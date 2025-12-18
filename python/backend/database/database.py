import os   # os 모듈 호출
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv # env 파일에 적 힌 텍스 읽어와 변수 처리

# 1. .env 또는 env.txt 파일을 읽어 시스템 환경 변수로 등록합니다.
load_dotenv()

# 2. os.getenv를 사용하여 Railway에 등록한 변수값을 가져옵니다.
# ("변수명", "기본값") 형태입니다. Railway에 값이 없으면 뒤의 기본값을 사용합니다.
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")  # lNQLAqJxbgvYvDTfsJpbnCkTJPXckTIg
DB_HOST = os.getenv("DB_HOST", "shortline.proxy.rlwy.net")
DB_PORT = os.getenv("DB_PORT", "20458")
DB_NAME = os.getenv("DB_NAME", "Railway_DB")

#SQLALCHEMY_DATABASE_URL = "mysql+mysqlconnector://root:@localhost/first_trip"
# 3. 가져온 변수들을 조합하여 데이터베이스 연결 URL을 만듭니다.
SQLALCHEMY_DATABASE_URL = f"mysql+mysqlconnector://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

# 4. DB 엔진을 생성합니다.--
engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
