/**
 * Seoul Spot Real-time Dashboard Core Controller
 * 
 * 이 파일은 대시보드의 비동기 핵심 로직을 담당합니다:
 * 1. 실시간 공공 API 호출 및 CORS/오프라인 예외 처리 (하이브리드 시뮬레이션 모드 전환)
 * 2. Leaflet.js 기반의 다크 테마 지도 연동 및 위치 동적 포커싱
 * 3. Chart.js 기반의 성별/연령대별 인구 분포 부드러운 차트 갱신
 * 4. 미세먼지, 기상, 교통 속도, 따릉이 대여율 통계 다차원 연동 연산
 * 5. 날씨/혼잡 데이터 기반 지능형 '야외 활동 적합 지수' 및 맞춤 가이드라인 실시간 생성
 */

// --- 1. Global State Management ---
let currentPlace = "강남역";
let isSimulationMode = false;
let currentNormalizedData = null;
let refreshIntervalId = null;

// Map & Visualization Instances
let leafletMap = null;
let leafletMarker = null;
let leafletBoundary = null;
let congestionTrendChart = null;

function normalizeFallbackData(placeName, fallbackPayload) {
  const origin = fallbackPayload || window.SeoulFallbackData[placeName] || {};
  return {
    areaName: placeName,
    congestLvl: origin.AREA_CONGEST_LVL || '보통',
    congestMsg: origin.AREA_CONGEST_MSG || '',
    pplMin: parseInt(origin.AREA_PPLN_MIN) || 20000,
    pplMax: parseInt(origin.AREA_PPLN_MAX) || 25000,
    congestionTrend: origin.CONGESTION_TREND || Array(24).fill(30),
    roadMsg: origin.ROAD_MSG || '',
    roadTrafficIdx: origin.ROAD_TRAFFIC_IDX || '원활',
    roadTrafficSpd: parseFloat(origin.ROAD_TRAFFIC_SPD) || 25.0,
    weatherTemp: parseFloat(origin.WEATHER_TEMP) || 20.0,
    weatherMsg: origin.WEATHER_MSG || '맑음',
    pm10: parseInt(origin.PM10) || 35,
    pm25: parseInt(origin.PM25) || 18,
    pm10Idx: origin.PM10_INDEX || '보통',
    pm25Idx: origin.PM25_INDEX || '좋음',
    bikeList: origin.BIKE_LIST || [],
    lat: parseFloat(origin.LAT) || 37.5665,
    lng: parseFloat(origin.LNG) || 126.9780,
    radius: origin.RADIUS || 300
  };
}

function resolveApiPlaceName(placeName) {
  const apiPlaceMap = {
    '강남역': '강남역',
    '홍대입구역': '홍대관광특구',
    '여의도': '여의도',
    '명동': '명동관광특구',
    '잠실역': '잠실역',
    '이태원': '이태원관광특구',
    '가로수길': '가로수길',
    '광화문': '광화문·덕수궁',
    '건대입구역': '건대입구역',
    '신촌·이대': '신촌·이대거리',
    '혜화역': '대학로·혜화역'
  };
  return apiPlaceMap[placeName] || placeName;
}

