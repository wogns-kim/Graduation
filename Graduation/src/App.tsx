// src/App.tsx
// 역할: 테마, 글로벌 스타일, 메시지 수신 및 라우팅을 관리합니다.

import { ThemeProvider } from '@emotion/react';
// --- !!! 1. useNavigate를 import 합니다. !!! ---
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

// --- 2. 라우팅 및 메시지 수신 로직을 AppContent 컴포넌트로 분리 ---
// useNavigate 훅은 <BrowserRouter>의 '자식' 컴포넌트에서만 호출할 수 있기 때문입니다.
function AppContent() {
  // 3. useNavigate 훅을 <BrowserRouter> 내부에서 호출합니다.
  const navigate = useNavigate();

  // 4. 팝업창에서 오는 메시지를 수신(listen)할 useEffect를 추가합니다.
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // 보안: 우리 사이트에서 온 메시지만 처리
      if (event.origin !== window.location.origin) {
        console.warn("다른 출처로부터의 메시지 무시:", event.origin);
        return;
      }

      // KakaoCallback.tsx에서 보낸 메시지인지 확인
      if (event.data.type === "KAKAO_LOGIN_SUCCESS") {
        alert("로그인 성공! (팝업에서 메시지 받음)");

        if (event.data.token) {
          console.log("백엔드 JWT 수신:", event.data.token);
          // 백엔드가 쿠키(httponly)로 JWT를 설정했다면, localStorage에 저장할 필요가 없습니다.
          // 만약 백엔드가 JSON으로 토큰을 반환했다면, 여기서 저장합니다.
          localStorage.setItem("access_token", event.data.token);
        }

        // --- 5. (가장 중요) 백엔드가 지시한 경로로 '새로고침 없이' 이동 ---
        if (event.data.nextAction) {
          navigate(event.data.nextAction); // 예: /taste 페이지로 이동
        } else {
          navigate("/"); // 기본값으로 메인 페이지로 이동
        }
      }

      if (event.data.type === "KAKAO_LOGIN_FAIL") {
        alert("로그인에 실패했습니다.");
      }
    };

    window.addEventListener("message", handleMessage);

    // 컴포넌트가 사라질 때 리스너 제거 (메모리 누수 방지)
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [navigate]); // navigate를 의존성 배열에 추가

  // 6. AppContent는 실제 페이지 레이아웃과 라우팅을 반환합니다.
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

// --- 7. 진짜 App 컴포넌트 ---
// App은 Provider들과 BrowserRouter(라우터 총괄)의 역할만 담당합니다.
function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles />
      <BrowserRouter>
        <AppContent /> {/* 실제 내용은 AppContent가 담당 */}
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;