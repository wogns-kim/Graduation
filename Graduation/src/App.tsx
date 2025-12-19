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
import CodeInputModal from './components/CodeInputModal';

// --- HeaderLayout 컴포넌트 정의 ---
interface HeaderLayoutProps {
  isLoggedIn: boolean;
  onLogoutClick: () => void;
  onCodeClick: () => void;
}

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

  // 1. [수정] 토큰 키 이름을 'access_token'으로 통일
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("access_token"));

  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("access_token"); // [수정] access_token 삭제
    setIsLoggedIn(false);
    navigate('/');
    // alert('로그아웃 되었습니다.');
  };

  const openCodeModal = () => setIsCodeModalOpen(true);
  const closeCodeModal = () => setIsCodeModalOpen(false);

  const handleJoinGroup = async (code: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("로그인이 필요합니다.");
      closeCodeModal();
      return;
    }

    const API_BASE = import.meta.env.VITE_BACKEND_API_URL;

    try {
      const response = await fetch(`${API_BASE}/trips/${code}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();

      if (response.ok) {
        alert(data.message || "여행에 성공적으로 참여했습니다!");
        navigate(`/travel-route/${data.trip_id}`);
      } else {
        throw new Error(data.detail || "참여에 실패했습니다.");
      }
    } catch (error: Error) {
      alert(`오류가 발생했습니다: ${error.message}`);
    } finally {
      closeCodeModal();
    }
  };

  // 카카오 로그인 처리 로직
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === "KAKAO_LOGIN_SUCCESS") {
        // alert("로그인 성공!"); 

        // 2. 토큰 저장 및 키 이름 통일
        if (event.data.token) {
          localStorage.setItem("access_token", event.data.token);
        }

        setIsLoggedIn(true);

        // 3. 백엔드의 지시(nextAction)에 따라 이동
        if (event.data.nextAction) {
          navigate(event.data.nextAction);
        } else {
          navigate('/');
        }
      }

      if (event.data.type === "KAKAO_LOGIN_FAIL") {
        // 전달받은 에러 내용을 콘솔에 출력 (F12에서 확인 가능)
        console.error("▼▼▼ 로그인 실패 상세 에러 ▼▼▼");
        console.error(event.data.error); 
        
        // 화면에도 띄워줌
        alert(`로그인에 실패했습니다.\n사유: ${event.data.error}`);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate]);

  return (
    <>
      <Routes>
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
        <Route path="/kakaoCallback" element={<KakaoCallback />} />
      </Routes>

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