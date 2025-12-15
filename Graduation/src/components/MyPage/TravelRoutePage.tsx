import React, { useEffect, useState, useRef } from "react";
import styled from "@emotion/styled";
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult, DroppableProvided, DraggableProvided } from '@hello-pangea/dnd';

import { MapPin, Info, Trash2, Map as MapIcon, Users, Plus, Minus, FileText, Search, Save, Share2, GripVertical } from "lucide-react";


// --- 타입 정의 ---
declare global {
    interface Window {
        kakao: any;
    }
    interface ImportMetaEnv {
        readonly VITE_KAKAO_JAVASCRIPT_KEY: string;
        readonly VITE_BACKEND_API_URL: string;
    }
    interface ImportMeta {
        readonly env: ImportMetaEnv;
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
  itineraries: Record<string, ItineraryItem[]>;
  alternatives?: string[]; 
  isAiResult?: boolean;
  shareCode?: string;
  trip_id?: number;
}

interface TripLog {
    action_id: number;
    action_type: string;
    user_name: string;
    description: string;
    created_at: string;
}

interface TripPoint { lat: number; lng: number; address: string; title?: string; sourceId?: number; order?: number; }
interface TripFolder { id: number; title: string; participants: number; points: TripPoint[]; }
interface Recommendation { id: number; title: string; description: string; lat: number; lng: number; }

// --- 스타일 컴포넌트 ---
const PageContainer = styled.div`
  padding: 30px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
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

  // 지도 및 UI 제어용 상태
  const [travelFolders, setTravelFolders] = useState<TripFolder[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);

  const [searchKeyword, setSearchKeyword] = useState("");
  const [shareCode, setShareCode] = useState(Math.random().toString(36).substring(2, 8).toUpperCase());

  // 지도 Refs
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const psRef = useRef<any>(null);

  const API_BASE = import.meta.env.VITE_BACKEND_API_URL || "http://127.0.0.1:8000/api";

  // --- 1. 백엔드 데이터 불러오기 ---
  useEffect(() => {
    const fetchTripDetails = async () => {
      const token = localStorage.getItem("access_token");
      if (!token) {
        alert("로그인이 필요합니다.");
        navigate("/");
        return;
      }
      
      try {
        let tripName = "";
        let participantsCount = 1;
        let routePlaceNames: string[] = [];
        let altPlaceNames: string[] = [];
        let tripId = 0;
        let currentItineraries: Record<string, ItineraryItem[]> = {};

        if (cityId === 'ai-result') {
            const startDate = searchParams.get('start');
            const endDate = searchParams.get('end');
            
            const response = await fetch(`${API_BASE}/recommendations?start_date=${startDate}&end_date=${endDate}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) throw new Error("AI 추천 로드 실패");
            const data = await response.json();
            const firstCourse = data[0]; 
            
            tripName = firstCourse.theme || "AI 추천 여행 코스";
            tripId = 999;
            if (firstCourse.alternatives) altPlaceNames = firstCourse.alternatives;
            
            if (firstCourse.route) {
                Object.entries(firstCourse.route).forEach(([day, places]) => {
                    const placeList = Array.isArray(places) ? places : [];
                    currentItineraries[day] = placeList.map((placeName: string, idx: number) => ({
                        item_id: Date.now() + idx, // 임시 ID
                        place_name: placeName,
                        order_in_day: idx + 1
                    }));
                    routePlaceNames.push(...placeList);
                });
            }

            setTripData({
                trip_name: tripName,
                participants: [],
                itineraries: currentItineraries,
                alternatives: altPlaceNames,
                isAiResult: true,
                shareCode: shareCode
            });

        } else {
            const response = await fetch(`${API_BASE}/trips/${cityId}/details`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("여행 정보 로드 실패");
            const data = await response.json();
            
            tripName = data.trip_name;
            participantsCount = data.participants.length;
            tripId = Number(cityId);

            const firstUserId = Object.keys(data.itineraries)[0];
            const myItinerary = data.itineraries[firstUserId] || {};
            
            if (Array.isArray(myItinerary)) {
                 currentItineraries["DAY 1"] = myItinerary;
                 myItinerary.forEach((item: any) => routePlaceNames.push(item.place_name));
            } else {
                 Object.assign(currentItineraries, myItinerary);
                 Object.values(myItinerary).forEach((items: any) => {
                     items.forEach((item: any) => routePlaceNames.push(item.place_name));
                 });
            }

            setTripData({
                trip_name: tripName,
                participants: data.participants,
                itineraries: currentItineraries,
                isAiResult: false,
                shareCode: data.shareable_link_id,
                trip_id: tripId
            });
            if(data.shareable_link_id) setShareCode(data.shareable_link_id);

            const historyRes = await fetch(`${API_BASE}/trips/${cityId}/history`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (historyRes.ok) setLogs(await historyRes.json());
        }

        // --- 좌표 검색 (Geocoding) ---
        const waitForKakao = setInterval(() => {
            if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
                clearInterval(waitForKakao);
                const ps = new window.kakao.maps.services.Places();

                const searchPlace = (keyword: string): Promise<any> => {
                    return new Promise((resolve) => {
                        ps.keywordSearch(keyword, (result: any, status: any) => {
                            if (status === window.kakao.maps.services.Status.OK) {
                                resolve({ title: keyword, lat: parseFloat(result[0].y), lng: parseFloat(result[0].x), address: result[0].address_name });
                            } else { resolve(null); }
                        });
                    });
                };

                Promise.all(routePlaceNames.map(name => searchPlace(name))).then(pointResults => {
                     const validPoints = pointResults.filter(p => p !== null).map((p, i) => ({ ...p, sourceId: i }));
                     setTravelFolders([{
                        id: tripId, title: tripName, participants: participantsCount, points: validPoints
                    }]);
                    setSelectedFolderId(tripId);
                });

                Promise.all(altPlaceNames.map(name => searchPlace(name))).then(recResults => {
                     const validRecs = recResults.filter(r => r !== null).map((r, i) => ({
                        id: i + 1000, title: r.title, description: "추천 대안 장소", lat: r.lat, lng: r.lng
                    }));
                     setRecommendations(validRecs);
                });
            }
        }, 500);

      } catch (error: any) {
        console.error(error);
        alert(`오류: ${error.message}`);
        navigate("/mypage");
      } finally {
        setIsLoading(false);
      }
    };

    if (cityId) fetchTripDetails();
  }, [cityId, navigate, searchParams]);


  // --- 2. 지도 그리기 ---
  useEffect(() => {
    // 로딩 중이거나 데이터가 없으면 중단
    if (isLoading || !tripData) return;
    
    // 카카오맵 키 (상수로 정의하거나 .env 사용)
    const kakaoAppKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;
    
    const loadKakaoMap = () => {
        if (!window.kakao || !window.kakao.maps) return;
        window.kakao.maps.load(() => {
            const container = document.getElementById('map');
            if (!container) return;

            // 지도 초기화 (최초 1회)
            if (!mapRef.current) {
                const options = { center: new window.kakao.maps.LatLng(37.5665, 126.9780), level: 7 };
                mapRef.current = new window.kakao.maps.Map(container, options);
                psRef.current = new window.kakao.maps.services.Places();
            }

            // 기존 마커/라인 제거 (초기화)
            markersRef.current.forEach((m: any) => m.setMap(null));
            markersRef.current = [];
            if (polylineRef.current) polylineRef.current.setMap(null);

            // --- 날짜 순서대로 정렬하여 장소 수집 ---
            const allPlaceNames: string[] = [];
            
            // 1. 날짜 키(DAY 1, DAY 2...)를 가져와서 숫자 기준으로 정렬
            const sortedDays = Object.keys(tripData.itineraries).sort((a, b) => {
                const numA = parseInt(a.replace(/\D/g, '')) || 0; // "DAY 1" -> 1
                const numB = parseInt(b.replace(/\D/g, '')) || 0;
                return numA - numB;
            });

            // 2. 정렬된 날짜 순서대로 장소 이름 수집
            sortedDays.forEach(day => {
                const items = tripData.itineraries[day];
                // items가 배열인지 확인 후 순회
                if (Array.isArray(items)) {
                    items.forEach(item => {
                        // item이 객체라면 place_name, 문자열이라면 그대로 사용
                        const name = typeof item === 'string' ? item : item.place_name;
                        if (name) allPlaceNames.push(name);
                    });
                }
            });

            if (allPlaceNames.length === 0) return;
            // ----------------------------------------------------

            // 장소 이름으로 좌표 검색 (Promise.all로 병렬 처리)
            // 주의: 검색 결과 순서가 섞이지 않도록 map을 사용
            const searchPromises = allPlaceNames.map((name) => {
                return new Promise<any>((resolve) => {
                    psRef.current.keywordSearch(name, (data: any, status: any) => {
                        if (status === window.kakao.maps.services.Status.OK) {
                            // 검색 성공 시 좌표 반환
                            resolve({ 
                                title: name, 
                                lat: parseFloat(data[0].y), 
                                lng: parseFloat(data[0].x) 
                            });
                        } else {
                            // 검색 실패 시 null 반환 (하지만 순서는 유지됨)
                            console.warn(`장소 검색 실패: ${name}`);
                            resolve(null);
                        }
                    });
                });
            });

            Promise.all(searchPromises).then((results) => {
                // null(검색 실패) 제외하고 유효한 장소만 필터링
                const validPoints = results.filter((r) => r !== null);
                
                const linePath: any[] = [];
                const bounds = new window.kakao.maps.LatLngBounds();

                // 마커 및 선 그리기
                validPoints.forEach((point, index) => {
                    const position = new window.kakao.maps.LatLng(point.lat, point.lng);
                    linePath.push(position);
                    bounds.extend(position);

                    // 커스텀 오버레이 (순서 번호 표시)
                    const content = `
                        <div style="position: relative; bottom: 45px;">
                            <div style="background: white; padding: 5px 10px; border-radius: 15px; border: 1px solid #3B82F6; font-size: 12px; font-weight: bold; color: #3B82F6; box-shadow: 0 2px 4px rgba(0,0,0,0.2); white-space: nowrap;">${point.title}</div>
                            <div style="position: absolute; left: 50%; bottom: -35px; transform: translateX(-50%); width: 24px; height: 24px; background: #3B82F6; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${index + 1}</div>
                        </div>`;
                    
                    const overlay = new window.kakao.maps.CustomOverlay({
                        position: position,
                        content: content,
                        map: mapRef.current,
                        yAnchor: 1.5
                    });
                    markersRef.current.push(overlay);
                });

                // 경로 선(Polyline) 그리기
                if (linePath.length > 1) {
                    const polyline = new window.kakao.maps.Polyline({
                        path: linePath, // 정렬된 좌표 배열
                        strokeWeight: 5,
                        strokeColor: '#3B82F6',
                        strokeOpacity: 0.8,
                        strokeStyle: 'solid'
                    });
                    polyline.setMap(mapRef.current);
                    polylineRef.current = polyline;
                }

                // 모든 마커가 보이도록 지도 범위 재설정
                if (linePath.length > 0) {
                    mapRef.current.setBounds(bounds);
                }
            });
        });
    };

    // SDK 로드 확인 및 스크립트 추가
    if (window.kakao && window.kakao.maps) {
        loadKakaoMap();
    } else {
        const script = document.createElement("script");
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoAppKey}&libraries=services&autoload=false`;
        script.async = false;
        script.onload = loadKakaoMap;
        document.head.appendChild(script);
    }
  }, [tripData, isLoading]); // tripData가 변경될 때마다 실행


  // --- 핸들러 구현 ---

  // 1. 저장 핸들러 (AI 결과를 DB에 저장)
  const handleSaveTrip = async () => {
    if (!tripData) return;
    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
        // 1-1. 여행 생성
        const createRes = await fetch(`${API_BASE}/trips/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify({ trip_name: tripData.trip_name })
        });
        if (!createRes.ok) throw new Error("여행 생성 실패");
        const newTrip = await createRes.json();
        const newTripId = newTrip.trip_id;

        // 1-2. 일정 항목 추가 (개념적 구현 - 실제로는 place_id가 필요함)
        // 여기서는 저장 후 해당 페이지로 이동만 처리
        alert(`'${tripData.trip_name}' 여행이 저장되었습니다! (ID: ${newTripId})`);
        navigate(`/travel-route/${newTripId}`);

    } catch (error) {
        console.error(error);
        alert("저장 중 오류가 발생했습니다.");
    }
  };

  // 2. 장소 추가 (UI 업데이트 + 백엔드 요청)
  const handleAddPlace = async (placeName: string) => {
    if (!tripData) return;
    
    const firstDayKey = Object.keys(tripData.itineraries).sort()[0] || "DAY 1";
    const currentItems = tripData.itineraries[firstDayKey] || [];
    const newOrder = currentItems.length + 1;
    
    // UI 즉시 반영
    const newItem: ItineraryItem = { 
        item_id: Date.now(), 
        place_name: placeName, 
        order_in_day: newOrder 
    };

    setTripData(prev => prev ? ({
        ...prev,
        itineraries: {
            ...prev.itineraries,
            [firstDayKey]: [...currentItems, newItem]
        }
    }) : null);

    if (!tripData.isAiResult && tripData.trip_id) {
        const token = localStorage.getItem("access_token");
        try {
            await fetch(`${API_BASE}/trips/${tripData.trip_id}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ place_id: 1, visit_day_str: firstDayKey, order_in_day: newOrder })
            });
        } catch (e) { console.error(e); }
    }
    alert(`'${placeName}'을(를) 추가했습니다.`);
  };

  // 3. 장소 삭제
  const deletePoint = async (day: string, idx: number, item: ItineraryItem) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    setTripData(prev => {
        if (!prev) return null;
        const newItems = prev.itineraries[day].filter((_, i) => i !== idx);
        return { ...prev, itineraries: { ...prev.itineraries, [day]: newItems } };
    });

    if (!tripData?.isAiResult && item.item_id && tripData?.trip_id) {
        const token = localStorage.getItem("access_token");
        try {
             await fetch(`${API_BASE}/items/${item.item_id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
        } catch (e) { console.error(e); }
    }
  };
  
  // 4. 드래그 앤 드롭 순서 변경 (HandleDragEnd)
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !tripData) return;
    const { source, destination } = result;

    if (source.droppableId === destination.droppableId) {
        const day = source.droppableId;
        const items = Array.from(tripData.itineraries[day]);
        const [moved] = items.splice(source.index, 1);
        items.splice(destination.index, 0, moved);

        setTripData(prev => prev ? ({
            ...prev,
            itineraries: { ...prev.itineraries, [day]: items }
        }) : null);

        if (!tripData.isAiResult && tripData.trip_id) {
            const token = localStorage.getItem("access_token");
            const orderedIds = items.map(i => i.item_id); 
            try {
                await fetch(`${API_BASE}/trips/${tripData.trip_id}/items/reorder`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ visit_day_str: day, ordered_item_ids: orderedIds })
                });
            } catch (e) { console.error(e); }
        }
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(shareCode);
    alert("초대 코드 복사 완료!");
  };

  const handleMapSearch = (e: React.FormEvent) => { 
      e.preventDefault();
      if (!searchKeyword.trim() || !psRef.current) return;
      psRef.current.keywordSearch(searchKeyword, (data: any, status: any) => {
          if (status === window.kakao.maps.services.Status.OK) {
              const place = data[0];
              mapRef.current.panTo(new window.kakao.maps.LatLng(place.y, place.x));
          } else { alert("검색 결과 없음"); }
      });
  };

  const toggleRecommendation = (rec: any) => {
    alert("추가 (구현 예정)");
  };

  if (isLoading) return <div style={{textAlign:'center', padding:'100px'}}>로딩 중...</div>;
  if (!tripData) return <div>데이터 없음</div>;

  return (
    <PageContainer>
      <HeaderSection>
        <Title>{tripData.trip_name}</Title>
        {tripData.isAiResult && <SaveButton onClick={handleSaveTrip}><Save size={16}/> 저장</SaveButton>}
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