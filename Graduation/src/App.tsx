import { ThemeProvider } from '@emotion/react';
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Outlet } from 'react-router-dom';
import { theme } from './styles/theme';
import GlobalStyles from './styles/GlobalStyles';
import HomePage from './pages/HomePage';
import MyPage from './pages/MyPage/MyTastePage';
import TravelRoutePage from "./components/MyPage/TravelRoutePage";
import Taste from "./components/Select your taste/select_your_taste";
import Header from './components/Header/Header';
import KakaoCallback from './components/kakaoCallback/kakaoCallback';
import CodeInputModal from './components/CodeInputModal'; // 모달 import

// --- HeaderLayout 컴포넌트 정의 ---
// 👇 1. onCodeClick prop 타입 추가
interface HeaderLayoutProps {
  isLoggedIn: boolean;
  onLogoutClick: () => void;
  onCodeClick: () => void; 
}

// 👇 2. HeaderLayout에서 onCodeClick을 받아서 Header에 전달
const HeaderLayout = ({ isLoggedIn, onLogoutClick, onCodeClick }: HeaderLayoutProps) => {
  return (
    <>
      <Header 
        isLoggedIn={isLoggedIn}
        onLogoutClick={onLogoutClick}
        onCodeClick={onCodeClick}
      />
      <Outlet />
    </>
  );
};

function AppContent() {
  const navigate = useNavigate();

  // 로그인 상태 관리
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("authToken"));
  
  // 👇 3. 코드 입력 모달 상태 관리
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    setIsLoggedIn(false);
    navigate('/');
  };

  // 👇 4. 모달 열기/닫기 및 입장 함수
  const openCodeModal = () => setIsCodeModalOpen(true);
  const closeCodeModal = () => setIsCodeModalOpen(false);

  const handleJoinGroup = (code: string) => {
    console.log("입력된 초대 코드:", code);
    navigate(`/travel-route/${code}`); // 해당 루트 페이지로 이동
    closeCodeModal();
  };
  
  // 카카오 로그인 처리 로직
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "KAKAO_LOGIN_SUCCESS") {
        alert("로그인 성공! (팝업에서 메시지 받음)");
        localStorage.setItem("authToken", "true"); 
        setIsLoggedIn(true);
        navigate('/taste');
      }

      if (event.data.type === "KAKAO_LOGIN_FAIL") {
        alert("로그인에 실패했습니다.");
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate]);

  return (
    <>
      <Routes>
        {/* 👇 5. HeaderLayout에 onCodeClick={openCodeModal} 전달 */}
        <Route element={
          <HeaderLayout 
            isLoggedIn={isLoggedIn} 
            onLogoutClick={handleLogout} 
            onCodeClick={openCodeModal} 
          />
        }>
          <Route path="/" element={<HomePage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/travel-route/:cityId" element={<TravelRoutePage />} />
        </Route>

        <Route path="/taste" element={<Taste />} />
        <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
      </Routes>

      {/* 👇 6. 코드 입력 모달 렌더링 */}
      <CodeInputModal 
        isOpen={isCodeModalOpen} 
        onClose={closeCodeModal} 
        onJoin={handleJoinGroup} 
      />
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