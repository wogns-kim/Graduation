// src/components/CityCard/index.tsx
//new
//new2
import styled from "@emotion/styled";

// --- 스타일 컴포넌트 ---

const CardContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden; // 이미지가 둥근 모서리를 넘어가지 않도록
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
    height: 100%; // 그리드 높이에 맞춤


  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
  }
`;

const CardImage = styled.img`
  width: 100%;
  height: 280px; // 고정 높이로 변경
  object-fit: cover;
  flex-shrink: 0; // 이미지가 줄어들지 않도록
`;

const CardBody = styled.div`
  padding: 1.25rem; // 2.0rem에서 1.25rem으로 줄임
  flex: 1; // 남은 공간 채우기
  display: flex;
  flex-direction: column;
`;

const CardTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.text};
`;

const CardDescription = styled.p`
  margin: 0;
  font-size: 1rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.textSecondary};
`;


// --- 타입 정의 ---

interface CityCardProps {
    name: string;
    description: string;
    imageUrl: string;
}


// --- CityCard 컴포넌트 ---

function CityCard({ name, description, imageUrl }: CityCardProps) {
    return (
        <CardContainer>
            <CardImage src={imageUrl} alt={`Image of ${name}`} />
            <CardBody>
                <CardTitle>{name}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardBody>
        </CardContainer>
    );
}

export default CityCard;