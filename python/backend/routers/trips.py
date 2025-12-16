# 여행 계획(Trip) 생성/조회/삭제 및 공동 작업자 관리
# 일정 항목(Itinerary Item) 추가/삭제/순서 변경 및 실행 취소(Undo) 기능

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session, joinedload
from typing import List, Dict, Optional
import uuid
import json 

# 프로젝트의 다른 모듈들을 가져옵니다.
from database import database
from schemas import schemas
from models import models
from auth.auth import get_current_user

router = APIRouter()

# =============================================================================
# 헬퍼 함수 (권한 확인 및 로그 기록)
# =============================================================================

def check_collaborator_permission(trip_id: int, user_id: int, db: Session) -> models.Trip:
    """
    사용자가 해당 여행의 공동 작업자인지 확인합니다.
    권한이 없거나 여행이 존재하지 않으면 예외를 발생시킵니다.
    """
    trip = db.query(models.Trip).filter(models.Trip.trip_id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="여행 계획을 찾을 수 없습니다.")

    collaborator = db.query(models.Collaborator).filter(
        models.Collaborator.trip_id == trip_id,
        models.Collaborator.user_id == user_id
    ).first()
    
    if not collaborator:
        raise HTTPException(status_code=403, detail="이 여행 계획을 수정할 권한이 없습니다.")
    
    return trip

def log_action(db: Session, trip_id: int, user_id: int, action_type: str, item_id_affected: Optional[int] = None, previous_state: Optional[dict] = None):
    """
    TRIP_ACTIONS 테이블에 변경 이력을 기록합니다. (Undo 기능을 위해 사용)
    """
    new_action = models.TripAction(
        trip_id=trip_id,
        user_id=user_id,
        action_type=action_type,
        item_id_affected=item_id_affected,
        previous_state=json.dumps(previous_state, ensure_ascii=False) if previous_state else None
    )
    db.add(new_action)


# =============================================================================
# 1. 여행(Trip) 기본 관리 API
# =============================================================================

@router.post("/", response_model=schemas.Trip, status_code=status.HTTP_201_CREATED)
def create_trip(
    trip: schemas.TripCreate, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """
    새로운 여행 계획을 생성하고, 생성자를 공동 작업자로 등록합니다.
    """
    new_trip = models.Trip(
        trip_name=trip.trip_name,
        owner_id=current_user.user_id,
        shareable_link_id=str(uuid.uuid4())[:8]
    )
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)

    new_collaborator = models.Collaborator(trip_id=new_trip.trip_id, user_id=current_user.user_id)
    db.add(new_collaborator)
    db.commit()

    return new_trip

@router.get("/my-trips", response_model=List[schemas.Trip])
def get_my_trips(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    현재 로그인한 사용자가 참여 중인 모든 여행 계획 목록을 조회합니다.
    """
    my_trips = db.query(models.Trip).join(models.Collaborator).filter(models.Collaborator.user_id == current_user.user_id).all()
    return my_trips

@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_trip(
    trip_id: int, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    특정 여행 계획을 삭제합니다. (소유자만 가능)
    """
    trip_to_delete = db.query(models.Trip).filter(models.Trip.trip_id == trip_id).first()
    if not trip_to_delete:
        raise HTTPException(status_code=404, detail="여행 계획을 찾을 수 없습니다.")

    if trip_to_delete.owner_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="여행의 소유자만 삭제할 권한이 있습니다.")
    
    db.delete(trip_to_delete)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT) 

