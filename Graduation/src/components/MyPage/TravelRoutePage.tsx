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


// 1. useEffect를 React에서 import 합니다.
import React, { useState, useEffect } from "react";
import { MapPin, Calendar, ChevronRight, Info, X } from "lucide-react";

export default function TravelRoutePage() {
    const [routes] = useState([
        { id: 1, title: "경복궁", description: "조선시대의 아름다운 궁궐을 탐험하세요" },
        { id: 2, title: "남산타워", description: "서울의 전경을 한눈에 볼 수 있는 랜드마크" },
        { id: 3, title: "명동 거리", description: "쇼핑과 맛집이 가득한 번화가" },
        { id: 4, title: "한강 공원", description: "자연과 함께하는 여유로운 시간" },
    ]);

    const [recommendations] = useState([
        { id: 1, title: "북촌 한옥마을", description: "전통 가옥이 보존된 아름다운 마을" },
        { id: 2, title: "인사동", description: "전통 문화와 예술이 살아있는 거리" },
        { id: 3, title: "홍대 거리", description: "젊음과 예술이 넘치는 문화의 거리" },
        { id: 4, title: "광장시장", description: "전통 먹거리의 천국" },
        { id: 5, title: "동대문 디자인 플라자", description: "현대적 건축의 아름다움" },
        { id: 6, title: "청계천", description: "도심 속 자연을 만나는 산책로" },
    ]);

    // 3. 맵을 로드하고 초기화하는 useEffect 훅
    useEffect(() => {
        // .env 파일에서 카카오 API 키 가져오기
        const kakaoAppKey = import.meta.env.VITE_KAKAO_JAVASCRIPT_KEY;

        if (!kakaoAppKey) {
            console.error("❌ 카카오 지도 API 키를 찾을 수 없습니다!");
            console.log("💡 .env 파일에 VITE_KAKAO_JAVASCRIPT_KEY=your_key 가 있는지 확인하세요");
            console.log("💡 개발 서버를 재시작해주세요 (npm run dev)");
            return;
        }
        
        console.log("✅ 카카오 API 키 로드 성공");

        // 맵 초기화 함수
        const initializeMap = () => {
            console.log("🗺️ 맵 초기화 시도...");
            
            if (window.kakao && window.kakao.maps) {
                console.log("✅ 카카오 맵 SDK 로드 완료");
                
                window.kakao.maps.load(() => {
                    console.log("✅ 카카오 맵 로드 콜백 실행");
                    
                    const mapContainer = document.getElementById('map');
                    
                    if (!mapContainer) {
                        console.error("❌ 맵 컨테이너를 찾을 수 없습니다.");
                        return;
                    }
                    
                    console.log("✅ 맵 컨테이너 발견");

                    try {
                        const mapOption = {
                            center: new window.kakao.maps.LatLng(37.566826, 126.9786567),
                            level: 7,
                        };

                        const map = new window.kakao.maps.Map(mapContainer, mapOption);
                        console.log("✅ 맵 생성 성공!");

                        const markerPosition = new window.kakao.maps.LatLng(37.566826, 126.9786567);
                        const marker = new window.kakao.maps.Marker({ position: markerPosition });
                        marker.setMap(map);
                        console.log("✅ 마커 추가 성공!");
                    } catch (error) {
                        console.error("❌ 맵 생성 중 오류:", error);
                    }
                });
            } else {
                console.error("❌ window.kakao.maps를 사용할 수 없습니다.");
            }
        };

        // 스크립트 로드 로직
        const existingScript = document.querySelector(
            `script[src*="dapi.kakao.com/v2/maps/sdk.js"]`
        );

        if (existingScript) {
            console.log("📌 기존 카카오맵 스크립트 발견");
            
            if (window.kakao && window.kakao.maps) {
                console.log("✅ 카카오맵 이미 로드됨");
                initializeMap();
            } else {
                console.log("⏳ 스크립트 로드 대기 중...");
                existingScript.addEventListener("load", initializeMap);
            }
        } else {
            console.log("📥 새 카카오맵 스크립트 추가 중...");
            
            const script = document.createElement("script");
            // 프로토콜 생략하면 현재 페이지 프로토콜을 따라감
            script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoAppKey}&autoload=false`;
            script.async = false; // 동기 로딩으로 변경
            script.charset = "utf-8";
            
            script.onload = () => {
                console.log("✅ 카카오맵 스크립트 로드 성공");
                // 약간의 지연 후 초기화
                setTimeout(() => {
                    initializeMap();
                }, 100);
            };
            
            script.onerror = (error) => {
                console.error("❌ 카카오맵 스크립트 로드 실패:", error);
                console.log("💡 현재 API 키:", kakaoAppKey);
                console.log("💡 카카오 개발자 콘솔 확인사항:");
                console.log("   1. Web 플랫폼 등록: http://localhost:5173");
                console.log("   2. JavaScript 키 활성화");
                console.log("   3. 사이트 도메인이 정확한지 확인");
            };
            
            document.head.appendChild(script);
        }

        // cleanup
        return () => {
            console.log("🧹 맵 컴포넌트 언마운트");
        };
    }, []);

    return (
        <div style={styles.rootWrapper}>
            <style>{`
                /* keyframes, hover 효과 등 스타일 정의 */
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .route-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 25px rgba(102, 126, 234, 0.2);
                    border-color: #667eea;
                }
                
                .rec-card:hover {
                    transform: translateX(5px);
                    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.15);
                    border-color: #667eea;
                }
                
                .edit-btn:hover {
                    background: #667eea;
                    color: white;
                    transform: scale(1.05);
                }
                
                .add-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
                }
                
                .close-btn:hover {
                    background: #fee;
                    color: #f56565;
                }
                
                .next-btn:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                }
                
                .next-btn:hover svg {
                    transform: translateX(5px);
                }
                
                .rec-scroll::-webkit-scrollbar {
                    width: 8px;
                }
                
                .rec-scroll::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                
                .rec-scroll::-webkit-scrollbar-thumb {
                    background: #667eea;
                    border-radius: 10px;
                }

                @media (max-width: 1200px) {
                    .three-column-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>

            <div style={styles.container}>
                <div className="three-column-grid" style={styles.threeColumnGrid}>
                    {/* 왼쪽: 혼자 여행 서울 + 프로필 */}
                    <div style={styles.leftColumn}>
                        <div style={styles.tripDetailsCard}>
                            <div style={styles.tripBadge}>혼자 여행</div>
                            <div style={styles.tripLocation}>
                                <MapPin size={24} color="#667eea" />
                                <span>서울</span>
                            </div>
                            <div id="map" style={styles.tripImage}></div>
                        </div>

                        <div style={styles.profileSection}>
                            <div style={styles.avatarGroup}>
                                <div style={styles.avatarItem}>
                                    <div style={styles.avatar}>
                                        <span style={styles.avatarText}>햄</span>
                                    </div>
                                    <span style={styles.avatarName}>햄스갱</span>
                                </div>
                                <div style={styles.avatarItem}>
                                    <div style={styles.avatar}>
                                        <span style={styles.avatarText}>무</span>
                                    </div>
                                    <span style={styles.avatarName}>무적언</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 가운데: 여행 루트 */}
                    <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                            <h2 style={styles.sectionTitle}>
                                <Calendar size={28} color="#667eea" />
                                여행 루트
                            </h2>
                        </div>
                        <div style={styles.routeCards}>
                            {routes.map((route, index) => (
                                <div key={route.id} className="route-card" style={styles.routeCard}>
                                    <div style={styles.routeNumber}>{index + 1}</div>
                                    <div style={styles.routeContent}>
                                        <h3 style={styles.routeTitle}>{route.title}</h3>
                                        <p style={styles.routeDescription}>{route.description}</p>
                                    </div>
                                    <button className="edit-btn" style={styles.editButton}>
                                        <span>수정</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 오른쪽: 추천 여행지 */}
                    <div style={styles.section}>
                        <div style={styles.sectionHeader}>
                            <h2 style={styles.sectionTitle}>
                                <MapPin size={28} color="#667eea" />
                                추천 여행지
                            </h2>
                        </div>
                        <div className="rec-scroll" style={styles.recommendationCards}>
                            {recommendations.map((rec) => (
                                <div key={rec.id} className="rec-card" style={styles.recommendationCard}>
                                    <div style={styles.recInfo}>
                                        <Info size={18} color="#667eea" />
                                    </div>
                                    <div style={styles.recContent}>
                                        <h4 style={styles.recTitle}>{rec.title}</h4>
                                        <p style={styles.recDescription}>{rec.description}</p>
                                    </div>
                                    <div style={styles.recActions}>
                                        <button className="add-btn" style={styles.addButton}>담기</button>
                                        <button className="close-btn" style={styles.closeButton}>
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>
                            ))}
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
            </div>
        </div>
    );
}

