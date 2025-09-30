// src/components/Header/index.tsx

import styled from "@emotion/styled";

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

const Nav = styled.nav`
  display: flex;
  gap: 1rem;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

const NavButton = styled.button<{ primary?: boolean }>`
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid ${({ theme, primary }) => (primary ? 'transparent' : theme.colors.border)};
  cursor: pointer;
  font-size: 15px;
  font-weight: 600;
  background-color: ${({ theme, primary }) => (primary ? theme.colors.primary : theme.colors.white)};
  color: ${({ theme, primary }) => (primary ? theme.colors.white : theme.colors.text)};
  transition: all 0.2s ease-in-out;

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
    return (
        <HeaderContainer>
            <Logo>First Trip</Logo>
            <Nav>
                <NavButton>로그인</NavButton>
                <NavButton primary>회원 가입</NavButton>
            </Nav>
        </HeaderContainer>
    );
}

export default Header;