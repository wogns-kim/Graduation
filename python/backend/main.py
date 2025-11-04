# main.py (테스트용)

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI
from api.routers import api_router
from database import database
from models import models

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="User Authentication Test Server",
    description="users.py의 API를 테스트하기 위한 서버입니다.",
)

app.include_router(api_router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "테스트 서버가 성공적으로 실행되었습니다. /docs 로 이동하여 API를 확인하세요."}