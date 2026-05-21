/**
 * Seoul Spot Real-time City Data Fallback & Simulation Module
 * 
 * 이 파일은 서울 열린데이터 광장의 실시간 도시데이터 API 규격과 100% 동일한
 * 예비(Fallback) 데이터를 정의하며, 오프라인 또는 CORS 제한 환경에서
 * 실제 데이터처럼 동작하도록 5초마다 세밀한 흔들림(Fluctuation)을 주는 시뮬레이션 알고리즘을 포함합니다.
 */

const SeoulFallbackData = {
  "강남역": {
    AREA_NAME: "강남역",
    AREA_CONGEST_LVL: "매우 붐빔",
    AREA_CONGEST_MSG: "사람들이 광장 및 도로 전체에 가득 차 있어 매우 혼잡합니다. 대중교통 이용 시 밀치거나 부딪힐 우려가 있으니 이동에 각별히 유의하세요.",
    AREA_PPLN_MIN: 78000,
    AREA_PPLN_MAX: 84000,
    FEMALE_RATE: 51.8,
    MALE_RATE: 48.2,
    PPLN_RATE_10: 4.5,
    PPLN_RATE_20: 42.8,
    PPLN_RATE_30: 31.4,
    PPLN_RATE_40: 12.3,
    PPLN_RATE_50: 6.2,
    PPLN_RATE_60: 2.8,
    ROAD_MSG: "출퇴근 및 상업지구 밀집 지역으로 강남대로 주변 차량 소통이 극심하게 지체되고 있습니다.",
    ROAD_TRAFFIC_IDX: "정체",
    ROAD_TRAFFIC_SPD: 12.5,
    WEATHER_TEMP: 21.8,
    WEATHER_MSG: "맑음",
    PM10: 42,
    PM25: 22,
    PM10_INDEX: "보통",
    PM25_INDEX: "보통",
    BIKE_LIST: [
      { stationName: "강남역 9번출구 앞", rackCount: 20, bikeCount: 3 },
      { stationName: "강남역 12번출구 뒤", rackCount: 15, bikeCount: 1 },
      { stationName: "특허청 서울사무소 앞", rackCount: 25, bikeCount: 5 }
    ],
    LAT: 37.4979,
    LNG: 127.0276,
    RADIUS: 400,
    CONGESTION_TREND: [15, 10, 8, 5, 12, 35, 75, 90, 80, 75, 70, 72, 78, 80, 75, 78, 85, 95, 98, 92, 80, 60, 45, 25]
  },
  "홍대입구역": {
    AREA_NAME: "홍대입구역",
    AREA_CONGEST_LVL: "매우 붐빔",
    AREA_CONGEST_MSG: "거리 예술, 버스킹 및 여가 활동 인파로 걷기 힘들 정도로 붐빕니다. 주차 및 도로 진입이 불가능하므로 차량 우회를 적극 권장합니다.",
    AREA_PPLN_MIN: 64000,
    AREA_PPLN_MAX: 70000,
    FEMALE_RATE: 56.4,
    MALE_RATE: 43.6,
    PPLN_RATE_10: 16.7,
    PPLN_RATE_20: 55.2,
    PPLN_RATE_30: 18.5,
    PPLN_RATE_40: 5.8,
    PPLN_RATE_50: 2.6,
    PPLN_RATE_60: 1.2,
    ROAD_MSG: "홍대 걷고싶은거리 및 마포대로 합류 차량으로 신호 대기가 길어지고 있습니다.",
    ROAD_TRAFFIC_IDX: "정체",
    ROAD_TRAFFIC_SPD: 14.2,
    WEATHER_TEMP: 22.1,
    WEATHER_MSG: "맑음",
    PM10: 38,
    PM25: 19,
    PM10_INDEX: "보통",
    PM25_INDEX: "좋음",
    BIKE_LIST: [
      { stationName: "홍대입구역 2번출구 앞", rackCount: 30, bikeCount: 2 },
      { stationName: "홍대입구역 8번출구 뒤", rackCount: 20, bikeCount: 0 },
      { stationName: "홍익대학교 정문 앞", rackCount: 22, bikeCount: 4 }
    ],
    LAT: 37.5568,
    LNG: 126.9238,
    RADIUS: 450,
    CONGESTION_TREND: [35, 20, 12, 8, 5, 10, 25, 45, 55, 60, 65, 70, 75, 80, 85, 90, 95, 98, 99, 95, 90, 80, 65, 50]
  },
  "여의도": {
    AREA_NAME: "여의도",
    AREA_CONGEST_LVL: "보통",
    AREA_CONGEST_MSG: "직장인 퇴근 시간 및 한강공원 인근 나들이객으로 다소 북적이지만 이동하는 데 무리가 없는 보통 수준입니다.",
    AREA_PPLN_MIN: 35000,
    AREA_PPLN_MAX: 40000,
    FEMALE_RATE: 48.9,
    MALE_RATE: 51.1,
    PPLN_RATE_10: 2.1,
    PPLN_RATE_20: 24.3,
    PPLN_RATE_30: 35.8,
    PPLN_RATE_40: 20.2,
    PPLN_RATE_50: 11.4,
    PPLN_RATE_60: 6.2,
    ROAD_MSG: "여의대로는 비교적 소통이 쾌적하며 한강교량 진입로 부근만 일부 서행 중입니다.",
    ROAD_TRAFFIC_IDX: "원활",
    ROAD_TRAFFIC_SPD: 32.8,
    WEATHER_TEMP: 20.9,
    WEATHER_MSG: "구름많음",
    PM10: 28,
    PM25: 14,
    PM10_INDEX: "좋음",
    PM25_INDEX: "좋음",
    BIKE_LIST: [
      { stationName: "여의도역 1번출구 앞", rackCount: 25, bikeCount: 14 },
      { stationName: "여의나루역 1번출구 앞", rackCount: 40, bikeCount: 22 },
      { stationName: "국회의사당역 3번출구 앞", rackCount: 20, bikeCount: 11 }
    ],
    LAT: 37.5216,
    LNG: 126.9242,
    RADIUS: 700,
    CONGESTION_TREND: [10, 5, 3, 2, 8, 30, 65, 85, 75, 70, 68, 72, 80, 75, 68, 70, 78, 90, 60, 40, 30, 20, 15, 12]
  },
  "명동": {
    AREA_NAME: "명동",
    AREA_CONGEST_LVL: "약간 붐빔",
    AREA_CONGEST_MSG: "외국인 관광객과 쇼핑 인파가 거리에 가득 차 다소 복잡함을 느낄 수 있습니다. 일부 골목길은 지체 현상이 있습니다.",
    AREA_PPLN_MIN: 42000,
    AREA_PPLN_MAX: 48000,
    FEMALE_RATE: 54.1,
    MALE_RATE: 45.9,
    PPLN_RATE_10: 6.8,
    PPLN_RATE_20: 32.5,
    PPLN_RATE_30: 25.4,
    PPLN_RATE_40: 18.2,
    PPLN_RATE_50: 12.1,
    PPLN_RATE_60: 5.0,
    ROAD_MSG: "을지로 및 명동 지하상가 주변 이면도로 진출입 차량으로 교통 흐름이 약간 정체됩니다.",
    ROAD_TRAFFIC_IDX: "서행",
    ROAD_TRAFFIC_SPD: 18.1,
    WEATHER_TEMP: 21.2,
    WEATHER_MSG: "맑음",
    PM10: 45,
    PM25: 25,
    PM10_INDEX: "보통",
    PM25_INDEX: "보통",
    BIKE_LIST: [
      { stationName: "명동역 2번출구 앞", rackCount: 15, bikeCount: 5 },
      { stationName: "을지로입구역 5번출구 앞", rackCount: 20, bikeCount: 9 },
      { stationName: "롯데백화점 본점 건너편", rackCount: 18, bikeCount: 4 }
    ],
    LAT: 37.5635,
    LNG: 126.9811,
    RADIUS: 300,
    CONGESTION_TREND: [12, 8, 5, 3, 5, 12, 28, 45, 55, 62, 68, 75, 82, 85, 80, 82, 88, 90, 85, 75, 60, 45, 30, 20]
  },
  "잠실역": {
    AREA_NAME: "잠실역",
    AREA_CONGEST_LVL: "약간 붐빔",
    AREA_CONGEST_MSG: "롯데월드 및 석촌호수 나들이객, 잠실 롯데상권 쇼핑 인파로 광장 주변이 북적이고 있습니다.",
    AREA_PPLN_MIN: 55000,
    AREA_PPLN_MAX: 62000,
    FEMALE_RATE: 53.2,
    MALE_RATE: 46.8,
    PPLN_RATE_10: 12.4,
    PPLN_RATE_20: 35.8,
    PPLN_RATE_30: 26.5,
    PPLN_RATE_40: 14.1,
    PPLN_RATE_50: 7.4,
    PPLN_RATE_60: 3.8,
    ROAD_MSG: "송파대로 및 올림픽로 일대는 잠실대교 남단 교차로 진입 차량으로 인해 서행 중입니다.",
    ROAD_TRAFFIC_IDX: "서행",
    ROAD_TRAFFIC_SPD: 20.4,
    WEATHER_TEMP: 21.5,
    WEATHER_MSG: "맑음",
    PM10: 34,
    PM25: 16,
    PM10_INDEX: "좋음",
    PM25_INDEX: "좋음",
    BIKE_LIST: [
      { stationName: "잠실역 2번출구 앞", rackCount: 30, bikeCount: 12 },
      { stationName: "석촌호수 동호 입구", rackCount: 25, bikeCount: 8 },
      { stationName: "잠실새내역 4번출구", rackCount: 20, bikeCount: 15 }
    ],
    LAT: 37.5133,
    LNG: 127.1001,
    RADIUS: 500,
    CONGESTION_TREND: [15, 10, 6, 4, 8, 22, 45, 60, 65, 70, 72, 78, 82, 85, 83, 86, 88, 92, 90, 80, 65, 50, 35, 25]
  },
  "이태원": {
    AREA_NAME: "이태원",
    AREA_CONGEST_LVL: "보통",
    AREA_CONGEST_MSG: "세계음식거리 및 이태원 앤틱가구거리 주변으로 산책 및 모임 인파가 있으나 쾌적하게 이동 가능합니다.",
    AREA_PPLN_MIN: 22000,
    AREA_PPLN_MAX: 28000,
    FEMALE_RATE: 49.5,
    MALE_RATE: 50.5,
    PPLN_RATE_10: 3.2,
    PPLN_RATE_20: 41.5,
    PPLN_RATE_30: 32.8,
    PPLN_RATE_40: 13.9,
    PPLN_RATE_50: 5.6,
    PPLN_RATE_60: 3.0,
    ROAD_MSG: "이태원로 주변 통행량이 늘어나 신호 대기 차량이 있으나 소통은 무난합니다.",
    ROAD_TRAFFIC_IDX: "원활",
    ROAD_TRAFFIC_SPD: 25.6,
    WEATHER_TEMP: 21.0,
    WEATHER_MSG: "구름많음",
    PM10: 30,
    PM25: 15,
    PM10_INDEX: "좋음",
    PM25_INDEX: "좋음",
    BIKE_LIST: [
      { stationName: "이태원역 1번출구 앞", rackCount: 15, bikeCount: 6 },
      { stationName: "녹사평역 광장", rackCount: 20, bikeCount: 10 },
      { stationName: "한강진역 2번출구 옆", rackCount: 15, bikeCount: 4 }
    ],
    LAT: 37.5348,
    LNG: 126.9936,
    RADIUS: 350,
    CONGESTION_TREND: [55, 40, 25, 15, 8, 5, 10, 15, 20, 25, 30, 38, 45, 50, 55, 65, 75, 85, 90, 95, 98, 92, 80, 68]
  },
  "가로수길": {
    AREA_NAME: "가로수길",
    AREA_CONGEST_LVL: "보통",
    AREA_CONGEST_MSG: "카페 및 패션 숍 밀집지역으로 가벼운 쇼핑과 만남 위주의 유동인구 위주로 여유롭게 산책할 수 있습니다.",
    AREA_PPLN_MIN: 18000,
    AREA_PPLN_MAX: 24000,
    FEMALE_RATE: 58.2,
    MALE_RATE: 41.8,
    PPLN_RATE_10: 5.4,
    PPLN_RATE_20: 48.6,
    PPLN_RATE_30: 28.2,
    PPLN_RATE_40: 11.1,
    PPLN_RATE_50: 4.8,
    PPLN_RATE_60: 1.9,
    ROAD_MSG: "신사동 가로수길 메인 도로는 차량 진입 자제로 다소 쾌적하며 도산대로 합류 부근만 정체됩니다.",
    ROAD_TRAFFIC_IDX: "원활",
    ROAD_TRAFFIC_SPD: 28.2,
    WEATHER_TEMP: 22.0,
    WEATHER_MSG: "맑음",
    PM10: 40,
    PM25: 21,
    PM10_INDEX: "보통",
    PM25_INDEX: "보통",
    BIKE_LIST: [
      { stationName: "신사역 8번출구 앞", rackCount: 20, bikeCount: 9 },
      { stationName: "가로수길 북단 입구", rackCount: 15, bikeCount: 7 },
      { stationName: "압구정역 5번출구 뒤", rackCount: 18, bikeCount: 5 }
    ],
    LAT: 37.5204,
    LNG: 127.0230,
    RADIUS: 250,
    CONGESTION_TREND: [15, 10, 5, 3, 4, 10, 20, 32, 42, 50, 58, 65, 72, 75, 78, 80, 75, 70, 65, 55, 45, 35, 25, 18]
  },
  "광화문": {
    AREA_NAME: "광화문",
    AREA_CONGEST_LVL: "여유",
    AREA_CONGEST_MSG: "세종대로 광장 일대 및 경복궁 주변은 야외 관광객 위주로 보행자가 분산되어 매우 쾌적하고 조용하게 걸어 다닐 수 있습니다.",
    AREA_PPLN_MIN: 12000,
    AREA_PPLN_MAX: 16000,
    FEMALE_RATE: 47.5,
    MALE_RATE: 52.5,
    PPLN_RATE_10: 3.5,
    PPLN_RATE_20: 21.8,
    PPLN_RATE_30: 28.4,
    PPLN_RATE_40: 22.3,
    PPLN_RATE_50: 14.8,
    PPLN_RATE_60: 9.2,
    ROAD_MSG: "세종대로는 왕복 다차선 도로로 막힘없이 매끄러운 통행을 보이고 있습니다.",
    ROAD_TRAFFIC_IDX: "원활",
    ROAD_TRAFFIC_SPD: 36.4,
    WEATHER_TEMP: 20.5,
    WEATHER_MSG: "흐림",
    PM10: 25,
    PM25: 11,
    PM10_INDEX: "좋음",
    PM25_INDEX: "좋음",
    BIKE_LIST: [
      { stationName: "광화문역 2번출구 앞", rackCount: 25, bikeCount: 18 },
      { stationName: "경복궁역 4번출구 앞", rackCount: 20, bikeCount: 14 },
      { stationName: "세종문화회관 뒤", rackCount: 15, bikeCount: 9 }
    ],
    LAT: 37.5759,
    LNG: 126.9768,
    RADIUS: 300,
    CONGESTION_TREND: [8, 5, 2, 2, 6, 25, 55, 75, 68, 62, 60, 65, 78, 70, 62, 64, 70, 80, 50, 35, 25, 18, 12, 10]
  },
  "건대입구역": {
    AREA_NAME: "건대입구역",
    AREA_CONGEST_LVL: "약간 붐빔",
    AREA_CONGEST_MSG: "대학가 맛의거리 및 영화관, 쇼핑몰 주변에 점심 및 저녁 모임을 가지는 젊은 층 위주로 소폭 붐비고 있습니다.",
    AREA_PPLN_MIN: 45000,
    AREA_PPLN_MAX: 52000,
    FEMALE_RATE: 50.8,
    MALE_RATE: 49.2,
    PPLN_RATE_10: 11.2,
    PPLN_RATE_20: 51.4,
    PPLN_RATE_30: 20.8,
    PPLN_RATE_40: 9.5,
    PPLN_RATE_50: 4.8,
    PPLN_RATE_60: 2.3,
    ROAD_MSG: "아차산로 및 능동로 주변 사거리 신호 대기가 길어지고 있습니다.",
    ROAD_TRAFFIC_IDX: "서행",
    ROAD_TRAFFIC_SPD: 17.5,
    WEATHER_TEMP: 21.4,
    WEATHER_MSG: "맑음",
    PM10: 36,
    PM25: 18,
    PM10_INDEX: "보통",
    PM25_INDEX: "좋음",
    BIKE_LIST: [
      { stationName: "건대입구역 2번출구 앞", rackCount: 25, bikeCount: 6 },
      { stationName: "스타시티몰 앞 광장", rackCount: 20, bikeCount: 11 },
      { stationName: "건국대학교 일감호 옆", rackCount: 15, bikeCount: 8 }
    ],
    LAT: 37.5404,
    LNG: 127.0700,
    RADIUS: 350,
    CONGESTION_TREND: [40, 25, 15, 8, 4, 8, 18, 30, 42, 48, 52, 58, 65, 70, 75, 82, 88, 95, 97, 92, 85, 75, 60, 50]
  },
  "신촌·이대": {
    AREA_NAME: "신촌·이대",
    AREA_CONGEST_LVL: "보통",
    AREA_CONGEST_MSG: "대학생 통학 인원 및 만남의광장 나들이객이 적절히 분포하여 이동성이 매우 좋은 쾌적한 보통 레벨입니다.",
    AREA_PPLN_MIN: 28000,
    AREA_PPLN_MAX: 34000,
    FEMALE_RATE: 54.8,
    MALE_RATE: 45.2,
    PPLN_RATE_10: 14.5,
    PPLN_RATE_20: 49.6,
    PPLN_RATE_30: 19.8,
    PPLN_RATE_40: 9.2,
    PPLN_RATE_50: 4.5,
    PPLN_RATE_60: 2.4,
    ROAD_MSG: "신촌오거리 지하철역 부근 합류 도로를 제외하고 연세로 대중교통전용지구 등 주변은 무난히 소통 중입니다.",
    ROAD_TRAFFIC_IDX: "원활",
    ROAD_TRAFFIC_SPD: 26.8,
    WEATHER_TEMP: 21.0,
    WEATHER_MSG: "맑음",
    PM10: 33,
    PM25: 17,
    PM10_INDEX: "좋음",
    PM25_INDEX: "좋음",
    BIKE_LIST: [
      { stationName: "신촌역 2번출구 앞", rackCount: 20, bikeCount: 11 },
      { stationName: "이대역 3번출구 앞", rackCount: 15, bikeCount: 7 },
      { stationName: "신촌기차역 앞 광장", rackCount: 18, bikeCount: 10 }
    ],
    LAT: 37.5583,
    LNG: 126.9370,
    RADIUS: 400,
    CONGESTION_TREND: [25, 15, 8, 5, 3, 8, 20, 38, 45, 48, 50, 55, 62, 65, 60, 64, 72, 80, 85, 78, 68, 55, 40, 30]
  },
  "혜화역": {
    AREA_NAME: "혜화역",
    AREA_CONGEST_LVL: "보통",
    AREA_CONGEST_MSG: "대학로 소극장 공연 거리와 낙산공원 데이트 인파가 골고루 분포하여 적당히 활기찬 보통 상태입니다.",
    AREA_PPLN_MIN: 32000,
    AREA_PPLN_MAX: 38000,
    FEMALE_RATE: 53.2,
    MALE_RATE: 46.8,
    PPLN_RATE_10: 10.8,
    PPLN_RATE_20: 55.4,
    PPLN_RATE_30: 18.2,
    PPLN_RATE_40: 8.5,
    PPLN_RATE_50: 4.8,
    PPLN_RATE_60: 2.3,
    ROAD_MSG: "대학로 혜화동로터리에서 이화사거리 방면으로 연극 공연 시간 전후로 차량 정체와 서행이 잦은 편입니다.",
    ROAD_TRAFFIC_IDX: "서행",
    ROAD_TRAFFIC_SPD: 21.4,
    WEATHER_TEMP: 22.0,
    WEATHER_MSG: "맑음",
    PM10: 30,
    PM25: 15,
    PM10_INDEX: "좋음",
    PM25_INDEX: "좋음",
    BIKE_LIST: [
      { stationName: "혜화역 4번출구 앞", rackCount: 20, bikeCount: 9 },
      { stationName: "마로니에공원 앞", rackCount: 25, bikeCount: 14 },
      { stationName: "서울대학교 연건캠퍼스 앞", rackCount: 15, bikeCount: 5 }
    ],
    LAT: 37.5822,
    LNG: 127.0018,
    RADIUS: 250,
    CONGESTION_TREND: [20, 12, 8, 4, 3, 5, 12, 22, 35, 40, 45, 52, 60, 68, 74, 82, 78, 85, 92, 88, 70, 52, 38, 28]
  }
};

