# Pydantic을 사용하여 API의 요청(Request) 및 응답(Response) 데이터 형식을 정의하고 검증

from pydantic import BaseModel, Field
from typing import List, Optional, Dict

# --- User ---
class UserSimple(BaseModel):
    user_id: int
    username: str
    profile_image_url: Optional[str] = None

    class Config:
        from_attributes = True

# --- Kakao Login (users.py에서 사용) ---
class KakaoCode(BaseModel):
    code: str

class Token(BaseModel): # JWT 토큰 응답용
    access_token: str
    token_type: str
    next_action: Optional[str] = None # 로그인 후 다음 이동 경로

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
        from_attributes = True

# --- ItineraryItem ---
class ItineraryItem(BaseModel):
    item_id: int
    place_name: str
    order_in_day: int

    class Config:
        from_attributes = True

# --- Trip Details ---
class TripDetailsResponse(BaseModel):
    trip_name: str
    participants: List[UserSimple]
    # 날짜별 구분을 포함한 복잡한 일정 구조
    # 예: { "user_id_1": { "DAY 1": [...], "DAY 2": [...] } }
    itineraries: Dict[str, Dict[str, List[ItineraryItem]]]

# --- Recommendation (recommend.py에서 사용) ---
class RecommendationResponse(BaseModel):
    route: Dict[str, List[str]] # "DAY 1": ["장소1", "장소2"] ...
    alternatives: Optional[List[str]] = None # "대안장소A", "대안장소B" ...

    class Config:
        from_attributes = True