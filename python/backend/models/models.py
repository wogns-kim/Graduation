# first_trip.sql에 정의된 테이블 구조를 파이썬 클래스 형태로 구현
# SQLAlchemy(ORM)가 이 모델을 보고 DB와 통신

from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint, BIGINT, DECIMAL, TEXT
from sqlalchemy.orm import relationship
from database.database import Base
from sqlalchemy.sql import func # created_at에 기본 타임스탬프를 찍기 위해

class User(Base):
    __tablename__ = "USERS"

    user_id = Column(Integer, primary_key=True, index=True)
    kakao_id = Column(BIGINT, unique=True, nullable=False, index=True)
    username = Column(String(50), nullable=False)
    email = Column(String(100), nullable=True)
    profile_image_url = Column(String(255), nullable=True)
    preferences = Column(TEXT, nullable=True)

class Trip(Base):
    __tablename__ = "TRIPS"

    trip_id = Column(Integer, primary_key=True, index=True)
    trip_name = Column(String(100), nullable=False)
    owner_id = Column(Integer, ForeignKey("USERS.user_id"), nullable=False)
    shareable_link_id = Column(String(50), unique=True, nullable=False, index=True)

class Collaborator(Base):
    __tablename__ = "COLLABORATORS"

    trip_id = Column(Integer, ForeignKey("TRIPS.trip_id"), primary_key=True)
    user_id = Column(Integer, ForeignKey("USERS.user_id"), primary_key=True)

class Place(Base):
    __tablename__ = "PLACES"

    place_id = Column(Integer, primary_key=True, index=True)
    place_name = Column(String(255), unique=True, nullable=False, index=True)
    address = Column(String(255), nullable=True)
    latitude = Column(DECIMAL(10, 7), nullable=True)
    longitude = Column(DECIMAL(10, 7), nullable=True)
    category = Column(String(255), nullable=True)

class ItineraryItem(Base):
    __tablename__ = "ITINERARY_ITEMS"

    item_id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("TRIPS.trip_id"), nullable=False, index=True)
    place_id = Column(Integer, ForeignKey("PLACES.place_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("USERS.user_id"), nullable=False)
    visit_day_str = Column(String(50), nullable=False)
    order_in_day = Column(Integer, nullable=False)
    __table_args__ = (UniqueConstraint('trip_id', 'visit_day_str', 'order_in_day', name='unique_itinerary_constraint'),)

class TripAction(Base):
    __tablename__ = "TRIP_ACTIONS"
    
    action_id = Column(Integer, primary_key=True, index=True)
    trip_id = Column(Integer, ForeignKey("TRIPS.trip_id"), nullable=False)
    user_id = Column(Integer, ForeignKey("USERS.user_id"), nullable=False)
    action_type = Column(String(20), nullable=False) # "ADD", "DELETE", "REORDER"
    previous_state = Column(TEXT, nullable=True) # JSON 문자열로 이전 상태 저장
    item_id_affected = Column(Integer, nullable=True) # ADD/DELETE 시 대상이 된 item_id
    created_at = Column(TIMESTAMP, server_default=func.now())