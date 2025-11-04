from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
import uuid

from database import database
from schemas import schemas
from models import models
from auth.auth import get_current_user

router = APIRouter()

# --- 1. 새로운 여행 계획 생성 API ---
@router.post("/", response_model=schemas.Trip, status_code=status.HTTP_201_CREATED)
def create_trip(
    trip: schemas.TripCreate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    # 실제 로그인된 사용자의 ID를 사용합니다.
    new_trip = models.Trip(
        trip_name=trip.trip_name,
        owner_id=current_user.user_id,
        shareable_link_id=str(uuid.uuid4())[:8] # 공유 코드를 8자리로 짧게 생성
    )
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)

    # 여행 생성자를 공동 작업자 테이블에도 추가
    new_collaborator = models.Collaborator(trip_id=new_trip.trip_id, user_id=current_user.user_id)
    db.add(new_collaborator)
    db.commit()

    return new_trip

# --- 2. 내가 만든/참여한 여행 계획 목록 조회 API ---
@router.get("/my-trips", response_model=List[schemas.Trip])
def get_my_trips(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # 실제 로그인된 사용자의 ID를 사용합니다.
    my_trips = db.query(models.Trip).join(models.Collaborator).filter(models.Collaborator.user_id == current_user.user_id).all()
    
    return my_trips

# --- 3. 특정 여행 계획 삭제 API ---
@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(
    trip_id: int, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    trip_to_delete = db.query(models.Trip).filter(models.Trip.trip_id == trip_id).first()
    if not trip_to_delete:
        raise HTTPException(status_code=404, detail="여행 계획을 찾을 수 없습니다.")

    # 실제 로그인된 사용자의 ID와 비교하여 본인만 삭제 가능하도록 함
    if trip_to_delete.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="삭제 권한이 없습니다.")

    db.delete(trip_to_delete)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT) 

# --- 4. 코드를 이용해 여행에 참여하는 API ---
@router.post("/{shareable_link_id}/join", status_code=status.HTTP_201_CREATED)
def join_trip(
    shareable_link_id: str, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    trip = db.query(models.Trip).filter(models.Trip.shareable_link_id == shareable_link_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="해당 코드를 가진 여행 계획을 찾을 수 없습니다.")

    # 이미 참여하고 있는지 확인
    existing_collaborator = db.query(models.Collaborator).filter(
        models.Collaborator.trip_id == trip.trip_id,
        models.Collaborator.user_id == current_user.user_id
    ).first()

    if existing_collaborator:
        raise HTTPException(status_code=409, detail="이미 참여하고 있는 여행 계획입니다.")

    # 새 공동 작업자 추가
    new_collaborator = models.Collaborator(trip_id=trip.trip_id, user_id=current_user.user_id)
    db.add(new_collaborator)
    db.commit()
    
    return {"message": f"'{trip.trip_name}' 여행에 성공적으로 참여했습니다."}

# --- 5. 특정 여행의 모든 상세 정보 조회 API ---
@router.get("/{shareable_link_id}/details", response_model=schemas.TripDetailsResponse)
def get_trip_details(
    shareable_link_id: str, 
    db: Session = Depends(database.get_db),
    # current_user: models.User = Depends(get_current_user) # 로그인을 해야 접근 가능하도록 설정
):
    trip = db.query(models.Trip).filter(models.Trip.shareable_link_id == shareable_link_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="여행 계획을 찾을 수 없습니다.")

    # 1. 참여자 목록 조회 (User 정보까지 함께 로드 - joinedload 사용)
    collaborators = db.query(models.Collaborator).options(joinedload(models.Collaborator.user)).filter(models.Collaborator.trip_id == trip.trip_id).all()
    participants = [col.user for col in collaborators] # User 객체만 추출

    # 2. 모든 일정 항목 조회 (Place 이름까지 함께 로드)
    # SQLAlchemy의 join과 label을 사용하여 필요한 컬럼만 선택
    items_query = db.query(
        models.ItineraryItem.item_id,
        models.ItineraryItem.user_id,
        models.Place.place_name,
        models.ItineraryItem.visit_day_str, # 날짜 정보 추가
        models.ItineraryItem.order_in_day
    ).join(models.Place, models.ItineraryItem.place_id == models.Place.place_id)\
     .filter(models.ItineraryItem.trip_id == trip.trip_id)\
     .order_by(models.ItineraryItem.visit_day_str, models.ItineraryItem.order_in_day)\
     .all()

    # 3. 사용자별 + 날짜별로 일정 그룹화 (더 복잡한 구조)
    # 예: itineraries['user_id']['DAY 1'] = [...]
    itineraries_by_user_day = {str(p.user_id): {} for p in participants} 
    for item in items_query:
        user_id_str = str(item.user_id)
        day_str = item.visit_day_str
        
        if user_id_str not in itineraries_by_user_day: continue # 참여자가 아닌 경우 스킵(이론상 없어야 함)
        
        if day_str not in itineraries_by_user_day[user_id_str]:
            itineraries_by_user_day[user_id_str][day_str] = []

        itinerary_item_schema = schemas.ItineraryItem(
            item_id=item.item_id,
            place_name=item.place_name,
            order_in_day=item.order_in_day
        )
        itineraries_by_user_day[user_id_str][day_str].append(itinerary_item_schema)
            
    # 최종 응답 구조에 맞게 변환 (schemas.py 수정 필요 가능성 있음)
    # 현재 스키마는 itineraries: Dict[str, List[ItineraryItem]] 이므로, 
    # 날짜별 구분을 포함하도록 스키마를 업데이트하거나, 여기서 데이터를 재구성해야 함.
    # 임시로 user_id별 첫 날짜의 일정만 반환하는 방식으로 단순화 (스키마 호환)
    final_itineraries = {}
    for user_id_str, days_data in itineraries_by_user_day.items():
        if days_data: # 해당 유저의 일정이 있다면
            first_day = sorted(days_data.keys())[0] # 첫 날짜 기준으로 임시 반환
            final_itineraries[user_id_str] = days_data[first_day]
        else:
             final_itineraries[user_id_str] = []
            
    return {
        "trip_name": trip.trip_name,
        "participants": participants,
        "itineraries": final_itineraries # 최종 가공된 일정 데이터
    }
