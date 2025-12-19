from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
from dotenv import load_dotenv
import google.generativeai as genai
from datetime import datetime

# Load environment variables
load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    print("⚠️  Warning: GEMINI_API_KEY not set. AI features will not work.")
else:
    genai.configure(api_key=GEMINI_API_KEY)

# Initialize FastAPI app
app = FastAPI(
    title="ICU Dashboard AI Service",
    description="AI-powered medical insights and analysis using Google Gemini",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class PatientData(BaseModel):
    name: str
    age: int
    gender: str
    reasonForAdmission: str
    medicalHistory: Optional[str] = ""
    allergies: Optional[List[str]] = []
    bloodType: Optional[str] = ""

class VitalReading(BaseModel):
    heartRate: Optional[float] = None
    bloodPressure: Optional[str] = None
    oxygenSaturation: Optional[float] = None
    temperature: Optional[float] = None
    respiratoryRate: Optional[float] = None
    bloodSugar: Optional[float] = None
    co2Level: Optional[float] = None
    timestamp: str

class ReportData(BaseModel):
    title: str
    type: str
    category: str
    content: Optional[str] = ""
    aiExtractedText: Optional[str] = ""
    aiSummary: Optional[str] = ""
    timestamp: str

class InsightsRequest(BaseModel):
    patient: PatientData
    vitals: List[VitalReading]
    reports: List[ReportData]

class ChatRequest(BaseModel):
    message: str
    context: Dict[str, Any]
    conversationHistory: Optional[List[Dict[str, str]]] = []

class FileProcessRequest(BaseModel):
    reportId: str
    filePath: str
    type: str  # 'image' or 'pdf'

class MedicalImageRequest(BaseModel):
    image: str  # Base64 encoded image
    message: Optional[str] = ""
    patientContext: Dict[str, Any]

class PatientChatMessage(BaseModel):
    message: str
    context: Dict[str, Any]
    conversationHistory: Optional[List[Dict[str, str]]] = []

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "ICU Dashboard AI Service",
        "timestamp": datetime.now().isoformat(),
        "gemini_configured": bool(GEMINI_API_KEY)
    }

