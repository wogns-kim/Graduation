# check_models.py
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv() # .env에서 API 키 로드

api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("Error: .env 파일에서 GOOGLE_API_KEY를 찾을 수 없습니다.")
else:
    genai.configure(api_key=api_key)
    print("--- 사용 가능한 모델 목록 ---")
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"모델 이름: {m.name}")
    except Exception as e:
        print(f"에러 발생: {e}")