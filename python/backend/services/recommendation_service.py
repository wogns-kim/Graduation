# services/recommendation_service.py
# AI 추천 생성과 같이 복잡한 비즈니스 로직을 담당합니다.
# 프론트엔드의 취향 카테고리를 DB와 매핑합니다.

from sqlalchemy.orm import Session
from sqlalchemy import func, text
from models import models
import google.generativeai as genai
import os
import json
from typing import List, Optional # Optional 추가
import traceback
from datetime import datetime # 날짜 계산을 위해 import

# .env 파일에서 환경 변수(API 키 등)를 로드
from dotenv import load_dotenv
load_dotenv() 

# --- 1. '번역기' 정의: 프론트엔드 취향(Key)과 DB 카테고리(Value) 매핑 ---
# (frontend/select_your_taste.tsx의 categories.keywords와 일치)
TAG_TO_CATEGORY_MAP = {
    # 여행 스타일
    "힐링/휴양": ["공원", "수목원", "사찰", "휴양"],
    "액티비티": ["스포츠", "테마파크", "레저"],
    "문화/역사": ["문화유산", "궁궐", "박물관", "미술관", "역사"],
    "쇼핑/시티 투어": ["쇼핑", "백화점", "거리", "랜드마크", "도시명소"],
    "미식/쇼핑": ["음식점", "맛집", "쇼핑", "시장"],

    # 식사 선호도
    "로컬 맛집": ["음식점", "한식", "시장"],
    "가성비 맛집": ["음식점", "분식", "시장"],
    "프리미엄": ["음식점", "레스토랑", "고급"],

    # 동행 유형 (이 키워드들은 분위기/스타일 지시에 사용)
    "나 홀로 여행": [], 
    "친구/지인": [],
    "가족 여행": [],
    "펫 동반 여행": [],
    "아이 동반 여행": ["테마파크", "어린이", "가족공원", "키즈"],
}

# --- 2. Gemini API 설정 ---
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") # .env 파일에서 키를 읽어옴
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
else:
    print("경고: GOOGLE_API_KEY가 .env 파일에 설정되지 않았습니다.")


