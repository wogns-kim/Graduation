# -*- coding: utf-8 -*-
"""
데이터 시딩(Seeding) 스크립트
이 스크립트는 수동으로 정의된 고품질 샘플 여행 코스를
카카오맵 API로 검증 및 고도화(좌표, 카테고리 추가)한 후,
'first_trip' MySQL 데이터베이스에 자동으로 저장합니다.
"""

import mysql.connector
from mysql.connector import Error
import requests
import time

# --- 1. 설정 영역 ---
KAKAO_API_KEY = "8abfe377ab126ace7e541f101103470d"

# --- 2. MySQL 접속 정보를 자신의 환경에 맞게 수정해주세요 ---
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'first_trip'
}

# --- 3. 여기에 고품질 샘플 코스를 추가하세요 ---
# 각 trip_id, shareable_link_id는 고유해야 합니다.
SAMPLE_TRIPS = [
    {
        "trip_id": 2, # 1번은 'crawler_bot'이 사용 중
        "trip_name": "샘플 코스 1 (경복궁/안국 힐링)",
        "shareable_link_id": "sample-course-1",
        "days": [
            {
                "day_str": "DAY 1",
                "places": ["경복궁", "국립현대미술관 서울", "다운타우너 안국", "블루보틀 삼청"]
            }
        ]
    },
    {
        "trip_id": 3,
        "trip_name": "샘플 코스 2 (서울숲/성수 핫플)",
        "shareable_link_id": "sample-course-2",
        "days": [
            {
                "day_str": "DAY 1",
                "places": ["서울숲", "런던 베이글 뮤지엄", "성수동 카페거리"]
            }
        ]
    },
    {
        "trip_id": 4,
        "trip_name": "샘플 코스 3 (강남/잠실)",
        "shareable_link_id": "sample-course-3",
        "days": [
            {
                "day_str": "DAY 1",
                "places": ["코엑스 별마당 도서관", "롯데월드타워", "송리단길"]
            }
        ]
    },
     {
        "trip_id": 5,
        "trip_name": "샘플 코스 4 (강남/논현)",
        "shareable_link_id": "sample-course-4",
        "days": [
            {
                "day_str": "DAY 1",
                "places": ["오하라식당교토", "무신사 스탠다드 강남점", "셀렉티드마롱"]
            }
        ]
    },
    {
        "trip_id": 6,
        "trip_name": "샘플 코스 5 (강남/잠원)",
        "shareable_link_id": "sample-course-5",
        "days": [
            {
                "day_str": "DAY 1",
                "places": ["잠원 한강공원", "잠원떡볶이", "뉴코아아울렛 강남점"]
            }
        ]
    },
    {
        "trip_id": 7,
        "trip_name": "샘플 코스 5 (용산/후암)",
        "shareable_link_id": "sample-course-6",
        "days": [
            {
                "day_str": "DAY 1",
                "places": ["패스로스터스", "후암돈까스", "백범김구선생상"]
            }
        ]
    },
    {
        "trip_id": 8,
        "trip_name": "샘플 코스 5 (동작/이수)",
        "shareable_link_id": "sample-course-7",
        "days": [
            {
                "day_str": "DAY 1",
                "places": ["쁠랑떼", "오센", "애플하우스"]
            }
        ]
    },
    {
        "trip_id": 9,
        "trip_name": "샘플 코스 5 (강남/압구정)",
        "shareable_link_id": "sample-course-7",
        "days": [
            {
                "day_str": "DAY 1",
                "places": ["현대백화점 압구정본점", "씨네드쉐프 압구정", "파티클리에","누데이크 하우스 노웨어 도산"]
            }
        ]
    }
]

def get_place_details_from_kakao(place_name):
    """카카오 API로 장소의 상세 정보(좌표, 주소, 카테고리)를 조회합니다."""
    if not KAKAO_API_KEY or len(KAKAO_API_KEY) != 32: 
        print(f"  > [오류] 카카오 API 키가 유효하지 않습니다.")
        return None
        
    url = f"https://dapi.kakao.com/v2/local/search/keyword.json?query=서울 {place_name}"
    headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            result = response.json()
            if result['documents'] and '서울' in result['documents'][0]['address_name']:
                place_info = result['documents'][0]
                # API 응답에서 상세 정보 추출
                return {
                    "place_name": place_info['place_name'], # API가 반환한 정확한 이름
                    "address": place_info.get('address_name'),
                    "latitude": place_info.get('y'),
                    "longitude": place_info.get('x'),
                    "category": place_info.get('category_name')
                }
        print(f"  > [검증 실패] '{place_name}' 정보를 카카오 API에서 찾을 수 없거나 서울 소재가 아닙니다.")
        return None
    except requests.RequestException as e:
        print(f"  > [API 오류] '{place_name}' 검증 중 네트워크 오류: {e}")
        return None

