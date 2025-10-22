// src/App.tsx
import { ThemeProvider } from '@emotion/react';
import { theme } from './styles/theme';
import GlobalStyles from './styles/GlobalStyles';
// import HomePage from './pages/HomePage';
import  TravelRoutePage  from "./components/Mypage/mypage";

function App() {
    return (
        <ThemeProvider theme={theme}>
            <GlobalStyles />
            <TravelRoutePage />
        </ThemeProvider>
    );
}

export default App;