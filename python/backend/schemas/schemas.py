from pydantic import BaseModel, Field
from typing import List, Optional, Dict

# --- User ---
class UserSimple(BaseModel):
    user_id: int
    username: str
    profile_image_url: Optional[str] = None

    class Config:
        from_attributes = True 

# --- Kakao Login ---
class KakaoCode(BaseModel):
    code: str

class Token(BaseModel):
    access_token: str
    token_type: str
    next_action: Optional[str] = None

# --- Preferences ---
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

# --- Place ---
class PlaceSchema(BaseModel):
    place_id: int
    place_name: str
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    category: Optional[str] = None

    class Config:
        from_attributes = True

# --- ItineraryItem ---
class ItineraryItemSimple(BaseModel):
    item_id: int
    place_id: int
    place_name: str
    order_in_day: int
    
    class Config:
        from_attributes = True

class ItemCreate(BaseModel):
    place_id: int
    visit_day_str: str 
    order_in_day: int

class ItemReorder(BaseModel):
    visit_day_str: str
    ordered_item_ids: List[int]

# --- Trip Details ---
class TripDetailsResponse(BaseModel):
    trip_name: str
    participants: List[UserSimple]
    itineraries: Dict[str, Dict[str, List[ItineraryItemSimple]]]

# --- Recommendation ---
class RecommendationResponse(BaseModel):
    theme: Optional[str] = None 
    route: Dict[str, List[str]]
    alternatives: Optional[List[str]] = None

    class Config:
        from_attributes = True 

# --- Trip History (Undo) ---
class TripActionResponse(BaseModel):
    action_id: int
    action_type: str
    created_at: object # datetime 객체 호환
    user_name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True