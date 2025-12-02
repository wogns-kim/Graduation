import React, { useState } from 'react';
import styled from '@emotion/styled';
import { X } from 'lucide-react';

interface CodeInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (code: string) => void;
}

// --- 스타일 정의 ---
const Overlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: ${({ isOpen }) => (isOpen ? 'flex' : 'none')};
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const Content = styled.form`
  background-color: white;
  padding: 2.5rem;
  border-radius: 16px;
  width: 100%;
  max-width: 400px;
  position: relative;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  text-align: center;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #888;
  &:hover { color: #333; }
`;

const Title = styled.h2`
  margin: 0 0 1.5rem 0;
  font-size: 1.8rem;
  color: #333;
`;

const Description = styled.p`
  color: #666;
  margin-bottom: 2rem;
  font-size: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px;
  border: 2px solid #ddd;
  border-radius: 12px;
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  text-align: center;
  transition: border-color 0.2s;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: #3C73EC;
  }
`;

const JoinButton = styled.button`
  width: 100%;
  padding: 14px;
  background-color: #3C73EC;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #2a5bbf;
  }
`;

// --- 컴포넌트 ---
const CodeInputModal = ({ isOpen, onClose, onJoin }: CodeInputModalProps) => {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      onJoin(code.trim());
      setCode(''); // 입력창 초기화
    }
  };

  // 모달 닫힐 때 입력값 초기화
  const handleClose = () => {
    setCode('');
    onClose();
  };

  return (
    <Overlay isOpen={isOpen} onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <Content onSubmit={handleSubmit}>
        <CloseButton type="button" onClick={handleClose}>
          <X size={24} />
        </CloseButton>
        <Title>함께 여행하기</Title>
        <Description>친구가 공유해준 초대 코드를 입력하세요.</Description>
        <Input 
          type="text" 
          placeholder="초대 코드 입력" 
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
        />
        <JoinButton type="submit">입장하기</JoinButton>
      </Content>
    </Overlay>
  );
};

export default CodeInputModal;