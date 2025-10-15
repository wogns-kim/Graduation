import React from 'react';
import styled from "@emotion/styled";

interface User {
  name: string;
  ageGroup: string;
  introduction: string;
  travelPreference: string;
  profileImage: string;
}

interface UserProfileProps {
  user: User;
}

const ProfileContainer = styled.div`
  background-color: white;
  border-radius: 16px;
  padding: 30px;
  display: flex;
  gap: 100px; /* 이미지와 컨텐츠 사이 간격 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #e9e9e9;
  margin-bottom: 40px;

  @media (max-width: 768px) {
    flex-direction: column; /* 모바일에서는 세로로 쌓이도록 변경 */
    align-items: center;
    text-align: center;
  }
`;

const ProfileImage = styled.img`
  width: 200px;
  height: 200px;
  border-radius: 12px;
  object-fit: cover;

  transform: translate(20px, 20px); /* 오른쪽으로 20px, 아래로 20px 이동 */
`;

const ContentContainer = styled.div`
  flex: 1; /* 남은 공간을 모두 차지하도록 */
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
`;

const Name = styled.h2`
  font-size: 2rem;
  font-weight: bold;
  margin: 0;
`;

const HeartButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
`;

const Tag = styled.span`
  background-color: #e6f9e6;
  color: #00b300;
  font-weight: bold;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.9rem;
  align-self: flex-start; /* 컨텐츠 시작점에 맞춤 */
  margin-top: 5px;

  @media (max-width: 768px) {
    align-self: center; /* 모바일에서는 중앙 정렬 */
  }
`;

const Stat = styled.p`
  font-size: 2.5rem;
  font-weight: bold;
  color: #333;
  margin: 15px 0;
`;

const Introduction = styled.p`
  color: #555;
  font-size: 1rem;
  flex-grow: 1; /* 남은 세로 공간을 차지하여 드롭다운을 아래로 밀어냄 */
`;

const Dropdown = styled.select`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fafafa;
  width: 200px;
  align-self: flex-start;

  @media (max-width: 768px) {
    width: 100%;
    align-self: center;
  }
`;

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  return (
    <ProfileContainer>
      <ProfileImage src={user.profileImage} alt={`${user.name}의 프로필 사진`} />
      <ContentContainer>
        <Header>
          <Name>{user.name}</Name>
          <HeartButton>❤️</HeartButton>
        </Header>
        <Tag>자기소개</Tag>
        <Stat>{user.ageGroup}</Stat>
        <Introduction>{user.introduction}</Introduction>
        <Dropdown defaultValue={user.travelPreference}>
          <option value="혼자 여행">혼자 여행</option>
          <option value="친구와 여행">친구와 여행</option>
          <option value="연인과 여행">연인과 여행</option>
        </Dropdown>
      </ContentContainer>
    </ProfileContainer>
  );
};

export default UserProfile;