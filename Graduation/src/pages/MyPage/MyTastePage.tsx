import React, { useState } from 'react';
import styled from "@emotion/styled";
import { useNavigate } from 'react-router-dom';

import UserProfile from '../../components/MyPage/UserProfile';
import UserTabs from '../../components/MyPage/UserTabs';
//import Header from '../../components/Header'; // 공통 헤더가 있다면 불러옵니다.



// 스타일 정의 (styled-components)
const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center; /* 컨텐츠를 중앙 정렬합니다. */
  background-color: #ffffffff; /* 페이지 배경색 */
  padding: 40px 20px;
  min-height: 100vh;
`;

const ContentWrap = styled.div`
  width: 100%;
  max-width: 1024px; /* 페이지의 최대 너비를 설정합니다. */
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
`;

const LogoutButton = styled.button`
  background-color: #ffffffff;
  border: 1px solid #ddd;
  border-radius: 20px;
  padding: 8px 16px;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
`;

const soloTravelLogs = [
  { id: 1, title: '서울 탐방', price: 0, imageUrl: '/mainpage_images/mainpage_Seoul.png' },
  { id: 2, title: '부산 여행', price: 0, imageUrl: '/mainpage_images/mainpage_Busan.png' },
  { id: 3, title: '제주도 일주', price: 0, imageUrl: '/mainpage_images/mainpage_Jeju.png' },
];
const friendTravelLogs = [
  { id: 4, title: '대전 여행', price: 0, imageUrl: '/mainpage_images/mainpage_Daejeon.png' },
  { id: 5, title: '전주 여행', price: 0, imageUrl: '/mainpage_images/mainpage_Jeonju.png' },
];
const coupleTravelLogs = [
  { id: 7, title: '여수 여행', price: 0, imageUrl: '/mainpage_images/mainpage_Yeosu.png' },
  
];

// MyPage 컴포넌트
const MyPage = () => {
  //  Mock 데이터 (실제로는 API 통신으로 받아올 데이터입니다)
  const navigate = useNavigate();

  const [selectedStyle, setSelectedStyle] = useState('혼자 여행');

  const handleLogout = () => {
    // '/' 경로(HomePage)로 페이지를 이동시킵니다.
    navigate('/');
  };

  const mockUserData = {
    name: '햄스깽',
    ageGroup: '2+', // 예시 데이터
    introduction: '솔직히 햄스터 뭐 넣어서 만들고 싶은데 ..그냥 그렇다고',
    travelPreference: '혼자 여행',
    profileImage: '/MyPage_images/Profile.png',
  };

// 여행 기록 사진
  const displayedLogs = () => {
    if (selectedStyle === '친구와 여행') {
      return friendTravelLogs;
    }
    if (selectedStyle === '연인과 여행') {
      return coupleTravelLogs;
    }
    return soloTravelLogs; // 기본값
  };

  return (
    <>
      {/* <Header /> 공통 헤더가 있다면 여기에 배치 */}
      <PageContainer>
        <ContentWrap>
          <PageHeader>
            <Title>마이페이지</Title>
            <LogoutButton onClick={handleLogout}>로그아웃</LogoutButton>
          </PageHeader>

          {/* 프로필 정보 컴포넌트 */}
          <UserProfile
            user={mockUserData}
            selectedValue={selectedStyle}
            onChange={(e) => setSelectedStyle(e.target.value)}
          />

          {/* 탭 메뉴 및 컨텐츠 컴포넌트 */}
          <UserTabs travelLogs={displayedLogs()} />
        </ContentWrap>
      </PageContainer>
    </>
  );
};

export default MyPage;