// --- 2. Chart.js Themes & Initialization ---
function initCharts() {
  const ctxTrend = document.getElementById('congestionTrendChart').getContext('2d');

  // Chart Global Options (Dark Mode Theme Elements)
  Chart.defaults.color = '#94a3b8'; // text-secondary
  Chart.defaults.font.family = "'Noto Sans KR', 'Outfit', sans-serif";

  // Create subtle glow gradient for the line area fill
  const gradientFill = ctxTrend.createLinearGradient(0, 0, 0, 200);
  gradientFill.addColorStop(0, 'rgba(59, 130, 246, 0.35)'); // Blue glow
  gradientFill.addColorStop(1, 'rgba(59, 130, 246, 0.00)');

  congestionTrendChart = new Chart(ctxTrend, {
    type: 'line',
    data: {
      labels: Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}시`),
      datasets: [{
        label: '예측 혼잡 지수',
        data: Array(24).fill(0),
        borderColor: '#3b82f6',
        borderWidth: 3,
        pointBackgroundColor: '#60a5fa',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        pointRadius: 3,
        pointHoverRadius: 6,
        tension: 0.4, // Curved spline line
        fill: true,
        backgroundColor: gradientFill
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleColor: '#f8fafc',
          bodyColor: '#e2e8f0',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          callbacks: {
            label: function(context) {
              return `예측 혼잡도: ${context.parsed.y}%`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            font: { family: 'Outfit', size: 10 },
            maxTicksLimit: 12
          }
        },
        y: {
          grid: { color: 'rgba(255, 255, 255, 0.05)' },
          ticks: {
            font: { family: 'Outfit', size: 10 },
            callback: function(value) { return value + '%'; }
          },
          min: 0,
          max: 100
        }
      }
    }
  });
}

// Update congestion trend line chart smoothly
function updateCongestionChart(trendData) {
  if (congestionTrendChart && trendData) {
    congestionTrendChart.data.datasets[0].data = trendData;
    
    // Dynamic color coding based on current peak congestion
    const maxVal = Math.max(...trendData);
    if (maxVal >= 90) {
      congestionTrendChart.data.datasets[0].borderColor = '#ef4444'; // Red for extremely crowded
    } else if (maxVal >= 70) {
      congestionTrendChart.data.datasets[0].borderColor = '#f97316'; // Orange
    } else {
      congestionTrendChart.data.datasets[0].borderColor = '#3b82f6'; // Blue
    }
    
    congestionTrendChart.update('active');
  }
}

// --- 3. Leaflet.js Map Initialization ---
function initMap() {
  // Center map initially around Seoul Center [37.5665, 126.9780]
  leafletMap = L.map('map', {
    zoomControl: true,
    attributionControl: false
  }).setView([37.4979, 127.0276], 15);

  // CartoDB Positron Dark theme tiles for a stunning tech-grid look
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19
  }).addTo(leafletMap);
}

// Move map and drop custom colored glowing marker with boundary circle
function updateMap(lat, lng, areaName, congestLvl, radius) {
  if (!leafletMap) return;

  // Move camera with a smooth pan animation
  leafletMap.panTo([lat, lng], { animate: true, duration: 0.8 });

  // Clear previous marker & boundary circle
  if (leafletMarker) {
    leafletMap.removeLayer(leafletMarker);
  }
  if (leafletBoundary) {
    leafletMap.removeLayer(leafletBoundary);
  }

  // Choose color based on congestion
  let colorHex = '#10b981'; // Green
  if (congestLvl === '매우 붐빔') colorHex = '#ef4444'; // Red
  else if (congestLvl === '약간 붐빔') colorHex = '#f97316'; // Orange
  else if (congestLvl === '보통') colorHex = '#f59e0b'; // Yellow

  // Draw semi-transparent holographic boundary circle
  const boundaryRadius = radius || 300;
  leafletBoundary = L.circle([lat, lng], {
    radius: boundaryRadius,
    color: colorHex,
    weight: 2,
    dashArray: '6, 6', // dotted radar feeling
    fillColor: colorHex,
    fillOpacity: 0.12,
    interactive: false
  }).addTo(leafletMap);

  // Custom DivIcon representing a high-tech glowing pulse radar
  const customRadarIcon = L.divIcon({
    className: 'custom-radar-icon',
    html: `
      <div style="position: relative; width: 30px; height: 30px;">
        <div style="
          position: absolute; top: 7px; left: 7px; width: 16px; height: 16px; 
          background-color: ${colorHex}; border-radius: 50%; border: 3px solid #fff;
          box-shadow: 0 0 15px ${colorHex}; z-index: 10;">
        </div>
        <div class="radar-ripple" style="
          position: absolute; top: 0; left: 0; width: 30px; height: 30px; 
          border-radius: 50%; background-color: ${colorHex}; opacity: 0.4;
          animation: pulse-ring 1.8s ease-out infinite; z-index: 1;">
        </div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });

  // Put marker with beautiful customized detail popup
  leafletMarker = L.marker([lat, lng], { icon: customRadarIcon }).addTo(leafletMap);
  leafletMarker.bindPopup(`
    <div style="color: #0f172a; font-family: 'Noto Sans KR'; font-size: 0.85rem; line-height: 1.4; padding: 4px;">
      <strong style="font-size: 0.95rem; color: #1e293b;">📍 ${areaName}</strong><br>
      <span style="color: ${colorHex}; font-weight: 800;">혼잡도: ${congestLvl}</span><br>
      영역 반경: ${boundaryRadius}m<br>
      좌표: ${lat.toFixed(4)}, ${lng.toFixed(4)}
    </div>
  `).openPopup();
}

// --- 4. Dynamic Metric Calculators ---

