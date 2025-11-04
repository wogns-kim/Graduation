# 용자의 취향/검색어를 받아 recommendation_service를 호출하고, AI가 생성한 추천 루트를 최종 응답하는 API

from fastapi import APIRouter, Query
from typing import List, Optional

router = APIRouter()

@router.get("/recommendations")
async def get_ai_recommendations(
    preferences: List[str] = Query(...) 
):
    """
    쿼리 파라미터로 받은 취향(preferences) 목록에 따라
    미리 정의된 가짜(Dummy) 추천 코스를 반환합니다.
    (DB 조회 및 실제 AI 호출 없이 테스트하기 위한 버전)
    """
    print(f"수신된 취향: {preferences}")

    if "#힐링" in preferences:
        dummy_response = [
            {"theme": "가짜 힐링 코스", "route": ["서울숲", "근처 조용한 카페"]},
            {"theme": "또 다른 힐링 코스", "route": ["북서울 꿈의 숲", "창포원"]}
        ]
    elif "#맛집탐방" in preferences:
        dummy_response = [
            {"theme": "가짜 맛집 코스", "route": ["광장시장", "익선동 맛집"]},
            {"theme": "힙스터 맛집 코스", "route": ["성수동 맛집", "연남동 맛집"]}
        ]
    else:
        # 기본 가짜 응답
        dummy_response = [
            {"theme": "기본 샘플 코스", "route": ["경복궁", "인사동"]},
        ]
        
    return dummy_response