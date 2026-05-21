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
  // 배포 환경에서는 클라이언트에 직접 API 키를 두지 않는 것을 권장합니다.
  // 로컬 개발용으로만 필요하면 여기에 키를 넣고 사용하세요.
  API_KEY: "",

  API_BASE: "http://openapi.seoul.go.kr:8088",

  // Vercel과 같은 HTTPS 배포 환경에서는 서버리스 프록시를 만들어 API 키를 안전하게 보관하세요.
  // 아래 설정은 프로젝트 루트에 만든 Vercel 함수 `/api/citydata`를 사용합니다.
  USE_PROXY: true,
  PROXY_ENDPOINT: "/api/citydata?place=",
};

console.log('SEOUL API config loaded. Remember to set SEOUL_API_CONFIG.API_KEY in production.');
