import requests
import json
import time

# --- 설정 ---
KAKAO_API_KEY = "8abfe377ab126ace7e541f101103470d" # 본인의 키 확인

# 📝 사용자가 크롤링(시딩)했던 실제 장소 목록을 여기에 넣었습니다.
SAMPLE_PLACES = [
    # [Trip 14: 경복궁/안국 힐링]
    "경복궁", "국립현대미술관 서울", "다운타우너 안국", "블루보틀 삼청",
    "사장님돈까스 본점", "우미마루", "이름없는파스타 이화여대점",

    # [Trip 15: 서울숲/성수 핫플]
    "서울숲", "런던 베이글 뮤지엄", "성수동 카페거리",

    # [Trip 16: 강남/잠실]
    "코엑스 별마당 도서관", "롯데월드타워", "송리단길",

    # [Trip 17: 강남/논현]
    "오하라식당교토", "무신사 스탠다드 강남점", "셀렉티드마롱",
    "텍사스브라질 센트럴시티점", "플라워아티장베이터리 가로수", "이스케이프 샵",

    # [Trip 18: 강남/잠원]
    "잠원 한강공원", "잠원떡볶이", "뉴코아아울렛 강남점",

    # [Trip 19: 용산/후암]
    "패스로스터스", "후암돈까스", "백범김구선생상",

    # [Trip 20: 동작/이수]
    "쁠랑떼", "오센", "애플하우스",

    # [Trip 21: 강남/압구정]
    "현대백화점 압구정본점", "씨네드쉐프 압구정", "파티클리에", "누데이크 하우스 노웨어 도산"
]

def check_kakao_category(place_name):
    url = f"https://dapi.kakao.com/v2/local/search/keyword.json?query=서울 {place_name}"
    headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}
    
    try:
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            result = response.json()
            if result['documents']:
                # 정확도를 위해 첫 번째 검색 결과를 가져옵니다
                place = result['documents'][0]
                
                name = place['place_name']
                cat_name = place['category_name'] # 상세 카테고리 (예: 여행 > 공원)
                cat_group = place['category_group_name'] # 대분류 (예: 관광명소)
                
                print(f"---------------")
                print(f"📍 장소: {name}")
                print(f"   🏷️ 카테고리: {cat_name}")
                print(f"   📂 그룹:    {cat_group if cat_group else '(없음)'}")
                return
                
        print(f"❌ '{place_name}' 검색 실패 (결과 없음)")
        
    except Exception as e:
        print(f"오류 발생: {e}")

if __name__ == '__main__':
    print("--- 🕵️‍♀️ 크롤링 데이터 카테고리 분석 시작 ---\n")
    
    for place in SAMPLE_PLACES:
        check_kakao_category(place)
        time.sleep(0.1) # API 도배 방지용 딜레이
        
    print("\n-------------------------------------")
    print("분석 완료! 이 카테고리들을 보고 '취향 매핑'을 수정하세요.")