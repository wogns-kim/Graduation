import React, { useState } from 'react';
import styled from "@emotion/styled";
import { Link } from 'react-router-dom';
import { Trash2 } from "lucide-react";

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

const DeleteButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #eee;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #a0aec0;
  transition: all 0.2s;
  z-index: 10;

  &:hover {
    background: #fff5f5;
    color: #e53e3e;
    border-color: #feb2b2;
    transform: scale(1.1);
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
  onDeleteTrip: (id: number) => void; // [추가] 삭제 핸들러 타입 정의
}

const UserTabs: React.FC<UserTabsProps> = ({ travelLogs, preferences, onDeleteTrip }) => {
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
                <DeleteButton 
                  onClick={(e) => {
                    e.preventDefault(); // 링크 이동 방지
                    e.stopPropagation(); // 이벤트 전파 방지
                    onDeleteTrip(log.id);
                  }}
                  title="여행 기록 삭제"
                >
                  <Trash2 size={16} />
                </DeleteButton>
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