/**
 * 핫플레이스 데이터 복사본 생성 후 실시간 미세변동(Noise) 알고리즘을 수행합니다.
 * @param {string} areaName - 핫플레이스 이름
 * @returns {object} - 요동치는 난수 처리가 완료된 최신 핫플레이스 데이터
 */
function getFluctuatedData(areaName) {
  const origin = SeoulFallbackData[areaName];
  if (!origin) return null;

  // 딥 카피 수행
  const data = JSON.parse(JSON.stringify(origin));

  // 1. 인구수 미세 조절 (+/- 2% 내외)
  const pplPercent = (Math.random() * 4 - 2) / 100;
  data.AREA_PPLN_MIN = Math.round(data.AREA_PPLN_MIN * (1 + pplPercent));
  data.AREA_PPLN_MAX = Math.round(data.AREA_PPLN_MAX * (1 + pplPercent));

  // 2. 교통 속도 미세 조절 (+/- 1.5 km/h)
  const speedNoise = (Math.random() * 3 - 1.5);
  data.ROAD_TRAFFIC_SPD = parseFloat(Math.max(5, Math.min(80, data.ROAD_TRAFFIC_SPD + speedNoise)).toFixed(1));
  
  // 속도에 맞추어 인덱스 동적 보정
  if (data.ROAD_TRAFFIC_SPD < 15) {
    data.ROAD_TRAFFIC_IDX = "정체";
  } else if (data.ROAD_TRAFFIC_SPD < 25) {
    data.ROAD_TRAFFIC_IDX = "서행";
  } else {
    data.ROAD_TRAFFIC_IDX = "원활";
  }

  // 3. 온도 미세 조절 (+/- 0.3도)
  const tempNoise = (Math.random() * 0.6 - 0.3);
  data.WEATHER_TEMP = parseFloat((data.WEATHER_TEMP + tempNoise).toFixed(1));

  // 4. 따릉이 거치대 자전거 개수 조절 (+/- 2대)
  data.BIKE_LIST = data.BIKE_LIST.map(bike => {
    const bikeNoise = Math.floor(Math.random() * 5 - 2); // -2, -1, 0, 1, 2
    let newBikeCount = Math.max(0, Math.min(bike.rackCount, bike.bikeCount + bikeNoise));
    return {
      ...bike,
      bikeCount: newBikeCount
    };
  });

  // 5. 미세먼지 수치 미세 조절 (+/- 2)
  const pm10Noise = Math.floor(Math.random() * 5 - 2);
  const pm25Noise = Math.floor(Math.random() * 3 - 1);
  data.PM10 = Math.max(5, data.PM10 + pm10Noise);
  data.PM25 = Math.max(2, data.PM25 + pm25Noise);

  // 6. 24시간 혼잡 예측 트렌드 미세 조절 (+/- 3 이내)
  if (data.CONGESTION_TREND) {
    data.CONGESTION_TREND = data.CONGESTION_TREND.map(val => {
      const trendNoise = Math.floor(Math.random() * 7 - 3); // -3 ~ 3
      return Math.max(0, Math.min(100, val + trendNoise));
    });
  }

  return data;
}

// 브라우저 전역에 공개
window.SeoulFallbackData = SeoulFallbackData;
window.getFluctuatedData = getFluctuatedData;
console.log("Fallback module loaded successfully. 10 Seoul hotspots ready for simulation!");
