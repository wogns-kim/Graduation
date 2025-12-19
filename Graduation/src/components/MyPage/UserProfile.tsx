import React from 'react';
import styled from "@emotion/styled";

const ProfileContainer = styled.div`
  display: flex;
  align-items: center;
  background-color: #ffffff;
  border: 1px solid #eee;
  border-radius: 20px;
  padding: 40px;
  margin-bottom: 40px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 20px;
  }
`;

const ProfileImage = styled.img`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 40px;
  border: 4px solid #f8f9fa;

  @media (max-width: 768px) {
    margin-right: 0;
  }
`;

const InfoSection = styled.div`
  flex: 1;
  text-align: left;
  @media (max-width: 768px) {
    text-align: center;
  }
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
   @media (max-width: 768px) {
    justify-content: center;
  }
`;

const Name = styled.h2`
  font-size: 2rem;
  font-weight: 800;
  color: #333;
  margin: 0;
`;

const Badge = styled.span`
  background-color: #e6fcf5;
  color: #0ca678;
  font-size: 0.8rem;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 12px;
`;

const StatRow = styled.div`
  font-size: 1.2rem;
  color: #333;
  margin-bottom: 10px;
  font-weight: 600;
  
  span {
      color: #007bff;
      font-weight: 800;
      font-size: 1.4rem;
      margin-left: 5px;
  }
`;

const Bio = styled.p`
  color: #868e96;
  font-size: 1rem;
  margin: 0;
  line-height: 1.5;
`;

interface UserData {
  name: string;
  introduction: string;
  travelPreferences: string[];
  profileImage: string;
}

interface UserProfileProps {
  user: UserData;
  tripCount: number;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, tripCount }) => {
  return (
    <ProfileContainer>
      <ProfileImage src={user.profileImage} alt="프로필" />
      <InfoSection>
        <NameRow>
            <Name>{user.name}</Name>
            <Badge>여행자</Badge>
        </NameRow>
        
        <StatRow>
            생성한 여행 <span>{tripCount}</span>
        </StatRow>

        <Bio>{user.introduction}</Bio>
      </InfoSection>
    </ProfileContainer>
  );
};

export default UserProfile;