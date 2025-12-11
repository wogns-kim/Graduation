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

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Info, Trash2, Map as MapIcon, Users, Plus, Minus, FileText, Search, Save, Share2 } from "lucide-react";

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

interface TripLog {
    action_id: number;
    action_type: string;
    user_name: string;
    description: string;
    created_at: string;
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
    const [logs, setLogs] = useState<TripLog[]>([]);

    // API URL
    const API_BASE = import.meta.env.VITE_BACKEND_API_URL || "http://127.0.0.1:8000/api";

    // --- [1] 데이터 로딩 ---
    useEffect(() => {
        const fetchTripDetails = async () => {
            const token = localStorage.getItem("access_token");

            try {
                if (cityId === 'ai-result') {
                    // [A] AI 추천 모드
                    const startDate = searchParams.get('start');
                    const endDate = searchParams.get('end');
                    const response = await fetch(`${API_BASE}/recommendations?start_date=${startDate}&end_date=${endDate}`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const firstCourse = data[0];
                        setTripData({
                            trip_name: firstCourse.theme || "AI 추천 여행 코스",
                            participants: [],
                            itineraries: firstCourse.route,
                            alternatives: firstCourse.alternatives || [],
                            isAiResult: true,
                            shareCode: Math.random().toString(36).substring(2, 8).toUpperCase()
                        });
                    } else { throw new Error("AI Load Failed"); }
                } else {
                    // [B] DB 조회 모드
                    const response = await fetch(`${API_BASE}/trips/${cityId}/details`, {
                        headers: { "Authorization": `Bearer ${token}` }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const groupedItinerary: Record<string, ItineraryItem[]> = {};

                        const firstKey = Object.keys(data.itineraries)[0];
                        const myItems = Array.isArray(data.itineraries) ? data.itineraries : data.itineraries[firstKey];

                        if (Array.isArray(myItems)) {
                            groupedItinerary["Day 1"] = myItems;
                        } else {
                            Object.assign(groupedItinerary, myItems || {});
                        }

                        setTripData({
                            trip_id: data.trip_id,
                            trip_name: data.trip_name,
                            participants: data.participants || [],
                            itineraries: groupedItinerary,
                            alternatives: data.alternatives || ["북촌 한옥마을", "경복궁"],
                            isAiResult: false,
                            shareCode: data.shareable_link_id || "CODE"
                        });

                        const historyRes = await fetch(`${API_BASE}/trips/${cityId}/history`, {
                            headers: { "Authorization": `Bearer ${token}` }
                        });
                        if (historyRes.ok) setLogs(await historyRes.json());
                    }
                }
            } catch (error) {
                console.error("데이터 로딩 실패:", error);
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
    }, [cityId, searchParams, API_BASE]);


    // --- [2] 기능 핸들러 (팝업 제거됨) ---

    // 1. 저장하기
    const handleSave = async () => {
        if (!tripData) return;
        const token = localStorage.getItem("access_token");
        try {
            const response = await fetch(`${API_BASE}/trips`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: tripData.trip_name,
                    start_date: searchParams.get('start'),
                    end_date: searchParams.get('end'),
                    itineraries: tripData.itineraries
                }),
            });
            if (response.ok) {
                const result = await response.json();
                alert("저장되었습니다!");
                navigate(`/plan/${result.trip_id}`);
            } else { alert("저장 실패"); }
        } catch (error) { alert("서버 연결 실패"); }
    };

