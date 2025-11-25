import styled from "@emotion/styled";
import { Link } from "react-router-dom";

console.log("VITE_KAKAO_REST_API_KEY:", import.meta.env.VITE_KAKAO_REST_API_KEY);
console.log("VITE_KAKAO_REDIRECT_URI:", import.meta.env.VITE_KAKAO_REDIRECT_URI);
// --- 카카오 로그인 설정 ---
const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;
const REDIRECT_URI = import.meta.env.VITE_KAKAO_REDIRECT_URI; // 로컬용
const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

// --- Header가 받을 Props 타입 정의 ---
interface HeaderProps {
  isLoggedIn: boolean;
  onLogoutClick: () => void;
  // onLoginClick은 LoginModal을 안 쓰므로 제거
}

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

// '마이페이지', '로그아웃' 버튼으로 재사용할 NavButton 스타일 정의
const NavButton = styled('a')<{ primary?: boolean; as?: 'a' | 'button' | typeof Link }>`
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
  text-align: center;

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
function Header({ isLoggedIn, onLogoutClick }: HeaderProps) {

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

      {/*isLoggedIn 상태에 따라 다른 버튼들을 렌더링 */}
      <Nav>
        {isLoggedIn ? (
          // --- 1. 로그인 되었을 때 ---
          <>
            {/* NavButton을 Link처럼 사용하기 위해 as={Link} 사용 */}
            <NavButton as={Link} to="/mypage">
              마이페이지
            </NavButton>
            <NavButton as="button" type="button" onClick={onLogoutClick} primary>
              로그아웃
            </NavButton>
          </>
        ) : (
          // --- 2. 로그인 안 되었을 때 ---
          <>
            {/* 카카오 로그인 버튼 */}
            <KakaoLoginButton onClick={handleKakaoLogin}>
              <img
                src="/kakao_login/kakao_login_large_narrow.png"
                alt="카카오로 로그인"
              />
            </KakaoLoginButton>
          </>
        )}
      </Nav>
    </HeaderContainer>
  );
}

export default Header;