@router.post("/{shareable_link_id}/join", status_code=status.HTTP_201_CREATED)
def join_trip(
    shareable_link_id: str, 
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    공유 코드를 통해 다른 사용자의 여행 계획에 참여합니다.
    """
    trip = db.query(models.Trip).filter(models.Trip.shareable_link_id == shareable_link_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="해당 코드를 가진 여행 계획을 찾을 수 없습니다.")

    existing_collaborator = db.query(models.Collaborator).filter(
        models.Collaborator.trip_id == trip.trip_id,
        models.Collaborator.user_id == current_user.user_id
    ).first()

    if existing_collaborator:
        raise HTTPException(status_code=409, detail="이미 참여하고 있는 여행 계획입니다.")

    new_collaborator = models.Collaborator(trip_id=trip.trip_id, user_id=current_user.user_id)
    db.add(new_collaborator)
    db.commit()
    
    return {"message": f"'{trip.trip_name}' 여행에 성공적으로 참여했습니다."}

# ★ [수정됨] shareable_link_id(문자열) 대신 trip_id(숫자)로 조회하도록 변경
@router.get("/{trip_id}/details", response_model=schemas.TripDetailsResponse)
def get_trip_details(
    trip_id: int, 
    db: Session = Depends(database.get_db)
):
    """
    특정 여행 계획의 상세 정보(참여자, 날짜별 일정 등)를 모두 조회합니다.
    """
    # 1. trip_id로 조회 변경
    trip = db.query(models.Trip).filter(models.Trip.trip_id == trip_id).first()
    
    if not trip:
        raise HTTPException(status_code=404, detail="여행 계획을 찾을 수 없습니다.")

    # 1. 참여자 목록 조회
    participants_query = db.query(models.User).join(models.Collaborator).filter(models.Collaborator.trip_id == trip.trip_id).all()
    participants = [schemas.UserSimple.from_orm(p) for p in participants_query]

    # 2. 모든 일정 항목 조회
    items_query = db.query(
        models.ItineraryItem.item_id,
        models.ItineraryItem.user_id,
        models.Place.place_name,
        models.Place.place_id,
        models.ItineraryItem.visit_day_str,
        models.ItineraryItem.order_in_day
    ).join(models.Place, models.ItineraryItem.place_id == models.Place.place_id)\
     .filter(models.ItineraryItem.trip_id == trip.trip_id)\
     .order_by(models.ItineraryItem.visit_day_str, models.ItineraryItem.order_in_day)\
     .all()

    # 3. 사용자별 + 날짜별로 일정 그룹화
    itineraries_by_user_day = {str(p.user_id): {} for p in participants} 
    for item in items_query:
        user_id_str = str(item.user_id)
        day_str = item.visit_day_str
        
        if user_id_str not in itineraries_by_user_day: continue
        if day_str not in itineraries_by_user_day[user_id_str]:
            itineraries_by_user_day[user_id_str][day_str] = []

        itinerary_item_schema = schemas.ItineraryItemSimple(
            item_id=item.item_id,
            place_id=item.place_id,
            place_name=item.place_name,
            order_in_day=item.order_in_day
        )
        itineraries_by_user_day[user_id_str][day_str].append(itinerary_item_schema)
            
    return {
        "trip_name": trip.trip_name,
        "participants": participants,
        "itineraries": itineraries_by_user_day,
        "shareable_link_id": trip.shareable_link_id  # 공유 링크 ID도 반환
    }


# =============================================================================
# 2. 일정 항목(Itinerary Item) 수정 API
# =============================================================================

@router.post("/{trip_id}/items", response_model=schemas.ItineraryItemSimple)
def add_itinerary_item(
    trip_id: int,
    item_data: schemas.ItemCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    여행 계획에 새로운 장소를 추가하고, 변경 이력을 로그에 저장합니다.
    """
    check_collaborator_permission(trip_id, current_user.user_id, db)
    
    place = db.query(models.Place).filter(models.Place.place_id == item_data.place_id).first()
    if not place:
        raise HTTPException(status_code=404, detail=f"Place ID {item_data.place_id}를 찾을 수 없습니다.")

    try:
        new_item = models.ItineraryItem(
            trip_id=trip_id,
            place_id=item_data.place_id,
            user_id=current_user.user_id,
            visit_day_str=item_data.visit_day_str,
            order_in_day=item_data.order_in_day
        )
        db.add(new_item)
        db.flush() 

        # [로그 기록] ADD 액션
        log_action(db, trip_id, current_user.user_id, 'ADD', item_id_affected=new_item.item_id)
        
        db.commit()
        db.refresh(new_item)
        
        return schemas.ItineraryItemSimple(
            item_id=new_item.item_id,
            place_id=new_item.place_id,
            place_name=place.place_name,
            order_in_day=new_item.order_in_day
        )
    except Exception as e:
        db.rollback()
        print(f"일정 항목 추가 중 오류: {e}")
        raise HTTPException(status_code=500, detail="일정 항목 추가 중 오류가 발생했습니다.")

@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_itinerary_item(
    item_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    여행 계획에서 특정 장소를 삭제하고, 변경 이력을 로그에 저장합니다.
    """
    item = db.query(models.ItineraryItem).filter(models.ItineraryItem.item_id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="삭제할 일정 항목을 찾을 수 없습니다.")
    
    check_collaborator_permission(item.trip_id, current_user.user_id, db)
    
    try:
        # [로그 기록] DELETE 액션 (삭제 전 상태 백업)
        prev_state = {
            "trip_id": item.trip_id,
            "place_id": item.place_id,
            "user_id": item.user_id,
            "visit_day_str": item.visit_day_str,
            "order_in_day": item.order_in_day
        }
        log_action(db, item.trip_id, current_user.user_id, 'DELETE', item_id_affected=item.item_id, previous_state=prev_state)
        
        db.delete(item)
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        db.rollback()
        print(f"일정 항목 삭제 중 오류: {e}")
        raise HTTPException(status_code=500, detail="일정 항목 삭제 중 오류가 발생했습니다.")

@router.put("/trips/{trip_id}/items/reorder", status_code=status.HTTP_204_NO_CONTENT)
def reorder_itinerary_items(
    trip_id: int,
    reorder_data: schemas.ItemReorder,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    특정 날짜의 장소 방문 순서를 변경하고, 변경 이력을 로그에 저장합니다.
    """
    check_collaborator_permission(trip_id, current_user.user_id, db)
    
    try:
        current_items = db.query(models.ItineraryItem).filter(
            models.ItineraryItem.trip_id == trip_id,
            models.ItineraryItem.visit_day_str == reorder_data.visit_day_str
        ).all()
        
        # [로그 기록] REORDER 액션 (변경 전 순서 백업)
        prev_state = {item.item_id: item.order_in_day for item in current_items}
        log_action(db, trip_id, current_user.user_id, 'REORDER', previous_state=prev_state)
        
        # 순서 업데이트
        for idx, item_id in enumerate(reorder_data.ordered_item_ids):
            item = next((i for i in current_items if i.item_id == item_id), None)
            if item:
                item.order_in_day = idx + 1 
        
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        db.rollback()
        print(f"일정 순서 변경 중 오류: {e}")
        raise HTTPException(status_code=500, detail="일정 순서 변경 중 오류가 발생했습니다.")


# =============================================================================
# 3. 실행 취소(Undo) API
# =============================================================================

@router.post("/{trip_id}/undo", status_code=status.HTTP_204_NO_CONTENT)
def undo_last_action(
    trip_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    가장 최근의 변경 사항(추가/삭제/순서변경)을 이전 상태로 되돌립니다.
    """
    check_collaborator_permission(trip_id, current_user.user_id, db)

    try:
        # 가장 최근 로그 1개 조회
        last_action = db.query(models.TripAction).filter(models.TripAction.trip_id == trip_id).order_by(models.TripAction.created_at.desc()).first()
        if not last_action:
            raise HTTPException(status_code=404, detail="되돌릴 작업 내역이 없습니다.")

        # 작업 유형에 따른 역작업 수행
        if last_action.action_type == 'ADD':
            # 추가했던 것을 삭제
            item = db.query(models.ItineraryItem).filter(models.ItineraryItem.item_id == last_action.item_id_affected).first()
            if item: db.delete(item)
            
        elif last_action.action_type == 'DELETE':
            # 삭제했던 것을 복구 (재삽입)
            state = json.loads(last_action.previous_state)
            restored_item = models.ItineraryItem(
                trip_id=state['trip_id'],
                place_id=state['place_id'],
                user_id=state['user_id'],
                visit_day_str=state['visit_day_str'],
                order_in_day=state['order_in_day']
            )
            db.add(restored_item)
            
        elif last_action.action_type == 'REORDER':
            # 이전 순서로 복원
            old_orders = json.loads(last_action.previous_state)
            for item_id_str, order in old_orders.items():
                item = db.query(models.ItineraryItem).filter(models.ItineraryItem.item_id == int(item_id_str)).first()
                if item: item.order_in_day = order
        
        else:
            raise HTTPException(status_code=400, detail="알 수 없는 작업 타입입니다.")

        # 되돌리기 완료된 로그는 삭제
        db.delete(last_action)
        
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    except Exception as e:
        db.rollback()
        print(f"실행 취소 중 오류: {e}")
        raise HTTPException(status_code=500, detail="실행 취소 중 오류가 발생했습니다.")