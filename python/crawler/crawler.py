# -*- coding: utf-8 -*-
"""
URL 직접 입력 크롤러 (MySQL 연동, 중복 방지, 필터링 + API 검증 통합 버전)
이 스크립트는 블로그 URL 목록을 순회하며 동선을 추출하고,
추출된 각 장소 후보를 카카오 API로 검증하여 유효한 장소만 DB에 저장합니다.
"""

import re
import json
import mysql.connector
from mysql.connector import Error
import requests
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.common.exceptions import NoSuchFrameException
from bs4 import BeautifulSoup
import time

# --- 1. 설정 영역 ---
KAKAO_API_KEY = "8abfe377ab126ace7e541f101103470d"

# --- 2. MySQL 접속 정보를 자신의 환경에 맞게 수정해주세요 ---
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "9047",
    "database": "first_trip",
}


def clean_place_name(raw_name):
    """추출된 장소 이름에서 불필요한 부분을 제거"""
    cleaned = re.sub(r"^\d+\.\s*|^[•*~-]\s*", "", raw_name).strip()
    cleaned = cleaned.split("-")[0].strip()
    return cleaned


def is_valid_keyword(keyword):
    """추출된 키워드가 유효한 장소 이름 후보인지 기본적인 필터링"""
    if not keyword:
        return False
    if not (1 < len(keyword) < 50):
        return False
    excluded_keywords = [
        ":",
        "코스",
        "가격",
        "정보",
        "시간",
        "Day",
        "DAY",
        "일차",
        "여행 팁",
        "참고",
        "주의",
        "준비물",
        "꿀팁",
        "가는 법",
        "예상 비용",
        "예약",
        "후기",
        "추천",
        "만족",
        "솔직",
        "문의",
        "위치",
        "주소",
        "전화",
        "영업",
        "휴무",
        "주차",
        "입장료",
    ]
    if any(kw in keyword for kw in excluded_keywords):
        return False
    sentence_patterns = [
        r".*다\.?$",
        r".*요\.?$",
        r".*죠\.?$",
        r".*음$",
        r".*함$",
        r".*에서$",
        r".*으로$",
        r".*에게$",
        r".*(와|과)$",
        r".*(은|는|이|가)$",
    ]
    if any(
        re.match(pattern, keyword) for pattern in sentence_patterns
    ) and not keyword.endswith("가"):
        return False
    if keyword.isdigit() or (sum(c.isdigit() for c in keyword) / len(keyword) > 0.5):
        return False
    if re.search(r"[!@#$%^&*()=+/\\|?><]", keyword):
        return False
    return True


def verify_place_with_kakao_api(place_name):
    """카카오 API로 장소 이름이 실제 서울에 있는지 확인"""
    if not KAKAO_API_KEY or len(KAKAO_API_KEY) != 32:
        return False
    url = f"https://dapi.kakao.com/v2/local/search/keyword.json?query=서울 {place_name}"
    headers = {"Authorization": f"KakaoAK {KAKAO_API_KEY}"}
    try:
        response = requests.get(url, headers=headers, timeout=5)
        if response.status_code == 200:
            result = response.json()
            # 정확도를 높이기 위해 검색 결과가 있고, 주소에 '서울'이 포함되며,
            # 검색된 이름과 원래 이름이 어느 정도 유사한지 확인 (선택적)
            if result["documents"] and "서울" in result["documents"][0]["address_name"]:
                # 예: "광화문 광장" -> "광화문" 처럼 부분 일치 허용 로직 추가 가능
                return True
        return False
    except requests.RequestException:
        return False


