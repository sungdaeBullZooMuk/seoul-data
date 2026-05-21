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
  API_KEY: "sample",

  // API 기본 호스트 (기본값 유지)
  API_BASE: "http://openapi.seoul.go.kr:8088",

  // 브라우저에서 직접 호출 시 CORS가 차단된다면 true로 바꿔 외부 프록시를 사용하세요.
  USE_PROXY: false,

  // 프록시를 사용할 경우, 프록시의 엔드포인트를 넣어주세요.
  // 예: "https://my-cors-proxy.example.com/fetch?url="
  // 프록시에 따라 호출 규격이 다르므로 필요시 프록시 문서에 맞춰 조정하세요.
  PROXY_ENDPOINT: "",
};

console.log('SEOUL API config loaded. Remember to set SEOUL_API_CONFIG.API_KEY in production.');
