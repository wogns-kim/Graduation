import React, { useState } from "react";
import styled from "@emotion/styled";
import { useNavigate } from "react-router-dom";

// 데이터를 객체 배열로 깔끔하게 분리
const categories = [
    {
        title: "여행 스타일",
        icon: "✈️",
        keywords: [
            "힐링/휴양",
            "액티비티",
            "문화/역사",
            "쇼핑/시티 투어",
            "미식/쇼핑",
        ],
    },
    {
        title: "식사 선호도",
        icon: "🍜",
        keywords: ["로컬 맛집", "가성비 맛집", "프리미엄"],
    },
    {
        title: "동행 유형",
        icon: "👨‍👩‍👧‍👦",
        keywords: [
            "나 홀로 여행",
            "친구/지인",
            "가족 여행",
            "펫 동반 여행",
            "아이 동반 여행",
        ],
    },
];

interface KeywordButtonProps {
    isSelected: boolean;
}

export default function Taste() {
    const [selectedKeywords, setSelectedKeywords] = useState(new Set<string>());
    const navigate = useNavigate();

    const toggleKeyword = (keyword: string) => {
        setSelectedKeywords((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(keyword)) {
                newSet.delete(keyword);
            } else {
                newSet.add(keyword);
            }
            return newSet;
        });
    };

    // 저장 버튼 클릭 시 실행될 함수
    const handleSave = () => {
        console.log("선택된 취향:", Array.from(selectedKeywords));
        navigate('/');
    };

    return (
        <PageWrapper>
            <Container>
                <Header>
                    <h1>여행할 때, 당신의 스타일은 어떤 편인가요?</h1>
                    <p>
                        좋아하는 여행 키워드를 골라 여행 루트를 만들어보세요. (여러 개 선택
                        가능)
                    </p>
                </Header>

                <MainGrid>
                    {categories.map((category) => {
                        // 공통 카드 내용
                        const CardContent = (
                            <CategoryColumn>
                                <CategoryHeader>
                                    <span role="img" aria-label={category.title}>
                                        {category.icon}
                                    </span>
                                    <CategoryTitle>{category.title}</CategoryTitle>
                                </CategoryHeader>
                                <Line />
                                <ButtonGrid>
                                    {category.keywords.map((keyword) => (
                                        <KeywordButton
                                            key={keyword}
                                            isSelected={selectedKeywords.has(keyword)}
                                            onClick={() => toggleKeyword(keyword)}
                                        >
                                            {keyword}
                                        </KeywordButton>
                                    ))}
                                </ButtonGrid>
                            </CategoryColumn>
                        );

                        // '동행 유형'인 경우에만 위에 저장 버튼 추가
                        if (category.title === "동행 유형") {
                            return (
                                <CategoryWrapper key={category.title}>
                                    <SaveButton onClick={handleSave}>저장</SaveButton>
                                    {CardContent}
                                </CategoryWrapper>
                            );
                        }

                        // 나머지 카테고리
                        return (
                            <CategoryWrapper key={category.title}>
                                {CardContent}
                            </CategoryWrapper>
                        );
                    })}
                </MainGrid>
            </Container>
        </PageWrapper>
    );
}

// --- 스타일 컴포넌트 ---
const PageWrapper = styled.div`
  min-height: 100vh;
  width: 100%;
  background-color: white;
  overflow-x: hidden;
`;

const Container = styled.div`
  min-height: 100vh;
  background-color: white;
  padding: 1rem 2rem 2rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 4rem; /* 버튼 공간 확보를 위해 여백 유지 */

  h1 {
    color: rgb(33, 33, 33);
    font-size: 2.5rem;
    font-weight: 400;
    text-shadow: 4px 4px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 0.5rem;
  }

  p {
    color: rgba(118, 118, 118, 0.7);
    font-size: 1.25rem;
    font-family: Inter, sans-serif;
    font-weight: 400;
  }
`;

const MainGrid = styled.main`
  display: grid;
  flex: 1;
  align-items: stretch; /* 높이를 꽉 채우도록 설정 */
  grid-template-columns: 1fr 1fr 1fr;
  gap: 2.5rem;

  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const CategoryWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const CategoryColumn = styled.div`
  display: flex;
  flex-direction: column;
  background-color: rgba(255, 253, 253, 0.67);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #eee;
  flex: 1;
  height: 100%;
`;

const CategoryHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;

  span[role="img"] {
    font-size: 2.25rem;
  }
`;

const CategoryTitle = styled.h2`
  color: rgb(123, 123, 123);
  font-size: 1.75rem;
  font-family: Inter, sans-serif;
  font-weight: 600;
  margin-left: 0.75rem;
`;

const Line = styled.div`
  width: 100%;
  height: 1px;
  background-color: rgb(123, 123, 123);
  margin-bottom: 1.5rem;
`;

const ButtonGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const KeywordButton = styled.button<KeywordButtonProps>`
  padding: 0.6rem 1.2rem;
  font-size: 1rem;
  font-family: Inter, sans-serif;
  font-weight: 600;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  box-shadow: 3px 5px 4px 0px rgba(0, 0, 0, 0.15);

  border: 2px solid ${(props) =>
      props.isSelected ? "rgb(255, 115, 115)" : "rgb(251, 251, 251)"};
  background-color: ${(props) =>
      props.isSelected ? "rgba(255, 220, 220, 0.5)" : "rgb(251, 251, 251)"};
  color: ${(props) => (props.isSelected ? "rgb(220, 50, 50)" : "black")};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 3px 7px 8px 0px rgba(0, 0, 0, 0.1);
  }
`;

// 👇 깔끔하게 변경된 저장 버튼 스타일
const SaveButton = styled.button`
  position: absolute;
  top: -4rem; 
  right: 0;
  
  /* 디자인 변경: 심플하고 모던하게 */
  background-color: #3C73EC; /* 테마의 Primary Color (파란색) */
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 6px rgba(60, 115, 236, 0.2); /* 부드러운 파란 그림자 */
  transition: all 0.2s ease;

  &:hover {
    background-color: #2a5bbf; /* 호버 시 약간 진하게 */
    transform: translateY(-2px); /* 살짝 떠오르는 효과 */
    box-shadow: 0 6px 12px rgba(60, 115, 236, 0.3);
  }

  &:active {
    transform: translateY(0); /* 클릭 시 눌리는 효과 */
  }

  @media (max-width: 900px) {
    position: static;
    margin-bottom: 1rem;
    align-self: flex-end;
  }
`;