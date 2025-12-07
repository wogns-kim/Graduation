import React, { useEffect, useState, useRef } from 'react';
import styled from "@emotion/styled";
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Info, Trash2, Users, Plus, Minus, FileText, Search, Save, Share2, Clock } from "lucide-react";

// --- 타입 정의 ---
declare global {
    interface Window {
        kakao: any;
    }
}

interface ItineraryItem {
  item_id: number;
  place_name: string;
  order_in_day: number;
  place_id?: number;
}

interface UserSimple {
  user_id: number;
  username: string;
  profile_image_url: string | null;
}

interface TripDetails {
  trip_name: string;
  participants: UserSimple[];
  itineraries: Record<string, ItineraryItem[]>; // { "DAY 1": [], "DAY 2": [] }
  alternatives?: string[]; 
  isAiResult?: boolean;
  shareCode?: string; // 공유 코드
}

interface TripLog {
    action_id: number;
    action_type: string;
    user_name: string;
    description: string;
    created_at: string;
}

// --- 스타일 컴포넌트 ---
const PageContainer = styled.div`
  padding: 40px 20px;
  max-width: 1600px; /* 넓은 화면 활용 */
  margin: 0 auto;
  background-color: #f8f9fa;
  min-height: 100vh;
`;

const HeaderSection = styled.div`
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  color: #333;
  margin: 0;
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  background: #3B82F6;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background-color: #2563EB; }
`;

// 그리드 레이아웃 (지도 | 일정 | 추천) + 하단 로그
const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr 0.8fr; 
  grid-template-rows: 600px auto; 
  gap: 24px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 500px auto auto;
    grid-template-areas: 
      "map schedule"
      "recommend recommend"
      "logs logs";
  }
`;

// [1] 지도 영역
const MapSection = styled.div`
  grid-column: 1 / 2;
  grid-row: 1 / 2;
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
  position: relative; /* 오버레이 배치를 위해 relative */
  overflow: hidden;

  @media (max-width: 1200px) { grid-area: map; }
`;

// 지도 우측 상단 오버레이 (코드, 인원)
const MapOverlayControls = styled.div`
  position: absolute;
  top: 15px;
  right: 15px;
  display: flex;
  gap: 10px;
  z-index: 10;
`;

const OverlayBadge = styled.div`
  background: rgba(255, 255, 255, 0.9);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 5px;
  backdrop-filter: blur(4px);
  cursor: pointer;
  transition: transform 0.2s;

  &:hover { transform: translateY(-2px); }
  
  &.code-badge { color: #3B82F6; border: 1px solid #dbeafe; }
`;

// [2] 일정 영역
const ScheduleSection = styled.div`
  grid-column: 2 / 3;
  grid-row: 1 / 3; /* 길게 내려옴 */
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  max-height: 900px;
  padding-right: 5px;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 3px; }

  @media (max-width: 1200px) { grid-area: schedule; max-height: 500px; }
`;

const DayCard = styled.div`
  background: white;
  padding: 20px;
  border-radius: 16px;
  border: 1px solid #eee;
  box-shadow: 0 2px 8px rgba(0,0,0,0.03);
`;

const DayHeader = styled.h3`
  font-size: 1.1rem;
  color: #3B82F6;
  margin: 0 0 15px 0;
  font-weight: 800;
`;

const PlaceItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 8px;
  transition: all 0.2s;
  border: 1px solid transparent;

  &:hover {
    background-color: #ffffff;
    border-color: #3B82F6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  }
`;

const OrderBadge = styled.div`
  background-color: #333;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  margin-right: 12px;
  flex-shrink: 0;
`;

const PlaceName = styled.span`
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
  flex: 1;
`;

// [3] 추천 여행지 영역
const RecommendSection = styled.div`
  grid-column: 3 / 4;
  grid-row: 1 / 2;
  background-color: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  height: 600px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;

  @media (max-width: 1200px) { grid-area: recommend; height: 300px; }
`;

