import styled from "@emotion/styled";
import { Link } from "react-router-dom";

// --- 카카오 로그인 설정 ---
const KAKAO_REST_API_KEY = "여기에_본인의_카카오_REST_API_키를_입력하세요";
const REDIRECT_URI = "http://localhost:5173/auth/kakao/callback";
const KAKAO_AUTH_URL = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`;

// --- 타입 정의 추가 ---
interface HeaderProps {
  onLoginClick: () => void; // 로그인 버튼 클릭 시 호출될 함수 prop 추가
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

const LogoLink = styled(Link)` /* StyledLink -> LogoLink 이름 변경 */
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

// ✅ 핵심 변경: styled('span')으로 수정해서 as="a" 시 타입 인식되게 함
const NavButton = styled.a<{ primary?: boolean; as?: 'a' | 'button' }>` /* button으로 변경, as prop 추가 */
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
  display: inline-block; /* a 태그처럼 보이게 */
  text-align: center; /* 버튼 텍스트 정렬 */

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }

  @media (max-width: 768px) {
    font-size: 13px;
    padding: 6px 12px;
  }
`; //


// --- Header 컴포넌트 ---
function Header({ onLoginClick }: HeaderProps) {
  return (
    <HeaderContainer>
      {/* 로고 클릭 시 홈('/')으로 이동 */}
      <LogoLink to="/">
        <Logo>First Trip</Logo>
      </LogoLink>

      <Nav>
        {/* 로그인 페이지 이동 */}
          <NavButton
          as = "button"
          type = "button"
          onClick={onLoginClick}>로그인</NavButton>

        {/* 카카오 회원가입 */}
        <NavButton
          primary
          href={KAKAO_AUTH_URL}
        >
          회원 가입
        </NavButton>
      </Nav>
    </HeaderContainer>
  );
}

export default Header;
