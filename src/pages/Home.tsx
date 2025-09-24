import React, { useState } from "react";
import styled from "@emotion/styled";

// TODO: 실제 아이콘과 이미지 파일을 import 하세요.
// import logoImage from "./assets/logo.png";
// import mainMapImage from "./assets/map.jpg";
// import searchIcon from "./assets/search-icon.svg";
// import calendarIcon from "./assets/calendar-icon.svg";

export default function Home() {
    // 사이드바의 활성 버튼 상태 관리를 위한 state
    const [activeUser, setActiveUser] = useState(1);
    const users = [1, 2, 3];

    return (
        <PageLayout>
            <Sidebar>
                {users.map(userNum => (
                    <SidebarButton
                        key={userNum}
                        $isActive={activeUser === userNum}
                        onClick={() => setActiveUser(userNum)}
                    >
                        유저 {userNum}
                    </SidebarButton>
                ))}
            </Sidebar>

            <ContentWrapper>
                <Header>
                    <Logo>
                        {/* <img src={logoImage} alt="서비스 로고" /> */}
                        <span>YOUR LOGO</span>
                    </Logo>
                    <Nav>
                        <NavButton>여행 기록</NavButton>
                        <NavButton>취향 기록</NavButton>
                        <NavButton>로그인</NavButton>
                    </Nav>
                </Header>

                <Main>
                    <SearchSection>
                        <CalendarButton>
                            {/* <img src={calendarIcon} alt="날짜 선택" /> */}
                            <span>📅</span>
                        </CalendarButton>
                        <SearchInputWrapper>
                            <SearchInput placeholder="여행지를 선택하세요." />
                            <SearchButton>
                                {/* <img src={searchIcon} alt="검색" /> */}
                                <span>🔍</span>
                            </SearchButton>
                        </SearchInputWrapper>
                    </SearchSection>

                    <MapSection>
                        {/* <img src={mainMapImage} alt="여행 지도" /> */}
                        <span>지도가 표시될 영역입니다.</span>
                    </MapSection>
                </Main>
            </ContentWrapper>
        </PageLayout>
    );
}


// --- Styled Components ---

const PageLayout = styled.div`
    display: grid;
    /* 🖥️ 데스크탑: 사이드바 | 메인 컨텐츠 */
    grid-template-columns: 80px 1fr;
    min-height: 100vh;
    background-color: white;

    /* 📱 992px 이하 태블릿/모바일 */
    @media (max-width: 992px) {
        grid-template-columns: 1fr; /* 한 줄로 변경 */
        grid-template-rows: auto 1fr; /* 사이드바를 위로 올림 */
    }
`;

const Sidebar = styled.aside`
    background-color: #f8f9fa;
    border-right: 1px solid #dee2e6;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 120px; /* Header 높이만큼 여백 */
    gap: 10px;

    @media (max-width: 992px) {
        flex-direction: row;
        width: 100%;
        padding: 10px;
        border-right: none;
        border-bottom: 1px solid #dee2e6;
        justify-content: center;
    }
`;

// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ 여기가 수정된 부분입니다 ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// 1. 버튼에 전달할 커스텀 속성의 타입을 먼저 정의합니다.
interface SidebarButtonProps {
    $isActive: boolean;
}

// 2. styled.button 뒤에 <타입이름>을 추가해서 타입을 알려줍니다.
const SidebarButton = styled.button<SidebarButtonProps>`
    width: 60px;
    height: 100px;
    border: 1px solid #ccc;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    writing-mode: vertical-rl; /* 텍스트를 세로로 표시 */
    text-orientation: mixed;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease-in-out;

    /* props($isActive)에 따른 동적 스타일링 */
    background-color: ${props => (props.$isActive ? "#2c3e50" : "#f0e5d8")};
    color: ${props => (props.$isActive ? "white" : "#333")};
    border-color: ${props => (props.$isActive ? "#2c3e50" : "#ccc")};

    &:hover {
        transform: translateY(-3px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    @media (max-width: 992px) {
        writing-mode: horizontal-tb;
        width: 100px;
        height: 50px;
    }
`;
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ 여기가 수정된 부분입니다 ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

const ContentWrapper = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow-x: hidden; /* 가로 스크롤 방지 */
`;

const Header = styled.header`
    width: 100%;
    height: 120px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 4%;
    border-bottom: 3px solid #2c3e50;
    box-sizing: border-box;

    /* 💻 768px 이하 모바일 화면 */
    @media (max-width: 768px) {
        flex-direction: column;
        height: auto;
        padding: 20px 0;
        gap: 20px;
    }
`;

const Logo = styled.div`
    font-size: 2rem;
    font-weight: bold;
`;

const Nav = styled.nav`
    display: flex;
    gap: 15px;
`;

const NavButton = styled.button`
    padding: 10px 20px;
    font-size: 1rem;
    background-color: rgba(240, 229, 216, 0.7);
    border: none;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background-color: rgba(240, 229, 216, 1);
        transform: scale(1.05);
    }
`;

const Main = styled.main`
    flex-grow: 1;
    padding: 40px 4%;
    display: flex;
    flex-direction: column;
    gap: 30px;
    align-items: center;
`;

const SearchSection = styled.section`
    display: flex;
    gap: 15px;
    width: 100%;
    max-width: 980px;
    align-items: center;
`;

const CalendarButton = styled.button`
    width: 65px;
    height: 65px;
    flex-shrink: 0; /* 크기 줄어들지 않게 */
    border: 1px solid #1d4e89;
    border-radius: 50%;
    background-color: white;
    font-size: 2rem;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const SearchInputWrapper = styled.div`
    position: relative;
    width: 100%;
`;

const SearchInput = styled.input`
    width: 100%;
    height: 65px;
    padding: 0 80px 0 30px;
    font-size: 1.3rem;
    border: 1px solid #1d4e89;
    border-radius: 35px;
    box-sizing: border-box;
`;

const SearchButton = styled.button`
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    width: 45px;
    height: 45px;
    border: none;
    background-color: transparent;
    font-size: 2rem;
    cursor: pointer;
`;

const MapSection = styled.section`
    width: 100%;
    max-width: 1077px;
    flex-grow: 1; /* 남은 공간 최대한 차지 */
    min-height: 400px;
    background-color: #e8e8ed;
    border-radius: 50px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.5rem;
    color: #aaa;
    
    img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50px;
    }
`;