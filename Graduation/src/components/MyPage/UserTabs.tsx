import React, { useState } from 'react';
import styled from "@emotion/styled";
import { Link } from 'react-router-dom';

// --- 스타일 ---
const TabsContainer = styled.div`
  margin-bottom: 30px;
  border-bottom: 2px solid #eee;
  display: flex;
  gap: 40px;
`;

const TabButton = styled.button<{ isActive: boolean }>`
  padding: 15px 5px;
  font-size: 1.1rem;
  font-weight: 700;
  color: ${(props) => (props.isActive ? "#333" : "#adb5bd")};
  border: none;
  background: none;
  border-bottom: 3px solid ${(props) => (props.isActive ? "#333" : "transparent")};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: #333;
  }
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 25px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const TripCard = styled(Link)`
  display: block;
  text-decoration: none;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s;
  border: 1px solid #eee;

  &:hover {
    transform: translateY(-5px);
  }
`;

const CardImage = styled.div<{ bgUrl: string }>`
  height: 180px;
  background-image: url(${(props) => props.bgUrl});
  background-size: cover;
  background-position: center;
`;

const CardContent = styled.div`
  padding: 20px;
`;

const CardTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #333;
  margin: 0;
`;

// 취향 태그 스타일
const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 20px 0;
`;

const Tag = styled.span`
  background-color: #f8f9fa;
  color: #495057;
  border: 1px solid #e9ecef;
  padding: 10px 20px;
  border-radius: 30px;
  font-size: 1rem;
  font-weight: 600;
`;

// --- 타입 ---
interface TravelLog {
  id: number;
  title: string;
  imageUrl: string;
}

interface UserTabsProps {
  travelLogs: TravelLog[];
  preferences: string[]; // 취향 목록 (문자열 배열)
}

const UserTabs: React.FC<UserTabsProps> = ({ travelLogs, preferences }) => {
  // 탭 상태 관리 (기본값: 'records')
  const [activeTab, setActiveTab] = useState<"records" | "tastes">("records");

  return (
    <div>
      <TabsContainer>
        <TabButton isActive={activeTab === "records"} onClick={() => setActiveTab("records")}>
          여행 기록
        </TabButton>
        <TabButton isActive={activeTab === "tastes"} onClick={() => setActiveTab("tastes")}>
          선택한 취향
        </TabButton>
      </TabsContainer>

      {/* 1. 여행 기록 탭 내용 */}
      {activeTab === "records" && (
        <GridContainer>
          {travelLogs.length > 0 ? (
            travelLogs.map((log) => (
              <TripCard key={log.id} to={`/travel-route/${log.id}`}>
                <CardImage bgUrl={log.imageUrl} />
                <CardContent>
                  <CardTitle>{log.title}</CardTitle>
                </CardContent>
              </TripCard>
            ))
          ) : (
            <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 0", color: "#888" }}>
              아직 생성된 여행 기록이 없습니다.
              <br />
              새로운 여행을 계획해 보세요!
            </div>
          )}
        </GridContainer>
      )}
      
      {/* 2. 선택한 취향 탭 내용 */}
      {activeTab === "tastes" && (
        <div>
           {preferences.length > 0 ? (
               <TagContainer>
                   {preferences.map((tag, idx) => (
                       <Tag key={idx}>{tag}</Tag>
                   ))}
               </TagContainer>
           ) : (
               <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>
                   선택한 취향 정보가 없습니다.
               </div>
           )}
        </div>
      )}
    </div>
  );
};

export default UserTabs;