# Generate comprehensive patient insights
@app.post("/api/generate-insights")
async def generate_insights(request: InsightsRequest):
    try:
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=503, detail="AI service not configured")

        # Create comprehensive patient context
        patient_context = f"""
Patient Information:
- Name: {request.patient.name}
- Age: {request.patient.age}
- Gender: {request.patient.gender}
- Reason for Admission: {request.patient.reasonForAdmission}
- Medical History: {request.patient.medicalHistory or 'None recorded'}
- Allergies: {', '.join(request.patient.allergies) if request.patient.allergies else 'None'}
- Blood Type: {request.patient.bloodType or 'Unknown'}

Recent Vital Signs (Last 24 hours):
"""
        
        # Add vitals summary
        if request.vitals:
            vitals_summary = []
            for vital in request.vitals[:10]:  # Last 10 readings
                vital_str = f"- Time: {vital.timestamp}"
                if vital.heartRate:
                    vital_str += f"\n  Heart Rate: {vital.heartRate} bpm"
                if vital.bloodPressure:
                    vital_str += f"\n  Blood Pressure: {vital.bloodPressure} mmHg"
                if vital.oxygenSaturation:
                    vital_str += f"\n  O2 Saturation: {vital.oxygenSaturation}%"
                if vital.temperature:
                    vital_str += f"\n  Temperature: {vital.temperature}°F"
                if vital.bloodSugar:
                    vital_str += f"\n  Blood Sugar: {vital.bloodSugar} mg/dL"
                vitals_summary.append(vital_str)
            
            patient_context += "\n".join(vitals_summary)
        else:
            patient_context += "No recent vital signs recorded."

        # Add reports summary
        patient_context += "\n\nMedical Reports:\n"
        if request.reports:
            for i, report in enumerate(request.reports[:5], 1):
                patient_context += f"\n{i}. {report.title} ({report.category})"
                if report.content:
                    patient_context += f"\n   Content: {report.content[:200]}..."
                if report.aiSummary:
                    patient_context += f"\n   Summary: {report.aiSummary}"
        else:
            patient_context += "No reports available."

        # Create prompt for Gemini
        prompt = f"""
You are an experienced ICU physician assistant AI. Analyze the following patient data and provide actionable insights.

{patient_context}

Generate your analysis in the following format. Use these EXACT severity keywords in your bullet points:

### Immediate Concerns:
- **Critical:** [High-severity issues requiring immediate action]
- **Warning:** [Medium-severity issues needing attention]
- **Info:** [General information and stable observations]

### Recommendations:
- **Critical:** [Urgent interventions needed]
- **Warning:** [Important care adjustments]
- **Info:** [Routine monitoring suggestions]

### Action Items:
- **Critical:** [Immediate actions required]
- **Warning:** [Priority tasks]
- **Info:** [Standard care protocols]

IMPORTANT RULES:
1. Start each bullet point with "- **Critical:**", "- **Warning:**", or "- **Info:**"
2. Be specific and cite actual data points (vital readings, trends, etc.)
3. Each insight should be concise (1-2 sentences max)
4. Focus on actionable recommendations
5. Include at least 2-3 Critical items if there are serious concerns
"""

        # Call Gemini API
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content(prompt)

        return {
            "success": True,
            "data": {
                "insights": response.text,
                "generatedAt": datetime.now().isoformat(),
                "patientName": request.patient.name
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Chat endpoint for conversational AI
@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=503, detail="AI service not configured")

        # Build context from patient data
        context_str = f"""
You are an AI medical assistant for ICU patients. You have access to the following patient information:

Patient: {request.context.get('patient', {}).get('name', 'Unknown')}
Age: {request.context.get('patient', {}).get('age', 'Unknown')}
Admission Reason: {request.context.get('patient', {}).get('reasonForAdmission', 'Unknown')}
Medical History: {request.context.get('patient', {}).get('medicalHistory', 'None')}

Recent Vitals: {len(request.context.get('recentVitals', []))} readings available
Reports: {request.context.get('reportsCount', 0)} reports on file

Recent reports summaries:
"""
        
        for summary in request.context.get('reportsSummaries', []):
            context_str += f"\n- {summary.get('title')}: {summary.get('aiSummary', 'No summary')}"

        # Build conversation history
        conversation = "\n\nPrevious conversation:\n"
        for msg in request.conversationHistory[-5:]:  # Last 5 messages
            role = msg.get('role', 'user')
            content = msg.get('content', '')
            conversation += f"{role.capitalize()}: {content}\n"

        # Create prompt
        prompt = f"""
{context_str}
{conversation}

User: {request.message}

Provide a helpful, accurate response based on the patient context. If you don't have enough information, ask clarifying questions.
"""

        # Call Gemini API
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content(prompt)

        return {
            "success": True,
            "data": {
                "response": response.text,
                "timestamp": datetime.now().isoformat()
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Process uploaded files (PDFs, images)
@app.post("/api/process-file")
async def process_file(request: FileProcessRequest):
    try:
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=503, detail="AI service not configured")

        # This is a placeholder for file processing
        # In production, you would:
        # 1. Read the file from the path
        # 2. Use Gemini's multimodal capabilities to analyze images/PDFs
        # 3. Extract text and generate summaries
        # 4. Update the MongoDB report with extracted data

        return {
            "success": True,
            "message": "File processing endpoint - implementation pending",
            "reportId": request.reportId,
            "type": request.type
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Analyze medical images (body parts, wounds, rashes, etc.)
@app.post("/api/analyze-medical-image")
async def analyze_medical_image(request: MedicalImageRequest):
    try:
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=503, detail="AI service not configured")

        patient = request.patientContext
        
        # Create medical context
        medical_context = f"""
Patient Information:
- Name: {patient.get('name', 'Unknown')}
- Age: {patient.get('age', 'Unknown')}
- Gender: {patient.get('gender', 'Unknown')}
- Allergies: {', '.join(patient.get('allergies', [])) if patient.get('allergies') else 'None reported'}
- Medical History: {patient.get('medicalHistory', 'None')}
- Blood Type: {patient.get('bloodType', 'Unknown')}
"""

        # Create specialized medical prompt
        prompt = f"""
You are an experienced medical AI assistant analyzing a patient's medical image. 

{medical_context}

Patient Query: {request.message or 'Please analyze this image and provide medical insights.'}

Analyze the provided image and provide a structured medical assessment in the following JSON-like format:

DIAGNOSIS:
[Provide a clear description of what you observe in the image - any visible conditions, symptoms, or abnormalities]

SUGGESTIONS:
1. [First immediate action to take]
2. [Second action or care recommendation]
3. [Third action or monitoring advice]

PRECAUTIONS:
- [Important precaution 1]
- [Important precaution 2]
- [Important precaution 3]

MEDICATIONS:
- [Medication suggestion 1 - CHECK: Verify this doesn't conflict with patient allergies: {', '.join(patient.get('allergies', [])) if patient.get('allergies') else 'None'}]
- [Medication suggestion 2 if applicable]
- [Note: Over-the-counter vs prescription]

SEVERITY: [Low/Medium/High/Emergency]

IMPORTANT RULES:
1. Base severity on: Low (minor/cosmetic), Medium (needs attention soon), High (urgent care needed), Emergency (immediate medical attention)
2. ALWAYS check medications against patient allergies: {', '.join(patient.get('allergies', [])) if patient.get('allergies') else 'None'}
3. If uncertain, err on the side of recommending professional consultation
4. Be specific but conservative in diagnosis
5. Include timeline recommendations (e.g., "seek care within 24 hours")

⚠️ CRITICAL DISCLAIMER: This AI analysis is for informational purposes only and does not replace professional medical diagnosis. Please consult with your assigned doctor or healthcare provider for proper evaluation and treatment.
"""

        # Use Gemini with vision capabilities
        try:
            import base64
            
            # Decode base64 image
            image_data = base64.b64decode(request.image)
            
            # Create image part for Gemini
            from PIL import Image
            import io
            
            image = Image.open(io.BytesIO(image_data))
            
            # Call Gemini Vision API
            model = genai.GenerativeModel('gemini-flash-latest')
            response = model.generate_content([prompt, image])
            
            ai_response = response.text
            
            # Parse the response to extract structured data
            diagnosis = ""
            suggestions = []
            precautions = []
            medications = []
            severity = "Medium"
            
            # Simple parsing logic
            sections = ai_response.split('\n')
            current_section = None
            
            for line in sections:
                line = line.strip()
                if not line:
                    continue
                    
                if 'DIAGNOSIS:' in line.upper():
                    current_section = 'diagnosis'
                    diagnosis = line.split(':', 1)[1].strip() if ':' in line else ""
                elif 'SUGGESTIONS:' in line.upper():
                    current_section = 'suggestions'
                elif 'PRECAUTIONS:' in line.upper():
                    current_section = 'precautions'
                elif 'MEDICATIONS:' in line.upper():
                    current_section = 'medications'
                elif 'SEVERITY:' in line.upper():
                    severity_match = line.split(':', 1)[1].strip() if ':' in line else "Medium"
                    raw_severity = severity_match.split()[0].replace('*', '').strip() if severity_match else "Medium"
                    # Visualize/Normalize first letter just in case
                    severity = raw_severity.capitalize() if raw_severity else "Medium"
                    current_section = None
                elif current_section == 'diagnosis' and line:
                    diagnosis += " " + line
                elif current_section == 'suggestions' and (line.startswith(tuple('123456789')) or line.startswith('-')):
                    suggestions.append(line.lstrip('0123456789.-) '))
                elif current_section == 'precautions' and line.startswith('-'):
                    precautions.append(line.lstrip('- '))
                elif current_section == 'medications' and line.startswith('-'):
                    medications.append(line.lstrip('- '))
            
            return {
                "success": True,
                "data": {
                    "response": ai_response,
                    "diagnosis": diagnosis.strip(),
                    "suggestions": suggestions[:5],  # Limit to 5
                    "precautions": precautions[:5],
                    "medications": medications[:5],
                    "severity": severity,
                    "timestamp": datetime.now().isoformat()
                }
            }
            
        except Exception as vision_error:
            # Fallback if vision fails
            print(f"Vision API error: {vision_error}")
            raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(vision_error)}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Patient-specific chat endpoint
@app.post("/api/patient-chat")
async def patient_chat(request: PatientChatMessage):
    try:
        if not GEMINI_API_KEY:
            raise HTTPException(status_code=503, detail="AI service not configured")

        patient = request.context.get('patient', {})
        
        # Build patient context
        context_str = f"""
You are a compassionate AI health assistant helping ICU patients. You have access to this patient's information:

Patient: {patient.get('name', 'Unknown')}
Age: {patient.get('age', 'Unknown')}
Gender: {patient.get('gender', 'Unknown')}
Admission Reason: {patient.get('reasonForAdmission', 'Unknown')}
Medical History: {patient.get('medicalHistory', 'None recorded')}
Allergies: {', '.join(patient.get('allergies', [])) if patient.get('allergies') else 'None'}
Blood Type: {patient.get('bloodType', 'Unknown')}
"""

        # Add conversation history
        conversation = ""
        if request.conversationHistory:
            conversation = "\\n\\nRecent conversation:\\n"
            for msg in request.conversationHistory[-5:]:
                role = msg.get('role', 'user')
                content = msg.get('content', '')
                conversation += f"{role.capitalize()}: {content}\\n"

        # Create prompt
        prompt = f"""
{context_str}
{conversation}

Patient's Question: {request.message}

Provide a helpful, empathetic, and medically accurate response. 

GUIDELINES:
1. Be supportive and reassuring
2. Provide accurate health information
3. Reference the patient's specific condition or allergies when relevant
4. If suggesting any medications, ALWAYS check against patient allergies
5. If the question is serious or requires medical intervention, advise consulting their assigned doctor
6. Keep responses concise but informative (2-4 paragraphs max)

⚠️ DISCLAIMER: Always end with a brief reminder that this is informational guidance and they should consult their healthcare provider for medical decisions.
"""


        # Call Gemini API
        model = genai.GenerativeModel('gemini-flash-latest')
        response = model.generate_content(prompt)

        return {
            "success": True,
            "data": {
                "response": response.text,
                "timestamp": datetime.now().isoformat()
            }
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error in patient_chat: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

# Run the app
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    print(f"\n🤖 AI Service starting on {host}:{port}")
    print(f"📖 API Docs: http://localhost:{port}/docs\n")
    
    uvicorn.run(app, host=host, port=port)
# trigger reload
