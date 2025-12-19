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

export { };

import React, { useEffect, useState, useRef } from 'react';
import type { CSSProperties } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Info, Trash2, Map as MapIcon, Users, Plus, Minus, Search, Save, Share2 } from "lucide-react";
// [수정 1] config에서 중앙 관리되는 API 주소 가져오기
import { API_BASE_URL } from '../../config';

// --- 타입 정의 ---
interface ItineraryItem {
    item_id: number;
    place_name: string;
    order_in_day: number;
    place_id?: number;
    lat?: number;
    lng?: number;
    address?: string;
}

interface UserSimple {
    user_id: number;
    username: string;
    profile_image_url: string | null;
}

interface TripDetails {
    trip_id?: number;
    trip_name: string;
    participants: UserSimple[];
    itineraries: Record<string, ItineraryItem[]>;
    alternatives: string[];
    isAiResult: boolean;
    shareCode: string;
}

export default function TravelRoutePage() {
    const { cityId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Refs
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const polylineRef = useRef<any>(null);
    const geocoderRef = useRef<any>(null);
    const psRef = useRef<any>(null);

    // 상태 관리
    const [searchKeyword, setSearchKeyword] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // 데이터 상태
    const [tripData, setTripData] = useState<TripDetails | null>(null);

    // shareCode 초기화
    const [shareCode, setShareCode] = useState(Math.random().toString(36).substring(2, 8).toUpperCase());

    // --- [1] 데이터 로딩 ---
    useEffect(() => {
        const fetchTripDetails = async () => {
            const token = localStorage.getItem("access_token");

            try {
                if (cityId === 'ai-result') {
                    // [A] AI 추천 모드
                    const startDate = searchParams.get('start');
                    const endDate = searchParams.get('end');
                    // [수정 2] API_BASE_URL 사용
                    const response = await fetch(`${API_BASE_URL}/api/recommendations?start_date=${startDate}&end_date=${endDate}`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const firstCourse = data[0];

                        const itineraries: Record<string, ItineraryItem[]> = {};
                        if (firstCourse.route) {
                            for (const day in firstCourse.route) {
                                itineraries[day] = firstCourse.route[day].map((placeName: string, index: number) => ({
                                    item_id: Date.now() + index,
                                    place_name: placeName,
                                    order_in_day: index + 1,
                                }));
                            }
                        }

                        setTripData({
                            trip_name: firstCourse.theme || "AI 추천 여행 코스",
                            participants: [],
                            itineraries: itineraries,
                            alternatives: firstCourse.alternatives || [],
                            isAiResult: true,
                            shareCode: shareCode
                        });
                    } else { throw new Error("AI Load Failed"); }
                } else {
                    // [B] DB 조회 모드
                    // [수정 2] API_BASE_URL 사용
                    const response = await fetch(`${API_BASE_URL}/api/trips/${cityId}/details`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        setTripData({
                            trip_id: data.trip_id,
                            trip_name: data.trip_name,
                            participants: data.participants || [],
                            itineraries: data.itineraries || {},
                            alternatives: data.alternatives || [],
                            isAiResult: false,
                            shareCode: data.shareable_link_id || "CODE"
                        });
                        if (data.shareable_link_id) setShareCode(data.shareable_link_id);
                    }
                }
            } catch (error) {
                console.error("데이터 로딩 실패:", error);
                // 에러 발생 시 더미 데이터
                setTripData({
                    trip_name: "데이터 로딩 실패(샘플)",
                    participants: [],
                    itineraries: { "Day 1": [] },
                    alternatives: ["북촌 한옥마을", "경복궁"],
                    isAiResult: true,
                    shareCode: "ERROR"
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchTripDetails();
    }, [cityId, searchParams, shareCode]);


    // --- [2] 기능 핸들러 (수정됨) ---

    const handleSave = async () => {
        if (!tripData) return;
        const token = localStorage.getItem("access_token");
        if (!token) {
            alert("로그인이 필요합니다.");
            return;
        }

        try {
            // Case 1: AI 추천 결과를 새로 저장
            if (tripData.isAiResult) {
                // 1. 여행(Trip) 생성
                const createRes = await fetch(`${API_BASE_URL}/api/trips`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({ trip_name: tripData.trip_name })
                });

                if (!createRes.ok) throw new Error("여행 생성 실패");
                const newTrip = await createRes.json();
                const newTripId = newTrip.trip_id;

                const itemsToAdd = tripData.itineraries["Day 1"] || [];

                // [수정 3] 병렬 처리 (Promise.all) 적용 - 속도 최적화
                const savePromises = itemsToAdd.map(async (item, index) => {
                    let lat = item.lat;
                    let lng = item.lng;

                    // 좌표가 없으면 카카오 검색 서비스로 좌표 구하기 (Promise로 감싸기)
                    if (lat === undefined || lng === undefined) {
                        try {
                            const coords: any = await new Promise((resolve, reject) => {
                                if (!psRef.current) return reject(new Error("Kakao Service Unavailable"));
                                psRef.current.keywordSearch(item.place_name, (data: any, status: any) => {
                                    if (status === window.kakao.maps.services.Status.OK && data.length > 0) {
                                        resolve({ lat: parseFloat(data[0].y), lng: parseFloat(data[0].x) });
                                    } else {
                                        resolve({ lat: 0, lng: 0 }); // 검색 실패 시 기본값
                                    }
                                });
                            });
                            lat = coords.lat;
                            lng = coords.lng;
                        } catch (e) {
                            lat = 0; lng = 0;
                        }
                    }

                    // 개별 아이템 저장 요청
                    return fetch(`${API_BASE_URL}/api/trips/${newTripId}/items`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                        body: JSON.stringify({
                            place_name: item.place_name,
                            lat,
                            lng,
                            visit_day_str: "2025-01-01",
                            order_in_day: index + 1,
                        })
                    });
                });

                // 모든 저장 요청이 끝날 때까지 대기
                await Promise.all(savePromises);

                alert(`'${tripData.trip_name}' 여행이 저장되었습니다!`);
                navigate(`/travel-route/${newTripId}`);
            }
            // Case 2: 기존 여행 수정 후 업데이트
            else {
                const itemsToUpdate = tripData.itineraries["Day 1"] || [];
                const payload = {
                    itineraries: itemsToUpdate.map((item, index) => ({
                        place_name: item.place_name,
                        lat: item.lat,
                        lng: item.lng,
                        place_id: item.place_id,
                        visit_day_str: "2025-01-01",
                        order_in_day: index + 1,
                    }))
                };

                const updateRes = await fetch(`${API_BASE_URL}/api/trips/${tripData.trip_id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify(payload)
                });

                if (!updateRes.ok) {
                    const errorBody = await updateRes.json().catch(() => ({ detail: "Unknown error" }));
                    throw new Error(`여행 업데이트 실패: ${errorBody.detail}`);
                }
                alert("여행이 성공적으로 업데이트되었습니다!");
            }
        } catch (error: any) {
            console.error(error);
            alert(`작업 중 오류가 발생했습니다: ${error.message}`);
        }
    };

    // 2. 지도 클릭하여 장소 추가
    const handleMapClick = async (lat: number, lng: number) => {
        geocoderRef.current.coord2RegionCode(lng, lat, async (result: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
                const addressName = result[0].address_name;
                const currentList = tripData?.itineraries["Day 1"] || [];

                // AI 결과 화면이면 프론트에서만 갱신
                if (tripData?.isAiResult) {
                    const newPoint = {
                        item_id: Date.now(),
                        place_name: addressName,
                        order_in_day: currentList.length + 1,
                        lat, lng, address: addressName
                    };
                    setTripData(prev => prev ? { ...prev, itineraries: { ...prev.itineraries, "Day 1": [...currentList, newPoint] } } : null);
                    return;
                }

                // 저장된 여행이면 서버로 전송
                const token = localStorage.getItem("access_token");
                try {
                    // [수정 4] API_BASE_URL 적용
                    const response = await fetch(`${API_BASE_URL}/api/trips/${cityId}/items`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                        body: JSON.stringify({
                            place_name: addressName,
                            lat,
                            lng,
                            visit_day_str: "2025-01-01", // 임시 날짜
                            order_in_day: currentList.length + 1,
                        }),
                    });

                    if (response.ok) {
                        const newItem = await response.json();
                        setTripData(prev => {
                            if (!prev) return null;
                            const updatedList = [...currentList, { ...newItem, address: addressName, lat, lng }];
                            return { ...prev, itineraries: { ...prev.itineraries, "Day 1": updatedList } };
                        });
                    } else {
                        alert("장소 추가에 실패했습니다.");
                    }
                } catch (e) {
                    alert("서버 오류가 발생했습니다.");
                }
            }
        });
    };

    // 3. 추천 장소 추가/삭제 (toggle)
    const toggleRecommendation = async (recName: string) => {
        const currentList = tripData?.itineraries["Day 1"] || [];
        const existingItem = currentList.find(p => p.place_name === recName);

        // AI 모드에서는 프론트에서만 처리
        if (tripData?.isAiResult) {
            let newList: ItineraryItem[];
            if (existingItem) {
                newList = currentList.filter(p => p.place_name !== recName);
            } else {
                const newPoint = { item_id: Date.now(), place_name: recName, order_in_day: currentList.length + 1, address: recName };
                newList = [...currentList, newPoint];
            }
            setTripData(prev => prev ? { ...prev, itineraries: { ...prev.itineraries, "Day 1": newList } } : null);
            return;
        }

        const token = localStorage.getItem("access_token");

        if (existingItem) {
            // 삭제 로직 (DELETE)
            try {
                const response = await fetch(`${API_BASE_URL}/api/trips/items/${existingItem.item_id}`, {
                    method: "DELETE",
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (response.ok) {
                    setTripData(prev => {
                        if (!prev) return null;
                        const newList = prev.itineraries["Day 1"].filter(p => p.item_id !== existingItem.item_id);
                        return { ...prev, itineraries: { ...prev.itineraries, "Day 1": newList } };
                    });
                } else { alert("삭제 실패"); }
            } catch (e) { alert("서버 오류"); }

        } else {
            // 추가 로직 (POST)
            try {
                const response = await fetch(`${API_BASE_URL}/api/trips/${cityId}/items`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify({
                        place_name: recName,
                        visit_day_str: "2025-01-01",
                        order_in_day: currentList.length + 1,
                    }),
                });
                if (response.ok) {
                    const newItem = await response.json();
                    setTripData(prev => {
                        if (!prev) return null;
                        const updatedList = [...currentList, { ...newItem, address: recName }];
                        return { ...prev, itineraries: { ...prev.itineraries, "Day 1": updatedList } };
                    });
                } else { alert("추가 실패"); }
            } catch (e) { alert("서버 오류"); }
        }
    };

    // 4. 일정에서 장소 삭제
    const deletePoint = async (day: string, itemIdToDelete: number) => {
        // AI 모드 (프론트에서만 처리)
        if (tripData?.isAiResult) {
            setTripData(prev => {
                if (!prev) return null;
                const currentList = prev.itineraries[day] || [];
                const newList = currentList.filter(item => item.item_id !== itemIdToDelete);
                return { ...prev, itineraries: { ...prev.itineraries, [day]: newList } };
            });
            return;
        }

        // DB 저장된 여행 (서버 통신)
        const token = localStorage.getItem("access_token");
        try {
            const response = await fetch(`${API_BASE_URL}/api/trips/items/${itemIdToDelete}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                setTripData(prev => {
                    if (!prev) return null;
                    const currentList = prev.itineraries[day] || [];
                    const newList = currentList.filter(item => item.item_id !== itemIdToDelete);
                    return { ...prev, itineraries: { ...prev.itineraries, [day]: newList } };
                });
            } else {
                const error = await response.json();
                alert(`삭제 실패: ${error.detail || '알 수 없는 오류'}`);
            }
        } catch (error) {
            alert("서버 연결에 실패했습니다.");
        }
    };

    const handleCopyCode = () => {
        if (!tripData) return;
        navigator.clipboard.writeText(tripData.shareCode);
        alert(`초대 코드 [${tripData.shareCode}]가 복사되었습니다!`);
    };

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchKeyword.trim() || !psRef.current) return;
        psRef.current.keywordSearch(searchKeyword, (data: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
                const place = data[0];
                const moveLatLon = new window.kakao.maps.LatLng(place.y, place.x);
                mapRef.current.panTo(moveLatLon);
            } else { alert('검색 결과가 없습니다.'); }
        });
    };

    // --- [3] 지도 렌더링 ---
    useEffect(() => {
        const kakaoAppKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;

        // 지도 생성 함수
        const initMap = () => {
            const container = document.getElementById('map');
            if (!container) return;

            // 지도 객체가 없으면 새로 생성
            if (!mapRef.current) {
                const options = { center: new window.kakao.maps.LatLng(37.5665, 126.9780), level: 7 };
                mapRef.current = new window.kakao.maps.Map(container, options);
                psRef.current = new window.kakao.maps.services.Places();
                geocoderRef.current = new window.kakao.maps.services.Geocoder();

                // 클릭 이벤트 등록
                window.kakao.maps.event.addListener(mapRef.current, 'click', function (mouseEvent: any) {
                    // 내부에서 최신 상태를 참조하기 어렵기 때문에, 별도 함수보다는 
                    // lat/lng만 넘기고 로직은 handleMapClick에서 처리하는 방식 권장.
                    // 여기서는 handleMapClick이 dependency에 들어가면 무한루프 가능성이 있으므로
                    // mapRef.current에 이벤트를 붙이는 방식은 유지하되, 
                    // useEffect cleanup에서 잘 지워줘야 함.
                });
            }
        };

        // 데이터를 지도에 그리는 함수
        const drawTripOnMap = async () => {
            if (!mapRef.current || !tripData) return;

            // 기존 마커/폴리라인 제거
            markersRef.current.forEach(m => m.setMap(null));
            markersRef.current = [];
            if (polylineRef.current) {
                polylineRef.current.setMap(null);
                polylineRef.current = null;
            }

            const points = tripData.itineraries["Day 1"] || [];
            if (points.length === 0) return;

            const path: any[] = [];

            for (let i = 0; i < points.length; i++) {
                const p = points[i];
                let lat = p.lat;
                let lng = p.lng;

                // 좌표 없으면 검색 (여기서는 async/await 허용)
                if (!lat || !lng) {
                    await new Promise((resolve) => {
                        if (!psRef.current) { resolve(null); return; }
                        psRef.current.keywordSearch(p.place_name, (data: any, status: any) => {
                            if (status === window.kakao.maps.services.Status.OK) {
                                lat = parseFloat(data[0].y);
                                lng = parseFloat(data[0].x);
                            }
                            resolve(null);
                        });
                    });
                }

                if (lat && lng) {
                    const position = new window.kakao.maps.LatLng(lat, lng);
                    path.push(position);
                    const content = `
                        <div style="position: relative; width: 0; height: 0;">
                            <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); background: white; padding: 4px 10px; border-radius: 15px; border: 1px solid #3B82F6; font-size: 12px; font-weight: bold; color: #3B82F6; box-shadow: 0 2px 4px rgba(0,0,0,0.2); pointer-events: none;">${p.place_name}</div>
                            <div style="position: absolute; top: 0; left: 0; transform: translate(-50%, -50%); width: 24px; height: 24px; background: #3B82F6; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${i + 1}</div>
                        </div>`;
                    const overlay = new window.kakao.maps.CustomOverlay({ position: position, content: content, map: mapRef.current });
                    markersRef.current.push(overlay);
                }
            }

            if (path.length > 1) {
                const polyline = new window.kakao.maps.Polyline({ path: path, strokeWeight: 5, strokeColor: '#667eea', strokeOpacity: 0.8, strokeStyle: 'solid' });
                polyline.setMap(mapRef.current);
                polylineRef.current = polyline;
            }
            if (path.length > 0) mapRef.current.panTo(path[path.length - 1]);
        };

        // 로드 로직 실행
        if (window.kakao && window.kakao.maps) {
            initMap();
            drawTripOnMap();
        } else {
            const script = document.createElement("script");
            script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoAppKey}&libraries=services&autoload=false`;
            script.async = false;
            script.onload = () => {
                window.kakao.maps.load(() => {
                    initMap();
                    drawTripOnMap();
                });
            };
            document.head.appendChild(script);
        }

        // [수정 5] Cleanup Function 추가 (메모리 누수 방지)
        return () => {
            // 마커 제거
            if (markersRef.current) {
                markersRef.current.forEach(m => m.setMap(null));
                markersRef.current = [];
            }
            // 폴리라인 제거
            if (polylineRef.current) {
                polylineRef.current.setMap(null);
            }
            // 지도 인스턴스 해제 (선택적이나 안전함)
            if (mapRef.current) {
                mapRef.current = null;
            }
        };
    }, [tripData]); // tripData 변경될 때마다 지도 다시 그리기

    // 지도 클릭 이벤트 별도 등록 (최신 State 참조를 위해)
    useEffect(() => {
        if (!mapRef.current) return;

        const clickHandler = (mouseEvent: any) => {
            handleMapClick(mouseEvent.latLng.getLat(), mouseEvent.latLng.getLng());
        };

        window.kakao.maps.event.addListener(mapRef.current, 'click', clickHandler);

        return () => {
            if (mapRef.current) {
                window.kakao.maps.event.removeListener(mapRef.current, 'click', clickHandler);
            }
        }
    }, [tripData]); // tripData가 바뀔 때마다 핸들러 갱신


    if (isLoading) return <div style={{ color: 'white', padding: '50px', textAlign: 'center' }}>로딩 중...</div>;

    const day1Items = tripData?.itineraries["Day 1"] || [];

    return (
        <div className="root-wrapper">
            <style>{`
                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 3px; }
                ::-webkit-scrollbar-thumb:hover { background: #a0aec0; }
                .root-wrapper { height: 100vh; min-height: 800px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; display: flex; flex-direction: column; overflow: hidden; }
                .main-container { width: 100%; max-width: 1800px; margin: 0 auto; height: 100%; display: grid; grid-template-columns: 2fr 1fr 1fr; grid-template-rows: 7fr 3fr; gap: 15px; }
                .map-card { grid-column: 1 / 2; grid-row: 1 / 3; height: 100%; }
                .detail-card { grid-column: 2 / 3; grid-row: 1 / 2; height: 100%; }
                .right-section { grid-column: 3 / 4; grid-row: 1 / 2; height: 100%; }
                @media (max-width: 1200px) {
                    .root-wrapper { height: auto; overflow-y: auto; }
                    .main-container { display: flex; flex-direction: column; height: auto; }
                    .map-card { height: 500px; flex: none; }
                    .detail-card { height: 300px; flex: none; }
                    .right-section { height: 300px; flex: none; }
                }
                .white-box { background: white; border-radius: 15px; padding: 15px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2); display: flex; flex-direction: column; overflow: hidden; }
                .rec-card:hover { transform: translateX(3px); border-color: #667eea; }
                .point-delete-btn { padding: 6px; background: transparent; border: none; border-radius: 4px; color: #cbd5e0; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
                .point-delete-btn:hover { color: #e53e3e; background: #fee; }
                .map-search-box { position: absolute; top: 15px; left: 15px; z-index: 100; background: white; padding: 8px 12px; border-radius: 25px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); display: flex; align-items: center; width: 280px; border: 1px solid #e2e8f0; transition: all 0.2s; }
                .map-search-box:focus-within { width: 320px; border-color: #667eea; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2); }
                .search-input { border: none; outline: none; flex: 1; font-size: 14px; margin-left: 8px; color: #2d3748; }
                .search-input::placeholder { color: #a0aec0; }
                .search-btn { background: transparent; border: none; cursor: pointer; padding: 4px; display: flex; align-items: center; color: #667eea; border-radius: 50%; }
                .search-btn:hover { background: #f7fafc; }
            `}</style>

            <div className="main-container">
                <div className="white-box map-card">
                    <div style={styles.cardHeader}>
                        <div style={styles.tripBadge}>편집 중</div>
                        <div style={styles.headerRow}>
                            <div style={styles.tripLocation}>
                                <MapIcon size={24} color="#667eea" />
                                <span style={{ fontSize: '20px' }}>{tripData?.trip_name || "로딩 중..."}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <button onClick={handleCopyCode} style={styles.shareCodeBtn} title="초대 코드 복사">
                                    <Share2 size={14} /><span>초대 코드: {tripData?.shareCode}</span>
                                </button>
                                <div style={styles.participantBadge}>
                                    <Users size={16} /><span>{Array.isArray(tripData?.participants) ? tripData?.participants.length : 1}명</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style={styles.mapContainer}>
                        <form onSubmit={handleSearch} className="map-search-box">
                            <Search size={18} color="#718096" />
                            <input type="text" className="search-input" placeholder="장소 검색" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} />
                            <button type="submit" className="search-btn"><Search size={16} /></button>
                        </form>
                        <div id="map" style={{ width: '100%', height: '100%' }}></div>
                        <div style={styles.mapOverlayHint}>지도를 클릭해 경로를 추가하세요 📍</div>
                    </div>
                </div>

                <div className="white-box detail-card">
                    <div style={styles.detailHeader}>
                        <h4 style={styles.detailTitleText}>📂 Day 1 일정</h4>
                        <button style={styles.saveButton} onClick={handleSave} title="저장 또는 업데이트">
                            <Save size={14} />
                            <span>{tripData && !tripData.isAiResult ? "업데이트" : "저장"}</span>
                        </button>
                    </div>
                    <div style={styles.scrollableList}>
                        {day1Items.length === 0 ? (
                            <div style={styles.emptyState}>장소가 없습니다.<br />지도를 클릭해보세요!</div>
                        ) : (
                            day1Items.map((point, idx) => (
                                <div key={idx} style={styles.detailItem}>
                                    <div style={styles.detailIndex}>{idx + 1}</div>
                                    <div style={{ ...styles.detailAddress, flex: 1 }}>{point.place_name}</div>
                                    <button className="point-delete-btn" onClick={(e) => { e.stopPropagation(); deletePoint("Day 1", point.item_id); }} title="삭제">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="white-box right-section">
                    <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}><MapPin size={24} color="#667eea" />추천 여행지</h2>
                    </div>
                    <div style={styles.scrollableList}>
                        {tripData?.alternatives?.map((recName, idx) => {
                            const isAdded = day1Items.some(p => p.place_name === recName);
                            return (
                                <div key={idx} className="rec-card" style={styles.recommendationCard}>
                                    <div style={styles.recInfo}><Info size={16} color="#667eea" /></div>
                                    <div style={styles.recContent}>
                                        <h4 style={styles.recTitle}>{recName}</h4>
                                        <p style={styles.recDescription}>AI 추천 장소</p>
                                    </div>
                                    <button onClick={() => toggleRecommendation(recName)} style={{ ...styles.actionButton, background: isAdded ? '#fff5f5' : '#f3f0ff', color: isAdded ? '#e53e3e' : '#667eea', border: isAdded ? '1px solid #feb2b2' : '1px solid #d6bcfa' }}>
                                        {isAdded ? <Minus size={12} /> : <Plus size={12} />}
                                        <span style={{ marginLeft: '4px' }}>{isAdded ? '빼기' : '담기'}</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
}

const styles: { [key: string]: CSSProperties } = {
    mapContainer: { flex: 1, width: '100%', position: 'relative', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0', minHeight: '400px' },
    scrollableList: { flex: 1, overflowY: 'auto', paddingRight: '5px', display: 'flex', flexDirection: 'column', gap: '8px' },
    cardHeader: { marginBottom: '10px' },
    tripBadge: { display: 'inline-block', background: '#667eea', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', marginBottom: '5px' },
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    tripLocation: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', fontWeight: '700', color: '#2d3748' },
    participantBadge: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#4a5568', background: '#f7fafc', padding: '4px 10px', borderRadius: '15px' },
    mapOverlayHint: { position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '8px 20px', borderRadius: '20px', fontSize: '14px', zIndex: 10, whiteSpace: 'nowrap' },
    detailHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '2px solid #f7fafc', paddingBottom: '6px' },
    detailTitleText: { margin: 0, color: '#2d3748', fontSize: '15px' },
    saveButton: { display: 'flex', alignItems: 'center', gap: '5px', background: '#667eea', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' },
    shareCodeBtn: { display: 'flex', alignItems: 'center', gap: '5px', background: '#f0f4ff', color: '#667eea', border: '1px solid #dbeafe', padding: '4px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' },
    detailItem: { display: 'flex', alignItems: 'center', gap: '10px', background: '#f7fafc', padding: '8px', borderRadius: '8px', fontSize: '13px' },
    detailIndex: { width: '20px', height: '20px', background: '#667eea', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 },
    detailAddress: { fontSize: '13px', color: '#4a5568' },
    emptyState: { textAlign: 'center', color: '#a0aec0', marginTop: '10px', fontSize: '13px', lineHeight: '1.6' },
    sectionHeader: { marginBottom: '15px', borderBottom: '1px solid #edf2f7', paddingBottom: '10px' },
    sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 },
    recommendationCard: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px', minHeight: 'auto', background: 'white' },
    recInfo: { color: '#667eea' },
    recContent: { flex: 1 },
    recTitle: { fontSize: '14px', fontWeight: '600', margin: '0 0 2px 0' },
    recDescription: { fontSize: '11px', color: '#718096', margin: 0 },
    actionButton: { display: 'flex', alignItems: 'center', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' },
};