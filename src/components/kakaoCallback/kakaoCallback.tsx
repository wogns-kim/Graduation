// src/pages/KakaoCallback.tsx

import { useEffect } from "react";
import { useSearchParams } from "react-router-dom"; // useNavigate 제거

function KakaoCallback() {
    const [searchParams] = useSearchParams();
    // const navigate = useNavigate(); // 팝업창에서는 navigate가 필요 없으므로 제거

    // 1. URL에서 인가 코드(code) 뽑아내기
    const code = searchParams.get("code");

    useEffect(() => {
        if (code) {
            console.log("카카오 인가 코드:", code); // (1) 콘솔에서 코드 확인

            // 2. 백엔드 서버로 인가 코드 전송 (주석 처리된 sendCodeToBackend 함수 참고)
            // ...

            // (백엔드 통신이 성공적으로 끝났다고 가정하고,)

            // ✅ 3. 부모창(원래 사이트)에 로그인 성공 메시지 전송
            window.opener.postMessage({
                type: "KAKAO_LOGIN_SUCCESS",
            }, window.location.origin); // 부모창의 주소 (예: http://localhost:5173)

            // ✅ 4. 메시지 전송 후 팝업창 스스로 닫기
            window.close();

        }
    }, [code]); // navigate 의존성 제거

    // 이 페이지는 팝업창에서 아주 잠깐 로딩 화면으로 보입니다.
    return <div>카카오 로그인 처리 중...</div>;
}

export default KakaoCallback;

/*
// 2번 백엔드 전송 예시 (팝업창 방식)
// 나중에 백엔드 구현 시 참고하세요.
const sendCodeToBackend = async (code: string) => {
  try {
    const response = await fetch("https://[내 백엔드 API 주소]/auth/kakao", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });
    
    if (!response.ok) {
      throw new Error('백엔드 서버 통신 실패');
    }

    const result = await response.json();
    
    // ✅ 성공: 토큰과 함께 성공 메시지를 부모창에 전송
    window.opener.postMessage({ 
      type: "KAKAO_LOGIN_SUCCESS", 
      token: result.token // 백엔드에서 준 토큰을 부모창으로 넘김
    }, window.location.origin);
    
    window.close();

  } catch (error) {
    console.error("로그인 실패:", error);

    // ✅ 실패: 실패 메시지를 부모창에 전송
    window.opener.postMessage({ 
      type: "KAKAO_LOGIN_FAIL" 
    }, window.location.origin);

    window.close();
  }
};
*/