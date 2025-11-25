// src/App.tsx
import { ThemeProvider } from '@emotion/react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { theme } from './styles/theme';
import GlobalStyles from './styles/GlobalStyles';
import HomePage from './pages/HomePage';
import MyPage from './pages/MyPage/MyTastePage'; // 경로 확인 필요
import TravelRoutePage from "./components/MyPage/TravelRoutePage";
import Taste from "./components/Select your taste/select_your_taste";
import Header from './components/Header/Header';
import KakaoCallback from './components/kakaoCallback/kakaoCallback';

import { useEffect, useState } from 'react';

// --- 1. 메시지 데이터 타입 정의 (TypeScript용) ---
interface LoginMessageData {
  type: string;
  token?: string;
  nextAction?: string; // 백엔드가 알려주는 다음 이동 경로
}

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // 초기 로그인 상태 확인 (토큰 존재 여부)
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("access_token")); // 토큰 키 이름 통일 ('access_token')

  const handleLogout = () => {
    localStorage.removeItem("access_token"); // 토큰 삭제
    setIsLoggedIn(false); // 로그아웃 상태로 변경
    navigate('/'); // 홈으로 이동
    alert('로그아웃 되었습니다.');
  };

  // Header를 숨길 경로들
  const hideHeaderPaths = ['/taste', '/auth/kakao/callback'];
  const shouldShowHeader = !hideHeaderPaths.includes(location.pathname);
  
  // 팝업창 메시지 수신 리스너
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        console.warn("다른 출처로부터의 메시지 무시:", event.origin);
        return;
      }

      const data = event.data as LoginMessageData;

      if (data.type === "KAKAO_LOGIN_SUCCESS") {
        // alert("로그인 성공! (팝업에서 메시지 받음)"); // 사용자 경험을 위해 알림은 생략 가능

        if (data.token) {
          localStorage.setItem("access_token", data.token);
          console.log("토큰 저장 완료:", data.token);
        }

        setIsLoggedIn(true); // 로그인 상태 업데이트

        // --- 2. 백엔드가 지정한 경로로 이동 ---
        // nextAction이 있으면 그곳으로, 없으면 기본값('/')으로 이동
        if (data.nextAction) {
            console.log("다음 경로로 이동:", data.nextAction);
            navigate(data.nextAction); 
        } else {
            navigate('/');
        }
      }

      if (data.type === "KAKAO_LOGIN_FAIL") {
        alert("로그인에 실패했습니다. 다시 시도해주세요.");
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [navigate]);

  return (
    <>
      {/* 조건부 Header 렌더링 */}
      {shouldShowHeader && (
        <Header
          isLoggedIn={isLoggedIn}
          onLogoutClick={handleLogout}
        />
      )}
      
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/mypage" element={<MyPage />} />
        <Route path="/travel-route/:cityId" element={<TravelRoutePage />} />
        <Route path="/taste" element={<Taste />} />
        <Route
          path="/auth/kakao/callback"
          element={<KakaoCallback />}
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;