# 사용자 인증(카카오 로그인, JWT 발급 등)과 관련된 모든 API를 담당합니다.

from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import requests
from jose import jwt
from datetime import datetime, timedelta
# SQLAlchemy 방식 (인증된 API용)
from database import database
from models import models
from auth.auth import get_current_user 
# 수동 연결 방식 (로그인 API용)
import mysql.connector
from mysql.connector import Error
# Pydantic 스키마 import
from schemas import schemas 
from typing import List, Optional

# --- 설정 ---
KAKAO_REST_API_KEY = "8abfe377ab126ace7e541f101103470d"
KAKAO_REDIRECT_URI = "http://localhost:5173/auth/kakao/callback"
JWT_SECRET_KEY = "super-secret-key"
JWT_ALGORITHM = "HS256"

# --- 프론트엔드 주소 설정 ---
FRONTEND_MAIN_URL = "/"
FRONTEND_PREFERENCES_URL = "/taste"

# --- 수동 DB 연결용 설정 ---
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '!j76684133', # 본인의 DB 비밀번호로 수정
    'database': 'first_trip'
}

router = APIRouter()

# --- 1. 로그인 처리 API ---
@router.post("/kakao/process-login", response_model=schemas.Token)
async def process_kakao_login(kakao_code: schemas.KakaoCode):
    """
    (수동 DB 연결) 프론트엔드(JS SDK)로부터 받은 인가 코드를 사용하여
    카카오 토큰 발급, 사용자 정보 조회, DB 처리 후 JWT를 반환합니다.
    """
    try:
        # 1-1. 인가 코드로 액세스 토큰 요청
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

        # 1-2. 액세스 토큰으로 사용자 정보 조회
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

        # 닉네임이 None일 경우 임시 닉네임 생성
        nickname = nickname_from_kakao or f"user_{kakao_id}"

    except requests.RequestException as e:
        # 카카오 API 통신 자체에서 오류가 나면 여기서 멈춤
        raise HTTPException(status_code=500, detail=f"카카오 API 통신 오류: {e}")

    # 2. DB 연결
    conn = None  #DB와 연결하는 객체 변수
    cursor = None # DB와 상호작용하는 수행자 변수
    user_in_db = None #DB에 가져올 사용자 정보를 임시로 담는 변수

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True) # cursor.fetchone()의 결과를 딕셔너리(key-value) 형태로 받기 위해 dictionary=True 설정

        query = "SELECT * FROM USERS WHERE kakao_id = %s"  #query 변수에 sql 명령어 텍스트 저장, user 테이블에서 컬럼 정보 찾기, 내가 알려줄 값과 일치하는 회원 찾기
        cursor.execute(query, (kakao_id,)) # query 명령어와 kakao_id 데이터 조회
        user_in_db = cursor.fetchone() # fetchone -> 딱 한개만 가져오게 함 그걸 user_in_db 에 저장

        if user_in_db:
            # -----기존 회원-------
            print(f"기존 회원 로그인: {user_in_db['username']} (우리 DB ID: {user_in_db['user_id']})") # 확인용 출력
            
            #  최신 정보로 DB 업데이트 (바뀌면 update, 그대로면 유지), 업데이트 정보 양식
            update_query = """
                UPDATE USERS 
                SET username = %s, email = %s, profile_image_url = %s 
                WHERE kakao_id = %s
            """
            cursor.execute(update_query, (nickname, email, profile_image_url, kakao_id)) # cursor에게 양식과 정보 전달해 수정 시키게 함
            conn.commit() # 변경사항 저장, (UPDATE, INSERT, DELETE)는 반드시 commit() 필요
            
            # JWT 생성을 위해 최신 정보로 업데이트
            user_in_db['username'] = nickname
            user_in_db['email'] = email
            user_in_db['profile_image_url'] = profile_image_url

        else:
            # ------- 신규 회원 (테이블에 insert) ------
            print(f"신규 회원 가입: {nickname}")  # 확인용 출력

            # SQL 스키마에 맞게 INSERT, 신규 등록 양식
            insert_query = """
                INSERT INTO USERS (kakao_id, username, email, profile_image_url) 
                VALUES (%s, %s, %s, %s)
            """
            cursor.execute(insert_query, (kakao_id, nickname, email, profile_image_url)) # cursor에게 양식과 정보 전달에 등록하게 시킴
            conn.commit() # DB에 최종 저장 (커밋)
            
            # 방금 가입시킨 새 회원의 정보를 가져와야 함 (특히 새로 생성된 'user_id')
            new_user_id = cursor.lastrowid # 방금 INSERT된 행의 user_id의 고유 번호를 가져옴
            user_in_db = {
                "user_id": new_user_id,
                "kakao_id": kakao_id,
                "username": nickname,
                "email": email,
                "preferences": None 
            }
            
        # --- 3. JWT 생성 및 응답 (try 블록 안으로 이동) ---
        if user_in_db and user_in_db.get('preferences'):
            next_action_url = FRONTEND_MAIN_URL
        else:
            next_action_url = FRONTEND_PREFERENCES_URL

        payload = {
            "sub": str(user_in_db['user_id']), # user_in_db가 None이면 여기서 TypeError 발생
            "nickname": user_in_db.get('username'),
            "exp": datetime.utcnow() + timedelta(days=1),
        }
        service_token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
        
        return JSONResponse(content={
            "access_token": service_token,
            "token_type": "bearer",
            "next_action": next_action_url
        })

    except Error as e: # 1. DB 관련 오류만 잡기
        if conn: conn.rollback()
        print(f"--- !!! DB 오류 발생 !!! ---: {e}") 
        raise HTTPException(status_code=500, detail="데이터베이스 처리 중 오류가 발생했습니다.")
    except Exception as e: # 2. 그 외 모든 오류 (TypeError, KeyError 등) 잡기
        if conn: conn.rollback()
        # --- !!! 여기가 Traceback을 보여줄 부분입니다 !!! ---
        print(f"--- !!! 로직 오류 발생 (Traceback 확인) !!! ---: {e}")
        # 터미널에 상세한 Traceback을 출력합니다.
        import traceback
        traceback.print_exc() 
        raise HTTPException(status_code=500, detail=f"서버 내부 로직 오류: {e}")
    finally: 
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

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
    지정된 user_id에 대한 테스트용 JWT 토큰을 발급합니다. (개발 단계에서만 사용)
    """
    payload = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(days=7),
    }
    service_token = jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return {"access_token": service_token, "token_type": "bearer" }