# /routers 폴더에 있는 모든 API 엔드포인트들을 하나로 묶어 main.py에 연결하는 중앙 허브

from fastapi import APIRouter
from routers import users, trips, recommend

api_router = APIRouter()

api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(trips.router, prefix="/trips", tags=["Trips"])
api_router.include_router(recommend.router, prefix="/recommendations", tags=["Recommendations"])
