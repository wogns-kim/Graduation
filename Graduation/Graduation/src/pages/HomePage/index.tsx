// src/pages/HomePage/index.tsx

import { useState } from "react";
import styled from "@emotion/styled";
import { Link } from "react-router-dom"; // <-- 1. react-router-dom의 Link를 가져옵니다.

// 달력 UI 변경
import DatePicker, { registerLocale } from "react-datepicker";
import { ko } from "date-fns/locale/ko";
import "react-datepicker/dist/react-datepicker.css";

// 달력 한글
registerLocale('ko', ko);

// 컴포넌트 및 데이터 불러오기

import CityCard from "../../components/CityCard/CityCard";
import { cityData } from "../../data/cityData";

// --- 페이지 레이아웃을 위한 스타일 컴포넌트 ---

const seoulDistricts = [
  { id: 'seoul-1', name: '은평구' },
  { id: 'seoul-2', name: '동작구' },
  { id: 'seoul-3', name: '서초구' },
  { id: 'seoul-4', name: '용산구' },
];

interface RecommendationItem {
  id: number | string; // cityData는 number, seoulDistricts는 string
  name: string;
}

const PageWrapper = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.background};
`;

const MainContent = styled.main``;

// ... (HeroSection, SearchBar 등 다른 스타일 컴포넌트는 그대로)
const HeroSection = styled.section`
  background: linear-gradient(to right, #6a82fb, #fc5c7d);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem 1rem;
`;

const SearchContainer = styled.div`
  position: relative; /* 추천 목록의 위치 기준이 됨 */
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
  
  /* ... (내부 DatePicker 스타일은 그대로) ... */
  .react-datepicker-wrapper {
    flex: 1;
    mid-width: 180px;
  }
  .react-datepicker__input-container input {
    width: 100%;
    box-sizing: border-box; /* 패딩과 테두리를 너비에 포함 */
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

  .react-datepicker-popper {
    z-index: 2;
  }

  /* 달력 전체 컨테이너 */
  .react-datepicker {
    font-size: 1rem;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    background-color: white;
  }

  /* 헤더 (회색 배경 -> 흰색, 경계선 추가) */
  .react-datepicker__header {
    background-color: white;
    border-bottom: 1px solid #eee;
    padding: 10px 0 8px 0;
  }

  /* 월 표시 (예: 2025년 10월) */
  .react-datepicker__current-month {
    font-size: 1.1rem;
    font-weight: bold;
  }

  /* 월 이동 버튼 */
  .react-datepicker__navigation {
    top: 9px;
  }

  /* 각 월 달력 사이의 경계선 */
  .react-datepicker__month-container + .react-datepicker__month-container {
    border-left: 1px solid #eee;
  }

  .react-datepicker *,
  .react-datepicker *:before,
  .react-datepicker *:after {
    box-sizing: border-box;
  }

  /* 간격 요일과 숫자 간격 조절*/
  .react-datepicker__day-names,
  .react-datepicker__week {
    display: flex;
    justify-content: space-between;
  }

  .react-datepicker__day-name,
  .react-datepicker__day {
    width: 36px; /* 너비를 px 단위로 강제 고정 */
    height: 36px; /* 높이를 px 단위로 강제 고정 */
    line-height: 36px; /* 세로 중앙 정렬 */
    margin: 2px; /* 모든 칸의 마진을 동일하게 설정 */
    padding: 0; /* 내부 패딩 초기화 */
    text-align: center;
  }

  /* --- 나머지 커스텀 스타일 --- */
  .react-datepicker__day--weekend:first-of-type {
    color: red !important;
  }

  .react-datepicker__day--selected,
  .react-datepicker__day--in-selecting-range,
  .react-datepicker__day--in-range {
    background-color: #3c73ec;
    color: white;
    border-radius: 50%;
  }
`;

const RecommendationsList = styled.ul<{ isVisible: boolean }>`
  display: ${({ isVisible }) => (isVisible ? 'block' : 'none')};
  position: absolute;
  top: 100%; /* 검색창 바로 아래에 위치 */
  left: 0;
  right: 0;
  background-color: ${({ theme }) => theme.colors.white}; //
  border: 1px solid ${({ theme }) => theme.colors.border}; //
  border-top: none;
  border-radius: 0 0 8px 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  list-style-type: none;
  padding: 0.5rem 0;
  margin: 0;
  z-index: 10; /* 달력보다 위에 오도록 (필요시 조절) */
`;

const RecommendationItem = styled.li`
  padding: 0.75rem 1rem;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text}; //
  cursor: pointer;

  &:hover {
    background-color: ${({ theme }) => theme.colors.background}; //
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

// <-- 2. <Link>의 기본 스타일(밑줄, 파란색)을 없애는 새 스타일 컴포넌트
const StyledLink = styled(Link)`
  text-decoration: none; /* 밑줄 제거 */
  color: inherit; /* 글자색을 부모 요소에서 상속 */
  display: block; /* 카드 영역 전체를 링크로 만듦 */
`;




// --- 홈페이지 컴포넌트 ---

export default function HomePage() {
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const getRecommendationList = (): RecommendationItem[] => {
    const normalizedInput = destination.toLowerCase().trim();

    // "서울"을 정확히 입력하면 서울의 구 목록을 반환
    if (normalizedInput === '서울') {
      return seoulDistricts;
    }

    // 입력값이 비어있으면 전체 도시 목록을 반환
    if (normalizedInput === '') {
      return cityData;
    }

    // 그 외의 경우, cityData에서 필터링 (예: "부" -> "부산")
    return cityData.filter(city =>
      city.name.toLowerCase().includes(normalizedInput)
    );
  };

  const currentRecommendations = getRecommendationList();

  const handleSearch = () => {
    let dateInfo = "전체";
    if (startDate && endDate) {
      // 시작일과 종료일이 모두 선택된 경우
      dateInfo = `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    } else if (startDate) {
      // 시작일만 선택된 경우
      dateInfo = `${startDate.toLocaleDateString()} -`;
    }

    alert(`검색 정보:\n여행지: ${destination || '전체'}\n시작일: ${startDate ? startDate.toLocaleDateString() : '미정'}\n종료일: ${endDate ? endDate.toLocaleDateString() : '미정'}`);
  };

  const handleRecommendationClick = (item: RecommendationItem) => {
    // 클릭한 항목이 'seoulDistricts'에 포함된 구 이름인지 확인
    const isDistrict = seoulDistricts.some(d => d.name === item.name);
    
    if (isDistrict) {
      // 구 이름("은평구")을 클릭하면 "서울 은평구"로 값을 설정
      setDestination(`서울 ${item.name}`);
    } else {
      // 도시 이름("서울")을 클릭하면 해당 도시 이름으로 값을 설정
      setDestination(item.name);
    }
    setShowRecommendations(false); // 목록 숨기기
  };

  return (
    <PageWrapper>
      
      <MainContent>
        {/* ... (HeroSection, SearchBar 등은 그대로) ... */}
        <HeroSection>
          <SearchBar>
            <SearchContainer>
              <SearchInput
                type="text"
                placeholder="여행지를 선택하세요."
                value={destination}
                onChange={(e) => {
                  setDestination(e.target.value);
                  setShowRecommendations(true); // 입력 시에도 목록 표시
                }}
                onFocus={() => setShowRecommendations(true)} // 포커스 시 목록 표시
                onBlur={() => {
                  // 잠시 후 목록 숨기기 (클릭 이벤트가 먼저 실행되도록)
                  setTimeout(() => setShowRecommendations(false), 150);
                }}
              />
              {/* 👇 7. 추천 검색어 목록 렌더링 */}
              <RecommendationsList isVisible={showRecommendations && currentRecommendations.length > 0}>
                {currentRecommendations.map((item) => (
                  <RecommendationItem
                    key={item.id}
                    // onClick 대신 onMouseDown을 사용해야 onBlur보다 먼저 실행됩니다.
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
              selectsStart // 기간 선택의 '시작'임을 명시
              startDate={startDate}
              endDate={endDate}
              isClearable={true}
              placeholderText="시작일"
              dateFormat="yyyy-MM-dd"
              monthsShown={1} // 달력 1개만 표시
              minDate={new Date()}
            />
            
            {/* (4) '종료일' DatePicker*/}
            <DatePicker
              locale="ko"
              selected={endDate}
              onChange={(date: Date | null) => setEndDate(date)}
              selectsEnd // 기간 선택의 '종료'임을 명시
              startDate={startDate}
              endDate={endDate}
              isClearable={true}
              placeholderText="종료일"
              dateFormat="yyyy-MM-dd"
              monthsShown={1} // 달력 1개만 표시
              minDate={startDate || new Date()} // 시작일보다 빠를 수 없음
            />
            <SearchButton onClick={handleSearch}>검색</SearchButton>
          </SearchBar>
        </HeroSection>


        <CardGridSection>
          <h2>어디로 떠나볼까요?</h2>
          <CardGrid>
            {/* <-- 3. .map() 내부를 <StyledLink>로 감싸줍니다. */}
            {cityData.map((city) => (
              // map() 안의 최상위 요소에 key를 줘야 합니다.
              <StyledLink key={city.id} to={`/travel-route/${city.id}`}>
                <CityCard
                  // key는 StyledLink로 이동
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