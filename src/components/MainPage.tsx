//import React, { ElementType } from "react";
import styled from "@emotion/styled";
//import { Theme } from "@emotion/react";
//import { DetailedHTMLProps, HTMLAttributes } from "react";

// --- 이미지 파일 경로 ---
const briefcaseIconPath = "/images/img_briefcase.svg";
const folderIconPath = "/images/img_vector.svg";
const logoutIconPath = "/images/img.svg";
const logoImagePath = "/images/img_1.png";
const mainBannerPath = "/images/img_frame_10.png";
const calendarIconPath = "/images/img_calendar_week.svg";
const decorativeImagePath = "/images/img_frame_21.png";
const searchIconPath = "/images/search-icon.svg";
// ✅ 중앙 콘텐츠에 표시할 이미지 경로
const mainContentImagePath = "/images/img_main.png";


// --- 컴포넌트 함수 ---
export function MainPage() {
  return (
    <MainPageWrapper>
      {/* --- 상단 메뉴 --- */}
      <MenuContainer>
        <MenuItem>
          <MenuIcon src={briefcaseIconPath} alt="여행 기록 아이콘" />
          <MenuLabel>여행 기록</MenuLabel>
        </MenuItem>
        <MenuItem>
          <MenuIcon src={folderIconPath} alt="취향 기록 아이콘" />
          <MenuLabel>취향 기록</MenuLabel>
        </MenuItem>
        <MenuItem>
          <MenuIcon src={logoutIconPath} alt="로그아웃 아이콘" />
          <MenuLabel>로그인</MenuLabel>
        </MenuItem>
      </MenuContainer>

      {/* --- 헤더 --- */}
      <HeaderLine />
      <Logo src={logoImagePath} alt="Logo"/>
      <MainBanner src={mainBannerPath} alt="Main Banner"/>

      {/* --- 검색창 --- */}
      <SearchContainer>
        <SearchInputWrapper>
          <SearchInputLabel>여행지를 선택하세요.</SearchInputLabel>
        </SearchInputWrapper>
        <SearchIconWrapper>
          <SearchIcon src={searchIconPath} alt="Search Icon"/>
        </SearchIconWrapper>
      </SearchContainer>
      
      <CalendarIconWrapper>
        <CalendarIcon src={calendarIconPath} alt="Calendar Icon" />
      </CalendarIconWrapper>
      
      {/* --- 사이드바 버튼 --- */}
      <SideButton style={{ top: "153px" }}>
        유<br/>저<br/>1
      </SideButton>
      <SideButtonUser2 style={{ top: "258px" }}>
        유<br/>저<br/>2
      </SideButtonUser2>
      <SideButtonUser3 style={{ top: "363px" }}>
        유<br/>저<br/>3
      </SideButtonUser3>

      {/* --- 하단 장식 이미지 --- */}
      <DecorativeImage src={decorativeImagePath} alt="Decorative background"/>
      
      {/* --- 배경 요소 --- */}
      <BackgroundOverlay>
        <MainContentImage src={mainContentImagePath} alt="메인 콘텐츠 이미지" />
      </BackgroundOverlay>
      {/* <BackgroundShape /> */}

    </MainPageWrapper>
  );
}


// --- 스타일 정의 ---

const MainPageWrapper = styled.div`
  min-height: 100vh;
  background-color: white; /* 흰색 배경으로 복원 */
  position: relative;
  width: 1440px; /* 고정 너비로 복원 */
  margin: 0 auto; /* 중앙 정렬 */
`;

const MenuContainer = styled.div`
  position: absolute;
  top: 31px;
  right: 40px;
  display: flex;
  gap: 20px;
`;

const MenuItem = styled.div`
  width: 130px;
  height: 50px;
  background-color: rgba(240, 229, 216, 0.5);
  border-radius: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  cursor: pointer;
`;

const MenuIcon = styled.img`
  width: 24px;
  height: 24px;
`;

const MenuLabel = styled.span`
  color: black;
  font-size: 14px;
  font-weight: 500;
`;

const HeaderLine = styled.div`
  width: 100%;
  border-top: solid 3px rgb(44, 62, 80);
  position: absolute;
  left: 0;
  top: 122px;
`;

const Logo = styled.img`
  width: 114px;
  height: 114px;
  object-fit: cover;
  position: absolute;
  left: 42px;
  top: -5px;
`;

const MainBanner = styled.img`
  width: 207px;
  height: 58px;
  object-fit: cover;
  position: absolute;
  left: 119px;
  top: 19px;
`;

const SearchContainer = styled.div`
  width: 937px;
  height: 59px;
  position: absolute;
  left: 290px; /* 고정 위치로 복원 */
  top: 202px;
`;

const SearchInputWrapper = styled.div`
  width: 100%;
  height: 100%;
  background-color: white;
  border: solid 1px rgb(29, 78, 137);
  border-radius: 35px;
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SearchInputLabel = styled.span`
  color: rgb(44, 62, 80);
  font-size: 23px;
  font-family: Inter, sans-serif;
  text-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
`;

const SearchIconWrapper = styled.div`
  width: 58px;
  height: 39px;
  position: absolute;
  left: 785px; /* 고정 위치로 복원 */
  top: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SearchIcon = styled.img`
  width: 40px;
  height: 40px;
  object-fit: cover;
`;

const CalendarIconWrapper = styled.div`
  width: 41px;
  height: 39px;
  position: absolute;
  left: 1154px; /* 고정 위치로 복원 */
  top: 212px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const CalendarIcon = styled.img`
  width: 35px;
  height: 34px;
  object-fit: cover;
`;

const SideButton = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 42px;
  height: 82px;
  background-color: rgb(44, 62, 80);
  border: solid 1px rgb(44, 62, 80);
  box-sizing: border-box;
  padding: 12px;
  position: absolute;
  left: 0;
  color: rgb(147, 170, 200);
  font-size: 17px;
  font-family: Inter, sans-serif;
  text-align: center;
  line-height: 100%;
  border-top-right-radius: 20px;
`;

const SideButtonUser2 = styled(SideButton)`
  background-color: rgb(29, 78, 137);
  border-color: rgb(29, 78, 137);
`;

const SideButtonUser3 = styled(SideButton)`
  background-color: rgb(240, 229, 216);
  border-color: rgb(240, 229, 216);
`;

const DecorativeImage = styled.img`
  width: 167px;
  height: 138px;
  object-fit: cover;
  position: absolute;
  left: 0;
  top: 895px;
`;

const BackgroundOverlay = styled.div`
  width: 1052px;
  height: 537px;
  border-radius: 50px;
  position: absolute;
  left: 223px;
  top: 326px;
  overflow: hidden;
  z-index: 2;
`;

// 👇 이미지 컨테이너 안에 이미지를 넣는 스타일
const MainContentImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

// 👇 이미지 뒤에 깔리는 회색 배경
// const BackgroundShape = styled.div`
//   width: 1108px;
//   height: 600px;
//   position: absolute;
//   left: 196px;
//   top: 295px;
//   z-index: 1;
//   background-color: rgba(228, 228, 228, 0.5);
//   border-radius: 50px; /* 둥근 모서리를 위해 추가 */
// `;