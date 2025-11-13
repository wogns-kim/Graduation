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

interface NavButtonProps {
    primary?: boolean;
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

    // 저장 버튼 클릭 시 실행될 함수를 만듭니다.
    const handleSave = () => {
        // (선택 사항) 선택된 취향을 localStorage나 백엔드에 저장할 수 있습니다.
        console.log("선택된 취향:", Array.from(selectedKeywords));
        
        // HomePage('/')로 이동합니다.
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
                    {categories.map((category) => (
                        <CategoryColumn key={category.title}>
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
                    ))}
                </MainGrid>

                <NavContainer>
                    <NavButton primary onClick={handleSave}>저장</NavButton>
                </NavContainer>
            </Container>
        </PageWrapper>
    );
}

// --- 페이지 전체 래퍼 (추가) ---
const PageWrapper = styled.div`
  min-height: 100vh;
  width: 100%;
  background-color: white;
  overflow-x: hidden;
`;

// --- 전체 레이아웃 ---
const Container = styled.div`
  min-height: 100vh;
  background-color: white;
  padding: 1rem 2rem 2rem 2rem;;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
`;

const Header = styled.header`
  text-align: center;

  h1 {
    color: rgb(33, 33, 33);
    font-size: 2.5rem;
    font-weight: 400;
    text-shadow: 4px 4px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 0.1rem;
  }

  p {
    color: rgba(118, 118, 118, 0.7);
    font-size: 1.25rem;
    font-family: Inter, sans-serif;
    font-weight: 400;
  }
`;

// --- 반응형 메인 그리드 ---
const MainGrid = styled.main`
  display: grid;
  flex: 1;

  /* 데스크톱 (기본 3단) */
  grid-template-columns: 1fr 1fr 1fr;
  gap: 2.5rem;

  /* 태블릿 (900px 이하 2단) */
  @media (max-width: 900px) {
    grid-template-columns: 1fr 1fr;
  }

  /* 모바일 (600px 이하 1단) */
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

// --- 카테고리 카드 ---
const CategoryColumn = styled.div`
  display: flex;
  flex-direction: column;
  background-color: rgba(255, 253, 253, 0.67);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  border: 1px solid #eee;
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

// --- 키워드 버튼 ---
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

// --- 하단 네비게이션 ---
const NavContainer = styled.nav`
  display: flex;
  justify-content: flex-end;
  padding-top: 2rem;
  margin-top: 2rem;
  border-top: 1px solid #eee;
`;

const NavButton = styled.button<NavButtonProps>`
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-family: Inter, sans-serif;
  font-weight: 400;
  box-shadow: 2px 5px 8px 3px rgba(0, 0, 0, 0.2);
  border: solid 2px black;
  border-radius: 8px;
  width: 120px;
  cursor: pointer;

  background-color: ${(props) =>
      props.primary ? "rgb(243, 252, 255)" : "rgba(243, 252, 255, 0.5)"};
`;