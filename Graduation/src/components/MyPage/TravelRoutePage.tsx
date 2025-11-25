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
import { MapPin, Calendar, Info, Trash2, Map as MapIcon, Users, Plus, Minus, Edit2, Check, X } from "lucide-react";

// ... (데이터 타입 정의는 동일) ...
interface TripPoint { lat: number; lng: number; address: string; sourceId?: number; }
interface TripFolder { id: number; title: string; participants: number; points: TripPoint[]; }
interface Recommendation { id: number; title: string; description: string; lat: number; lng: number; }

export default function TravelRoutePage() {
    // ... (로직 부분은 기존과 100% 동일합니다) ...
    const mapRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]); 
    const polylineRef = useRef<any>(null);
    const geocoderRef = useRef<any>(null);
    const selectedIdRef = useRef<number | null>(null);
    const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
    const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
    const [editTitle, setEditTitle] = useState<string>("");

    useEffect(() => { selectedIdRef.current = selectedFolderId; }, [selectedFolderId]);

    const [travelFolders, setTravelFolders] = useState<TripFolder[]>([
        { id: 1, title: "첫 번째 여행", participants: 4, points: [] },
        { id: 2, title: "두 번째 여행", participants: 2, points: [] },
        { id: 3, title: "세 번째 여행", participants: 6, points: [] },
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

    const startEditing = (e: React.MouseEvent, folder: TripFolder) => {
        e.stopPropagation();
        setEditingFolderId(folder.id);
        setEditTitle(folder.title);
    };
    const saveTitle = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (editTitle.trim() === "") return;
        setTravelFolders(prev => prev.map(f => f.id === editingFolderId ? { ...f, title: editTitle } : f));
        setEditingFolderId(null);
    };
    const cancelEditing = (e: React.MouseEvent) => { e.stopPropagation(); setEditingFolderId(null); };
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && editTitle.trim() !== "") {
            setTravelFolders(prev => prev.map(f => f.id === editingFolderId ? { ...f, title: editTitle } : f));
            setEditingFolderId(null);
        }
    };
    const addFolder = () => {
        const nextId = travelFolders.length > 0 ? Math.max(...travelFolders.map(f => f.id)) + 1 : 1;
        const newFolder: TripFolder = { id: nextId, title: `새로운 여행 ${nextId}`, participants: 1, points: [] };
        setTravelFolders([...travelFolders, newFolder]);
        setSelectedFolderId(nextId);
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
    const clearFolder = (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        setTravelFolders(prev => prev.filter(f => f.id !== id));
        if (selectedFolderId === id) setSelectedFolderId(null);
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
                    window.kakao.maps.event.addListener(map, 'click', function(mouseEvent: any) {
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
            {/* ★ 중요: 반응형 CSS를 위한 Style 태그 */}
            <style>{`
                /* 기본 스타일 */
                * { box-sizing: border-box; }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 3px; }
                ::-webkit-scrollbar-thumb:hover { background: #a0aec0; }

                /* 반응형 레이아웃 설정 */
                .root-wrapper {
                    height: 100vh; /* 기본은 꽉 찬 화면 */
                    min-height: 800px; /* ★ 최소 높이 안전장치: 창이 너무 작으면 스크롤 생김 */
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 20px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden; /* 기본은 바깥 스크롤 숨김 */
                }

                .main-container {
                    width: 100%;
                    max-width: 1800px;
                    margin: 0 auto;
                    height: 100%;
                    display: grid;
                    grid-template-columns: 2fr 1fr 1fr; /* 가로 3단 */
                    grid-template-rows: 7.5fr 2.5fr;    /* 세로 2단 (위 75%, 아래 25%) */
                    gap: 15px;
                }

                /* PC 화면용 배치 */
                .map-card { grid-column: 1 / 2; grid-row: 1 / 2; }
                .detail-card { grid-column: 1 / 2; grid-row: 2 / 3; }
                .middle-section { grid-column: 2 / 3; grid-row: 1 / 2; height: 100%; } /* 지도 높이와 동일하게 */
                .right-section { grid-column: 3 / 4; grid-row: 1 / 2; height: 100%; }  /* 지도 높이와 동일하게 */

                /* ★ 태블릿/모바일 화면 (1200px 이하) 대응 */
                @media (max-width: 1200px) {
                    .root-wrapper {
                        height: auto; /* 높이 제한 해제 */
                        overflow-y: auto; /* 세로 스크롤 허용 */
                    }
                    .main-container {
                        display: flex;
                        flex-direction: column; /* 세로로 쌓기 */
                        height: auto;
                    }
                    
                    /* 세로 모드일 때 각 섹션의 높이 지정 */
                    .map-card { height: 500px; flex: none; }
                    .detail-card { height: 300px; flex: none; }
                    .middle-section { height: 400px; flex: none; }
                    .right-section { height: 400px; flex: none; }
                }

                /* 공통 컴포넌트 스타일 */
                .white-box {
                    background: white;
                    border-radius: 15px;
                    padding: 15px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }

                .folder-card:hover { transform: translateY(-2px); box-shadow: 0 3px 10px rgba(102, 126, 234, 0.1); }
                .rec-card:hover { transform: translateX(3px); border-color: #667eea; }
                
                .point-delete-btn { padding: 6px; background: transparent; border: none; border-radius: 4px; color: #cbd5e0; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
                .point-delete-btn:hover { color: #e53e3e; background: #fee; }
                
                .edit-icon-btn { opacity: 0; padding: 4px; border-radius: 4px; color: #a0aec0; cursor: pointer; transition: all 0.2s; }
                .folder-card:hover .edit-icon-btn { opacity: 1; }
                .edit-icon-btn:hover { background: #edf2f7; color: #667eea; }
            `}</style>

            <div className="main-container">
                
                {/* [1] 지도 카드 */}
                <div className="white-box map-card">
                    <div style={styles.cardHeader}>
                        {!selectedFolderId ? (
                            <div style={styles.tripLocation}>
                                <MapIcon size={24} color="#718096" />
                                <span style={{color: '#718096'}}>전체 지도</span>
                            </div>
                        ) : (
                            <>
                                <div style={styles.tripBadge}>편집 중</div>
                                <div style={styles.headerRow}>
                                    <div style={styles.tripLocation}>
                                        <MapIcon size={24} color="#667eea" />
                                        <span style={{fontSize:'20px'}}>{currentActiveFolder?.title}</span>
                                    </div>
                                    <div style={styles.participantBadge}>
                                        <Users size={16} />
                                        <span>{currentActiveFolder?.participants}명</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    
                    <div style={styles.mapContainer}>
                        <div id="map" style={{width: '100%', height: '100%'}}></div>
                        <div style={styles.mapOverlayHint}>
                            {!selectedFolderId 
                                ? "오른쪽에서 여행 폴더를 선택하세요 👉" 
                                : "지도를 클릭해 경로를 추가하세요 📍"}
                        </div>
                    </div>
                </div>

                {/* 다음 단계 삭제인걸로 알아서 주석처리함 */}
                {/* <div style={styles.nextButtonWrapper}>
                    <button className="next-btn" style={styles.nextButton}>
                        <span>다음 단계로</span>
                        <ChevronRight size={24} style={{ transition: 'transform 0.3s ease' }} />
                    </button>
                </div> */}
                {/* [2] 상세 경로 리스트 */}
                <div className="white-box detail-card">
                    <h4 style={styles.detailTitle}>
                        {selectedFolderId ? `📂 ${currentActiveFolder?.title} 경로` : "📂 선택된 여행 없음"}
                    </h4>
                    <div style={styles.scrollableList}>
                        {!selectedFolderId ? (
                            <div style={styles.emptyState}>여행 폴더를 선택하면<br/>여기에 경로가 표시됩니다.</div>
                        ) : currentActiveFolder?.points.length === 0 ? (
                            <div style={styles.emptyState}>
                                아직 추가된 장소가 없습니다.<br/>
                                지도를 클릭하거나 추천 여행지를 담아보세요!
                            </div>
                        ) : (
                            currentActiveFolder?.points.map((point, idx) => (
                                <div key={idx} style={styles.detailItem}>
                                    <div style={styles.detailIndex}>{idx + 1}</div>
                                    <div style={{...styles.detailAddress, flex: 1}}>{point.address}</div>
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

                {/* [3] 가운데: 폴더 리스트 */}
                <div className="white-box middle-section">
                    <div style={styles.sectionHeader}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px'}}>
                            <h2 style={styles.sectionTitle}>
                                <Calendar size={24} color="#667eea" />
                                나의 여행 폴더
                            </h2>
                            <button onClick={addFolder} style={styles.addTripButton}>
                                <Plus size={16} />
                                <span>여행 추가</span>
                            </button>
                        </div>
                        <p style={{color: '#718096', fontSize: '12px', margin: 0}}>
                            여행을 선택하여 경로를 계획하세요.
                        </p>
                    </div>
                    <div style={styles.scrollableList}>
                        {travelFolders.map((folder) => {
                            const isSelected = selectedFolderId === folder.id;
                            const isEditing = editingFolderId === folder.id;
                            const pointCount = folder.points.length;

                            return (
                                <div 
                                    key={folder.id} 
                                    className="folder-card" 
                                    onClick={() => !isEditing && setSelectedFolderId(folder.id)}
                                    style={{
                                        ...styles.folderCard,
                                        borderColor: isSelected ? '#667eea' : '#e2e8f0',
                                        background: isSelected ? '#eff6ff' : 'white',
                                        borderWidth: isSelected ? '2px' : '1px',
                                    }}
                                >
                                    <div style={{
                                        ...styles.folderIconBox,
                                        background: isSelected ? '#667eea' : '#cbd5e0'
                                    }}>
                                        <span style={{color: 'white', fontWeight: 'bold'}}>{folder.id}</span>
                                    </div>
                                    
                                    <div style={{flex: 1}}>
                                        {isEditing ? (
                                            <div style={{display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px'}}>
                                                <input 
                                                    type="text" 
                                                    value={editTitle}
                                                    onChange={(e) => setEditTitle(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onKeyDown={handleKeyDown}
                                                    autoFocus
                                                    style={styles.editInput}
                                                />
                                                <button onClick={saveTitle} style={styles.saveBtn}><Check size={14} /></button>
                                                <button onClick={cancelEditing} style={styles.cancelBtn}><X size={14} /></button>
                                            </div>
                                        ) : (
                                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                                <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
                                                    <h3 style={styles.folderTitle}>{folder.title}</h3>
                                                    <div className="edit-icon-btn" onClick={(e) => startEditing(e, folder)}>
                                                        <Edit2 size={12} />
                                                    </div>
                                                </div>
                                                {isSelected && !isEditing && <span style={styles.activeBadge}>선택됨</span>}
                                            </div>
                                        )}
                                        
                                        <div style={styles.folderDesc}>
                                            <span>{pointCount === 0 ? "경로 없음" : `${pointCount}개 장소`}</span>
                                            <span style={{margin: '0 5px', color: '#cbd5e0'}}>|</span>
                                            <div style={{display: 'flex', alignItems: 'center'}}>
                                                <Users size={11} style={{marginRight: '3px', marginBottom: '-1px'}}/>
                                                <span>{folder.participants}명</span>
                                            </div>
                                        </div>
                                    </div>

                                    {!isEditing && (
                                        <button 
                                            className="clear-btn"
                                            onClick={(e) => clearFolder(e, folder.id)}
                                            style={styles.clearButton}
                                            title="폴더 삭제"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* [4] 오른쪽: 추천 여행지 */}
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
                                        <span style={{marginLeft: '4px'}}>{isAdded ? '빼기' : '담기'}</span>
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

// 인라인 스타일은 컴포넌트 내부에서 처리하기 힘든 동적이지 않은 부분만 남김
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
    detailTitle: { margin: '0 0 8px 0', color: '#2d3748', fontSize: '15px', borderBottom: '2px solid #f7fafc', paddingBottom: '6px' },
    detailItem: { display: 'flex', alignItems: 'center', gap: '10px', background: '#f7fafc', padding: '8px', borderRadius: '8px', fontSize: '13px' },
    detailIndex: { width: '20px', height: '20px', background: '#667eea', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', flexShrink: 0 },
    detailAddress: { fontSize: '13px', color: '#4a5568' },
    emptyState: { textAlign: 'center' as const, color: '#a0aec0', marginTop: '10px', fontSize: '13px', lineHeight: '1.6' },
    sectionHeader: { marginBottom: '15px', borderBottom: '1px solid #edf2f7', paddingBottom: '10px' },
    sectionTitle: { fontSize: '18px', fontWeight: '700', color: '#2d3748', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 },
    addTripButton: { display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' },
    folderCard: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px', transition: 'all 0.2s ease', cursor: 'pointer', minHeight: 'auto' },
    folderIconBox: { width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0 },
    folderTitle: { fontSize: '14px', fontWeight: '700', color: '#2d3748', margin: '0 0 2px 0' },
    folderDesc: { fontSize: '11px', color: '#718096', margin: 0, display: 'flex', alignItems: 'center' },
    activeBadge: { fontSize: '10px', color: '#667eea', background: '#eff6ff', padding: '2px 6px', borderRadius: '6px', fontWeight: '600' },
    clearButton: { padding: '6px', background: '#f7fafc', border: 'none', borderRadius: '6px', color: '#a0aec0', cursor: 'pointer', transition: 'all 0.2s' },
    editInput: { flex: 1, padding: '4px 8px', borderRadius: '4px', border: '1px solid #667eea', fontSize: '14px', outline: 'none' },
    saveBtn: { background: '#667eea', color: 'white', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer', marginLeft: '4px' },
    cancelBtn: { background: '#e2e8f0', color: '#4a5568', border: 'none', borderRadius: '4px', padding: '4px', cursor: 'pointer', marginLeft: '4px' },
    recommendationCard: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px', minHeight: 'auto', background: 'white' },
    recInfo: { color: '#667eea' },
    recContent: { flex: 1 },
    recTitle: { fontSize: '14px', fontWeight: '600', margin: '0 0 2px 0' },
    recDescription: { fontSize: '11px', color: '#718096', margin: 0 },
    actionButton: { display: 'flex', alignItems: 'center', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' as const },
} as const;