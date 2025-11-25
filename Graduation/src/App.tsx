// src/App.tsx
import { ThemeProvider } from '@emotion/react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation  } from 'react-router-dom';
import { theme } from './styles/theme';
import GlobalStyles from './styles/GlobalStyles';
import HomePage from './pages/HomePage';
import MyPage from './pages/MyPage/MyTastePage';
import TravelRoutePage from "./components/MyPage/TravelRoutePage";
import Taste from "./components/Select your taste/select_your_taste";
import Header from './components/Header/Header';
import KakaoCallback from './components/kakaoCallback/kakaoCallback';

import React, { useEffect, useState } from 'react';

function AppContent() {

  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("access_token"));
  
  const handleLogout = () => {
    localStorage.removeItem("authToken"); // 토큰 삭제
    setIsLoggedIn(false); // 로그아웃 상태로 변경
    navigate('/'); // 홈으로 이동
    // (필요시) alert('로그아웃 되었습니다.');
  };

  // Header를 숨길 경로들
  const hideHeaderPaths = ['/taste', '/auth/kakao/callback'];
  const shouldShowHeader = !hideHeaderPaths.includes(location.pathname);
  
    // ✅ 2. 팝업창에서 오는 메시지를 수신(listen)할 useEffect를 추가합니다.
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            // 메시지를 보낸 곳이 내 사이트(localhost:5173)가 맞는지 확인
            if (event.origin !== window.location.origin) {
                console.warn("다른 출처로부터의 메시지 무시:", event.origin);
                return;
            }

            // KakaoCallback.tsx에서 보낸 메시지인지 확인
            if (event.data.type === "KAKAO_LOGIN_SUCCESS") {
                alert("로그인 성공! (팝업에서 메시지 받음)");

                localStorage.setItem("authToken", "true");

                setIsLoggedIn(true); // 로그인 상태로 변경
                navigate('/taste'); // 취향 선택 페이지로 이동


                // (선택) 백엔드에서 받은 토큰을 여기서 localStorage에 저장할 수 있습니다.
                // if (event.data.token) {
                //   localStorage.setItem("token", event.data.token);
                // }

                // 로그인 성공했으므로 페이지를 새로고침해서 로그인 상태를 반영
                //window.location.reload();
            }

            // (선택) 로그인 실패 시 처리
            if (event.data.type === "KAKAO_LOGIN_FAIL") {
                alert("로그인에 실패했습니다.");
            }
        };

        // 메시지 이벤트 리스너 등록
        window.addEventListener("message", handleMessage);

        // App 컴포넌트가 언마운트될 때 리스너 제거 (메모리 누수 방지)
        return () => {
            window.removeEventListener("message", handleMessage);
        };
    }, [navigate]); // [] : App 컴포넌트가 처음 렌더링될 때 딱 한 번만 실행

    return (
    <>
      {/* 조건부로 Header 렌더링 */}
      {shouldShowHeader && 
      (<Header
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
        {/* 👇 8. AppContent를 BrowserRouter 안에서 렌더링합니다. */}
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;