// ✅ 디자인 수정 절대 없음
const styles = {
    rootWrapper: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
    },
    container: {
        maxWidth: '1600px',
        margin: '0 auto',
    },
    threeColumnGrid: {
        display: 'grid',
        gridTemplateColumns: '770px 1fr 370px',
        gap: '30px',
        marginBottom: '40px',
    },
    leftColumn: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    tripDetailsCard: {
        background: 'white',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    },
    tripBadge: {
        display: 'inline-block',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '8px 20px',
        borderRadius: '20px',
        fontWeight: '600',
        fontSize: '16px',
        marginBottom: '15px',
    },
    tripLocation: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '28px',
        fontWeight: '700',
        color: '#2d3748',
        marginBottom: '20px',
    },
    tripImage: {
        width: '100%',
        height: '500px',
        borderRadius: '15px',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
        overflow: 'hidden',
    },
    profileSection: {
        background: 'white',
        borderRadius: '20px',
        padding: '20px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    },
    avatarGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
    },
    avatarItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    avatar: {
        width: '45px',
        height: '45px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
    },
    avatarText: {
        color: 'white',
        fontSize: '18px',
        fontWeight: '700',
    },
    avatarName: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#2d3748',
    },
    section: {
        background: 'white',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    },
    sectionHeader: {
        marginBottom: '25px',
    },
    sectionTitle: {
        fontSize: '28px',
        fontWeight: '700',
        color: '#2d3748',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        margin: 0,
    },
    routeCards: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    routeCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        padding: '25px',
        border: '2px solid #e2e8f0',
        borderRadius: '15px',
        background: 'linear-gradient(to right, #f7fafc, white)',
        transition: 'all 0.3s ease',
    },
    routeNumber: {
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: '700',
        flexShrink: 0,
    },
    routeContent: { flex: 1 },
    routeTitle: {
        fontSize: '22px',
        fontWeight: '700',
        color: '#2d3748',
        marginBottom: '5px',
        margin: '0 0 5px 0',
    },
    routeDescription: {
        fontSize: '16px',
        color: '#718096',
        lineHeight: '1.5',
        margin: 0,
    },
    editButton: {
        padding: '10px 25px',
        background: 'white',
        border: '2px solid #667eea',
        borderRadius: '10px',
        color: '#667eea',
        fontWeight: '600',
        fontSize: '16px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    recommendationCards: {
        display: 'flex',
        flexDirection: 'column',
        gap: '15px',
        maxHeight: '700px',
        overflowY: 'auto',
        paddingRight: '10px',
    },
    recommendationCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        padding: '18px',
        border: '2px solid #e2e8f0',
        borderRadius: '12px',
        background: 'white',
        transition: 'all 0.3s ease',
    },
    recInfo: { color: '#667eea', flexShrink: 0 },
    recContent: { flex: 1 },
    recTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#2d3748',
        marginBottom: '3px',
        margin: '0 0 3px 0',
    },
    recDescription: {
        fontSize: '14px',
        color: '#718096',
        margin: 0,
    },
    recActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    addButton: {
        padding: '8px 18px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        borderRadius: '8px',
        color: 'white',
        fontWeight: '600',
        fontSize: '14px',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    closeButton: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        border: 'none',
        background: '#f7fafc',
        color: '#718096',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
    },
    nextButtonWrapper: {
        display: 'flex',
        justifyContent: 'center',
        padding: '20px 0',
    },
    nextButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        padding: '20px 50px',
        background: 'white',
        border: 'none',
        borderRadius: '15px',
        fontSize: '20px',
        fontWeight: '700',
        color: '#667eea',
        cursor: 'pointer',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        transition: 'all 0.3s ease',
    },
} as const;