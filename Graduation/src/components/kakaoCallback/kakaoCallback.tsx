// src/pages/KakaoCallback.tsx

import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
// [수정 1] config에서 환경변수 API 주소 가져오기
// (파일 위치에 따라 '../config' 또는 '../../config' 경로를 맞춰주세요)
import { API_BASE_URL } from "../../config";

function KakaoCallback() {
    const [searchParams] = useSearchParams();
    const isProcessing = useRef(false);

    // 1. URL에서 인가 코드(code) 뽑아내기
    const code = searchParams.get("code");

    useEffect(() => {
        // React StrictMode 방지 (중복 실행 방지)
        if (isProcessing.current) {
            return;
        }
        isProcessing.current = true;

        if (!code) {
            console.error("인가 코드가 없습니다.");
            window.opener?.postMessage({ type: "KAKAO_LOGIN_FAIL" }, window.location.origin);
            window.close();
            return;
        }

        // 2. 백엔드 서버로 인가 코드 전송
        const sendCodeToBackend = async (code: string) => {
            try {
                // [수정 2] 하드코딩 주소 제거하고 API_BASE_URL 사용
                const response = await fetch(`${API_BASE_URL}/api/users/kakao/process-login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ code }),
                });

                if (!response.ok) {
                    const errorDetails = await response.json();
                    throw new Error(`백엔드 서버 통신 실패: ${errorDetails.detail || response.statusText}`);
                }

                const result = await response.json();

                // 3. 성공: 토큰과 함께 성공 메시지를 부모창에 전송
                window.opener?.postMessage({
                    type: "KAKAO_LOGIN_SUCCESS",
                    token: result.access_token,
                    nextAction: result.next_action
                }, window.location.origin);

                window.close(); // 창 닫기

            } catch (error: any) {
                console.error("로그인 처리 실패:", error);
                // 4. 실패: 실패 메시지와 상세 에러 내용을 부모창에 전송
                window.opener?.postMessage({
                    type: "KAKAO_LOGIN_FAIL",
                    error: error.message || "알 수 없는 에러"
                }, window.location.origin);
                window.close(); // 창 닫기
            }
        };

        sendCodeToBackend(code);

    }, [code]);

    return <div>카카오 로그인 처리 중...</div>;
}

export default KakaoCallback;