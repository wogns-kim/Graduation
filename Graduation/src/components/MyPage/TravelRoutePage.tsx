import React, { useEffect, useState, useRef } from 'react';
import styled from "@emotion/styled";
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Trash2, Users, Plus, FileText, Search, Save, Share2, Clock } from "lucide-react";

// --- Kakao SDK 타입 정의 ---
declare global {
    interface Window {
        kakao: any;
    }
}

// --- 데이터 타입 정의 ---
interface ItineraryItem {
  item_id: number;
  place_name: string;
  order_in_day: number;
  place_id?: number;
  // 지도 표시를 위해 좌표 추가 (검색 후 채워짐)
  lat?: number;
  lng?: number;
}

interface UserSimple {
  user_id: number;
  username: string;
  profile_image_url: string | null;
}

interface TripDetails {
  trip_name: string;
  participants: UserSimple[];
  itineraries: Record<string, Record<string, ItineraryItem[]>>;
  alternatives?: string[]; 
  isAiResult?: boolean;    
}

// 로그 데이터 타입
interface TripLog {
    action_id: number;
    action_type: string;
    user_name: string;
    description: string;
    created_at: string;
}

// --- 스타일 정의 (기존 유지 + 로그 스타일 추가) ---
const PageContainer = styled.div`
  padding: 40px 20px;
  max-width: 1400px;
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
`;

const HeaderSection = styled.div`margin-bottom: 30px;`;
const HeaderContent = styled.div`display: flex; justify-content: space-between; align-items: center;`;
const TitleGroup = styled.div``;
const Title = styled.h1`font-size: 2.2rem; font-weight: 800; color: #333; margin: 0 0 10px 0;`;
const SubTitle = styled.p`color: #666; margin-top: 8px; font-size: 1rem;`;
const HeaderActions = styled.div`display: flex; align-items: center; gap: 10px;`;
const ShareButton = styled.button`display: flex; align-items: center; gap: 5px; background: #f0f4ff; color: #667eea; border: 1px solid #dbeafe; padding: 6px 12px; border-radius: 20px; font-size: 13px; font-weight: bold; cursor: pointer; transition: all 0.2s; white-space: nowrap; &:hover { background: #e0e7ff; }`;
const ParticipantBadge = styled.div`display: flex; align-items: center; gap: 4px; font-size: 13px; color: #4a5568; background: #f7fafc; padding: 4px 10px; border-radius: 15px;`;

// 그리드 레이아웃 수정: 로그 섹션을 위해 행 추가
const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.5fr 1fr;
  grid-template-rows: auto auto; // 로그 섹션 공간 확보
  gap: 24px;
  align-items: start;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr 1fr; 
    grid-template-areas: 
      "map schedule"
      "recommend recommend"
      "logs logs";
  }
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-areas: 
      "map"
      "schedule"
      "recommend"
      "logs";
  }
`;

const MapSection = styled.div`
  grid-area: map;
  grid-row: 1 / 2; // 첫 번째 행
  background-color: white;
  border-radius: 16px;
  height: 600px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  position: sticky;
  top: 20px;
`;

const ScheduleSection = styled.div`
  grid-area: schedule;
  grid-row: 1 / 3; // 길게 차지하도록
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const DayCard = styled.div`background: white; padding: 24px; border-radius: 16px; border: 1px solid #eee; box-shadow: 0 2px 8px rgba(0,0,0,0.03);`;
const DayHeader = styled.h3`font-size: 1.3rem; color: #3B82F6; margin: 0 0 16px 0; font-weight: 700; display: flex; align-items: center; &::before { content: ''; display: inline-block; width: 4px; height: 18px; background-color: #3B82F6; margin-right: 10px; border-radius: 2px; }`;
const PlaceItem = styled.div`display: flex; align-items: center; padding: 16px; background-color: #f8f9fa; border-radius: 12px; margin-bottom: 10px; transition: transform 0.2s; &:hover { transform: translateX(4px); background-color: #f1f3f5; }`;
const OrderBadge = styled.div`background-color: #333; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; margin-right: 14px; flex-shrink: 0;`;
const PlaceInfo = styled.div`flex: 1;`;
const PlaceName = styled.h4`font-size: 1rem; font-weight: 600; margin: 0 0 4px 0; color: #333;`;
const PlaceDesc = styled.p`font-size: 0.85rem; color: #868e96; margin: 0;`;
const EditButton = styled.button`padding: 6px 12px; font-size: 13px; color: #868e96; background: white; border: 1px solid #dee2e6; border-radius: 6px; cursor: pointer; margin-left: 10px; &:hover { color: #333; border-color: #adb5bd; }`;

