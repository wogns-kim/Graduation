import React, { useState } from 'react';
import styled from '@emotion/styled';
// import { X } from 'lucide-react'; // 닫기 아이콘 사용 시

// --- 타입 정의 ---
interface LoginModalProps {
  isOpen: boolean; // 모달이 열려 있는지 여부
  onClose: () => void; // 모달을 닫는 함수
}

// --- 스타일 정의 ---
const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed; /* 화면 전체를 덮도록 고정 */
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5); /* 반투명 배경 */
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')}; /* isOpen 상태에 따라 보이기/숨기기 */
  justify-content: center;
  align-items: center;
  z-index: 1000; /* 다른 요소들 위에 보이도록 */
`;

const ModalContent = styled.div`
  background-color: ${({ theme }) => theme.colors.white}; //
  padding: 2.5rem 2rem;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  
  width: 100%;
  max-width: 400px; 
  position: relative; 
  text-align: center;
  box-sizing: border-box; 

  @media (max-width: 480px) {
    max-width: 90%; 
    max-width: calc(100% - 2rem);
    padding: 2rem 1.5rem;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #aaa;
  &:hover {
    color: #333;
  }
`;

// --- LoginPage에서 가져온 스타일 (약간 수정) ---
const Title = styled.h2` /* h1 -> h2로 변경 */
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 2rem;
  font-weight: 700;
`;
// InputGroup, Label, Input, CheckboxGroup, Button, LinkGroup, StyledLink 등
// LoginPage.tsx의 스타일을 여기에 붙여넣습니다. (필요시 약간 수정)
// 예시: Button 스타일
const Button = styled.button<{ primary?: boolean }>`
  width: 100%;
  padding: 14px;
  margin-bottom: 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  background-color: ${({ theme, primary }) => (primary ? '#555' : theme.colors.white)}; /* 로그인 버튼 색상 변경 */
  color: ${({ theme, primary }) => (primary ? theme.colors.white : theme.colors.text)};
  border: ${({ theme, primary }) => (primary ? 'none' : `1px solid ${theme.colors.border}`)};
`;
// ... (나머지 스타일 붙여넣기) ...
const InputGroup = styled.div` /* ... */ `;
const Label = styled.label` /* ... */ `;
const Input = styled.input` /* ... */ `;
const CheckboxGroup = styled.div` /* ... */ `;
const LinkGroup = styled.div` /* ... */ `;
const StyledLink = styled.a` /* Link -> a 태그로 변경 (페이지 이동X) */
  color: ${({ theme }) => theme.colors.textSecondary};
  text-decoration: none;
  cursor: pointer; /* 클릭 가능 표시 */
   &:hover {
    color: ${({ theme }) => theme.colors.primary};
  }
`;


// --- LoginModal 컴포넌트 ---
const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('ID:', id, 'Password:', password, 'Remember Me:', rememberMe);
    alert('로그인 시도 (구현 필요)');
    // 로그인 성공 시 onClose(); 호출하여 모달 닫기
  };

  // 배경 클릭 시 닫기
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalOverlay isOpen={isOpen} onClick={handleOverlayClick}>
      <ModalContent>
        <CloseButton onClick={onClose}>&times;</CloseButton> {/* 닫기 버튼 */}
        <Title>LOGIN</Title> {/* LoginPage의 Title 스타일 재활용 */}

        <form onSubmit={handleLogin}>
           {/* LoginPage의 InputGroup, Input 등을 여기에 붙여넣습니다. */}
          <InputGroup>
            <Label htmlFor="modal-id">아이디</Label>
            <Input
              type="text"
              id="modal-id"
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
            />
          </InputGroup>
          <InputGroup>
            <Label htmlFor="modal-password">비밀번호</Label>
            <Input
              type="password"
              id="modal-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </InputGroup>
          <CheckboxGroup>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <label htmlFor="rememberMe">로그인 유지</label>
          </CheckboxGroup>

          <Button type="submit" primary>로그인</Button>

          <LinkGroup>
             {/* Link 대신 span이나 a 태그 사용 */}
            <StyledLink onClick={() => alert('ID/PW 찾기 구현 필요')}>ID/PW 찾기</StyledLink>
            <StyledLink onClick={() => alert('회원가입 구현 필요')}>회원가입</StyledLink>
          </LinkGroup>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
};

export default LoginModal;