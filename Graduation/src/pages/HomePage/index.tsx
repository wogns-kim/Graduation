// src/pages/HomePage/index.tsx

import { useState } from "react";
import styled from "@emotion/styled";
import { Link, useNavigate } from "react-router-dom"; 

// 달력 UI
import DatePicker, { registerLocale } from "react-datepicker";
import { ko } from "date-fns/locale/ko";
import "react-datepicker/dist/react-datepicker.css";

// 달력 한글 설정
registerLocale('ko', ko);

// 컴포넌트 및 데이터 불러오기
import CityCard from "../../components/CityCard/CityCard";
import { cityData } from "../../data/cityData";

// --- 스타일 컴포넌트 (변경 없음) ---

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

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: 180px;
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
  
  .react-datepicker-wrapper {
    flex: 1;
    min-width: 180px;
  }
  .react-datepicker__input-container input {
    width: 100%;
    box-sizing: border-box;
    padding: 12px 16px;
    font-size: 16px;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 8px;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.primary};
    }
  }

  .react-datepicker-popper { z-index: 2; }
  .react-datepicker { font-size: 1rem; border: 1px solid #e0e0e0; border-radius: 8px; background-color: white; }
  .react-datepicker__header { background-color: white; border-bottom: 1px solid #eee; padding: 10px 0 8px 0; }
  .react-datepicker__current-month { font-size: 1.1rem; font-weight: bold; }
  .react-datepicker__navigation { top: 9px; }
  .react-datepicker__month-container + .react-datepicker__month-container { border-left: 1px solid #eee; }
  .react-datepicker *, .react-datepicker *:before, .react-datepicker *:after { box-sizing: border-box; }
  .react-datepicker__day-names, .react-datepicker__week { display: flex; justify-content: space-between; }
  .react-datepicker__day-name, .react-datepicker__day { width: 36px; height: 36px; line-height: 36px; margin: 2px; padding: 0; text-align: center; }
  .react-datepicker__day--weekend:first-of-type { color: red !important; }
  .react-datepicker__day--selected, .react-datepicker__day--in-selecting-range, .react-datepicker__day--in-range { background-color: #3c73ec; color: white; border-radius: 50%; }
`;

const RecommendationsList = styled.ul<{ isVisible: boolean }>`
  display: ${({ isVisible }) => (isVisible ? 'block' : 'none')};
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  list-style-type: none;
  padding: 0.5rem 0;
  margin: 0;
  z-index: 10;
`;

const RecommendationItem = styled.li`
  padding: 0.75rem 1rem;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background};
  }
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 280px;
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
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
  grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
  gap: 2rem;
`;

const StyledLink = styled(Link)`
  text-decoration: none;
  color: inherit;
  display: block;
`;

// --- 데이터 ---
const seoulDistricts = [
  { id: 'seoul-1', name: '은평구' },
  { id: 'seoul-2', name: '동작구' },
  { id: 'seoul-3', name: '서초구' },
  { id: 'seoul-4', name: '용산구' },
];

interface RecommendationItemType {
  id: number | string; 
  name: string;
}


// --- 홈페이지 컴포넌트 ---

export default function HomePage() {
  const navigate = useNavigate();
  
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [showRecommendations, setShowRecommendations] = useState(false);

  // 추천 검색어 로직
  const getRecommendationList = (): RecommendationItemType[] => {
    const normalizedInput = destination.toLowerCase().trim();
    if (normalizedInput === '서울') return seoulDistricts;
    if (normalizedInput === '') return cityData;
    return cityData.filter(city => city.name.toLowerCase().includes(normalizedInput));
  };

  const currentRecommendations = getRecommendationList();

  const handleRecommendationClick = (item: RecommendationItemType) => {
    const isDistrict = seoulDistricts.some(d => d.name === item.name);
    if (isDistrict) setDestination(`서울 ${item.name}`);
    else setDestination(item.name);
    setShowRecommendations(false);
  };


  // --- 🚀 [핵심 수정] 검색 버튼 핸들러 ---
  const handleSearch = () => {
    // 1. 로그인 확인
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("여행 추천을 받으려면 로그인이 필요합니다.");
      return;
    }
    
    // 2. 입력값 검증
    if (!destination) {
      alert("여행지를 입력해주세요.");
      return;
    }
    if (!startDate || !endDate) {
        alert("여행 날짜를 선택해주세요.");
        return;
    }

    // 날짜 포맷팅 (YYYY-MM-DD)
    const offset = startDate.getTimezoneOffset() * 60000;
    const startStr = new Date(startDate.getTime() - offset).toISOString().split('T')[0];
    
    const endOffset = endDate.getTimezoneOffset() * 60000;
    const endStr = new Date(endDate.getTime() - endOffset).toISOString().split('T')[0];

    console.log("검색 조건:", { startStr, endStr });
    navigate(`/travel-route/ai-result?start=${startStr}&end=${endStr}`);
  };

  return (
    <PageWrapper>
      <MainContent>
        <HeroSection>
          <SearchBar>
            <SearchContainer>
              <SearchInput
                type="text"
                placeholder="여행지를 선택하세요."
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setShowRecommendations(true);
                }}
                onFocus={() => setShowRecommendations(true)}
                onBlur={() => setTimeout(() => setShowRecommendations(false), 150)}
              />
              <RecommendationsList isVisible={showRecommendations && currentRecommendations.length > 0}>
                {currentRecommendations.map((item) => (
                  <RecommendationItem
                    key={item.id}
                    onMouseDown={() => handleRecommendationClick(item)}
                  >
                    {item.name}
                  </RecommendationItem>
                ))}
              </RecommendationsList>
            </SearchContainer>

            <DatePicker
              locale="ko"
              selected={startDate}
              onChange={(date: Date | null) => setStartDate(date)}
              selectsStart
              startDate={startDate}
              endDate={endDate}
              isClearable={true}
              placeholderText="시작일"
              dateFormat="yyyy-MM-dd"
              monthsShown={1}
              minDate={new Date()}
            />
            
            <DatePicker
              locale="ko"
              selected={endDate}
              onChange={(date: Date | null) => setEndDate(date)}
              selectsEnd
              startDate={startDate}
              endDate={endDate}
              isClearable={true}
              placeholderText="종료일"
              dateFormat="yyyy-MM-dd"
              monthsShown={1}
              minDate={startDate || new Date()}
            />
            {/* 검색 버튼에 핸들러 연결 */}
            <SearchButton onClick={handleSearch}>검색</SearchButton>
          </SearchBar>
        </HeroSection>

        <CardGridSection>
          <h2>어디로 떠나볼까요?</h2>
          <CardGrid>
            {cityData.map((city) => (
              <StyledLink key={city.id} to={`/travel-route/${city.id}`}>
                <CityCard
                  name={city.name}
                  description={city.description}
                  imageUrl={city.imageUrl}
                />
              </StyledLink>
            ))}
          </CardGrid>
        </CardGridSection>
      </MainContent>
    </PageWrapper>
  );
}