const RecommendSection = styled.div`
  grid-area: recommend;
  grid-row: 1 / 2;
  background-color: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  height: fit-content;
  max-height: 600px;
  overflow-y: auto;
`;

const SectionTitle = styled.h3`font-size: 1.2rem; font-weight: 700; color: #333; margin: 0 0 20px 0; padding-bottom: 15px; border-bottom: 2px solid #eee; display: flex; align-items: center; gap: 8px;`;
const RecommendItem = styled.div`padding: 16px; border: 1px solid #eee; border-radius: 12px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; transition: transform 0.2s; &:last-child { margin-bottom: 0; } &:hover { transform: translateX(3px); border-color: #667eea; }`;
const RecommendInfo = styled.div`h4 { font-size: 0.95rem; font-weight: 600; margin: 0 0 4px 0; } p { font-size: 0.8rem; color: #868e96; margin: 0; }`;
const AddButton = styled.button`padding: 6px 12px; font-size: 13px; color: #3B82F6; background: #EFF6FF; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 4px; &:hover { background: #DBEAFE; }`;
const SaveButton = styled.button`background-color: #10B981; color: white; padding: 6px 16px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: background 0.2s; display: flex; align-items: center; gap: 6px; &:hover { background-color: #059669; }`;

const MapSearchBox = styled.form`position: absolute; top: 15px; left: 15px; z-index: 100; background: white; padding: 8px 12px; border-radius: 25px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); display: flex; align-items: center; width: 280px; border: 1px solid #e2e8f0; transition: all 0.2s; &:focus-within { width: 320px; border-color: #667eea; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2); }`;
const SearchInput = styled.input`border: none; outline: none; flex: 1; font-size: 14px; margin-left: 8px; color: #2d3748; &::placeholder { color: #a0aec0; }`;
const MapOverlayHint = styled.div`position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.7); color: white; padding: 8px 20px; border-radius: 20px; font-size: 14px; z-index: 10; white-space: nowrap;`;

// [추가] 로그 섹션 스타일
const LogSection = styled.div`
    grid-area: logs;
    grid-column: 1 / 2; // 지도 아래 위치
    grid-row: 2 / 3;
    background: white;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    border: 1px solid #e2e8f0;
    max-height: 300px;
    overflow-y: auto;
`;

const LogItem = styled.div`
    padding: 8px 0;
    border-bottom: 1px solid #f1f3f5;
    font-size: 13px;
    color: #4a5568;
    display: flex;
    gap: 8px;
    align-items: flex-start;

    &:last-child { border-bottom: none; }
    
    span.time { color: #a0aec0; font-size: 11px; min-width: 60px; }
    span.user { font-weight: bold; color: #333; }
`;


