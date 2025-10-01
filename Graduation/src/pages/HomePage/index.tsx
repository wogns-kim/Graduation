// src/pages/HomePage/index.tsx

import { useState } from 'react';
import styled from "@emotion/styled";

// 컴포넌트 및 데이터 불러오기
import Header from '../../components/Header';
import CityCard from '../../components/CityCard';
import { cityData } from '../../data/cityData';

// --- 페이지 레이아웃을 위한 스타일 컴포넌트 ---

const PageWrapper = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
`;

const MainContent = styled.main``;

const HeroSection = styled.section`
  background: linear-gradient(to right, #6a82fb, #fc5c7d);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 1rem;
`;

const SearchBar = styled.div`
  display: flex;
  gap: 1rem;
  background-color: ${({ theme }) => theme.colors.white};
  padding: 1.5rem;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 1100px;
  
  @media (max-width: 1024px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 180px;
  padding: 12px 16px;
  font-size: 16px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
  }
`;

const SearchButton = styled.button`
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.white};
  transition: all 0.2s ease-in-out;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
`;

const CardGridSection = styled.section`
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 2rem;

  & > h2 {
    font-size: 2.5rem;
    text-align: center;
    margin-bottom: 3rem;
    color: ${({ theme }) => theme.colors.text};
  }

  @media (max-width: 768px) {
    padding: 3rem 1rem;
    & > h2 {
      font-size: 2rem;
    }
  }
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
`;


// --- 홈페이지 컴포넌트 ---

export default function HomePage() {
    const [destination, setDestination] = useState("");
    const [numPeople, setNumPeople] = useState("");
    const [date, setDate] = useState("");

    const handleSearch = () => {
        alert(`검색 정보:\n여행지: ${destination || '전체'}\n인원: ${numPeople || '전체'}\n날짜: ${date || '전체'}`);
    };

    return (
        <PageWrapper>
            <Header />
            <MainContent>
                <HeroSection>
                    <SearchBar>
                        <SearchInput
                            type="text"
                            placeholder="여행지를 선택하세요."
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                        />
                        <SearchInput
                            type="number"
                            placeholder="인원"
                            value={numPeople}
                            onChange={(e) => setNumPeople(e.target.value)}
                        />
                        <SearchInput
                            type="date"
                            placeholder="날짜"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                        <SearchButton onClick={handleSearch}>검색</SearchButton>
                    </SearchBar>
                </HeroSection>

                <CardGridSection>
                    <h2>어디로 떠나볼까요?</h2>
                    <CardGrid>
                        {cityData.map((city) => (
                            <CityCard
                                key={city.id}
                                name={city.name}
                                description={city.description}
                                imageUrl={city.imageUrl}
                            />
                        ))}
                    </CardGrid>
                </CardGridSection>
            </MainContent>
        </PageWrapper>
    );
}