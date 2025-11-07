// src/App.tsx
import { ThemeProvider } from '@emotion/react';
// 👇 1. useNavigate를 import 합니다.
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { theme } from './styles/theme';
import GlobalStyles from './styles/GlobalStyles';
import HomePage from './pages/HomePage';
import MyPage from './pages/MyPage';
import TravelRoutePage from "./components/MyPage/mypage";
import Taste from "./components/Select your taste/select_your_taste";
import Header from './components/Header/Header';
import KakaoCallback from './components/kakaoCallback/kakaoCallback';

import { useEffect } from 'react';

// 👇 2. 라우터 내부에 렌더링될 새 컴포넌트를 만듭니다.
function AppContent() {
  // 👇 3. useNavigate 훅을 여기서 호출합니다.
  const navigate = useNavigate();

  // 팝업창에서 오는 메시지를 수신(listen)할 useEffect
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        console.warn("다른 출처로부터의 메시지 무시:", event.origin);
        return;
      }

      // KakaoCallback.tsx에서 보낸 메시지인지 확인
      if (event.data.type === "KAKAO_LOGIN_SUCCESS") {
        alert("로그인 성공! (팝업에서 메시지 받음)");

        // 👇 4. window.location.reload() 대신 navigate('/taste')로 변경!
        navigate('/taste'); // 취향 선택 페이지로 이동

      }

      if (event.data.type === "KAKAO_LOGIN_FAIL") {
        alert("로그인에 실패했습니다.");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [navigate]); // 5. useEffect 의존성 배열에 navigate 추가

  // 6. 기존의 Header와 Routes를 반환합니다.
  return (
    <>
      <Header />
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

// 👇 7. App 컴포넌트는 Provider와 BrowserRouter만 감싸줍니다.
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