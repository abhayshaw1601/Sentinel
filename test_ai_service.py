import requests
import json

# Test the AI service endpoint directly
AI_SERVICE_URL = "http://localhost:8000"

# Sample patient data
test_data = {
    "patient": {
        "name": "Test Patient",
        "age": 45,
        "gender": "Male",
        "reasonForAdmission": "Chest pain",
        "medicalHistory": "Hypertension",
        "allergies": ["Penicillin"],
        "bloodType": "A+"
    },
    "vitals": [
        {
            "heartRate": 85,
            "bloodPressure": "120/80",
            "oxygenSaturation": 98,
            "temperature": 98.6,
            "respiratoryRate": 16,
            "bloodSugar": 110,
            "timestamp": "2025-12-14T15:00:00"
        }
    ],
    "reports": []
}

print("Testing AI Service...")
print(f"URL: {AI_SERVICE_URL}/api/generate-insights")
print("\nSending request...")

try:
    response = requests.post(
        f"{AI_SERVICE_URL}/api/generate-insights",
        json=test_data,
        headers={"Content-Type": "application/json"}
    )
    
    print(f"\nStatus Code: {response.status_code}")
    
    if response.status_code == 200:
        print("\n✅ SUCCESS!")
        result = response.json()
        print("\nResponse:")
        print(json.dumps(result, indent=2))
    else:
        print("\n❌ ERROR!")
        print(f"Response: {response.text}")
        
except Exception as e:
    print(f"\n❌ EXCEPTION: {str(e)}")