    // 2. 지도 클릭 추가 (팝업 제거)
    const handleMapClick = async (lat: number, lng: number) => {
        geocoderRef.current.coord2RegionCode(lng, lat, async (result: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
                const addressName = result[0].address_name;

                // [삭제됨] if (!confirm(...)) return;  <- 이 줄을 삭제했습니다.

                // AI 결과 화면이면 바로 화면 갱신
                if (cityId === 'ai-result' || tripData?.isAiResult) {
                    const newPoint = {
                        item_id: Date.now(),
                        place_name: addressName,
                        order_in_day: 99,
                        lat, lng, address: addressName
                    };
                    setTripData(prev => {
                        if (!prev) return null;
                        const list = prev.itineraries["Day 1"] || [];
                        return { ...prev, itineraries: { ...prev.itineraries, "Day 1": [...list, newPoint] } };
                    });
                    return;
                }

                // 저장된 여행이면 서버 전송
                const token = localStorage.getItem("access_token");
                try {
                    const response = await fetch(`${API_BASE}/trips/${cityId}/items`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                        body: JSON.stringify({ place_name: addressName, visit_date: "2025-01-01", day_number: 1, lat, lng }),
                    });
                    if (response.ok) {
                        const newPoint = { item_id: Date.now(), place_name: addressName, order_in_day: 99, lat, lng, address: addressName };
                        setTripData(prev => {
                            if (!prev) return null;
                            const list = prev.itineraries["Day 1"] || [];
                            return { ...prev, itineraries: { ...prev.itineraries, "Day 1": [...list, newPoint] } };
                        });
                    } else { alert("추가 실패"); }
                } catch (e) { alert("서버 오류"); }
            }
        });
    };

    // 3. 추천 장소 추가/삭제 (toggle) 로직 수정
    const toggleRecommendation = async (recName: string) => {

        // 1. 현재 Day 1 목록을 가져와서 해당 장소가 이미 포함되어 있는지 확인
        const currentList = tripData?.itineraries["Day 1"] || [];
        const isAdded = currentList.some(p => p.place_name === recName);

        // 2. AI 모드일 경우 (서버 통신 차단)
        if (cityId === 'ai-result' || tripData?.isAiResult) {

            if (isAdded) {
                // 삭제 로직 (프론트엔드에서 필터링)
                setTripData(prev => {
                    if (!prev) return null;
                    const newList = currentList.filter(p => p.place_name !== recName);
                    return { ...prev, itineraries: { ...prev.itineraries, "Day 1": newList } };
                });
                return;
            }

            // 추가 로직 (프론트엔드에 추가)
            const newPoint = { item_id: Date.now(), place_name: recName, order_in_day: currentList.length + 1, address: recName };
            setTripData(prev => {
                if (!prev) return null;
                return { ...prev, itineraries: { ...prev.itineraries, "Day 1": [...currentList, newPoint] } };
            });
            return;
        }

        // 3. DB 저장된 여행일 경우 (서버 통신)
        const token = localStorage.getItem("access_token");

        if (isAdded) {
            // 삭제 로직 (서버에 DELETE 요청)
            // 주의: 삭제 시에는 item_id가 필요합니다. 현재 로직에서는 item_id가 없으므로 알림 처리만 함.
            alert("DB 저장된 항목을 빼려면 휴지통 버튼을 사용해주세요.");
            return;
        }

        // 추가 로직 (서버에 POST 요청)
        try {
            const response = await fetch(`${API_BASE}/trips/${cityId}/items`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ place_name: recName, visit_date: "2025-01-01", day_number: 1 }),
            });
            if (response.ok) {
                // UI에 추가
                setTripData(prev => {
                    if (!prev) return null;
                    const newPoint = { item_id: Date.now(), place_name: recName, order_in_day: currentList.length + 1, address: recName };
                    return { ...prev, itineraries: { ...prev.itineraries, "Day 1": [...currentList, newPoint] } };
                });
            } else { alert("추가 실패"); }
        } catch (e) { alert("서버 오류"); }
    };

    // 4. 삭제 (팝업 제거)
    const deletePoint = async (day: string, index: number, itemId: number) => {
        // [삭제됨] if (!confirm("정말 삭제하시겠습니까?")) return;

        // AI 모드 화면 갱신
        if (cityId === 'ai-result' || tripData?.isAiResult) {
            setTripData(prev => {
                if (!prev) return null;
                const currentList = prev.itineraries[day] || [];
                const newList = currentList.filter((_, i) => i !== index);
                return { ...prev, itineraries: { ...prev.itineraries, [day]: newList } };
            });
            return;
        }

        const token = localStorage.getItem("access_token");
        try {
            const response = await fetch(`${API_BASE}/trips/${cityId}/items/${itemId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                setTripData(prev => {
                    if (!prev) return null;
                    const currentList = prev.itineraries[day] || [];
                    const newList = currentList.filter((_, i) => i !== index);
                    return { ...prev, itineraries: { ...prev.itineraries, [day]: newList } };
                });
            } else { alert("삭제 실패"); }
        } catch (error) { alert("서버 연결 실패"); }
    };

    // 기타 헬퍼
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
        const loadKakaoMap = () => {
            if (!window.kakao || !window.kakao.maps) return;
            window.kakao.maps.load(() => {
                const container = document.getElementById('map');
                if (!container) return;

                if (!mapRef.current) {
                    const options = { center: new window.kakao.maps.LatLng(37.5665, 126.9780), level: 7 };
                    mapRef.current = new window.kakao.maps.Map(container, options);
                    psRef.current = new window.kakao.maps.services.Places();
                    geocoderRef.current = new window.kakao.maps.services.Geocoder();

                    window.kakao.maps.event.addListener(mapRef.current, 'click', function (mouseEvent: any) {
                        handleMapClick(mouseEvent.latLng.getLat(), mouseEvent.latLng.getLng());
                    });
                }

                if (tripData && tripData.itineraries) {
                    markersRef.current.forEach(m => m.setMap(null));
                    markersRef.current = [];
                    if (polylineRef.current) polylineRef.current.setMap(null);

                    const points = tripData.itineraries["Day 1"] || [];
                    if (points.length === 0) return;

                    const path: any[] = [];
                    const drawMap = async () => {
                        for (let i = 0; i < points.length; i++) {
                            const p = points[i];
                            let lat = p.lat;
                            let lng = p.lng;

                            if (!lat || !lng) {
                                await new Promise((resolve) => {
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
                    drawMap();
                }
            });
        };

        if (window.kakao && window.kakao.maps) {
            loadKakaoMap();
        } else {
            const script = document.createElement("script");
            script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoAppKey}&libraries=services&autoload=false`;
            script.async = false;
            script.onload = loadKakaoMap;
            document.head.appendChild(script);
        }
    }, [tripData]);

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
                .log-section { grid-column: 2 / 4; grid-row: 2 / 3; height: 100%; }
                @media (max-width: 1200px) {
                    .root-wrapper { height: auto; overflow-y: auto; }
                    .main-container { display: flex; flex-direction: column; height: auto; }
                    .map-card { height: 500px; flex: none; }
                    .detail-card { height: 300px; flex: none; }
                    .right-section { height: 300px; flex: none; }
                    .log-section { height: 200px; flex: none; }
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
                        <button style={styles.saveButton} onClick={handleSave} title="저장">
                            <Save size={14} /><span>저장</span>
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
                                    <button className="point-delete-btn" onClick={(e) => { e.stopPropagation(); deletePoint("Day 1", idx, point.item_id); }} title="삭제">
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

                <div className="white-box log-section">
                    <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}><FileText size={24} color="#667eea" />로그 기록</h2>
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {logs.length === 0 ? <div style={{ textAlign: 'center', color: '#a0aec0', padding: '20px', fontSize: '13px' }}>기록 없음</div> : logs.map(log => (
                            <div key={log.action_id} style={{ display: 'flex', gap: '10px', padding: '5px 0', borderBottom: '1px solid #f0f0f0', fontSize: '13px' }}>
                                <span style={{ color: '#aaa' }}>{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                <span><b>{log.user_name}</b>님이 {log.description}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
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