// --- 컴포넌트 ---
export default function TravelRoutePage() {
  const { cityId } = useParams(); // trip_id 또는 'ai-result'
  const [searchParams] = useSearchParams(); 
  const navigate = useNavigate();
  
  const [tripData, setTripData] = useState<TripDetails | null>(null);
  const [logs, setLogs] = useState<TripLog[]>([]); // 로그 데이터 상태
  const [isLoading, setIsLoading] = useState(true);

  // 지도 관련 refs
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const psRef = useRef<any>(null);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [shareCode] = useState(Math.random().toString(36).substring(2, 8).toUpperCase());

  // 1. 데이터 Fetching
  useEffect(() => {
    const fetchTripDetails = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("로그인이 필요합니다.");
        navigate("/");
        return;
      }

      const API_BASE = "http://127.0.0.1:8000/api";
      
      try {
        // --- 1. AI 추천 ('ai-result') ---
        if (cityId === 'ai-result') {
            const startDate = searchParams.get('start');
            const endDate = searchParams.get('end');
            
            const response = await fetch(`${API_BASE}/recommendations?start_date=${startDate}&end_date=${endDate}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("AI 추천을 불러오는데 실패했습니다.");
            const data = await response.json();
            const firstCourse = data[0];
            
            const formattedItineraries: Record<string, ItineraryItem[]> = {};
            
            if (firstCourse && firstCourse.route) {
                Object.entries(firstCourse.route).forEach(([day, places]) => {
                    const placeList = Array.isArray(places) ? places : [];
                    formattedItineraries[day] = placeList.map((placeName: string, idx: number) => ({
                        item_id: idx, 
                        place_name: placeName,
                        order_in_day: idx + 1
                    }));
                });
            }
            
            setTripData({
                trip_name: firstCourse?.theme || "AI 추천 여행 코스",
                participants: [], 
                itineraries: { "ai": formattedItineraries }, 
                alternatives: firstCourse?.alternatives || [],
                isAiResult: true
            });

        } 
        // --- 2. 저장된 여행 조회 모드 (숫자 ID) ---
        else {
            const response = await fetch(`${API_BASE}/trips/${cityId}/details`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("여행 정보를 불러오는데 실패했습니다.");
            const data = await response.json();
            
            setTripData({
                trip_name: data.trip_name,
                participants: data.participants,
                itineraries: data.itineraries,
                isAiResult: false
            });

            // 로그 데이터 조회 (저장된 여행일 때만)
            const historyRes = await fetch(`${API_BASE}/trips/${cityId}/history`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (historyRes.ok) {
                setLogs(await historyRes.json());
            }
        }

      } catch (error: any) {
        console.error(error);
        alert(`오류가 발생했습니다: ${error.message}`);
        navigate("/mypage");
      } finally {
        setIsLoading(false);
      }
    };

    if (cityId) {
      fetchTripDetails();
    }
  }, [cityId, navigate, searchParams]);


  // --- 2. 지도 그리기 (마커 + 선 연결) ---
  useEffect(() => {
    if (isLoading || !tripData) return;

    const kakaoAppKey = "c0ce14306decee109a46f80f30e7c0df"; // 상수로 입력
    
    const initializeMap = () => {
        if (!window.kakao || !window.kakao.maps) return;

        window.kakao.maps.load(() => {
            const mapContainer = document.getElementById('map');
            if (!mapContainer) return;
            
            // 지도 생성 (최초 1회만 하거나, 이미 있으면 재사용)
            if (!mapRef.current) {
                const mapOption = { center: new window.kakao.maps.LatLng(37.566826, 126.9786567), level: 7 };
                mapRef.current = new window.kakao.maps.Map(mapContainer, mapOption);
                psRef.current = new window.kakao.maps.services.Places();
            }

            // 기존 마커/라인 제거
            markersRef.current.forEach((m: any) => m.setMap(null));
            markersRef.current = [];
            if (polylineRef.current) polylineRef.current.setMap(null);

            // 현재 표시할 일정 데이터 수집
            const targetUserId = tripData.isAiResult ? "ai" : (tripData.participants[0]?.user_id.toString() || "");
            const myItinerary = tripData.itineraries[targetUserId] || {};
            const sortedDays = Object.keys(myItinerary).sort();
            
            // 순서대로 장소 이름 수집
            const allPlaceNames: string[] = [];
            sortedDays.forEach(day => {
                myItinerary[day].forEach(item => allPlaceNames.push(item.place_name));
            });

            if (allPlaceNames.length === 0) return;

            // 장소 검색 및 마커 표시 (순서 보장 위해 Promise 사용)
            const searchPromises = allPlaceNames.map((name) => {
                return new Promise<any>((resolve) => {
                    psRef.current.keywordSearch(name, (data: any, status: any) => {
                        if (status === window.kakao.maps.services.Status.OK) {
                            resolve({ name, lat: data[0].y, lng: data[0].x });
                        } else {
                            resolve(null); // 검색 실패 시
                        }
                    });
                });
            });

            Promise.all(searchPromises).then((results) => {
                const validResults = results.filter((r) => r !== null);
                const linePath: any[] = [];
                const bounds = new window.kakao.maps.LatLngBounds();

                validResults.forEach((place, index) => {
                    const position = new window.kakao.maps.LatLng(place.lat, place.lng);
                    
                    // 마커 생성 (순서 번호 표시)
                    const markerImage = new window.kakao.maps.MarkerImage(
                        "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png",
                        new window.kakao.maps.Size(36, 37),
                        {
                            spriteSize: new window.kakao.maps.Size(36, 691),
                            spriteOrigin: new window.kakao.maps.Point(0, (index * 46) + 10),
                            offset: new window.kakao.maps.Point(13, 37)
                        }
                    );
                    
                    const marker = new window.kakao.maps.Marker({
                        position: position,
                        image: markerImage,
                        map: mapRef.current
                    });
                    
                    markersRef.current.push(marker);
                    linePath.push(position);
                    bounds.extend(position);
                });

                // 선(Polyline) 그리기
                if (linePath.length > 1) {
                    const polyline = new window.kakao.maps.Polyline({
                        path: linePath,
                        strokeWeight: 5,
                        strokeColor: '#3B82F6',
                        strokeOpacity: 0.8,
                        strokeStyle: 'solid'
                    });
                    polyline.setMap(mapRef.current);
                    polylineRef.current = polyline;
                }

                // 지도 범위 재설정
                if (validResults.length > 0) {
                    mapRef.current.setBounds(bounds);
                }
            });
        });
    };

    // SDK 로드 확인
    const existingScript = document.querySelector(`script[src*="dapi.kakao.com/v2/maps/sdk.js"]`);
    if (existingScript) {
        if (window.kakao && window.kakao.maps) initializeMap();
        else existingScript.addEventListener("load", initializeMap);
    } else {
        const script = document.createElement("script");
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=c0ce14306decee109a46f80f30e7c0df&libraries=services&autoload=false`;
        script.async = false;
        script.onload = () => setTimeout(initializeMap, 100);
        document.head.appendChild(script);
    }

  }, [tripData, isLoading]); // 데이터가 로드되면 지도 그리기


  // --- 핸들러 ---
  const handleSaveTrip = async () => {
      alert("여행 저장 기능은 추후 구현 예정입니다! (POST /api/trips)");
  };
  const handleCopyCode = () => {
      navigator.clipboard.writeText(shareCode);
      alert(`초대 코드 [${shareCode}]가 복사되었습니다!`);
  };
  const handleMapSearch = (e: React.FormEvent) => {
      e.preventDefault();
      if (!searchKeyword.trim() || !psRef.current) return;
      psRef.current.keywordSearch(searchKeyword, (data: any, status: any) => {
          if (status === window.kakao.maps.services.Status.OK) {
              const place = data[0];
              const moveLatLon = new window.kakao.maps.LatLng(place.y, place.x);
              mapRef.current.panTo(moveLatLon);
          } else {
              alert('검색 결과가 없습니다.');
          }
      });
  };

  // 화면 렌더링 준비
  if (isLoading) return <div style={{textAlign:'center', padding:'100px', fontSize: '1.2rem'}}>AI가 코스를 생성 중입니다... 🤖</div>;
  if (!tripData) return <div>데이터가 없습니다.</div>;

  const targetUserId = tripData.isAiResult ? "ai" : (tripData.participants[0]?.user_id.toString() || "");
  const myItinerary = tripData.itineraries[targetUserId] || {};
  const sortedDays = Object.keys(myItinerary).sort();

  return (
    <PageContainer>
      <HeaderSection>
        <HeaderContent>
            <TitleGroup>
                <Title>{tripData.trip_name}</Title>
                <SubTitle>{tripData.isAiResult ? "AI 추천 코스" : "나의 여행 계획"}</SubTitle>
            </TitleGroup>
            <HeaderActions>
                {tripData.isAiResult && (
                    <SaveButton onClick={handleSaveTrip}>
                        <Save size={16} /><span>저장</span>
                    </SaveButton>
                )}
                <ShareButton onClick={handleCopyCode}>
                    <Share2 size={16} /><span>초대 코드: {shareCode}</span>
                </ShareButton>
            </HeaderActions>
        </HeaderContent>
      </HeaderSection>
      
      <ContentGrid>
        {/* 1. 지도 영역 */}
        <MapSection>
             <MapSearchBox onSubmit={handleMapSearch}>
                <Search size={18} color="#718096" />
                <SearchInput type="text" placeholder="장소 검색" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} />
            </MapSearchBox>
            <div id="map" style={{ width: '100%', height: '100%' }}></div>
        </MapSection>

        {/* 2. 여행 일정 영역 */}
        <ScheduleSection>
          {sortedDays.length > 0 ? (
            sortedDays.map((day) => (
              <DayCard key={day}>
                <DayHeader>{day}</DayHeader>
                {myItinerary[day].map((item: any, idx: number) => (
                  <PlaceItem key={idx}>
                    <OrderBadge>{idx + 1}</OrderBadge>
                    <PlaceInfo>
                        <PlaceName>{typeof item === 'string' ? item : item.place_name}</PlaceName>
                        <PlaceDesc>상세 정보</PlaceDesc>
                    </PlaceInfo>
                    <EditButton><Trash2 size={16} /></EditButton>
                  </PlaceItem>
                ))}
              </DayCard>
            ))
          ) : (<div style={{ padding: "20px", textAlign: 'center', color: "#888" }}>일정이 없습니다.</div>)}
        </ScheduleSection>

        {/* 3. 추천 여행지 및 로그 영역 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 추천 여행지 */}
            <RecommendSection>
                <SectionTitle><MapPin size={20} color="#667eea" />✨ 추천 여행지</SectionTitle>
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {tripData.alternatives && tripData.alternatives.length > 0 ? (
                        tripData.alternatives.map((placeName, idx) => (
                            <RecommendItem key={idx}>
                                <RecommendInfo><h4>{placeName}</h4></RecommendInfo>
                                <AddButton><Plus size={14} /></AddButton>
                            </RecommendItem>
                        ))
                    ) : (<p style={{ color: '#888', fontSize: '0.9rem' }}>추천 장소 없음</p>)}
                </div>
            </RecommendSection>

            {/* 로그 기록 (신규 추가) */}
            <LogSection>
                <SectionTitle><FileText size={20} color="#667eea" />📝 수정 기록</SectionTitle>
                {logs.length > 0 ? (
                    logs.map((log) => (
                        <LogItem key={log.action_id}>
                            <span className="time">{new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            <div>
                                <span className="user">{log.user_name}</span>님이 {log.description}
                            </div>
                        </LogItem>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', color: '#a0aec0', fontSize: '13px', padding: '20px' }}>
                        변경 이력이 없습니다.
                    </div>
                )}
            </LogSection>
        </div>

      </ContentGrid>
    </PageContainer>
  );
}