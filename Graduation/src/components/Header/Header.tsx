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
const KakaoLoginButton = styled.button`
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  
  img {
    display: block; // 이미지 기본 여백 제거
    width: 183px; // 카카오 가이드에 맞는 기본 크기 (medium-wide)
    
    &:hover {
      opacity: 0.9; // 간단한 호버 효과
    }
  }

  // 모바일에서는 이미지를 조금 줄일 수 있습니다.
  @media (max-width: 768px) {
    img {
      width: 150px;
    }
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
        {/* ✅ 2. NavButton 대신 KakaoLoginButton을 사용합니다. */}
        <KakaoLoginButton onClick={handleKakaoLogin}>
          {/* ✅ 3. public 폴더 안의 경로를 절대 경로로 적어줍니다.
            /kakapo_login/kakao_login_large_narrow.png
          */}
          <img
            src="/kakao_login/kakao_login_large_narrow.png"
            alt="카카오로 로그인"
          />
        </KakaoLoginButton>
      </Nav>
    </HeaderContainer>
  );
}

export default Header;