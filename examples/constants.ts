// 로컬 개발 환경 포트 및 URL 상수
// 포트 변경 시 이 파일만 수정하면 모든 예제 앱과 e2e 테스트에 반영됩니다.

/** Port number for the local Transcodes backend server. */
export const DEV_BACKEND_PORT = 3500;
/** Port number for the local example app dev server. */
export const DEV_EXAMPLE_PORT = 9999;

/** Full URL for the local Transcodes backend server. */
export const DEV_BACKEND_URL = `http://localhost:${DEV_BACKEND_PORT}`;
/** Full URL for the local example app dev server. */
export const DEV_EXAMPLE_URL = `http://localhost:${DEV_EXAMPLE_PORT}`;

// e2e 테스트용 프로젝트 설정
/** Project ID used for E2E testing across all example apps. */
export const TEST_PROJECT_ID = 'ca46234a595cded3d599990b';
