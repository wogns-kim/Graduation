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
    'password': '9047',
    'database': 'first_trip'
}

def enrich_place_data():
    """PLACES 테이블의 데이터를 상세 정보로 채우는 메인 함수"""
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # 1. 위도(latitude) 정보가 비어있는(NULL) 장소들만 모두 가져옵니다.
        cursor.execute("SELECT place_id, place_name FROM PLACES WHERE latitude IS NULL")
        places_to_update = cursor.fetchall()

        if not places_to_update:
            print("모든 장소의 상세 정보가 이미 업데이트되어 있습니다.")
            return

        print(f"총 {len(places_to_update)}개의 장소에 대한 상세 정보 업데이트를 시작합니다.")

        # 2. 각 장소를 순회하며 카카오 API로 정보 조회
        for place_id, place_name in places_to_update:
            print(f"\n- '{place_name}' 정보 조회 중...")
            
            url = f"https://dapi.kakao.com/v2/local/search/keyword.json?query=서울 {place_name}"
            headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}
            
            try:
                response = requests.get(url, headers=headers, timeout=5)
                if response.status_code == 200:
                    result = response.json()
                    if result['documents']:
                        # 3. API 결과에서 필요한 정보(좌표, 주소, 카테고리) 추출
                        place_info = result['documents'][0]
                        latitude = place_info.get('y')
                        longitude = place_info.get('x')
                        address = place_info.get('address_name')
                        category = place_info.get('category_name')

                        # 4. 추출한 정보로 PLACES 테이블을 UPDATE
                        update_query = """
                            UPDATE PLACES 
                            SET latitude = %s, longitude = %s, address = %s, category = %s 
                            WHERE place_id = %s
                        """
                        cursor.execute(update_query, (latitude, longitude, address, category, place_id))
                        print(f"  > 업데이트 성공: 위도={latitude}, 경도={longitude}")
                        time.sleep(0.1) # API에 부담을 주지 않기 위한 지연
                    else:
                        print(f"  > 카카오 API에서 '{place_name}' 정보를 찾을 수 없습니다.")
                else:
                    print(f"  > API 호출 실패 (HTTP {response.status_code})")
            except requests.RequestException as e:
                print(f"  > API 요청 중 네트워크 오류 발생: {e}")

        conn.commit()
        print("\n모든 장소 정보 업데이트가 완료되었습니다.")

    except Error as e:
        print(f"DB 작업 중 오류 발생: {e}")
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    enrich_place_data()
