# main.py
# FastAPI 애플리케이션의 메인 실행 파일입니다.

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import api_router
from database import database
from models import models

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="FIRST TRIP API",
    description="실시간 협업 여행 플래너 백엔드 API",
    version="1.0.0",
)

# 허용할 출처(프론트엔드 주소) 목록 정의
origins = [
    "http://localhost:5173", # Vite (React) 개발 서버 주소
    # (향후 배포 시 Vercel 주소 등을 여기에 추가해야 함)
]

# CORSMiddleware를 앱에 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # origins 목록에 있는 출처의 요청을 허용
    allow_credentials=True,    # 쿠키를 포함한 요청을 허용
    allow_methods=["*"],         # 모든 HTTP 메소드(GET, POST, PUT, DELETE 등)를 허용
    allow_headers=["*"],         # 모든 HTTP 헤더를 허용
)

# '/api' 경로로 들어오는 모든 요청을 api_router가 처리하도록 포함시킴.
app.include_router(api_router, prefix="/api")

# 기본 경로('/')에 대한 간단한 응답
@app.get("/")
def read_root():
    return {"message": "FIRST TRIP 백엔드 서버에 오신 것을 환영합니다!"}