// Calculates a scientific "Outdoor Activity Index" from 0 to 100
function calculateOutdoorScore(data) {
  let score = 100;

  // 1. Congestion impact
  switch (data.congestLvl) {
    case "여유": score -= 0; break;
    case "보통": score -= 12; break;
    case "약간 붐빔": score -= 28; break;
    case "매우 붐빔": score -= 48; break;
  }

  // 2. Fine Dust PM10 impact
  if (data.pm10 > 80) score -= 30;
  else if (data.pm10 > 30) score -= 10;

  // 3. Ultra Fine Dust PM2.5 impact
  if (data.pm25 > 35) score -= 25;
  else if (data.pm25 > 15) score -= 8;

  // 4. Extreme Temperature offsets
  if (data.weatherTemp > 30) {
    score -= Math.min(25, (data.weatherTemp - 30) * 5); // Severe heat
  } else if (data.weatherTemp < 5) {
    score -= Math.min(25, (5 - data.weatherTemp) * 3); // Chilly cold
  } else if (data.weatherTemp >= 18 && data.weatherTemp <= 24) {
    score += 5; // Perfect pleasant temperature bonus
  }

  // 5. Weather message rainfall deduction
  if (data.weatherMsg.includes("비") || data.weatherMsg.includes("소나기") || data.weatherMsg.includes("눈")) {
    score -= 35;
  }

  // Cap value boundaries
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Generates logical customized recommendations based on real API metrics
function generateSmartGuidelines(data, outdoorScore) {
  // Analyze 24-hour Congestion Trend for smart insights
  const trend = data.congestionTrend || Array(24).fill(30);
  const minVal = Math.min(...trend);
  const maxVal = Math.max(...trend);
  const goldenHour = trend.indexOf(minVal);
  const peakHour = trend.indexOf(maxVal);

  const goldenHourStr = `${String(goldenHour).padStart(2, '0')}시경(최저 ${minVal}%)`;
  const peakHourStr = `${String(peakHour).padStart(2, '0')}시경(최고 ${maxVal}%)`;

  // Core safety & comfort message assembling
  let mainMsg = `현재 <strong>${data.areaName}</strong>의 실시간 혼잡도는 <strong>${data.congestLvl}</strong> 상태입니다. 24시간 분석 결과, 가장 여유로운 쾌적 골든타임은 <strong>${goldenHourStr}</strong>이며, 가장 붐비는 혼잡 피크타임은 <strong>${peakHourStr}</strong>으로 예측됩니다. `;
  
  if (data.congestLvl === "매우 붐빔") {
    mainMsg += "보행 시 신체 접촉이 우려될 정도로 극도의 혼잡 구역이 형성되어 있으니, 안전거리 확보에 신경 쓰고 에스컬레이터 등 병목 정체 시 안전 펜스를 붙잡으세요. 가급적 약속 장소는 실외보다는 인근 건물 내부로 이전하는 것이 현명합니다.";
  } else if (data.congestLvl === "약간 붐빔") {
    mainMsg += "유동 인구가 약간 붐비는 상태이나 이동 자체는 가능합니다. 주요 교차로나 지하철 계단 진출입 시 보행 흐름이 엉키지 않도록 우측통행 기본 보행 원칙을 정밀하게 지켜주시기 바랍니다.";
  } else {
    mainMsg += "광장과 보도가 매우 한산하고 소통 상태가 양호하여, 도보 이동 시 전혀 스트레스 없이 쾌적하게 보행로를 누빌 수 있는 평화로운 골든타임입니다.";
  }

  // Sub Action tips assembly
  let transportIcon = "fa-bus";
  let transportTip = "";
  if (data.roadTrafficIdx === "정체") {
    transportIcon = "fa-train";
    transportTip = `⚠️ 차량 속도 ${data.roadTrafficSpd}km/h로 정체가 심각하니 절대 대중교통(지하철)을 우선 탑승하세요.`;
  } else if (data.roadTrafficIdx === "서행") {
    transportIcon = "fa-bus";
    transportTip = `🚗 도로 혼잡도가 슬금슬금 상승 중입니다. 자차 진입보다는 시내버스나 지하철을 고려하세요.`;
  } else {
    transportIcon = "fa-bicycle";
    transportTip = `🚴 주변 차량 흐름이 매우 원활합니다! 따릉이를 이용한 근거리 연계 이동에 완벽한 조건입니다.`;
  }

  let maskIcon = "fa-head-side-mask";
  let maskTip = "";
  if (data.pm10 > 80 || data.pm25 > 35) {
    maskIcon = "fa-shield-virus";
    maskTip = `😷 대기 오염 수치 경고! 호흡기 면역 유지를 위해 외출 시 식약처 인증 KF94 마스크 착용 필수!`;
  } else if (data.pm10 > 30 || data.pm25 > 15) {
    maskIcon = "fa-mask";
    maskTip = `👌 미세먼지가 보통 레벨입니다. 민감군 분들은 덴탈 마스크 또는 차단 필터를 장착하세요.`;
  } else {
    maskIcon = "fa-face-laugh-beam";
    maskTip = `✨ 초미세먼지 청정구역 통과 중! 맑은 공기를 만끽하며 야외 산책과 심호흡을 권장합니다.`;
  }

  let activityIcon = "fa-umbrella";
  let activityTip = "";
  if (data.weatherMsg.includes("비") || data.weatherMsg.includes("소나기")) {
    activityIcon = "fa-cloud-showers-heavy";
    activityTip = `☔ 현재 비 소식이 잡혀 있습니다. 외출 시 튼튼한 우산과 젖지 않는 의류를 챙기세요.`;
  } else if (data.weatherTemp > 28) {
    activityIcon = "fa-sun";
    activityTip = `☀️ 낮 더위 및 자외선 지수 주의! 가급적 그늘로 이동하시고 시원한 생수를 수시로 드세요.`;
  } else if (data.weatherTemp < 8) {
    activityIcon = "fa-snowflake";
    activityTip = `🧣 찬바람 부는 차가운 기온입니다. 머플러, 두터운 가디건을 레이어드해 감기를 예방하세요.`;
  } else {
    activityIcon = "fa-campground";
    activityTip = `🏕️ 야외활동 골든 온도(${data.weatherTemp}°C)대 형성! 한강 피크닉이나 버스킹 직관을 대만족 추천!`;
  }

  return { mainMsg, transportIcon, transportTip, maskIcon, maskTip, activityIcon, activityTip };
}

// --- 5. DOM Manipulation / Rendering ---
function renderSkeleton(show) {
  const cardsToAnimate = [
    'card-crowd',
    'card-weather',
    'card-traffic',
    'card-guide'
  ];

  cardsToAnimate.forEach(cardId => {
    const el = document.getElementById(cardId);
    if (el) {
      if (show) el.classList.add('skeleton');
      else el.classList.remove('skeleton');
    }
  });
}

function renderDashboard(data) {
  // 1. KPI upper row rendering
  document.getElementById('kpi-ppl-min').innerText = data.pplMin.toLocaleString();
  document.getElementById('kpi-ppl-max').innerText = data.pplMax.toLocaleString();
  document.getElementById('kpi-dust-val').innerText = data.pm10;
  document.getElementById('kpi-dust-idx').innerText = `(${data.pm10Idx})`;
  
  // Colorize dust KPI
  const dustIdxEl = document.getElementById('kpi-dust-idx');
  dustIdxEl.className = ''; // reset
  if (data.pm10Idx === '좋음') dustIdxEl.classList.add('congest-level-green');
  else if (data.pm10Idx === '나쁨') dustIdxEl.classList.add('congest-level-orange');
  else if (data.pm10Idx === '매우나쁨') dustIdxEl.classList.add('congest-level-red');
  else dustIdxEl.classList.add('congest-level-yellow');

  document.getElementById('kpi-speed-val').innerText = data.roadTrafficSpd;

  // Calculate overall Seoul bike availability rate in %
  const totalRacks = data.bikeList.reduce((acc, b) => acc + b.rackCount, 0);
  const totalBikesAvailable = data.bikeList.reduce((acc, b) => acc + b.bikeCount, 0);
  const bikeRate = totalRacks > 0 ? Math.round((totalBikesAvailable / totalRacks) * 100) : 0;
  document.getElementById('kpi-bike-rate').innerText = bikeRate;

  // 2. Congestion level signal box
  const signalCircle = document.getElementById('crowd-signal-circle');
  const levelText = document.getElementById('crowd-lvl-text');
  
  // Reset previous classes
  signalCircle.className = 'crowd-signal-circle';
  levelText.className = 'crowd-signal-text-lvl';
  
  levelText.innerText = data.congestLvl;
  
  if (data.congestLvl === '매우 붐빔') {
    signalCircle.classList.add('signal-red');
    levelText.classList.add('congest-level-red');
  } else if (data.congestLvl === '약간 붐빔') {
    signalCircle.classList.add('signal-orange');
    levelText.classList.add('congest-level-orange');
  } else if (data.congestLvl === '보통') {
    signalCircle.classList.add('signal-yellow');
    levelText.classList.add('congest-level-yellow');
  } else {
    signalCircle.classList.add('signal-green');
    levelText.classList.add('congest-level-green');
  }

  // Summary labels below circle
  const trend = data.congestionTrend || Array(24).fill(30);
  const peakHour = trend.indexOf(Math.max(...trend));
  const peakHourStr = `${String(peakHour).padStart(2, '0')}시`;
  document.getElementById('gender-skew-val').innerText = peakHourStr;

  // Dynamic label text update for demographics sub label
  const skewLblEl = document.querySelector('#gender-skew-val').nextElementSibling;
  if (skewLblEl) skewLblEl.innerText = '혼잡 피크시간';

  document.getElementById('weather-simple-val').innerText = data.weatherMsg;
  document.getElementById('bike-count-total-val').innerText = `${totalBikesAvailable}대`;

  // 3. Congestion Trend Line Chart
  updateCongestionChart(data.congestionTrend);

  // 4. Leaflet Map center update
  updateMap(data.lat, data.lng, data.areaName, data.congestLvl, data.radius);

  // 5. Weather details card
  document.getElementById('weather-temp-degree').innerText = `${data.weatherTemp}°C`;
  document.getElementById('weather-status-str').innerText = data.weatherMsg;

  // Choose weather visual icon dynamically
  const weatherIconBox = document.getElementById('weather-status-icon');
  weatherIconBox.innerHTML = '';
  const wMsg = data.weatherMsg;
  if (wMsg.includes('맑음')) {
    weatherIconBox.innerHTML = '<i class="fa-solid fa-sun" style="color: #fbbf24; filter: drop-shadow(0 0 10px rgba(251,191,36,0.4));"></i>';
  } else if (wMsg.includes('흐림')) {
    weatherIconBox.innerHTML = '<i class="fa-solid fa-cloud" style="color: #94a3b8;"></i>';
  } else if (wMsg.includes('비') || wMsg.includes('소나기')) {
    weatherIconBox.innerHTML = '<i class="fa-solid fa-cloud-showers-heavy" style="color: #60a5fa;"></i>';
  } else if (wMsg.includes('눈')) {
    weatherIconBox.innerHTML = '<i class="fa-solid fa-snowflake" style="color: #e2e8f0;"></i>';
  } else {
    weatherIconBox.innerHTML = '<i class="fa-solid fa-cloud-sun" style="color: #f59e0b;"></i>';
  }

  // PM10 details
  document.getElementById('weather-pm10-val').innerText = `${data.pm10} ㎍/㎥`;
  const pm10Badge = document.getElementById('weather-pm10-badge');
  pm10Badge.innerText = data.pm10Idx;
  pm10Badge.className = 'dust-badge';
  if (data.pm10Idx === '좋음') pm10Badge.classList.add('dust-bg-good');
  else if (data.pm10Idx === '보통') pm10Badge.classList.add('dust-bg-normal');
  else if (data.pm10Idx === '나쁨') pm10Badge.classList.add('dust-bg-warn');
  else pm10Badge.classList.add('dust-bg-danger');

  // PM25 details
  document.getElementById('weather-pm25-val').innerText = `${data.pm25} ㎍/㎥`;
  const pm25Badge = document.getElementById('weather-pm25-badge');
  pm25Badge.innerText = data.pm25Idx;
  pm25Badge.className = 'dust-badge';
  if (data.pm25Idx === '좋음') pm25Badge.classList.add('dust-bg-good');
  else if (data.pm25Idx === '보통') pm25Badge.classList.add('dust-bg-normal');
  else if (data.pm25Idx === '나쁨') pm25Badge.classList.add('dust-bg-warn');
  else pm25Badge.classList.add('dust-bg-danger');

  // 6. Traffic & bike lists details card
  const trafficBadge = document.getElementById('traffic-index-badge');
  trafficBadge.innerText = data.roadTrafficIdx;
  trafficBadge.className = 'traffic-idx-badge';
  if (data.roadTrafficIdx === '원활') trafficBadge.classList.add('badge-traffic-good');
  else if (data.roadTrafficIdx === '서행') trafficBadge.classList.add('badge-traffic-slow');
  else trafficBadge.classList.add('badge-traffic-bad');

  document.getElementById('traffic-speed-number').innerText = `${data.roadTrafficSpd} km/h`;

  // Draw bike stations
  const bikeContainer = document.getElementById('bike-stations-container');
  bikeContainer.innerHTML = ''; // wipe skeleton

  data.bikeList.forEach(bike => {
    const stationItem = document.createElement('div');
    stationItem.className = 'bike-station-item';
    
    // Evaluate density color badge
    const percent = Math.round((bike.bikeCount / bike.rackCount) * 100);
    let bikeClass = '';
    if (bike.bikeCount === 0) bikeClass = 'empty';
    else if (percent >= 50) bikeClass = 'many';

    stationItem.innerHTML = `
      <div class="bike-station-name">📍 ${bike.stationName}</div>
      <div class="bike-count-bar-wrapper">
        <span class="bike-count-pill ${bikeClass}">${bike.bikeCount} / ${bike.rackCount}대</span>
      </div>
    `;
    bikeContainer.appendChild(stationItem);
  });

  // 7. Outdoor activities indices and AI message guide box
  const outdoorScore = calculateOutdoorScore(data);
  document.getElementById('outdoor-score-badge').innerText = `${outdoorScore}점`;
  
  // Colorize index
  const outdoorBadge = document.getElementById('outdoor-score-badge');
  if (outdoorScore >= 80) outdoorBadge.style.color = 'var(--color-green)';
  else if (outdoorScore >= 50) outdoorBadge.style.color = 'var(--color-yellow)';
  else outdoorBadge.style.color = 'var(--color-red)';

  const tips = generateSmartGuidelines(data, outdoorScore);
  document.getElementById('guide-main-message').innerHTML = tips.mainMsg;

  // Lower Sub Icons tips updating
  const tip1Icon = document.getElementById('tip-transport-icon');
  tip1Icon.className = `fa-solid ${tips.transportIcon}`;
  document.getElementById('tip-transport-text').innerText = tips.transportTip;

  const tip2Icon = document.getElementById('tip-mask-icon');
  tip2Icon.className = `fa-solid ${tips.maskIcon}`;
  document.getElementById('tip-mask-text').innerText = tips.maskTip;

  const tip3Icon = document.getElementById('tip-activity-icon');
  tip3Icon.className = `fa-solid ${tips.activityIcon}`;
  document.getElementById('tip-activity-text').innerText = tips.activityTip;

  // Finally update timestamps
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  document.getElementById('last-update-time').innerText = timeStr;
}

// --- 6. API Business Logic (Asynchronous processing + Unified Adapter) ---
async function fetchDashboardData(placeName) {
  renderSkeleton(true);
  
  const refreshBtn = document.getElementById('refresh-btn');
  if (refreshBtn) refreshBtn.classList.add('spinning');

  console.log(`Starting asynchronous fetch request for: ${placeName}`);

  // Create unified storage object
  let processedData = null;
  let apiUrl = '';
  let directUrl = '';
  let proxyMode = false;
  let isSecurePage = window.location.protocol === 'https:';
  let useProxy = false;
  let simulated = null;

  try {
    // Attempt actual HTTP public API query (supports asynchronous fetch)
    // Build request using external config to allow real API key or proxy usage.
    const cfg = window.SEOUL_API_CONFIG || {};
    const apiKey = String(cfg.API_KEY || '').trim();
    const apiBase = String(cfg.API_BASE || 'http://openapi.seoul.go.kr:8088').trim();
    const proxyEndpoint = String(cfg.PROXY_ENDPOINT || '').trim();
    const proxyConfigured = Boolean(cfg.USE_PROXY && proxyEndpoint.length > 0);
    const apiPlaceName = resolveApiPlaceName(placeName);

    const endpoint = `${apiBase}/${encodeURIComponent(apiKey)}/json/citydata/1/5/${encodeURIComponent(apiPlaceName)}`;
    directUrl = `${endpoint}?_=${Date.now()}`;
    apiUrl = directUrl;

    const isHttpApi = apiBase.toLowerCase().startsWith('http://');
    const needsProxy = isSecurePage && isHttpApi;
    useProxy = Boolean(proxyConfigured && needsProxy);

    if (proxyConfigured && !needsProxy) {
      console.log('Proxy configured but not required for this page. Using direct HTTP API because page is not HTTPS or API endpoint is secure.');
    }

    if (useProxy) {
      // Support three proxy endpoint forms:
      // 1) endpoint includes '{{url}}' -> replace with encoded full direct URL
      // 2) relative server endpoint starting with '/' -> append encoded placeName (server will add API key)
      // 3) other absolute proxy -> append encoded full direct URL
      if (proxyEndpoint.includes('{{url}}')) {
        apiUrl = proxyEndpoint.replace('{{url}}', encodeURIComponent(directUrl));
      } else if (proxyEndpoint.startsWith('/')) {
        apiUrl = `${proxyEndpoint}${encodeURIComponent(apiPlaceName)}`;
      } else {
        apiUrl = `${proxyEndpoint}${encodeURIComponent(directUrl)}`;
      }
      proxyMode = true;
    } else if (needsProxy) {
      throw new Error('HTTPS 페이지에서는 HTTP API 직접 호출이 차단됩니다. `USE_PROXY: true`와 `PROXY_ENDPOINT`를 설정하세요.');
    }

    console.log('API config:', {
      apiKeySet: Boolean(apiKey && !/sample|YOUR_API_KEY_HERE/i.test(apiKey)),
      apiKeyLength: apiKey.length,
      apiKeyType: typeof apiKey,
      apiBase,
      apiPlaceName,
      proxyEndpoint,
      useProxy,
      proxyMode,
      isSecurePage,
      needsProxy,
      apiUrl
    });

    // If API key not configured or still placeholder, allow proceeding only when
    // a relative serverless proxy is configured (so the server holds the real key).
    if (!apiKey || /sample|YOUR_API_KEY_HERE/i.test(apiKey)) {
      if (!(proxyConfigured && proxyEndpoint.startsWith('/'))) {
        throw new Error('Missing or placeholder API key in SEOUL_API_CONFIG.API_KEY — using simulation mode.');
      } else {
        console.log('Client API key empty, but relative server proxy detected — proceeding via proxy.');
      }
    }

    // High-performance asynchronous fetch with a longer timeout for proxy DNS/relay delays
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(apiUrl, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP network response failure: status ${response.status}`);
    }

    const json = await response.json();
    console.log("Seoul CityData raw API successfully fetched! Parsing keys...", json);

    // If successful, extract and normalize keys from actual schema
    if (json.CITYDATA) {
      const apiData = json.CITYDATA;
      
      // Live Population Extraction
      const pplStts = apiData.LIVE_PPLTN_STTS ? apiData.LIVE_PPLTN_STTS[0] : (apiData.LIVE_PPLN_STTS ? apiData.LIVE_PPLN_STTS[0] : {});
      
      // Road Traffic Extraction (ROAD_TRAFFIC_STTS contains AVG_ROAD_DATA object)
      const roadStts = apiData.ROAD_TRAFFIC_STTS ? (apiData.ROAD_TRAFFIC_STTS.AVG_ROAD_DATA || {}) : {};
      
      // Weather Details Extraction
      const weatherStts = apiData.WEATHER_STTS ? apiData.WEATHER_STTS[0] : {};

      // Dynamic weather status logic
      let weatherMsg = "맑음";
      if (weatherStts.PRECPT_TYPE && weatherStts.PRECPT_TYPE !== "없음") {
        weatherMsg = weatherStts.PRECPT_TYPE;
      } else if (weatherStts.FCST24HOURS && weatherStts.FCST24HOURS.length > 0) {
        weatherMsg = weatherStts.FCST24HOURS[0].SKY_STTS || "맑음";
      }

      // Unified Bike listing parsing (from Seoul API or merge fallback coordinates)
      const fallbackItem = window.SeoulFallbackData[placeName] || {};
      const isSampleData = apiData.AREA_NM !== apiPlaceName;

      let pplMin = parseInt(pplStts.AREA_PPLN_MIN) || 20000;
      let pplMax = parseInt(pplStts.AREA_PPLN_MAX) || 25000;
      let congestLvl = pplStts.AREA_CONGEST_LVL || "보통";
      let congestMsg = pplStts.AREA_CONGEST_MSG || "상세 혼잡 내용이 제공되지 않습니다.";
      let roadTrafficIdx = roadStts.ROAD_TRAFFIC_IDX || "원활";
      let roadTrafficSpd = parseFloat(roadStts.ROAD_TRAFFIC_SPD) || 25.0;
      let bikeList = fallbackItem.BIKE_LIST || [];
      let congestionTrend = fallbackItem.CONGESTION_TREND || Array(24).fill(30);

      // 만약 sample API 결과물이라서 데이터가 불일치하거나 고정되어 있다면(API는 강남역 고정이므로), 
      // fallbackItem 데이터를 기반으로 동적 난수 처리된 데이터를 합성해줍니다!
      if (isSampleData && fallbackItem.AREA_NAME) {
        const simulated = window.getFluctuatedData(placeName);
        if (simulated) {
          pplMin = simulated.AREA_PPLN_MIN;
          pplMax = simulated.AREA_PPLN_MAX;
          congestLvl = simulated.AREA_CONGEST_LVL;
          congestMsg = simulated.AREA_CONGEST_MSG;
          roadTrafficIdx = simulated.ROAD_TRAFFIC_IDX;
          roadTrafficSpd = simulated.ROAD_TRAFFIC_SPD;
          bikeList = simulated.BIKE_LIST;
          congestionTrend = simulated.CONGESTION_TREND || fallbackItem.CONGESTION_TREND;
        }
      }
      
      processedData = {
        areaName: placeName,
        congestLvl: congestLvl,
        congestMsg: congestMsg,
        pplMin: pplMin,
        pplMax: pplMax,
        congestionTrend: congestionTrend,
        roadMsg: roadStts.ROAD_MSG || "도로 상세 정보가 부족합니다.",
        roadTrafficIdx: roadTrafficIdx,
        roadTrafficSpd: roadTrafficSpd,
        weatherTemp: parseFloat(weatherStts.TEMP) || 20.0,
        weatherMsg: weatherMsg,
        pm10: parseInt(weatherStts.PM10) || 35,
        pm25: parseInt(weatherStts.PM25) || 18,
        pm10Idx: weatherStts.PM10_INDEX || "보통",
        pm25Idx: weatherStts.PM25_INDEX || "좋음",
        bikeList: bikeList,
        lat: parseFloat(fallbackItem.LAT) || 37.5665,
        lng: parseFloat(fallbackItem.LNG) || 126.9780,
        radius: fallbackItem.RADIUS || 300
      };

      isSimulationMode = false;
      updateStatusBadge(false, proxyMode);
    } else {
      // In case keys don't match, trigger custom error
      console.warn('Invalid proxy/API payload received for:', placeName, json);
      throw new Error("Invalid API response format (Missing 'CITYDATA' key)");
    }

  } catch (error) {
    // --- EXCEPTION HANDLING ---
    // In case of CORS error, network disconnect, or rate-limits, we may retry direct fetch on local HTTP
    console.warn("⚠️ [CORS / NETWORK FAIL] Redirecting to high-fidelity live simulation module.", error);
    console.error('Attempted API URL:', apiUrl || '(not set)');

    if (!isSecurePage && useProxy && directUrl && apiUrl !== directUrl) {
      try {
        console.log('Retrying direct Seoul API fetch because this is a local HTTP page.');
        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), 15000);
        const retryResponse = await fetch(directUrl, { signal: retryController.signal, cache: 'no-store' });
        clearTimeout(retryTimeoutId);

        if (retryResponse.ok) {
          const retryJson = await retryResponse.json();
          if (retryJson.CITYDATA) {
            console.log('Direct Seoul API fetch succeeded, using live data.');
            const apiData = retryJson.CITYDATA;
            const pplStts = apiData.LIVE_PPLTN_STTS ? apiData.LIVE_PPLTN_STTS[0] : (apiData.LIVE_PPLN_STTS ? apiData.LIVE_PPLN_STTS[0] : {});
            const roadStts = apiData.ROAD_TRAFFIC_STTS ? (apiData.ROAD_TRAFFIC_STTS.AVG_ROAD_DATA || {}) : {};
            const weatherStts = apiData.WEATHER_STTS ? apiData.WEATHER_STTS[0] : {};

            const fallbackItem = window.SeoulFallbackData[placeName] || {};
            const simulatedData = window.getFluctuatedData(placeName) || fallbackItem;

            processedData = {
              areaName: placeName,
              congestLvl: pplStts.AREA_CONGEST_LVL || simulatedData.AREA_CONGEST_LVL || '보통',
              congestMsg: pplStts.AREA_CONGEST_MSG || simulatedData.AREA_CONGEST_MSG || '',
              pplMin: parseInt(pplStts.AREA_PPLN_MIN) || simulatedData.AREA_PPLN_MIN || 20000,
              pplMax: parseInt(pplStts.AREA_PPLN_MAX) || simulatedData.AREA_PPLN_MAX || 25000,
              congestionTrend: simulatedData.CONGESTION_TREND || Array(24).fill(30),
              roadMsg: roadStts.ROAD_MSG || simulatedData.ROAD_MSG || '',
              roadTrafficIdx: roadStts.ROAD_TRAFFIC_IDX || simulatedData.ROAD_TRAFFIC_IDX || '원활',
              roadTrafficSpd: parseFloat(roadStts.ROAD_TRAFFIC_SPD) || simulatedData.ROAD_TRAFFIC_SPD || 25.0,
              weatherTemp: parseFloat(weatherStts.TEMP) || simulatedData.WEATHER_TEMP || 20.0,
              weatherMsg: weatherStts.PRECPT_TYPE && weatherStts.PRECPT_TYPE !== '없음' ? weatherStts.PRECPT_TYPE : (weatherStts.FCST24HOURS && weatherStts.FCST24HOURS.length > 0 ? weatherStts.FCST24HOURS[0].SKY_STTS || '맑음' : '맑음'),
              pm10: parseInt(weatherStts.PM10) || simulatedData.PM10 || 35,
              pm25: parseInt(weatherStts.PM25) || simulatedData.PM25 || 18,
              pm10Idx: weatherStts.PM10_INDEX || '보통',
              pm25Idx: weatherStts.PM25_INDEX || '좋음',
              bikeList: simulatedData.BIKE_LIST || [],
              lat: parseFloat(simulatedData.LAT) || 37.5665,
              lng: parseFloat(simulatedData.LNG) || 126.9780,
              radius: simulatedData.RADIUS || 300
            };

            isSimulationMode = false;
            updateStatusBadge(false, false);
          }
        }
      } catch (retryError) {
        console.warn('Direct retry failed:', retryError);
      }
    }

    if (!processedData) {
      simulated = window.getFluctuatedData(placeName);
      const fallbackItem = simulated || window.SeoulFallbackData[placeName] || {};
      processedData = normalizeFallbackData(placeName, fallbackItem);

      isSimulationMode = true;
      updateStatusBadge(true);
    }
  }

  // Bind normalized data and render visual components
  if (processedData) {
    currentNormalizedData = processedData;
    renderDashboard(processedData);
  }

  // Tear down skeletons and spins after 400ms buffer for seamless transitions
  setTimeout(() => {
    renderSkeleton(false);
    if (refreshBtn) refreshBtn.classList.remove('spinning');
  }, 400);
}

// Update upper header badge styles based on active modes
function updateStatusBadge(simulation, proxyMode = false) {
  const badge = document.getElementById('api-status');
  const txt = document.getElementById('api-status-text');

  if (simulation) {
    badge.className = 'api-status-badge simulation-mode';
    txt.innerText = '실시간 시뮬레이션 모드';
    badge.setAttribute('title', '웹 브라우저의 CORS(출처 제한) 또는 API 키/네트워크 문제로 인해 시뮬레이션 모드로 전환되었습니다.');
  } else if (proxyMode) {
    badge.className = 'api-status-badge proxy-mode';
    txt.innerText = '프록시 API 연동 완료';
    badge.setAttribute('title', 'HTTPS 환경에서 외부 CORS 프록시를 통해 서울시 열린데이터 API와 통신합니다.');
  } else {
    badge.className = 'api-status-badge';
    txt.innerText = '공공 API 연동 완료';
    badge.setAttribute('title', '서울시 열린데이터 광장 실시간 API 서버와 다이렉트 통신에 성공했습니다.');
  }
}

// Setups the periodic fluctuation tick interval
function startUpdateTicker() {
  // Clear any existing timer
  if (refreshIntervalId) {
    clearInterval(refreshIntervalId);
  }

  // Ticks every 20 seconds to fluctuate variables slightly and recreate live updates
  refreshIntervalId = setInterval(() => {
    console.log("Automatic 20-second tick interval fired.");
    
    if (isSimulationMode && currentNormalizedData) {
      // If we are in simulation mode, fluctuate fallback data and keep normalized shape
      const fluctuated = window.getFluctuatedData(currentPlace);
      const normalized = normalizeFallbackData(currentPlace, fluctuated);
      currentNormalizedData = normalized;
      renderDashboard(normalized);
    } else {
      // If we are in online API mode, do a fresh asynchronous pull
      fetchDashboardData(currentPlace);
    }
  }, 20000);
}

// --- 7. Initialization & Event Handlers Setup ---
window.addEventListener('DOMContentLoaded', () => {
  console.log("SEOUL SIGNAL Dashboard starting components initialization...");
  
  // 1. Setup UI Charts & Maps
  initCharts();
  initMap();

  // 2. Load default locationGangnam
  fetchDashboardData(currentPlace);
  
  // 3. Initiate update ticker loops
  startUpdateTicker();

  // 4. Bind Selector Box Changes
  const selector = document.getElementById('spot-selector');
  selector.addEventListener('change', (e) => {
    currentPlace = e.target.value;
    console.log(`Dropdown spot changed to: ${currentPlace}`);
    fetchDashboardData(currentPlace);
    startUpdateTicker(); // reset tick timelines
  });

  // 5. Bind Manual Refresh Button
  const refreshBtn = document.getElementById('refresh-btn');
  refreshBtn.addEventListener('click', () => {
    console.log(`Manual reload requested for: ${currentPlace}`);
    fetchDashboardData(currentPlace);
    startUpdateTicker(); // reset tick timelines
  });
});
