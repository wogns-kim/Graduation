import React, { useState } from "react";
import styled from "@emotion/styled";
// [수정] 페이지 이동을 위해 useNavigate를 import 합니다.
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

// 1. [오류 수정] styled-component가 받을 props 타입을 정의
interface KeywordButtonProps {
    isSelected: boolean;
}

interface NavButtonProps {
    primary?: boolean; // ?는 optional(있어도 되고 없어도 되는) 속성이라는 의미
}

// 2. [추가] 백엔드의 '취향 저장' API 주소를 정의합니다.
// (users.py의 @router.put("/me/preferences") 경로와 일치)
const PREFERENCES_API_URL = "http://127.0.0.1:8000/api/users/me/preferences";


export default function Taste() {
    // 3. [오류 수정] useState의 타입으로 Set<string>을 명시합니다.
    const [selectedKeywords, setSelectedKeywords] = useState(new Set<string>());
    
    // [추가] useNavigate 훅을 준비합니다.
    const navigate = useNavigate();

    // 4. [오류 수정] keyword 매개변수의 타입을 string으로 명시합니다.
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

    // [추가] 'NEXT' 버튼 클릭 시 실행될 함수
    const handleSubmitPreferences = async () => {
        if (selectedKeywords.size === 0) {
            alert("취향을 1개 이상 선택해주세요!");
            return;
        }

        // 백엔드에 저장하기 위해 JWT 토큰을 localStorage에서 가져옵니다.
        const token = localStorage.getItem("access_token");
        if (!token) {
            alert("로그인 정보가 유효하지 않습니다. 다시 로그인해주세요.");
            navigate("/"); // 로그인 정보 없으면 홈으로
            return;
        }

        // Set을 Array로 변환하여 body에 담습니다.
        const preferencesList = Array.from(selectedKeywords);

        try {
            // 백엔드의 '취향 저장' API 호출
            const response = await fetch(PREFERENCES_API_URL, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    // JWT 토큰을 Bearer 형식으로 헤더에 추가
                    "Authorization": `Bearer ${token}` 
                },
                body: JSON.stringify({ preferences: preferencesList }),
            });

            if (!response.ok) {
                // 401(인증 실패) 등 오류 처리
                if (response.status === 401) {
                    alert("로그인 세션이 만료되었습니다. 다시 로그인해주세요.");
                    localStorage.removeItem("access_token");
                    navigate("/");
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || '취향 저장에 실패했습니다.');
                }
                return; // 오류 발생 시 여기서 중단
            }

            // 저장 성공 시
            alert("취향이 성공적으로 저장되었습니다!");
            // 메인 페이지로 이동
            navigate("/"); 

        } catch (error) {
            console.error("취향 저장 API 오류:", error);
            alert(`오류 발생: ${String(error)}`);
        }
    };

    return (
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
                {/* [수정] 버튼에 onClick 핸들러 연결 */}
                <NavButton onClick={() => navigate(-1)}>PREVIOUS</NavButton>
                <NavButton primary onClick={handleSubmitPreferences}>NEXT</NavButton>
            </NavContainer>
        </Container>
    );
}

// --- 전체 레이아웃 ---
const Container = styled.div`
min-height: 100vh;
background-color: white;
padding: 2rem;
max-width: 1400px;
margin: 0 auto;
display: flex;
flex-direction: column;
`

const Header = styled.header`
text-align: center;
margin-bottom: 3rem;

h1 {
    color: rgb(33, 33, 33);
    font-size: 2.5rem;
    font-weight: 400;
    text-shadow: 4px 4px 4px rgba(0, 0, 0, 0.1);
    margin-bottom: 1rem;
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
    font-size: 2.25r}
`;

const CategoryTitle = styled.h2`
color: rgb(123, 123, 123);
font-size: 1.75rem;
font-family: Inter, sans-serif;
font-weight: 600;
margin-left: 0.75rem;
`;

const Line = styled.div`width: 100%;height: 1px;background-color: rgb(123, 123, 123);margin-bottom: 1.5rem;
`;

// --- 키워드 버튼 ---
const ButtonGrid = styled.div`
display: flex;
flex-wrap: wrap;
gap: 0.75rem;
`;

// 5. [오류 수정] styled.button에 <KeywordButtonProps> 타입을 알려줍니다
const KeywordButton = styled.button<KeywordButtonProps>`
padding: 0.6rem 1.2rem;
font-size: 1rem;
font-family: Inter, sans-serif;
font-weight: 600;
border-radius: 30px;
cursor: pointer;
transition: all 0.2s ease-in-out;
box-shadow: 3px 5px 4px 0px rgba(0, 0, 0, 0.15);

  /* 이제 props.isSelected 타입을 명확히 알아서 오류가 사라집니다. */
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
justify-content: space-between;
padding-top: 2rem;
margin-top: 2rem;
border-top: 1px solid #eee;
`;

// 6. [오류 수정] styled.button에 <NavButtonProps> 타입을 알려줍니다.
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

  /* 이제 props.primary 타입을 명확히 알아서 오류가 사라집니다. */
background-color: ${(props) =>
        props.primary ? "rgb(243, 252, 255)" : "rgba(243, 252, 255, 0.5)"};
`;