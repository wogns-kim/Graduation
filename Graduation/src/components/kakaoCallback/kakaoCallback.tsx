// src/pages/KakaoCallback.tsx

import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

const BACKEND_PROCESS_URL = "http://127.0.0.1:8000/api/users/kakao/process-login";

function KakaoCallback() {
    const [searchParams] = useSearchParams();
    // const navigate = useNavigate(); // 팝업창에서는 navigate가 필요 없으므로 제거

    const isProcessing = useRef(false);

    // 1. URL에서 인가 코드(code) 뽑아내기
    const code = searchParams.get("code");

    useEffect(() => {
        if (isProcessing.current) {
            return;
        }
        isProcessing.current = true;

        if (!code) {
            console.error("인가 코드가 없습니다.");
            // 실패 메시지 전송
            window.opener?.postMessage({ type: "KAKAO_LOGIN_FAIL" }, window.location.origin);
            window.close(); // 창 닫기
            return;
        }

        // 2. 백엔드 서버로 인가 코드 전송 (주석 처리된 sendCodeToBackend 함수 참고)
        const sendCodeToBackend = async (code: string) => {
            try {
                const response = await fetch(BACKEND_PROCESS_URL, {
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
                    token: result.access_token, // 백엔드에서 준 JWT 토큰
                    nextAction: result.next_action
                }, window.location.origin);

                window.close(); // 창 닫기

            } catch (error: Error) {
                console.error("로그인 처리 실패:", error);
                // 4. 실패: 실패 메시지와 상세 에러 내용을 부모창에 전송
                window.opener?.postMessage({
                    type: "KAKAO_LOGIN_FAIL",
                    error: error.message || "알 수 없는 에러" // ★ 에러 내용을 여기에 담습니다.
                }, window.location.origin);
                window.close(); // 창 닫기
            }
        };

        // 인가 코드가 있으면 즉시 백엔드로 전송
        sendCodeToBackend(code);

    }, [code]); // code가 변경될 때 한 번만 실행

    // 이 페이지는 팝업창에서 아주 잠깐 로딩 화면으로 보입니다.
    return <div>카카오 로그인 처리 중...</div>;
}

export default KakaoCallback;