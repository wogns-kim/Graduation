import React, { useState } from "react";
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

    return (
        <div style={styles.rootWrapper}>
            <style>{`
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
                {/* 3단 레이아웃 */}
                <div className="three-column-grid" style={styles.threeColumnGrid}>

                    {/* 왼쪽: 혼자 여행 서울 + 프로필 */}
                    <div style={styles.leftColumn}>
                        <div style={styles.tripDetailsCard}>
                            <div style={styles.tripBadge}>혼자 여행</div>
                            <div style={styles.tripLocation}>
                                <MapPin size={24} color="#667eea" />
                                <span>서울</span>
                            </div>
                            <img
                                src="https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=400&h=500&fit=crop"
                                alt="서울"
                                style={styles.tripImage}
                            />
                        </div>

                        {/* 프로필 섹션 - 카드 아래 */}
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
            </div>
        </div>
    );
}

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
        gridTemplateColumns: '400px 1fr 400px',
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
        height: '300px',
        objectFit: 'cover',
        borderRadius: '15px',
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.15)',
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
    routeContent: {
        flex: 1,
    },
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
    recInfo: {
        color: '#667eea',
        flexShrink: 0,
    },
    recContent: {
        flex: 1,
    },
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