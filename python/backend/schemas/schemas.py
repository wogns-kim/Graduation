# Pydantic을 사용하여 API의 요청(Request) 및 응답(Response) 데이터 형식을 정의하고 검증

from pydantic import BaseModel, Field
from typing import List, Optional, Dict

# --- User ---
class UserSimple(BaseModel):
    user_id: int
    username: str
    profile_image_url: Optional[str] = None

    class Config:
        orm_mode = True

# --- Kakao Login (users.py에서 사용) ---
class KakaoCode(BaseModel):
    code: str

class Token(BaseModel): # JWT 토큰 응답용
    access_token: str
    token_type: str

# --- Preferences (users.py에서 사용) ---
class UserPreferencesUpdate(BaseModel):
    preferences: List[str] = Field(..., description="사용자가 선택한 취향 해시태그 목록")

class UserPreferencesResponse(BaseModel):
    preferences: Optional[List[str]] = Field(None, description="저장된 취향 해시태그 목록, 없으면 null")

# --- Trip ---
class TripCreate(BaseModel):
    trip_name: str

class Trip(BaseModel):
    trip_id: int
    trip_name: str
    owner_id: int
    shareable_link_id: str

    class Config:
        orm_mode = True

# --- ItineraryItem ---
class ItineraryItem(BaseModel):
    item_id: int
    place_name: str
    order_in_day: int

    class Config:
        orm_mode = True

# --- Trip Details ---
class TripDetailsResponse(BaseModel):
    trip_name: str
    participants: List[UserSimple]
    # 날짜별 구분을 포함한 복잡한 일정 구조
    # 예: { "user_id_1": { "DAY 1": [...], "DAY 2": [...] } }
    itineraries: Dict[str, Dict[str, List[ItineraryItem]]]

# --- Recommendation (recommend.py에서 사용) ---
class RecommendationResponse(BaseModel):
    theme: str
    # "DAY 1": ["장소1", "장소2"] 와 같은 객체(Dict) 형식으로 받도록 수정
    route: Dict[str, List[str]]

    class Config:
        orm_mode = True # SQLAlchemy 모델과 호환되도록 설정 (현재는 불필요)
        from_attributes = True # Pydantic V2 호환성