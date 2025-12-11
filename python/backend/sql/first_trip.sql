-- ===================================================================================
-- First Trip 프로젝트 최종 데이터베이스 스키마
-- ===================================================================================

-- 1. 'first_trip' 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS first_trip

DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. 데이터베이스 사용
USE first_trip;



-- 3. 테이블 생성

-- 사용자 정보 테이블 (카카오 로그인 전용)
CREATE TABLE IF NOT EXISTS USERS (
    user_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '우리 서비스의 사용자 고유 ID',
    kakao_id BIGINT NOT NULL UNIQUE COMMENT '카카오가 부여한 고유 사용자 ID (로그인 식별 기준)',
    username VARCHAR(50) NOT NULL COMMENT '사용자 닉네임',
    email VARCHAR(100) NULL COMMENT '사용자가 제공에 동의한 이메일 (선택 사항)',
    profile_image_url VARCHAR(255) COMMENT '프로필 이미지 주소',
    preferences TEXT NULL COMMENT '사용자가 선택한 취향 해시태그 목록'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 정보';

-- 개별 여행 계획 정보 테이블
CREATE TABLE IF NOT EXISTS TRIPS (
    trip_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '여행 고유 ID',
    trip_name VARCHAR(100) NOT NULL COMMENT '여행 이름 (예: 서울 2박 3일)',
    owner_id INT NOT NULL COMMENT '여행 계획을 처음 만든 사용자 ID',
    shareable_link_id VARCHAR(50) NOT NULL UNIQUE COMMENT '공유 및 참여를 위한 여행 고유 코드(UID)',
    FOREIGN KEY (owner_id) REFERENCES USERS(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='여행 계획 정보';

-- 여행 공동 작업자 관리 테이블
CREATE TABLE IF NOT EXISTS COLLABORATORS (
    trip_id INT NOT NULL COMMENT '참여하는 여행 ID',
    user_id INT NOT NULL COMMENT '참여하는 사용자 ID',
    PRIMARY KEY (trip_id, user_id),
    FOREIGN KEY (trip_id) REFERENCES TRIPS(trip_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='여행 공동 작업자';

-- 장소 정보 마스터 테이블
CREATE TABLE IF NOT EXISTS PLACES (
    place_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '장소 고유 ID',
    place_name VARCHAR(255) NOT NULL UNIQUE COMMENT '장소 이름',
    address VARCHAR(255) COMMENT '주소',
    latitude DECIMAL(10, 7) COMMENT '위도',
    longitude DECIMAL(10, 7) COMMENT '경도',
    category VARCHAR(255) COMMENT '카테고리 (AI 추천용)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='장소 정보';

-- 여행 일정 항목 저장 테이블
CREATE TABLE IF NOT EXISTS ITINERARY_ITEMS (
    item_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '일정 항목 고유 ID',
    trip_id INT NOT NULL COMMENT '이 항목이 속한 여행 ID',
    place_id INT NOT NULL COMMENT '방문할 장소 ID',
    user_id INT NOT NULL COMMENT '이 항목을 추가/수정한 사용자 ID',
    visit_day_str VARCHAR(50) NOT NULL COMMENT '방문 날짜 (예: DAY 1)',
    order_in_day INT NOT NULL COMMENT '하루 내에서의 방문 순서',
    FOREIGN KEY (trip_id) REFERENCES TRIPS(trip_id) ON DELETE CASCADE,
    FOREIGN KEY (place_id) REFERENCES PLACES(place_id),
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_itinerary (trip_id, visit_day_str, order_in_day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='여행 일정 항목';

-- 여행 일정의 모든 변경 이력을 저장하는 '로그' 테이블
CREATE TABLE IF NOT EXISTS TRIP_ACTIONS (
    action_id INT PRIMARY KEY AUTO_INCREMENT COMMENT '변경 이력 고유 ID',
    trip_id INT NOT NULL COMMENT '어떤 여행에 대한 이력인지',
    user_id INT NOT NULL COMMENT '누가 변경했는지',
    action_type VARCHAR(20) NOT NULL COMMENT '어떤 행동을 했는지 (ADD, DELETE, REORDER)',
    -- 되돌리기에 필요한 이전 상태 정보를 JSON 문자열로 저장
    previous_state TEXT NULL COMMENT '되돌리기를 위한 이전 상태 정보 (JSON)',
    -- (참고) ADD 액션의 경우, 되돌리려면 '추가된 item_id'를 알아야 하므로
    -- 이 필드를 활용하거나 previous_state에 {"item_id": 123} 형식으로 저장합니다.
    item_id_affected INT NULL COMMENT '추가/삭제된 아이템 ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '언제 변경했는지',
    
    FOREIGN KEY (trip_id) REFERENCES TRIPS(trip_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES USERS(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='여행 수정 이력 (Undo용)';

-- 4. 시스템 기본 데이터 삽입
INSERT IGNORE INTO USERS (user_id, kakao_id, username, email) VALUES (1, 0, 'crawler_bot', 'crawler@firsttrip.com');