const RecItem = styled.div`
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 10px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h4 { margin: 0; font-size: 0.9rem; color: #333; }
  p { margin: 2px 0 0 0; font-size: 0.75rem; color: #888; }
`;

const AddBtn = styled.button`
  background: #eff6ff;
  color: #3b82f6;
  border: none;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  &:hover { background: #dbeafe; }
`;

// [4] 로그 영역
const LogSection = styled.div`
  grid-column: 1 / 2; /* 지도 아래 */
  grid-row: 2 / 3;
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  border: 1px solid #e2e8f0;
  max-height: 300px;
  overflow-y: auto;

  @media (max-width: 1200px) { grid-area: logs; }
`;

const LogList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const LogRow = styled.li`
  font-size: 0.85rem;
  color: #666;
  padding: 8px 0;
  border-bottom: 1px solid #f1f3f5;
  display: flex;
  gap: 10px;
  
  .time { color: #aaa; min-width: 60px; }
  .content { flex: 1; }
  .user { font-weight: bold; color: #333; }
`;


// --- 컴포넌트 ---
export default function TravelRoutePage() {
  const { cityId } = useParams(); // 'ai-result' 또는 trip_id
  const [searchParams] = useSearchParams(); 
  const navigate = useNavigate();
  
  // 데이터 상태
  const [tripData, setTripData] = useState<TripDetails | null>(null);
  const [logs, setLogs] = useState<TripLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 공유 코드 (초기값은 랜덤, DB에서 가져오면 덮어씌움)
  const [shareCode, setShareCode] = useState(Math.random().toString(36).substring(2, 8).toUpperCase());

  // 지도 Refs
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);

  // --- 1. 백엔드 데이터 불러오기 ---
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
        if (cityId === 'ai-result') {
            // A. AI 추천 모드
            const startDate = searchParams.get('start');
            const endDate = searchParams.get('end');
            
            const response = await fetch(`${API_BASE}/recommendations?start_date=${startDate}&end_date=${endDate}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("AI 추천 로드 실패");
            const data = await response.json();
            const firstCourse = data[0]; // 첫 번째 추천 결과 사용
            
            setTripData({
                trip_name: firstCourse.theme || "AI 추천 여행 코스",
                participants: [], // AI 결과는 아직 참여자 없음
                itineraries: firstCourse.route, // { "DAY 1": ["장소1", "장소2"] }
                alternatives: firstCourse.alternatives || [],
                isAiResult: true,
                shareCode: shareCode // 임시 코드 유지
            });
        } 
        else {
            // B. 저장된 여행 조회 모드
            const response = await fetch(`${API_BASE}/trips/${cityId}/details`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("여행 정보 로드 실패");
            const data = await response.json();
            
            // DB 데이터 가공 (첫 번째 사용자의 일정만 보여주는 예시)
            const firstUserId = Object.keys(data.itineraries)[0];
            const myItineraryItems = data.itineraries[firstUserId] || [];
            
            // 리스트를 { "DAY 1": [...] } 형태로 변환
            const groupedItinerary: Record<string, ItineraryItem[]> = {};
            // (백엔드 스키마에 따라 다르지만, 여기서는 배열로 가정하고 변환 로직 추가)
            if (Array.isArray(myItineraryItems)) {
                 // visit_day_str 기준으로 그룹화 필요 (백엔드에서 이미 그룹화해줬다면 생략 가능)
                 // 임시로 'DAY 1'에 다 넣는 예시 (실제 백엔드 응답 구조 확인 필요)
                 groupedItinerary["DAY 1"] = myItineraryItems; 
            } else {
                 // 이미 그룹화된 딕셔너리라면 그대로 사용
                 Object.assign(groupedItinerary, myItineraryItems);
            }

            setTripData({
                trip_name: data.trip_name,
                participants: data.participants,
                itineraries: groupedItinerary,
                isAiResult: false,
                shareCode: data.shareable_link_id || shareCode
            });
            
            // 실제 공유 코드 업데이트
            if (data.shareable_link_id) setShareCode(data.shareable_link_id);

            // 로그 조회
            const historyRes = await fetch(`${API_BASE}/trips/${cityId}/history`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (historyRes.ok) setLogs(await historyRes.json());
        }
      } catch (error) {
        console.error(error);
        alert("데이터를 불러올 수 없습니다.");
        navigate("/mypage");
      } finally {
        setIsLoading(false);
      }
    };
    if (cityId) fetchTripDetails();
  }, [cityId, navigate, searchParams]);


  // --- 2. 지도 그리기 (데이터가 준비되면 실행) ---
  useEffect(() => {
    if (isLoading || !tripData) return;

    // 카카오맵 로드 함수
    const loadKakaoMap = () => {
        window.kakao.maps.load(() => {
            const container = document.getElementById('map');
            if (!container) return;

            // 지도 초기화 (최초 1회)
            if (!mapRef.current) {
                const options = { center: new window.kakao.maps.LatLng(37.5665, 126.9780), level: 7 };
                mapRef.current = new window.kakao.maps.Map(container, options);
            }

            // 기존 마커 제거
            markersRef.current.forEach((m: any) => m.setMap(null));
            markersRef.current = [];
            if (polylineRef.current) polylineRef.current.setMap(null);

            // 현재 표시할 장소들 수집
            const placesToShow: string[] = [];
            Object.values(tripData.itineraries).forEach(dayItems => {
                // dayItems가 문자열 배열인지 객체 배열인지 확인
                dayItems.forEach((item: any) => {
                    const name = typeof item === 'string' ? item : item.place_name;
                    if (name) placesToShow.push(name);
                });
            });

            if (placesToShow.length === 0) return;

            // 장소 검색 및 마커 찍기
            const ps = new window.kakao.maps.services.Places();
            const bounds = new window.kakao.maps.LatLngBounds();
            const linePath: any[] = [];

            // 비동기로 좌표 검색
            const searchPromises = placesToShow.map((placeName, idx) => {
                return new Promise<void>((resolve) => {
                    ps.keywordSearch(placeName, (data: any, status: any) => {
                        if (status === window.kakao.maps.services.Status.OK) {
                            const coords = new window.kakao.maps.LatLng(data[0].y, data[0].x);
                            
                            // 마커 생성 (순서 번호 포함)
                            const content = `<div style="padding:5px; background:white; border:1px solid #333; border-radius:5px; font-size:12px; font-weight:bold;">${idx + 1}. ${placeName}</div>`;
                            const overlay = new window.kakao.maps.CustomOverlay({
                                position: coords,
                                content: content,
                                map: mapRef.current,
                                yAnchor: 1.5
                            });
                            
                            markersRef.current.push(overlay);
                            linePath.push(coords); // 선 연결용 좌표 저장
                            bounds.extend(coords); // 지도 범위 조정용
                        }
                        resolve();
                    });
                });
            });

            // 모든 검색이 끝나면 선 그리고 범위 조정
            Promise.all(searchPromises).then(() => {
                if (linePath.length > 1) {
                    const polyline = new window.kakao.maps.Polyline({
                        path: linePath,
                        strokeWeight: 4,
                        strokeColor: '#3B82F6',
                        strokeOpacity: 0.8,
                        strokeStyle: 'solid'
                    });
                    polyline.setMap(mapRef.current);
                    polylineRef.current = polyline;
                }
                if (linePath.length > 0) {
                    mapRef.current.setBounds(bounds);
                }
            });
        });
    };

    // 카카오 SDK 로드 체크
    if (window.kakao && window.kakao.maps) {
        loadKakaoMap();
    } else {
        const script = document.createElement("script");
        // 본인의 JavaScript 키 입력
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=c0ce14306decee109a46f80f30e7c0df&libraries=services&autoload=false`;
        script.onload = loadKakaoMap;
        document.head.appendChild(script);
    }
  }, [tripData, isLoading]);


  // --- 핸들러 ---
  const handleSave = () => {
    // 실제 저장 로직 구현 필요 (백엔드 POST /api/trips 호출)
    alert(`'${tripData?.trip_name}' 코스를 저장합니다! (구현 예정)`);
    // 성공 시 로그 갱신 로직 추가
  };

  const handleCopyCode = () => {
      navigator.clipboard.writeText(shareCode);
      alert(`초대 코드 [${shareCode}]가 복사되었습니다!`);
  };

  const handleAddPlace = (placeName: string) => {
      alert(`'${placeName}'을(를) 일정에 추가합니다. (구현 예정)`);
      // 1. 백엔드 API 호출 (POST /api/trips/{id}/items)
      // 2. 성공 시 tripData 업데이트 (화면 갱신)
      // 3. 로그 업데이트
  };

  if (isLoading) return <div style={{textAlign:'center', padding:'100px'}}>로딩 중...</div>;
  if (!tripData) return <div>데이터 없음</div>;

  return (
    <PageContainer>
      <HeaderSection>
        <Title>{tripData.trip_name}</Title>
        {tripData.isAiResult && <SaveButton onClick={handleSave}><Save size={16}/> 저장</SaveButton>}
      </HeaderSection>
      
      <ContentGrid>
        {/* [1] 지도 */}
        <MapSection>
            {/* ★ 지도 우측 상단 오버레이 (코드, 인원) */}
            <MapOverlayControls>
                <OverlayBadge className="code-badge" onClick={handleCopyCode}>
                    <Share2 size={14} /> {shareCode}
                </OverlayBadge>
                <OverlayBadge>
                    <Users size={14} /> {tripData.participants.length || 1}명
                </OverlayBadge>
            </MapOverlayControls>
            
            <div id="map" style={{ width: '100%', height: '100%' }}></div>
        </MapSection>

        {/* [2] 여행 일정 (중앙) */}
        <ScheduleSection>
            {Object.entries(tripData.itineraries).sort().map(([day, items]) => (
                <DayCard key={day}>
                    <DayHeader>{day}</DayHeader>
                    {items.map((item: any, idx: number) => {
                        const name = typeof item === 'string' ? item : item.place_name;
                        return (
                            <PlaceItem key={idx}>
                                <OrderBadge>{idx + 1}</OrderBadge>
                                <PlaceName>{name}</PlaceName>
                                <Trash2 size={16} color="#bbb" style={{cursor:'pointer'}} />
                            </PlaceItem>
                        );
                    })}
                </DayCard>
            ))}
        </ScheduleSection>

        {/* [3] 추천 여행지 (우측) */}
        <RecommendSection>
            <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'15px'}}>
                <MapPin size={20} color="#3B82F6" />
                <h3 style={{margin:0, fontSize:'1.1rem'}}>추천 여행지</h3>
            </div>
            {tripData.alternatives?.map((place, idx) => (
                <RecItem key={idx}>
                    <div>
                        <h4>{place}</h4>
                        <p>AI 추천 대안 장소</p>
                    </div>
                    <AddBtn onClick={() => handleAddPlace(place)}><Plus size={16} /></AddBtn>
                </RecItem>
            ))}
        </RecommendSection>

        {/* [4] 로그 기록 (하단) */}
        <LogSection>
            <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'10px', borderBottom:'1px solid #eee', paddingBottom:'10px'}}>
                <FileText size={20} color="#3B82F6" />
                <h3 style={{margin:0, fontSize:'1.1rem'}}>수정 로그</h3>
            </div>
            <LogList>
                {logs.length > 0 ? logs.map(log => (
                    <LogRow key={log.action_id}>
                        <span className="time">{new Date(log.created_at).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                        <span className="content">
                            <span className="user">{log.user_name}</span>님이 {log.description}
                        </span>
                    </LogRow>
                )) : <div style={{textAlign:'center', color:'#aaa', padding:'20px'}}>변경 이력이 없습니다.</div>}
            </LogList>
        </LogSection>

      </ContentGrid>
    </PageContainer>
  );
}