import google.generativeai as genai
import os

api_key = os.getenv("GOOGLE_API_KEY", "AIzaSyB0YOWYhyAZ-0FfQAhPC3HeqnLcTXzYOMo")
genai.configure(api_key=api_key)

print("Listing available models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"Name: {m.name}")
            print(f"Display Name: {m.display_name}")
            print(f"Description: {m.description}")
            print("-" * 20)
except Exception as e:
    print(f"Error listing models: {e}")
