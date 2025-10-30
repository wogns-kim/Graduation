import styled from "@emotion/styled";
import { Link } from "react-router-dom";

// --- 카카오 로그인 설정 ---
const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
const REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI; // 로컬용
const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

// --- 스타일 컴포넌트 ---

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 5%;
  height: 80px;
  background: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid #eee;

  @media (max-width: 768px) {
    padding: 0 20px;
  }
`;

const Logo = styled.h1`
  font-family: 'Lemon', cursive;
  font-size: 32px;
  color: ${({ theme }) => theme.colors.primary};
  margin: 0;

  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;
`;

const Nav = styled.nav`
  display: flex;
  gap: 1rem;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

// (스타일 컴포넌트 정의는 동일합니다)
const NavButton = styled('a') <{ primary?: boolean }>`
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid ${({ theme, primary }) => (primary ? 'transparent' : theme.colors.border)};
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  background-color: ${({ theme, primary }) => (primary ? theme.colors.primary : theme.colors.white)};
  color: ${({ theme, primary }) => (primary ? theme.colors.white : theme.colors.text)};
  transition: all 0.2s ease-in-out;
  text-decoration: none;
  display: inline-block;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }

  @media (max-width: 768px) {
    font-size: 13px;
    padding: 6px 12px;
  }
`;


// --- Header 컴포넌트 ---
function Header() {

  // ✅ 1. 팝업창을 띄우는 함수를 정의합니다.
  const handleKakaoLogin = () => {
    window.open(KAKAO_AUTH_URL, "kakaoLogin", "width=500,height=600");
  };

  return (
    <HeaderContainer>
      {/* 로고 클릭 시 홈('/')으로 이동 */}
      <StyledLink to="/">
        <Logo>First Trip</Logo>
      </StyledLink>

      <Nav>
        {/* 로그인 페이지 이동 */}
        <StyledLink to="/login">
          <NavButton>로그인</NavButton>
        </StyledLink>

        {/* ✅ 2. 카카오 회원가입: 'as', 'href'를 'onClick'으로 변경 */}
        <NavButton
          primary
          as="button" // 렌더링 시 <a> 대신 <button> 태그로 렌더링
          onClick={handleKakaoLogin} // 클릭 시 팝업 함수 실행
        >
          회원 가입
        </NavButton>
      </Nav>
    </HeaderContainer>
  );
}

export default Header;