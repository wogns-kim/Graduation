import React, { useState } from 'react';
import styled from "@emotion/styled";

interface TravelLog {
  id: number;
  title: string;
  price: number;
  imageUrl: string;
}

interface UserTabsProps {
  travelLogs: TravelLog[];
}

const TabsContainer = styled.div`
  width: 100%;
`;

const TabButtons = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  border-bottom: 2px solid #eee;
`;

const TabButton = styled.button<{ active: boolean }>`
  padding: 15px 25px;
  font-size: 1.1rem;
  font-weight: bold;
  border: none;
  background: none;
  cursor: pointer;
  color: ${(props) => (props.active ? '#333' : '#aaa')};
  border-bottom: 3px solid ${(props) => (props.active ? '#333' : 'transparent')};
  margin-bottom: -2px; /* 아래 테두리와 겹치도록 */
`;

const ContentContainer = styled.div`
  padding: 20px 0;
`;

// 여행 기록 카드를 위한 스타일
const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TravelCard = styled.div`
  background-color: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9e9e9;
`;

const CardImage = styled.img`
  width: 100%;
  height: 400px;
  object-fit: cover;
`;

const CardInfo = styled.div`
  padding: 15px;
`;

const CardTitle = styled.h3`
  margin: 0 0 10px 0;
  font-size: 1.2rem;
`;

const CardPrice = styled.p`
  margin: 0;
  font-weight: bold;
  color: #555;
`;

const UserTabs: React.FC<UserTabsProps> = ({ travelLogs }) => {
  // 'log' (여행 기록) 또는 'notification' (알림) 상태를 관리
  const [activeTab, setActiveTab] = useState('log');

  return (
    <TabsContainer>
      <TabButtons>
        <TabButton
          active={activeTab === 'log'}
          onClick={() => setActiveTab('log')}
        >
          여행 기록
        </TabButton>
        <TabButton
          active={activeTab === 'notification'}
          onClick={() => setActiveTab('notification')}
        >
          선택한 취향
        </TabButton>
      </TabButtons>

      <ContentContainer>
        {activeTab === 'log' ? (
          // "여행 기록" 탭이 활성화된 경우
          <CardGrid>
            {travelLogs.map((log) => (
              <TravelCard key={log.id}>
                <CardImage src={log.imageUrl} alt={log.title} />
                <CardInfo>
                  <CardTitle>{log.title}</CardTitle>
                  <CardPrice>{`$${log.price.toLocaleString()}`}</CardPrice>
                </CardInfo>
              </TravelCard>
            ))}
          </CardGrid>
        ) : (
          // "알림" 탭이 활성화된 경우
          <div>
            <p>선택한 취향이 없습니다.</p>
          </div>
        )}
      </ContentContainer>
    </TabsContainer>
  );
};

export default UserTabs;