def save_itinerary_to_db(itinerary, blog_url, owner_id=1):
    """
    추출된 동선을 MySQL DB에 저장 (API 검증 포함)
    """
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        shareable_link_id = f"crawled-{hash(blog_url)}"
        cursor.execute(
            "SELECT trip_id FROM TRIPS WHERE shareable_link_id = %s",
            (shareable_link_id,),
        )
        existing_trip = cursor.fetchone()

        if existing_trip:
            print(
                f"\n이미 처리된 URL입니다. DB 저장을 건너뜁니다. (Trip ID: {existing_trip[0]})"
            )
            return

        print(f"\nMySQL 데이터베이스에 동선 저장을 시작합니다...")

        trip_name = f"Crawled: {blog_url[:50]}..."
        cursor.execute(
            "INSERT INTO TRIPS (trip_name, owner_id, shareable_link_id) VALUES (%s, %s, %s)",
            (trip_name, owner_id, shareable_link_id),
        )
        new_trip_id = cursor.lastrowid
        print(f"  - 새로운 여행 생성: '{trip_name}' (Trip ID: {new_trip_id})")
        cursor.execute(
            "INSERT IGNORE INTO COLLABORATORS (trip_id, user_id) VALUES (%s, %s)",
            (new_trip_id, owner_id),
        )

        total_saved_count = 0
        for day_str, places in itinerary.items():
            current_order = 1  # 유효한 장소만 순서를 매기기 위한 카운터
            for place_name_candidate in places:  # 추출된 모든 후보를 순회

                # DB 저장 직전에 카카오 API로 장소 유효성 검증
                if verify_place_with_kakao_api(place_name_candidate):
                    print(f"  [저장 승인] '{place_name_candidate}'")
                    # 검증 성공 시에만 DB 작업 수행
                    cursor.execute(
                        "SELECT place_id FROM PLACES WHERE place_name = %s",
                        (place_name_candidate,),
                    )
                    result = cursor.fetchone()

                    if result:
                        place_id = result[0]
                    else:
                        cursor.execute(
                            "INSERT INTO PLACES (place_name) VALUES (%s)",
                            (place_name_candidate,),
                        )
                        place_id = cursor.lastrowid
                        print(
                            f"    - 신규 장소 추가: '{place_name_candidate}' (ID: {place_id})"
                        )

                    cursor.execute(
                        "INSERT IGNORE INTO ITINERARY_ITEMS (trip_id, place_id, user_id, visit_day_str, order_in_day) VALUES (%s, %s, %s, %s, %s)",
                        (
                            new_trip_id,
                            place_id,
                            owner_id,
                            day_str,
                            current_order,
                        ),  # order 대신 current_order 사용
                    )
                    current_order += 1  # 유효한 장소가 저장될 때만 순서 증가
                    total_saved_count += 1
                    time.sleep(0.1)  # API 부담 감소
                else:
                    # 검증 실패 시 로그 출력 (선택적)
                    print(
                        f"  [저장 거부] '{place_name_candidate}' (유효하지 않거나 서울 장소 아님)"
                    )
            # --- --- ---

        conn.commit()
        print(
            f"\n데이터베이스 저장 완료. 총 {total_saved_count}개의 유효한 일정 항목 저장됨."
        )

    except Error as e:
        print(f"DB 저장 중 오류 발생: {e}")
    finally:
        if cursor:
            cursor.close()
        if conn and conn.is_connected():
            conn.close()


def extract_itinerary_from_content(content_html):
    """'DAY N' 패턴으로 동선 추출 (API 검증은 저장 단계에서 수행)"""
    itinerary = {}
    day_pattern = re.compile(
        r"(Day\s*\d+|[0-9]+\s*일차|첫째\s*날|둘째\s*날|셋째\s*날)", re.IGNORECASE
    )
    if not day_pattern.search(str(content_html)):
        return None

    day_sections = day_pattern.split(str(content_html))
    current_day_key = None

    for section in day_sections:
        if day_pattern.match(section):
            day_number_match = re.search(r"\d+", section)
            if day_number_match:
                day_number = int(day_number_match.group())
                current_day_key = f"DAY {day_number}"
                if current_day_key not in itinerary:
                    itinerary[current_day_key] = []
        elif current_day_key:
            day_content_soup = BeautifulSoup(section, "html.parser")
            potential_tags = day_content_soup.select("strong, li")

            processed_in_section = set()  # 섹션 내 중복 추출 방지
            for tag in potential_tags:
                raw_place_name = tag.get_text(strip=True)
                cleaned_place_name = clean_place_name(raw_place_name)

                if (
                    is_valid_keyword(cleaned_place_name)
                    and cleaned_place_name not in processed_in_section
                ):
                    itinerary[current_day_key].append(cleaned_place_name)
                    processed_in_section.add(cleaned_place_name)

    itinerary = {k: v for k, v in itinerary.items() if v}
    return itinerary if itinerary else None


def extract_places_by_verification(content_html):
    """날짜 구분 없는 본문에서 장소 후보 추출 (API 검증은 저장 단계에서 수행)"""
    print("\n'장소 후보 추출' 방식으로 전환합니다. (API 검증은 저장 시 수행)")
    soup = BeautifulSoup(str(content_html), "html.parser")
    potential_tags = soup.select("strong, h2, h3, li")

    place_candidates = []
    processed_candidates = set()

    for tag in potential_tags:
        raw_keyword = tag.get_text(strip=True)
        cleaned_keyword = clean_place_name(raw_keyword)

        if (
            is_valid_keyword(cleaned_keyword)
            and cleaned_keyword not in processed_candidates
        ):
            place_candidates.append(cleaned_keyword)
            processed_candidates.add(cleaned_keyword)

    if place_candidates:
        return {"방문 코스": place_candidates}
    return {}


