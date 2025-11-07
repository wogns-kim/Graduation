# routers/users.py
# 사용자 인증 API (전체 SQLAlchemy 방식)
# 500 오류 추적을 위해 모든 except 블록에 Traceback 프린트 추가

from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import requests
from jose import jwt
from datetime import datetime, timedelta
import traceback
from database import database
from models import models
from auth.auth import get_current_user 
from schemas import schemas 
from typing import List, Optional

# --- 설정 ---
KAKAO_REST_API_KEY = "8f796f4dc0ce5b285971669365326acc"
KAKAO_REDIRECT_URI = "http://localhost:5173/auth/kakao/callback" # 프론트엔드 팝업 경로
JWT_SECRET_KEY = "super-secret-key"
JWT_ALGORITHM = "HS256"

# --- 프론트엔드 주소 설정 ---
FRONTEND_MAIN_URL = "/"
FRONTEND_PREFERENCES_URL = "/taste"

router = APIRouter()

# --- 1. 로그인 처리 API ---
@router.post("/kakao/process-login", response_model=schemas.Token)
async def process_kakao_login(kakao_code: schemas.KakaoCode, db: Session = Depends(database.get_db)):
    """
    (SQLAlchemy) 프론트엔드(JS SDK)로부터 받은 인가 코드를 사용하여
    카카오 토큰 발급, 사용자 정보 조회, DB 처리 후 JWT를 반환합니다.
    """
    # --- 1. 카카오 API 통신 ---
    try:
        token_url = "https://kauth.kakao.com/oauth/token"
        token_data = {
            "grant_type": "authorization_code",
            "client_id": KAKAO_REST_API_KEY,
            "redirect_uri": KAKAO_REDIRECT_URI,
            "code": kakao_code.code,
        }
        print(f"카카오 토큰 요청 데이터: {token_data}")

        token_res = requests.post(token_url, data=token_data)
        token_res.raise_for_status()
        access_token = token_res.json().get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="액세스 토큰 발급 실패")

        user_info_url = "https://kapi.kakao.com/v2/user/me"
        headers = {"Authorization": f"Bearer {access_token}"}
        user_info_res = requests.get(user_info_url, headers=headers)
        user_info_res.raise_for_status()
        user_info = user_info_res.json()
        
        kakao_id = user_info.get("id")
        nickname_from_kakao = user_info.get("properties", {}).get("nickname")
        email = user_info.get("kakao_account", {}).get("email")
        profile_image_url = user_info.get("properties", {}).get("profile_image")

        if not kakao_id:
            raise HTTPException(status_code=400, detail="사용자 정보 조회 실패")

        nickname = nickname_from_kakao or f"user_{kakao_id}"

    except requests.RequestException as e:
        print(f"--- !!! 카카오 API 통신 오류 발생 !!! ---: {e}")
        if e.response is not None:
             try:
                 print(f"카카오 서버 응답: {e.response.json()}")
             except ValueError:
                 print(f"카카오 서버 응답 (JSON 아님): {e.response.text}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"카카오 API 통신 오류: {e}")

    # --- 2. DB 작업 및 JWT 생성 ---
    try:
        db_user = db.query(models.User).filter(models.User.kakao_id == kakao_id).first()

        if db_user:
            # --- 기존 회원 ---
            print(f"기존 회원 로그인: {db_user.username} (DB ID: {db_user.user_id})")
            db_user.username = nickname
            db_user.email = email
            db_user.profile_image_url = profile_image_url
            db.commit() 
            db.refresh(db_user)
        else:
            # --- 신규 회원 ---
            print(f"신규 회원 가입: {nickname}")
            new_user = models.User(
                kakao_id=kakao_id, 
                username=nickname,
                email=email, 
                profile_image_url=profile_image_url, 
                preferences=None
            )
            db.add(new_user)
            db.commit() 
            db.refresh(new_user)
            db_user = new_user

        # 3. 사용자의 취향 정보 확인 후 '다음 경로' 결정
        print(f"--- [디버깅] 사용자 '{db_user.username}'의 취향 정보 확인 ---")
        print(f"--- [디버깅] DB에서 가져온 preferences 값: '{db_user.preferences}'")
        print(f"--- [디버깅] 값의 타입(Type): {type(db_user.preferences)}")

        # 'if db_user.preferences:' 대신,
        # 'None'이거나 '빈 문자열'이 아니면 True로 판단하도록 명확하게 수정합니다.
        if db_user.preferences is not None and db_user.preferences != "":
            # 이 조건이 True가 되면 메인 페이지로 갑니다.
            print("--- [디버깅] 조건문 결과: True (메인 페이지로 이동)")
            next_action_url = FRONTEND_MAIN_URL
        else:
            # 이 조건이 False가 되어야 /taste로 갑니다.
            # (db_user.preferences가 None이거나 "" 일 경우)
            print("--- [디버깅] 조건문 결과: False (취향 선택 페이지로 이동)")
            next_action_url = FRONTEND_PREFERENCES_URL

        # 4. 우리 서비스 전용 JWT 생성
        payload = {
            "sub": str(db_user.user_id),
            "nickname": db_user.username,
            "exp": datetime.utcnow() + timedelta(days=1),
        }
        service_token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        
        return JSONResponse(content={
            "access_token": service_token,
            "token_type": "bearer",
            "next_action": next_action_url
        })

    except Exception as e: # DB 오류 또는 기타 모든 오류
        db.rollback() # 오류 발생 시 DB 변경사항 되돌리기
        print(f"--- !!! DB 또는 JWT 처리 오류 발생 !!! ---: {e}")
        import traceback
        traceback.print_exc() 
        raise HTTPException(status_code=500, detail=f"서버 내부 오류 (DB/JWT): {e}")
    

# --- 2. 사용자 취향 저장 API ---
@router.put("/me/preferences", status_code=status.HTTP_204_NO_CONTENT)
def update_user_preferences(
    prefs_data: schemas.UserPreferencesUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    (SQLAlchemy) 현재 로그인된 사용자의 취향 정보를 DB에 업데이트(저장)합니다.
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


# --- 3. 사용자 취향 조회 API ---
@router.get("/me/preferences", response_model=schemas.UserPreferencesResponse)
def get_user_preferences(
    current_user: models.User = Depends(get_current_user)
):
    """
    (SQLAlchemy) 현재 로그인된 사용자의 저장된 취향 정보를 반환합니다.
    """
    if current_user.preferences:
        prefs_list = current_user.preferences.split(',')
        return {"preferences": prefs_list}
    else:
        return {"preferences": None}

# --- 4. 테스트용 임시 토큰 발급 API ---
@router.get("/test-token/{user_id}", tags=["Test"], response_model=schemas.Token)
def get_test_token(user_id: int):
    """
    지정된 user_id에 대한 테스트용 JWT 토큰을 발급합니다. (개발 단계에서만 사용!)
    """
    payload = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(days=7),
    }
    service_token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return {"access_token": service_token, "token_type": "bearer" }