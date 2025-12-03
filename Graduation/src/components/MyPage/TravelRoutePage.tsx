declare global {
    interface Window {
        kakao: any;
    }
    interface ImportMetaEnv {
        readonly VITE_KAKAO_JAVASCRIPT_KEY: string;
    }
    interface ImportMeta {
        readonly env: ImportMetaEnv;
    }
}

export { };

import React, { useState, useEffect, useRef } from "react";
// ★ [수정] Share2 아이콘 추가됨
import { MapPin, Info, Trash2, Map as MapIcon, Users, Plus, Minus, FileText, Search, Save, Share2 } from "lucide-react";

// ... (데이터 타입 정의) ...
interface TripPoint { lat: number; lng: number; address: string; sourceId?: number; }
interface TripFolder { id: number; title: string; participants: number; points: TripPoint[]; }
interface Recommendation { id: number; title: string; description: string; lat: number; lng: number; }

export default function TravelRoutePage() {
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const polylineRef = useRef<any>(null);
    const geocoderRef = useRef<any>(null);
    const psRef = useRef<any>(null);
    const selectedIdRef = useRef<number | null>(null);

    const [selectedFolderId] = useState<number | null>(1);
    const [searchKeyword, setSearchKeyword] = useState("");

    // ★ [추가] 무작위 공유 코드 생성 (컴포넌트 로드 시 1회 생성)
    const [shareCode] = useState(Math.random().toString(36).substring(2, 8).toUpperCase());

    useEffect(() => { selectedIdRef.current = selectedFolderId; }, [selectedFolderId]);

    const [travelFolders, setTravelFolders] = useState<TripFolder[]>([
        { id: 1, title: "첫 번째 여행", participants: 4, points: [] },
    ]);

    const [recommendations] = useState<Recommendation[]>([
        { id: 101, title: "북촌 한옥마을", description: "전통 가옥이 보존된 마을", lat: 37.582604, lng: 126.983697 },
        { id: 102, title: "인사동", description: "전통 문화의 거리", lat: 37.574388, lng: 126.989326 },
        { id: 103, title: "홍대 거리", description: "젊음의 문화 거리", lat: 37.557527, lng: 126.924466 },
        { id: 104, title: "광장시장", description: "먹거리의 천국", lat: 37.570151, lng: 126.999385 },
        { id: 105, title: "남산타워", description: "서울의 랜드마크", lat: 37.551169, lng: 126.988227 },
        { id: 106, title: "경복궁", description: "조선의 법궁", lat: 37.579617, lng: 126.977041 },
        { id: 107, title: "충청남도 당진시 석문면", description: "서해안 드라이브 코스", lat: 37.003, lng: 126.532 },
        { id: 108, title: "충청남도 아산시 송악면", description: "아름다운 자연 경관", lat: 36.733, lng: 127.033 },
    ]);

    // ★ [추가] 공유 코드 복사 핸들러
    const handleCopyCode = () => {
        navigator.clipboard.writeText(shareCode);
        alert(`초대 코드 [${shareCode}]가 복사되었습니다!\n친구에게 공유해서 같이 여행을 계획해보세요. ✈️`);
    };

    const handleSearch = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!searchKeyword.trim() || !psRef.current) return;

        psRef.current.keywordSearch(searchKeyword, (data: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
                const place = data[0];
                const moveLatLon = new window.kakao.maps.LatLng(place.y, place.x);
                mapRef.current.panTo(moveLatLon);
            } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
                alert('검색 결과가 존재하지 않습니다.');
            } else if (status === window.kakao.maps.services.Status.ERROR) {
                alert('검색 중 오류가 발생했습니다.');
            }
        });
    };

    const handleSave = () => {
        const currentFolder = travelFolders.find(f => f.id === selectedFolderId);
        if (!currentFolder) return;
        console.log("저장할 데이터:", currentFolder);
        alert(`'${currentFolder.title}' 경로가 저장되었습니다! (총 ${currentFolder.points.length}개 장소)`);
    };

    const handleMapClick = (lat: number, lng: number) => {
        const currentId = selectedIdRef.current;
        if (!currentId || !geocoderRef.current) return;
        geocoderRef.current.coord2RegionCode(lng, lat, (result: any, status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
                const addressName = result[0].address_name;
                const newPoint: TripPoint = { lat, lng, address: addressName };
                setTravelFolders(prev => prev.map(folder => {
                    if (folder.id === currentId) return { ...folder, points: [...folder.points, newPoint] };
                    return folder;
                }));
            }
        });
    };
    const toggleRecommendation = (rec: Recommendation) => {
        if (!selectedFolderId) { alert("먼저 여행 폴더를 선택해주세요! 👆"); return; }
        setTravelFolders(prev => prev.map(folder => {
            if (folder.id === selectedFolderId) {
                const exists = folder.points.some(p => p.sourceId === rec.id);
                if (exists) return { ...folder, points: folder.points.filter(p => p.sourceId !== rec.id) };
                else {
                    const newPoint: TripPoint = { lat: rec.lat, lng: rec.lng, address: rec.title, sourceId: rec.id };
                    return { ...folder, points: [...folder.points, newPoint] };
                }
            }
            return folder;
        }));
    };
    const deletePoint = (folderId: number, pointIndex: number) => {
        setTravelFolders(prev => prev.map(folder => {
            if (folder.id === folderId) {
                const newPoints = folder.points.filter((_, index) => index !== pointIndex);
                return { ...folder, points: newPoints };
            }
            return folder;
        }));
    };

    useEffect(() => {
        if (!mapRef.current || !window.kakao) return;
        markersRef.current.forEach(m => m.setMap(null));
        markersRef.current = [];
        if (polylineRef.current) polylineRef.current.setMap(null);
        if (!selectedFolderId) return;
        const currentFolder = travelFolders.find(f => f.id === selectedFolderId);
        if (!currentFolder || currentFolder.points.length === 0) return;
        const path: any[] = [];
        currentFolder.points.forEach((point, index) => {
            const position = new window.kakao.maps.LatLng(point.lat, point.lng);
            path.push(position);
            const content = `
                <div style="position: relative; width: 0; height: 0;">
                    <div style="position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); background: white; padding: 4px 10px; border-radius: 15px; border: 1px solid #667eea; font-size: 12px; font-weight: bold; color: #667eea; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.2); pointer-events: none;">${point.address}</div>
                    <div style="position: absolute; top: 0; left: 0; transform: translate(-50%, -50%); width: 24px; height: 24px; background: #667eea; color: white; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; font-size: 14px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">${index + 1}</div>
                </div>`;
            const overlay = new window.kakao.maps.CustomOverlay({ position: position, content: content, map: mapRef.current });
            markersRef.current.push(overlay);
        });
        if (path.length > 1) {
            const polyline = new window.kakao.maps.Polyline({ path: path, strokeWeight: 5, strokeColor: '#667eea', strokeOpacity: 0.8, strokeStyle: 'solid' });
            polyline.setMap(mapRef.current);
            polylineRef.current = polyline;
        }
        const lastPoint = path[path.length - 1];
        mapRef.current.panTo(lastPoint);
    }, [travelFolders, selectedFolderId]);

    useEffect(() => {
        const kakaoAppKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;
        if (!kakaoAppKey) return;
        const initializeMap = () => {
            if (window.kakao && window.kakao.maps) {
                window.kakao.maps.load(() => {
                    const mapContainer = document.getElementById('map');
                    if (!mapContainer) return;
                    const mapOption = { center: new window.kakao.maps.LatLng(37.566826, 126.9786567), level: 7 };
                    const map = new window.kakao.maps.Map(mapContainer, mapOption);
                    mapRef.current = map;
                    geocoderRef.current = new window.kakao.maps.services.Geocoder();
                    psRef.current = new window.kakao.maps.services.Places();

                    window.kakao.maps.event.addListener(map, 'click', function (mouseEvent: any) {
                        handleMapClick(mouseEvent.latLng.getLat(), mouseEvent.latLng.getLng());
                    });
                });
            }
        };
        const existingScript = document.querySelector(`script[src*="dapi.kakao.com/v2/maps/sdk.js"]`);
        if (existingScript) {
            if (window.kakao && window.kakao.maps) initializeMap();
            else existingScript.addEventListener("load", initializeMap);
        } else {
            const script = document.createElement("script");
            script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoAppKey}&libraries=services&autoload=false`;
            script.async = false;
            script.onload = () => setTimeout(initializeMap, 100);
            document.head.appendChild(script);
        }
    }, []);

    const currentActiveFolder = travelFolders.find(f => f.id === selectedFolderId);

    return (
        <div className="root-wrapper">
            <style>{`
                /* 기본 스타일 */
                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 3px; }
                ::-webkit-scrollbar-thumb:hover { background: #a0aec0; }

                .root-wrapper {
                    height: 100vh;
                    min-height: 800px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .main-container {
                    width: 100%;
                    max-width: 1800px;
                    margin: 0 auto;
                    height: 100%;
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr; 
                    grid-template-rows: 7fr 3fr; 
                    gap: 15px;
                }

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

                .white-box {
                    background: white;
                    border-radius: 15px;
                    padding: 15px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .rec-card:hover { transform: translateX(3px); border-color: #667eea; }
                .point-delete-btn { padding: 6px; background: transparent; border: none; border-radius: 4px; color: #cbd5e0; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
                .point-delete-btn:hover { color: #e53e3e; background: #fee; }

                /* 검색창 스타일 */
                .map-search-box {
                    position: absolute;
                    top: 15px;
                    left: 15px;
                    z-index: 100;
                    background: white;
                    padding: 8px 12px;
                    border-radius: 25px;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    width: 280px;
                    border: 1px solid #e2e8f0;
                    transition: all 0.2s;
                }
                .map-search-box:focus-within {
                    width: 320px;
                    border-color: #667eea;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.2);
                }
                .search-input {
                    border: none;
                    outline: none;
                    flex: 1;
                    font-size: 14px;
                    margin-left: 8px;
                    color: #2d3748;
                }
                .search-input::placeholder { color: #a0aec0; }
                .search-btn {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    display: flex;
                    align-items: center;
                    color: #667eea;
                    border-radius: 50%;
                }
                .search-btn:hover { background: #f7fafc; }
            `}</style>

            <div className="main-container">

                {/* [1] 지도 카드 */}
                <div className="white-box map-card">
                    <div style={styles.cardHeader}>
                        <div style={styles.tripBadge}>편집 중</div>
                        
                        {/* 헤더 내용을 가로로 배치 */}
                        <div style={styles.headerRow}>
                            {/* 왼쪽: 제목 */}
                            <div style={styles.tripLocation}>
                                <MapIcon size={24} color="#667eea" />
                                <span style={{ fontSize: '20px' }}>{currentActiveFolder?.title}</span>
                            </div>

                            {/* 오른쪽: 공유 코드 + 참여자 수 */}
                            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                                
                                {/* ★ [추가] 공유 코드 버튼 */}
                                <button 
                                    onClick={handleCopyCode} 
                                    style={styles.shareCodeBtn}
                                    title="클릭하여 초대 코드 복사"
                                >
                                    <Share2 size={14} />
                                    <span>초대 코드: {shareCode}</span>
                                </button>

                                <div style={styles.participantBadge}>
                                    <Users size={16} />
                                    <span>{currentActiveFolder?.participants}명</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style={styles.mapContainer}>
                        {/* 지도 위 검색창 */}
                        <form onSubmit={handleSearch} className="map-search-box">
                            <Search size={18} color="#718096" />
                            <input
                                type="text"
                                className="search-input"
                                placeholder="장소 검색 (예: 제주공항)"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                            />
                            <button type="submit" className="search-btn">
                                <Search size={16} />
                            </button>
                        </form>

                        <div id="map" style={{ width: '100%', height: '100%' }}></div>
                        <div style={styles.mapOverlayHint}>
                            지도를 클릭해 경로를 추가하세요 📍
                        </div>
                    </div>
                </div>

                {/* [2] 상세 경로 리스트 */}
                <div className="white-box detail-card">
                    <div style={styles.detailHeader}>
                        <h4 style={styles.detailTitleText}>
                            {selectedFolderId ? `📂 ${currentActiveFolder?.title} 경로` : "📂 선택된 여행 없음"}
                        </h4>
                        {selectedFolderId && (
                            <button 
                                style={styles.saveButton} 
                                onClick={handleSave}
                                title="여행 경로 저장하기"
                            >
                                <Save size={14} />
                                <span>저장</span>
                            </button>
                        )}
                    </div>
                    
                    <div style={styles.scrollableList}>
                        {!selectedFolderId ? (
                            <div style={styles.emptyState}>오류: 선택된 여행 폴더가 없습니다.</div>
                        ) : currentActiveFolder?.points.length === 0 ? (
                            <div style={styles.emptyState}>
                                아직 추가된 장소가 없습니다.<br />
                                지도를 클릭하거나 추천 여행지를 담아보세요!
                            </div>
                        ) : (
                            currentActiveFolder?.points.map((point, idx) => (
                                <div key={idx} style={styles.detailItem}>
                                    <div style={styles.detailIndex}>{idx + 1}</div>
                                    <div style={{ ...styles.detailAddress, flex: 1 }}>{point.address}</div>
                                    <button
                                        className="point-delete-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (selectedFolderId) {
                                                deletePoint(selectedFolderId, idx);
                                            }
                                        }}
                                        title="삭제"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* [3] 추천 여행지 */}
                <div className="white-box right-section">
                    <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}>
                            <MapPin size={24} color="#667eea" />
                            추천 여행지
                        </h2>
                    </div>
                    <div style={styles.scrollableList}>
                        {recommendations.map((rec) => {
                            const isAdded = currentActiveFolder?.points.some(p => p.sourceId === rec.id);

                            return (
                                <div key={rec.id} className="rec-card" style={styles.recommendationCard}>
                                    <div style={styles.recInfo}><Info size={16} color="#667eea" /></div>
                                    <div style={styles.recContent}>
                                        <h4 style={styles.recTitle}>{rec.title}</h4>
                                        <p style={styles.recDescription}>{rec.description}</p>
                                    </div>
                                    <button
                                        onClick={() => toggleRecommendation(rec)}
                                        style={{
                                            ...styles.actionButton,
                                            background: isAdded ? '#fff5f5' : '#f3f0ff',
                                            color: isAdded ? '#e53e3e' : '#667eea',
                                            border: isAdded ? '1px solid #feb2b2' : '1px solid #d6bcfa'
                                        }}
                                    >
                                        {isAdded ? <Minus size={12} /> : <Plus size={12} />}
                                        <span style={{ marginLeft: '4px' }}>{isAdded ? '빼기' : '담기'}</span>
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* [4] 로그 기록 공간 */}
                <div className="white-box log-section">
                    <div style={styles.sectionHeader}>
                        <h2 style={styles.sectionTitle}>
                            <FileText size={24} color="#667eea" />
                            로그 기록
                        </h2>
                    </div>
                    <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#a0aec0',
                        fontSize: '13px',
                        background: '#f7fafc',
                        borderRadius: '10px',
                        border: '1px dashed #cbd5e0'
                    }}>
                        여기에 로그 기록 UI가 추가될 예정입니다.
                    </div>
                </div>

            </div>
        </div>
    );
}

const styles = {
    mapContainer: {
        flex: 1,
        width: '100%',
        position: 'relative' as const,
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
    },
    scrollableList: {
        flex: 1,
        overflowY: 'auto' as const,
        paddingRight: '5px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '8px'
    },
    cardHeader: { marginBottom: '10px' },
    tripBadge: { display: 'inline-block', background: '#667eea', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', marginBottom: '5px' },
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    tripLocation: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '20px', fontWeight: '700', color: '#2d3748' },
    participantBadge: { display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#4a5568', background: '#f7fafc', padding: '4px 10px', borderRadius: '15px' },
    mapOverlayHint: { position: 'absolute' as const, bottom: '20px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)', color: 'white', padding: '8px 20px', borderRadius: '20px', fontSize: '14px', zIndex: 10, whiteSpace: 'nowrap' as const },
    
    // 상세 경로 헤더
    detailHeader: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '8px',
        borderBottom: '2px solid #f7fafc', 
        paddingBottom: '6px' 
    },
    detailTitleText: { margin: 0, color: '#2d3748', fontSize: '15px' },
    // 저장 버튼
    saveButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        background: '#667eea',
        color: 'white',
        border: 'none',
        padding: '5px 12px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'background 0.2s',
    },
    // ★ [추가] 공유 코드 버튼 스타일
    shareCodeBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        background: '#f0f4ff', // 연한 파란색 배경
        color: '#667eea',
        border: '1px solid #dbeafe',
        padding: '4px 10px',
        borderRadius: '15px',
        fontSize: '12px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'all 0.2s',
        whiteSpace: 'nowrap' as const,
    },

    detailItem: { display: 'flex', alignItems: 'center', gap: '10px', background: '#f7fafc', padding: '8px', borderRadius: '8px', fontSize: '13px' },
    detailIndex: { width: '20px', height: '20px', background: '#667eea', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 },
    detailAddress: { fontSize: '13px', color: '#4a5568' },
    emptyState: { textAlign: 'center' as const, color: '#a0aec0', marginTop: '10px', fontSize: '13px', lineHeight: '1.6' },
    sectionHeader: { marginBottom: '15px', borderBottom: '1px solid #edf2f7', paddingBottom: '10px' },
    sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 },
    recommendationCard: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px', minHeight: 'auto', background: 'white' },
    recInfo: { color: '#667eea' },
    recContent: { flex: 1 },
    recTitle: { fontSize: '14px', fontWeight: '600', margin: '0 0 2px 0' },
    recDescription: { fontSize: '11px', color: '#718096', margin: 0 },
    actionButton: { display: 'flex', alignItems: 'center', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' as const },
} as const;