def get_ai_recommendations(preferences: List[str], db: Session, start_date: Optional[str], end_date: Optional[str]):
    """
    사용자의 취향(preferences)과 '여행 기간'에 맞는
    AI 맞춤형 여행 코스와 '대안 장소'를 생성하도록 요청합니다.
    """
    
    # --- 1. 여행 기간 계산 ---
    duration_str = "2박 3일" # 기본값
    if start_date and end_date:
        try:
            d1 = datetime.strptime(start_date, "%Y-%m-%d")
            d2 = datetime.strptime(end_date, "%Y-%m-%d")
            duration_days = (d2 - d1).days
            if duration_days < 0:
                duration_str = "2박 3일" # 날짜 오류 시 기본값
            elif duration_days == 0:
                duration_str = "당일치기"
            else:
                duration_str = f"{duration_days}박 {duration_days + 1}일"
        except ValueError:
            print(f"[AI 서비스] 날짜 형식이 잘못되었습니다. 기본값(2박 3일) 사용.")
            duration_str = "2박 3일" # 날짜 형식 오류 시 기본값
            
    print(f"[AI 서비스] 여행 기간: {duration_str}")

    # --- 2. 취향(tags)을 DB 카테고리 키워드로 '번역' ---
    db_keywords = []
    mood_keywords = [] 
    for tag in preferences:
        if tag in TAG_TO_CATEGORY_MAP:
            mapped_values = TAG_TO_CATEGORY_MAP[tag]
            if mapped_values: db_keywords.extend(mapped_values)
            else: mood_keywords.append(tag)

    db_keywords = list(set(db_keywords)) # 중복 제거
    print(f"[AI 서비스] 번역된 DB 키워드: {db_keywords}")
    print(f"[AI 서비스] 분위기/스타일 키워드: {mood_keywords}")

    # --- 3. '번역된' 키워드로 DB에서 '인기 장소' 조회 ---
    popular_places = []
    if db_keywords:
        try:
            # 1. LIKE 조건절과 파라미터 딕셔너리 생성
            like_conditions = " OR ".join([f"PLACES.category LIKE :kw{i}" for i, kw in enumerate(db_keywords)])
            like_params_dict = {f"kw{i}": f"%{kw}%" for i, kw in enumerate(db_keywords)}
            
            # 2. 완성된 SQL 쿼리 (f-string은 조건절에만 안전하게 사용)
            query_sql = f"""
                SELECT PLACES.place_name, COUNT(ITINERARY_ITEMS.item_id) as mention_count
                FROM PLACES
                JOIN ITINERARY_ITEMS ON PLACES.place_id = ITINERARY_ITEMS.place_id
                WHERE {like_conditions}
                GROUP BY PLACES.place_id, PLACES.place_name
                ORDER BY COUNT(ITINERARY_ITEMS.item_id) DESC
                LIMIT 10;
            """
            
            # 3. text()로 쿼리를 감싸고, 파라미터 딕셔너리를 전달
            results = db.execute(text(query_sql), like_params_dict).fetchall()
            popular_places = [row[0] for row in results]

        except Exception as e:
            print(f"[DB 오류] 인기 장소 조회 실패: {e}")
            traceback.print_exc()
            popular_places = [] 
    
    print(f"[AI 서비스] 조회된 인기 장소: {popular_places}")

    # --- 4. AI에게 보낼 '최종 지시서'(프롬프트) 생성 ---
    prompt = f"""
    당신은 최고의 서울 여행 전문가입니다.
    다음 조건을 만족하는 완벽한 {duration_str} 서울 여행 코스를 생성해 주세요.

    [사용자 취향]
    - 핵심 활동 키워드: {', '.join(db_keywords) if db_keywords else '지정 안 함'}
    - 동행 및 여행 스타일: {', '.join(mood_keywords) if mood_keywords else '지정 안 함'}

    [추천 시 참고할 실제 인기 장소 목록]
    - 다음 장소들을 코스에 우선적으로, 그리고 자연스럽게 포함시켜 주세요:
    {', '.join(popular_places) if popular_places else '특정 인기 장소 없음'}

    [출력 형식]
    - 반드시 'route' 키만 가진 JSON 객체의 리스트 형식으로만 응답해 주세요.
    - 'route'는 'DAY 1', 'DAY 2' 등 여행 기간({duration_str})에 맞춘 날짜별 장소 이름 리스트입니다.
    - 예시 (1박 2일의 경우): 
    [
      {{
        "route": {{
          "DAY 1": ["서울숲", "성수동 카페거리"],
          "DAY 2": ["경복궁", "국립현대미술관"]
        }}
      }},
      {{
        "route": {{ 
          "DAY 1": ["장소A", "장소B"],
          "DAY 2": ["장소C"]
        }}
      }}
    ]
    """
    
    # --- 5. Gemini API 호출 ---
    if not GOOGLE_API_KEY:
        print("[AI 서비스] API 키가 없어 가짜(Dummy) 응답을 반환합니다.")
        return [
            {
                "route": {"DAY 1": ["서울숲 (샘플)", "근처 카페 (샘플)"]}, 
                "alternatives": ["올림픽공원 (샘플)", "선유도공원 (샘플)"]
            }
        ]

    try:
        # 라이브러리가 최신 버전이면 이 코드가 정상 작동합니다.
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        print(f"[AI 서비스] AI 응답 수신 완료.")
        
        # AI로부터 받은 추천 목록 (예: [{"route": {...}}, {"route": {...}}])
        ai_recommendations = json.loads(response.text)
    
        # --- 6. AI가 사용하지 않은 '인기 장소'를 계산하여 'alternatives'로 추가 ---
        final_response_list = []
        popular_places_set = set(popular_places) # 비교를 위해 set으로 변환

        for reco in ai_recommendations:
            # 1. AI가 이 루트에서 사용한 모든 장소 집합을 구함
            route_places_set = set()
            for day_places in reco['route'].values():
                route_places_set.update(day_places)
            
            # 2. '인기 장소' 중에서 'AI가 사용한 장소'를 뺀 차집합을 구함
            alternatives_list = list(popular_places_set - route_places_set)
            
            # 3. 계산된 'alternatives' 리스트를 응답 객체에 추가
            reco['alternatives'] = alternatives_list
            final_response_list.append(reco)

        return final_response_list
    
    except Exception as e:
        print(f"--- !!! Gemini API 호출 또는 JSON 파싱 중 오류 발생 !!! ---: {e}")
        traceback.print_exc()
        return []