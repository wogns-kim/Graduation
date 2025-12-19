import React, { useState, useEffect } from 'react';
import styled from "@emotion/styled";
import { useNavigate } from 'react-router-dom';
// [수정 1] config에서 API 주소 가져오기 (이미 import 되어 있네요!)
import { API_BASE_URL } from '../../config';

import UserProfile from '../../components/MyPage/UserProfile';
import UserTabs from '../../components/MyPage/UserTabs';

// --- API 응답 데이터 타입 (백엔드 스키마) ---
interface APIUserProfile {
  username: string;
  profile_image_url: string | null;
  preferences: string | null;
}

interface APITrip {
  trip_id: number;
  trip_name: string;
}

// --- 스타일 정의 (기존과 동일) ---
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #ffffff;
  padding: 40px 20px;
  min-height: 100vh;
`;

const ContentWrap = styled.div`
  width: 100%;
  max-width: 1024px;
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: bold;
  color: #333;
`;

const LogoutButton = styled.button`
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 8px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    color: #333;
    border-color: #333;
  }
`;

// --- 메인 컴포넌트 ---
const MyPage = () => {
  const navigate = useNavigate();

  // 1. 상태 관리
  const [apiUser, setApiUser] = useState<APIUserProfile | null>(null);
  const [apiTrips, setApiTrips] = useState<APITrip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. 수정 버튼 (취향 선택 페이지 이동)
  const handleEdit = () => {
    navigate('/taste');
  };

  // 3. 백엔드 데이터 가져오기 (병렬 처리 적용)
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("로그인이 필요합니다.");
        navigate("/");
        return;
      }

      try {
        const headers = { 
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        };

        // [수정 2] Promise.all을 사용하여 프로필과 여행 목록을 '동시에' 요청 (속도 향상)
        // [수정 3] 하드코딩된 주소 대신 API_BASE_URL 사용
        const [userRes, tripsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/users/me`, { headers }),
          fetch(`${API_BASE_URL}/api/trips/my-trips`, { headers })
        ]);

        // (1) 프로필 응답 처리
        if (userRes.ok) {
            const userData = await userRes.json();
            setApiUser(userData);
        } else if (userRes.status === 401) {
            localStorage.removeItem("access_token");
            alert("세션이 만료되었습니다.");
            navigate("/");
            return; // 여기서 종료
        }

        // (2) 여행 목록 응답 처리
        if (tripsRes.ok) {
            setApiTrips(await tripsRes.json());
        }

      } catch (error) {
        console.error("데이터 로딩 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleDeleteTrip = async (tripId: number) => {
    if (!window.confirm("정말로 이 여행 기록을 삭제하시겠습니까?")) return;

    const token = localStorage.getItem("access_token");
    
    // [수정 4] 삭제 요청에서도 하드코딩 제거하고 config 변수 사용
    try {
      const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (response.ok) {
        setApiTrips(prev => prev.filter(trip => trip.trip_id !== tripId));
        alert("여행 기록이 삭제되었습니다.");
      } else {
        const errorData = await response.json();
        alert(`삭제 실패: ${errorData.detail || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error("삭제 중 오류:", error);
      alert("서버 오류가 발생했습니다.");
    }
  };

  if (isLoading) return <div style={{textAlign: 'center', marginTop: '100px'}}>로딩 중...</div>;

  // 4. 데이터 가공
  const userProfileData = apiUser ? {
      name: apiUser.username,
      ageGroup: '20대', 
      introduction: '아직 자기소개가 없습니다.', 
      travelPreferences: apiUser.preferences ? apiUser.preferences.split(',') : [],
      profileImage: apiUser.profile_image_url || '/MyPage_images/Profile.png', 
  } : {
      name: '', 
      ageGroup: '', 
      introduction: '', 
      travelPreferences: [],
      profileImage: ''
  };

  const travelLogsData = apiTrips.map(trip => ({
      id: trip.trip_id,
      title: trip.trip_name,
      price: 0, 
      imageUrl: `https://source.unsplash.com/random/300x200/?travel&sig=${trip.trip_id}` 
  }));

  return (
    <>
      <PageContainer>
        <ContentWrap>
          <PageHeader>
            <Title>마이페이지</Title>
            <LogoutButton onClick={handleEdit}>수정</LogoutButton>
          </PageHeader>

          <UserProfile
            user={userProfileData}
            tripCount={travelLogsData.length} 
          />

          <UserTabs 
            travelLogs={travelLogsData} 
            preferences={userProfileData.travelPreferences}
            onDeleteTrip={handleDeleteTrip}
          />
        </ContentWrap>
      </PageContainer>
    </>
  );
};

export default MyPage;