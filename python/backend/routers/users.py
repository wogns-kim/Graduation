# 사용자 인증 API, 취향 저장 및 조회 API 구현

from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import requests
from jose import jwt
from datetime import datetime, timedelta
from schemas import schemas 
from typing import List, Optional

from database import database
from models import models
from auth.auth import get_current_user # 현재 사용자 확인용

# --- 설정 ---
KAKAO_REST_API_KEY = "8abfe377ab126ace7e541f101103470d"
KAKAO_REDIRECT_URI = "http://localhost:5173/auth/kakao/callback"
JWT_SECRET_KEY = "super-secret-key"
JWT_ALGORITHM = "HS256"

# --- 프론트엔드 주소 설정 ---
FRONTEND_MAIN_URL = "/" # 메인 페이지 경로
FRONTEND_PREFERENCES_URL = "/taste" # 취향 선택 페이지 경로

router = APIRouter()

# --- 2. 로그인 처리 API ---
@router.post("/kakao/process-login", response_model=schemas.Token)
async def process_kakao_login(kakao_code: schemas.KakaoCode, db: Session = Depends(database.get_db)):
    """
    프론트엔드(JS SDK)로부터 받은 인가 코드를 사용하여 카카오 토큰을 발급받고,
    사용자 정보를 처리한 후 서비스 JWT와 다음 이동 경로를 반환합니다.
    """
    try:
        # 1. 인가 코드로 액세스 토큰 요청
        token_url = "https://kauth.kakao.com/oauth/token"
        token_data = {
            "grant_type": "authorization_code",
            "client_id": KAKAO_REST_API_KEY,
            "redirect_uri": KAKAO_REDIRECT_URI, 
            "code": kakao_code.code,
        }
        token_res = requests.post(token_url, data=token_data)
        token_res.raise_for_status()
        access_token = token_res.json().get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="액세스 토큰 발급 실패")

        # 2. 사용자 정보 조회

        # 3. DB에서 사용자 확인 및 신규 등록
        
        # 4. 사용자의 취향 정보 확인 후 '다음 경로' 결정

        # 5. 우리 서비스 전용 JWT 생성
        payload = {"sub": str(db_user.user_id), "nickname": db_user.username, "exp": datetime.utcnow() + timedelta(days=1)}
        service_token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        
        # 6. JWT 토큰과 다음 경로를 JSON으로 프론트엔드에 반환
        return JSONResponse(content={
            "access_token": service_token,
            "token_type": "bearer",
            "next_action": next_action_url
        })

    except requests.RequestException as e:
        raise HTTPException(status_code=500, detail=f"카카오 API 통신 오류: {e}")
    except Exception as e:
        print(f"로그인 처리 중 오류 발생: {e}")
        raise HTTPException(status_code=500, detail=f"로그인 처리 중 서버 오류 발생")


# --- 3. 사용자 취향 저장 API ---
@router.put("/me/preferences", status_code=status.HTTP_204_NO_CONTENT)
def update_user_preferences(
    prefs_data: schemas.UserPreferencesUpdate, # schemas에서 import
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user) 
):
    """
    현재 로그인된 사용자의 취향 정보를 DB에 업데이트(저장)합니다.
    """
    prefs_string = ",".join(prefs_data.preferences) if prefs_data.preferences else ""
    
    try:
        current_user.preferences = prefs_string
        db.commit() 
    except Exception as e:
        db.rollback() 
        print(f"취향 저장 중 DB 오류: {e}")
        raise HTTPException(status_code=500, detail="취향 정보 저장 중 오류가 발생했습니다.")
        
    return Response(status_code=status.HTTP_204_NO_CONTENT)


# --- 4. 사용자 취향 조회 API ---
@router.get("/me/preferences", response_model=schemas.UserPreferencesResponse)
def get_user_preferences(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user) 
):
    """
    현재 로그인된 사용자의 저장된 취향 정보를 반환합니다.
    """
    if current_user.preferences:
        prefs_list = current_user.preferences.split(',')
        return {"preferences": prefs_list}
    else:
        return {"preferences": None}

# --- 테스트용 토큰 발급 API ---
@router.get("/test-token/{user_id}", tags=["Test"], response_model=schemas.Token)
def get_test_token(user_id: int):
    payload = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(days=7), 
    }
    service_token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return {"access_token": service_token, "token_type": "bearer" }

