import styled from "@emotion/styled";
import { css } from "@emotion/react"; // 1. css import 추가
import { Link } from "react-router-dom";

// --- 카카오 로그인 설정 ---
const KAKAO_REST_API_KEY = import.meta.env.VITE_KAKAO_REST_API_KEY;

// --- HeaderProps 정의 ---
interface HeaderProps {
  isLoggedIn: boolean;
  onLogoutClick: () => void;
  onCodeClick: () => void; // 코드 입력 모달 열기 함수
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
    display: block;
    width: 183px;
    
    &:hover {
      opacity: 0.9;
    }
  }

  @media (max-width: 768px) {
    img {
      width: 150px;
    }
  }
`;

// ✅ 2. 공통 버튼 스타일 정의 (css 사용)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const navButtonStyle = (theme: any, primary?: boolean) => css`
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid ${primary ? 'transparent' : theme.colors.border};
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  background-color: ${primary ? theme.colors.primary : theme.colors.white};
  color: ${primary ? theme.colors.white : theme.colors.text};
  transition: all 0.2s ease-in-out;
  text-decoration: none;
  display: inline-flex; /* 텍스트 중앙 정렬 */
  align-items: center;
  justify-content: center;
  
  /* a 태그나 Link로 쓰일 때를 위해 */
  box-sizing: border-box; 

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }

  @media (max-width: 768px) {
    font-size: 13px;
    padding: 6px 12px;
  }
`;

// ✅ 3. Link용 버튼 (마이페이지 이동용)
const LinkButton = styled(Link)<{ primary?: boolean }>`
  ${({ theme, primary }) => navButtonStyle(theme, primary)}
`;

// ✅ 4. 일반 button용 버튼 (로그인/로그아웃용)
const ActionButton = styled.button<{ primary?: boolean }>`
  ${({ theme, primary }) => navButtonStyle(theme, primary)}
`;


// --- Header 컴포넌트 ---
function Header({ isLoggedIn, onLogoutClick, onCodeClick }: HeaderProps) {

  const handleKakaoLogin = () => {
    const redirectUri = `${window.location.origin}/kakaoCallback`;
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${redirectUri}&response_type=code`;
    window.open(kakaoAuthUrl, "kakaoLogin", "width=500,height=600");
  };

  return (
    <HeaderContainer>
      <StyledLink to="/">
        <Logo>First Trip</Logo>
      </StyledLink>

      <Nav>
        {isLoggedIn ? (
          // --- 로그인 상태일 때 ---
          <>
            {/* LinkButton 사용 (to 속성 문제 해결됨) */}
            <ActionButton onClick={onCodeClick}>
              코드 입력
            </ActionButton>

            <LinkButton to="/mypage">
              마이페이지
            </LinkButton>
            {/* ActionButton 사용 */}
            <ActionButton onClick={onLogoutClick} primary>
              로그아웃
            </ActionButton>
          </>
        ) : (
          // --- 로그아웃 상태일 때 ---
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