// src/App.tsx
import { ThemeProvider } from '@emotion/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { theme } from './styles/theme';
import GlobalStyles from './styles/GlobalStyles';
import HomePage from './pages/HomePage';
import MyPage from './pages/MyPage';
import  TravelRoutePage  from "./components/MyPage/mypage";
import  Taste  from "./components/Select your taste/select_your_taste";

function App() {
    return (
        <ThemeProvider theme={theme}>
            <GlobalStyles />
            {/* 3. BrowserRouter로 전체 앱을 감쌉니다. */}
            <BrowserRouter>
                {/* 4. Routes 안에서 각 페이지의 경로를 설정합니다. */}
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/mypage" element={<MyPage />} />

                    <Route path="/travel-route/:cityId" element={<TravelRoutePage />} />
                    <Route path="/taste" element={<Taste />} />
                    {/* 여기에 다른 페이지 경로들을 계속 추가할 수 있습니다. */}
                </Routes>
            </BrowserRouter>
        </ThemeProvider>
    );
}

export default App;