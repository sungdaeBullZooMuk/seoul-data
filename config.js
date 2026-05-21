/**
 * Seoul Signal — API 구성 파일
 *
 * 배포 환경에서 실제 서울시 열린데이터(openapi.seoul.go.kr) 연동을 위해
 * `API_KEY`에 발급받은 키를 넣어주세요.
 *
 * 만약 브라우저 CORS 문제로 직접 호출이 제한된다면,
 * `USE_PROXY`를 true로 설정하고 `PROXY_ENDPOINT`에 CORS 프록시 URL을 넣어주세요.
 * 예) https://your-cors-proxy.example.com/fetch?url=
 * (프록시가 대상 URL을 `url` 쿼리 파라미터로 받아 요청해주는 형태일 때)
 *
 * 보안: 클라이언트에 키를 두는 것은 보안상 취약할 수 있습니다. 더 안전한 배포를 위해
 * 서버 측 프록시(간단한 Node/Express 또는 Netlify Function)를 권장합니다.
 */

window.SEOUL_API_CONFIG = {
  // 발급받은 API 키를 넣어주세요. (예: "0123456789abcdef1234567890abcdef")
  // 실제 API 연동을 위해서는 꼭 서울시 열린데이터에서 발급받은 키를 입력하세요.
  API_KEY: "694b7376456a77633637614b796b63",

  // API 기본 호스트 (서울 열린데이터 광장 기본 엔드포인트)
  API_BASE: "http://openapi.seoul.go.kr:8088",

  // HTTPS로 배포된 사이트에서 http:// openapi 호출은 브라우저 혼합 콘텐츠 차단으로 실패합니다.
  // 이때는 반드시 USE_PROXY를 true로 바꾸고 HTTPS 프록시 엔드포인트를 지정하세요.
  USE_PROXY: true,

  // 프록시를 사용할 경우, 프록시의 엔드포인트를 넣어주세요.
  // 예1: "https://api.allorigins.win/raw?url="
  // 예2: "https://my-cors-proxy.example.com/fetch?url={{url}}"
  // {{url}} 플레이스홀더가 포함되면 그 자리에 전체 대상 URL을 삽입합니다.
  PROXY_ENDPOINT: "https://api.allorigins.win/raw?url=",
};

console.log('SEOUL API config loaded. Remember to set SEOUL_API_CONFIG.API_KEY in production.');