def get_blog_content(blog_url):
    """하나의 블로그 URL에서 동선을 추출하고 DB에 저장하는 전체 프로세스"""
    driver = None
    itinerary = None
    try:
        options = webdriver.ChromeOptions()
        options.add_argument("headless")
        options.add_argument("window-size=1920x1800")
        options.add_argument(
            "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/5.0 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36"
        )
        driver = webdriver.Chrome(
            service=Service(ChromeDriverManager().install()), options=options
        )
        driver.get(blog_url)
        time.sleep(4)
        content = None
        if "blog.naver.com" in blog_url:
            try:
                driver.switch_to.frame("mainFrame")
                time.sleep(1)
            except:
                print("Naver mainFrame 전환 실패")
                return
            html = driver.page_source
            soup = BeautifulSoup(html, "html.parser")
            content = soup.select_one(".se-main-container")
        elif "tistory.com" in blog_url:
            html = driver.page_source
            soup = BeautifulSoup(html, "html.parser")
            content = soup.select_one(
                ".tt_article_useless_p_margin, .entry-content, [role=main], .contents_style"
            )

        if content:
            itinerary = extract_itinerary_from_content(content)
            if not itinerary:
                itinerary = extract_places_by_verification(content)

            if itinerary:
                print("\n--- 🗺️ 추출된 장소 후보 목록 ---")
                print(json.dumps(itinerary, indent=2, ensure_ascii=False))
                print("--------------------------")
                # DB 저장 함수는 내부적으로 API 검증을 수행함
                save_itinerary_to_db(itinerary, blog_url)
            else:
                print("분석 결과: 유효한 장소 후보를 추출하지 못했습니다.")
        else:
            print("본문 내용을 찾을 수 없습니다.")
    except Exception as e:
        print(f"크롤링 중 오류 발생: {e}")
    finally:
        if driver:
            driver.quit()


# --- 3. 스크립트 실행 부분 ---
if __name__ == "__main__":
    urls_to_crawl = [
        "https://blog.naver.com/titibird__/223597650093",
        "https://nomadnjobs.tistory.com/1",
        "https://koreathreads.tistory.com/entry/%EC%84%9C%EC%9A%B8-3%EC%9D%BC-%EC%97%AC%ED%96%89%EC%BD%94%EC%8A%A4-%EC%A0%95%EB%A6%AC%F0%9F%93%B8-%EA%B0%90%EC%84%B1-%EC%9D%B8%EC%83%9D%EC%83%B7-%EB%AA%85%EC%86%8C%EB%B6%80%ED%84%B0-%EC%95%BC%EA%B2%BD%C2%B7%EC%B9%B4%ED%8E%98%EA%B9%8C%EC%A7%80-%EC%99%84%EB%B2%BD-%ED%94%8C%EB%9E%9C",
        "https://blog.naver.com/jungceo_blog/223115291069",
        "https://tripinfomation.tistory.com/183",
        "https://yeahlife.tistory.com/389#google_vignette",
        "https://blog.naver.com/neweunha/222872061646",
        "https://alinou.tistory.com/14",
        "https://thffhahsgud.tistory.com/entry/%EC%84%9C%EC%9A%B8%EC%97%AC%ED%96%89-2%EB%B0%95-3%EC%9D%BC-%EB%8F%99%EC%84%A0-%EC%97%AD%EC%82%AC-%ED%98%84%EB%8C%80-%EB%A7%9B%EC%A7%91%EC%9D%B4-%EC%96%B4%EC%9A%B0%EB%9F%AC%EC%A7%84-%EC%99%84%EB%B2%BD%ED%95%9C-%EC%9D%BC%EC%A0%95",
        "https://blog.naver.com/zinizio/223875017465",  # 추가
        "https://blog.naver.com/yhth27/224070324883"  # 추가
        "https://blog.naver.com/davi-kim/224008485524",  # 추가
    ]

    print(f"총 {len(urls_to_crawl)}개의 URL에 대한 동선 추출 및 DB 저장을 시작합니다.")
    for i, url in enumerate(urls_to_crawl):
        print(f"\n[{i+1}/{len(urls_to_crawl)}] >> {url} 크롤링 중...")
        get_blog_content(url)
        time.sleep(5)

    print("\n모든 URL에 대한 작업이 완료되었습니다.")