def get_or_create_place(place_name, cursor):
    """
    DB에서 장소를 조회하고, 없으면 카카오 API로 검증 및 생성 후 place_id를 반환합니다.
    """
    # 1. DB에서 장소 이름으로 먼저 조회
    cursor.execute("SELECT place_id FROM PLACES WHERE place_name = %s", (place_name,))
    result = cursor.fetchone()
    
    if result:
        print(f"  - (기존 장소) '{place_name}' (ID: {result[0]})")
        return result[0]
    
    # 2. DB에 없으면, 카카오 API로 상세 정보 조회
    print(f"  - (신규 장소) '{place_name}' 검증 및 정보 조회 시도...")
    place_details = get_place_details_from_kakao(place_name)
    time.sleep(0.1) # API 부담 감소
    
    if place_details:
        # 3. API 검증 성공 시, DB에 상세 정보와 함께 저장
        try:
            insert_query = """
                INSERT INTO PLACES (place_name, address, latitude, longitude, category)
                VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(insert_query, (
                place_details['place_name'],
                place_details['address'],
                place_details['latitude'],
                place_details['longitude'],
                place_details['category']
            ))
            new_place_id = cursor.lastrowid
            print(f"  - (신규 저장) '{place_details['place_name']}' (ID: {new_place_id})")
            return new_place_id
        except mysql.connector.Error as err:
            # UNIQUE 제약 조건 등 삽입 오류 처리 (거의 발생 안 함)
            print(f"  - [DB 오류] '{place_name}' 삽입 실패: {err}")
            cursor.execute("SELECT place_id FROM PLACES WHERE place_name = %s", (place_details['place_name'],))
            result = cursor.fetchone()
            if result: return result[0] # 동시성 문제 등으로 이미 삽입된 경우
            return None
    else:
        # 4. API 검증 실패 시 None 반환
        return None

def main():
    """데이터 시딩 스크립트 메인 실행 함수"""
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        print("MySQL 데이터베이스 연결 성공.")
        
        owner_user_id = 1 # 'crawler_bot' 사용자를 기본 소유자로 지정
        
        # 1. 정의된 샘플 코스를 순회
        for trip_data in SAMPLE_TRIPS:
            trip_id = trip_data['trip_id']
            trip_name = trip_data['trip_name']
            shareable_link_id = trip_data['shareable_link_id']
            
            print(f"\n--- [ {trip_name} ] (Trip ID: {trip_id}) 작업 시작 ---")
            
            # 2. TRIPS 테이블에 여행 생성 (이미 있으면 건너뜀)
            cursor.execute(
                "INSERT IGNORE INTO TRIPS (trip_id, trip_name, owner_id, shareable_link_id) VALUES (%s, %s, %s, %s)",
                (trip_id, trip_name, owner_user_id, shareable_link_id)
            )
            # 3. COLLABORATORS 테이블에 참여자 추가 (이미 있으면 건너뜀)
            cursor.execute(
                "INSERT IGNORE INTO COLLABORATORS (trip_id, user_id) VALUES (%s, %s)",
                (trip_id, owner_user_id)
            )
            
            # 4. 각 날짜(day)별로 일정(place) 순회
            for day_data in trip_data['days']:
                day_str = day_data['day_str']
                order_in_day = 1 # 유효한 장소의 순서를 매기기 위한 카운터
                
                print(f"  [ {day_str} ] 일정 처리 중...")
                
                for place_name in day_data['places']:
                    # 5. 장소를 검증하고 place_id를 받아옴
                    place_id = get_or_create_place(place_name, cursor)
                    
                    if place_id:
                        # 6. 유효한 place_id만 ITINERARY_ITEMS에 저장 (이미 있으면 건너뜀)
                        cursor.execute(
                            "INSERT IGNORE INTO ITINERARY_ITEMS (trip_id, place_id, user_id, visit_day_str, order_in_day) VALUES (%s, %s, %s, %s, %s)",
                            (trip_id, place_id, owner_user_id, day_str, order_in_day)
                        )
                        order_in_day += 1 # 유효한 장소가 저장될 때만 순서 증가
                    else:
                        print(f"  - (건너뜀) '{place_name}'은(는) 유효하지 않아 일정에 추가되지 않습니다.")
            
            conn.commit() # 각 여행(Trip) 단위로 DB에 최종 반영
            print(f"--- [ {trip_name} ] 작업 완료 ---")
            
        print("\n모든 샘플 데이터 시딩 작업이 완료되었습니다.")
        
    except Error as e:
        print(f"DB 작업 중 오류 발생: {e}")
        if conn:
            conn.rollback() # 오류 발생 시 모든 변경 사항 되돌리기
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()
        print("MySQL 데이터베이스 연결 종료.")

# --- 스크립트 실행 부분 ---
if __name__ == '__main__':
    main()
