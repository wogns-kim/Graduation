import React, { useState, useEffect } from 'react';
import styled from "@emotion/styled";
import { useNavigate } from 'react-router-dom';

import UserProfile from '../../components/MyPage/UserProfile';
import UserTabs from '../../components/MyPage/UserTabs';

// --- API 응답 데이터 타입 (백엔드 스키마) ---
interface APIUserProfile {
  username: string;
  profile_image_url: string | null;
  preferences: string | null; // 예: "#힐링,#맛집"
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
  
  // const [selectedStyle, setSelectedStyle] = useState('전체'); // 사용하지 않으므로 제거 가능

  // 2. 로그아웃
  const handleLogout = () => {
    if (window.confirm("로그아웃 하시겠습니까?")) {
        localStorage.removeItem("access_token");
        navigate('/');
    }
  };

  // 3. 백엔드 데이터 가져오기
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
        // .env 환경변수 사용 권장 (import.meta.env.VITE_BACKEND_API_URL)
        const API_BASE = "http://127.0.0.1:8000/api";

        // (1) 내 프로필 조회
        const userRes = await fetch(`${API_BASE}/users/me`, { headers });
        if (userRes.ok) {
            const userData = await userRes.json();
            setApiUser(userData);
            
            /* UserProfile에서 필터링 기능을 사용하지 않으므로 이 부분도 제거 가능
            if (userData.preferences) {
                const firstPref = userData.preferences.split(',')[0];
                setSelectedStyle(firstPref.replace('#', ''));
            }
            */
        } else if (userRes.status === 401) {
            localStorage.removeItem("access_token");
            alert("세션이 만료되었습니다.");
            navigate("/");
            return;
        }

        // (2) 내 여행 목록 조회
        const tripsRes = await fetch(`${API_BASE}/trips/my-trips`, { headers });
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

  if (isLoading) return <div style={{textAlign: 'center', marginTop: '100px'}}>로딩 중...</div>;

  // 4. 데이터 가공 (백엔드 데이터 -> 프론트 컴포넌트용 데이터 변환)
  
  // UserProfile용 데이터 가공
  const userProfileData = apiUser ? {
      name: apiUser.username,
      ageGroup: '20대', 
      introduction: '아직 자기소개가 없습니다.', 
      // --- [수정] travelPreferences (배열)로 변환하여 전달 ---
      travelPreferences: apiUser.preferences ? apiUser.preferences.split(',') : [],
      profileImage: apiUser.profile_image_url || '/MyPage_images/Profile.png', 
  } : {
      name: '', 
      ageGroup: '', 
      introduction: '', 
      travelPreferences: [], // 빈 배열
      profileImage: ''
  };

  // UserTabs용 데이터 (여행 목록)
  const travelLogsData = apiTrips.map(trip => ({
      id: trip.trip_id,
      title: trip.trip_name,
      price: 0, 
      imageUrl: `https://source.unsplash.com/random/300x200/?travel&sig=${trip.trip_id}` 
  }));

  return (
    <>
      {/* <Header /> */}
      <PageContainer>
        <ContentWrap>
          <PageHeader>
            <Title>마이페이지</Title>
            <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
          </PageHeader>

          {/* 프로필 정보 컴포넌트 */}
          {/* --- [수정] 불필요한 props (selectedValue, onChange) 제거 --- */}
          <UserProfile
            user={userProfileData}
            tripCount={travelLogsData.length} // UserProfile에 필요한 tripCount 전달
          />

          {/* 탭 메뉴 및 컨텐츠 컴포넌트 */}
          {/* preferences도 함께 전달 */}
          <UserTabs 
            travelLogs={travelLogsData} 
            preferences={userProfileData.travelPreferences} 
          />
        </ContentWrap>
      </PageContainer>
    </>
  );
};

export default MyPage;