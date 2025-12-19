# routers/recommend.py
# AI 여행 코스 추천 API의 입구(엔드포인트)입니다.

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import traceback # Traceback import

# 우리 프로젝트의 다른 모듈들을 가져옵니다.
from database import database
from models import models
from auth.auth import get_current_user # 로그인된 사용자 확인용
from services import recommendation_service # 실제 AI 추천 로직
from schemas import schemas # 응답 형식 정의

router = APIRouter()

@router.get("/", response_model=List[schemas.RecommendationResponse]) # 응답 형식 지정
def get_recommendations(
    # 메인 페이지에서 입력받을 여행 시작일과 종료일
    start_date: Optional[str] = Query(None, description="여행 시작일 (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="여행 종료일 (YYYY-MM-DD)"),

    # 프론트엔드에서 preferences 파라미터를 쿼리로 받을 수 있음 (선택 사항)
    preferences: Optional[List[str]] = Query(None),
    
    # DB 세션과 현재 로그인된 사용자를 자동으로 가져옴
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    사용자의 취향과 여행 날짜에 맞는 여행 코스를 AI로 생성하여 반환합니다.
    - 1순위: 요청 URL에 'preferences'가 있으면, 그 취향을 사용합니다.
    - 2순위: 요청 URL에 'preferences'가 없으면, DB에 저장된 사용자의 취향을 사용합니다.
    """
    
    final_preferences = []
    
    if preferences:
        print(f"[API] URL 쿼리에서 새 취향 사용: {preferences}")
        final_preferences = preferences
    elif current_user.preferences:
        print(f"[API] DB에 저장된 사용자 취향 사용: {current_user.preferences}")
        final_preferences = current_user.preferences.split(',')
    else:
        print("[API] 사용 가능한 취향 정보 없음. 기본 추천 시도.")
        final_preferences = [] 

    try:
        recommendations = recommendation_service.get_ai_recommendations(
            preferences=final_preferences, 
            db=db, 
            start_date=start_date, 
            end_date=end_date
        )
        
        if not recommendations:
             print("[API] AI가 추천을 생성하지 못했거나 빈 결과를 반환했습니다.")
        
        return recommendations

    except Exception as e:
        print(f"[API] 추천 API 처리 중 알 수 없는 오류 발생: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="추천 코스를 생성하는 중 서버에 오류가 발생했습니다.")