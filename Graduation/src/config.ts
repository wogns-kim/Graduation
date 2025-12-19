// src/config.ts
// 환경 변수가 있으면 그걸 쓰고, 없으면(로컬) localhost를 씁니다.
export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";