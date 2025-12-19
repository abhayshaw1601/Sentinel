# Smart ICU Dashboard - Architecture & Feature Overview

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│                                                                  │
│  React Frontend (Port 5173)                                     │
│  ├── Premium UI with Glassmorphism                              │
│  ├── JWT Authentication & Context                               │
│  ├── React Router for Navigation                               │
│  └── Axios API Client                                           │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP/REST API
┌────────────────────┴────────────────────────────────────────────┐
│                      BACKEND LAYER                              │
│                                                                  │
│  Express.js Server (Port 5000)                                  │
│  ├── JWT Authentication Middleware                              │
│  ├── Multer File Upload Handler                                 │
│  ├── MongoDB Integration (Mongoose)                             │
│  └── RESTful API Routes                                         │
│      ├── /api/auth (Login, Register, Profile)                  │
│      ├── /api/patients (CRUD Operations)                        │
│      ├── /api/vitals (Health Metrics)                          │
│      ├── /api/reports (Documents & Files)                       │
│      └── /api/ai (Proxy to AI Service)                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴──────────┬─────────────────────────────────┐
        │                       │                                 │
┌───────┴────────┐    ┌─────────┴────────┐             ┌─────────┴─────────┐
│  MongoDB       │    │  File Storage    │             │  AI Service       │
│  Database      │    │  (uploads/)      │             │  (Port 8000)      │
│                │    │                  │             │                   │
│  Collections:  │    │  Medical Docs:   │             │  FastAPI Server   │
│  • users       │    │  • X-rays        │             │  ├── Gemini API   │
│  • patients    │    │  • Lab Reports   │             │  ├── LangChain    │
│  • vitals      │    │  • PDFs          │             │  └── RAG System   │
│  • reports     │    │  • Images        │             │                   │
└────────────────┘    └──────────────────┘             └───────────────────┘
```

---

## 📦 Database Schema Design

### Users
```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  password: String (bcrypt hashed),
  name: String,
  role: "admin" | "staff",
  phone: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** email (unique)

### Patients
```javascript
{
  _id: ObjectId,
  patientId: String (auto-generated: ICU000001),
  name: String,
  age: Number,
  dateOfBirth: Date,
  gender: "male" | "female" | "other",
  reasonForAdmission: String,
  roomNumber: String,
  bedNumber: String,
  admissionDate: Date,
  dischargeDate: Date | null,
  assignedDoctor: String,
  status: "admitted" | "discharged",
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  medicalHistory: String,
  allergies: [String],
  bloodType: String,
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** patientId (unique), status

### Vitals
```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: Patient),
  heartRate: Number (bpm),
  bloodPressureSystolic: Number (mmHg),
  bloodPressureDiastolic: Number (mmHg),
  oxygenSaturation: Number (%),
  temperature: Number (°F),
  respiratoryRate: Number (breaths/min),
  bloodSugar: Number (mg/dL),
  co2Level: Number (%),
  notes: String,
  recordedBy: ObjectId (ref: User),
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** patientId, timestamp, compound(patientId+timestamp)

### Reports
```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: Patient),
  title: String,
  type: "text" | "image" | "pdf",
  category: "lab" | "radiology" | "clinical" | "discharge" | "consultation" | "other",
  
  // For text reports
  content: String,
  
  // For file uploads
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  mimeType: String,
  
  // Metadata
  description: String,
  tags: [String],
  uploadedBy: ObjectId (ref: User),
  
  // AI Processing
  aiProcessed: Boolean,
  aiExtractedText: String,
  aiSummary: String,
  
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:** patientId, timestamp, type, compound(patientId+timestamp)

---

## 🎯 Feature Breakdown

### 1. Authentication & Authorization ✅

**Implementation:**
- JWT-based token authentication
- Bcrypt password hashing (10 rounds)
- Role-based access control (Admin/Staff)
- Protected routes with middleware
- Automatic token refresh

**Security Measures:**
- HTTP-only tokens (recommended for production)
- Password strength validation
- Account deactivation support
- Session timeout (7 days default)

**API Endpoints:**
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Create new user (Admin only)
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/updatepassword` - Change password
- `PUT /api/auth/updateprofile` - Update profile

### 2. Patient Management ✅

**Features:**
- Create, Read, Update, Delete patients
- Auto-generated Patient IDs (ICU000001, ICU000002...)
- Separate views for Admitted vs Discharged
- Search functionality
- Comprehensive patient profiles
- Emergency contact information
- Medical history tracking
- Allergy management

**API Endpoints:**
- `GET /api/patients?status=admitted` - Get patients by status
- `GET /api/patients/:id` - Get single patient
- `POST /api/patients` - Create patient
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient (Admin only)
- `PUT /api/patients/:id/discharge` - Discharge patient

### 3. Vitals Monitoring ✅ (Backend Complete)

**Vital Signs Tracked:**
- Heart Rate (bpm)
- Blood Pressure (Systolic/Diastolic)
- Oxygen Saturation (%)
- Temperature (°F)
- Respiratory Rate (breaths/min)
- Blood Sugar (mg/dL)
- CO2 Level (%)

**Features:**
- Time-filtered queries (Last Hour, 24h, 7 days, All)
- Latest vital reading endpoint
- Trend analysis capability
- Staff attribution (who recorded)
- Notes support

**API Endpoints:**
- `GET /api/vitals/patient/:id?timeRange=24h` - Get vitals with time filter
- `GET /api/vitals/patient/:id/latest` - Latest reading
- `POST /api/vitals` - Record new vitals
- `PUT /api/vitals/:id` - Update vitals
- `DELETE /api/vitals/:id` - Delete record

**Frontend Integration Needed:**
- Recharts line/area charts for trends
- Real-time vital display
- Form for recording new readings
- Alert system for abnormal values

### 4. Reports & Documents Hub ✅

**Report Types:**
1. **Text Reports** - Clinical notes, observations
2. **Images** - X-rays, CT scans, photos
3. **PDFs** - Lab results, discharge summaries

**Features:**
- Multer file upload (10MB limit)
- File type validation (JPEG, PNG, PDF)
- Categorization system
- Tagging support
- Download functionality
- AI processing integration
- Metadata management

**API Endpoints:**
- `GET /api/reports/patient/:id?type=pdf` - Get patient reports
- `POST /api/reports/text` - Create text report
- `POST /api/reports/upload` - Upload file (multipart/form-data)
- `PUT /api/reports/:id` - Update report metadata
- `DELETE /api/reports/:id` - Delete report
- `GET /api/reports/:id/download` - Download file

**Storage:**
- Files stored in `backend/uploads/`
- Database stores metadata and file paths
- Automatic cleanup on deletion

### 5. AI Command Center ✅

**Powered By:**
- Google Gemini 1.5 Flash
- FastAPI microservice
- LangChain framework

**Capabilities:**

**A. Comprehensive Patient Analysis:**
```
Input: Patient data + 24h vitals + all reports
Output:
  1. Critical Alerts
  2. Vital Signs Trends
  3. Risk Assessment
  4. Clinical Recommendations
  5. Priority Score (1-10)
```

**B. Conversational Chatbot:**
- Context-aware responses
- Access to patient history
- Medical knowledge base
- Multi-turn conversations

**C. Multimodal File Processing:**
- Extract text from PDFs
- Analyze medical images
- Generate summaries
- Auto-populate aiExtractedText and aiSummary fields

**API Endpoints:**

*Backend Proxy:*
- `POST /api/ai/insights/:patientId` - Generate insights
- `POST /api/ai/chat/:patientId` - Chat interface

*AI Service Direct:*
- `POST /api/generate-insights` - Full analysis
- `POST /api/chat` - Chatbot
- `POST /api/process-file` - File analysis
- `GET /health` - Service status

**Example Insight Response:**
```json
{
  "success": true,
  "data": {
    "insights": "**CRITICAL ALERTS:**\n- Oxygen saturation declining (92% → 88%)\n- Blood pressure elevated...",
    "generatedAt": "2024-01-15T10:30:00Z",
    "patientName": "John Doe"
  }
}
```

---

## 🎨 Frontend Architecture

### Component Hierarchy
```
App
├── AuthProvider (Context)
├── Router
    ├── Login (Public)
    ├── Dashboard (Protected)
    │   ├── Navbar
    │   ├── StatCards
    │   ├── SearchBar
    │   └── PatientCard[] (Admitted & Discharged)
    │
    └── PatientDetail (Protected)
        ├── Navbar
        ├── PatientHeader
        ├── TabNavigation
        └── TabContent
            ├── VitalsMonitor
            │   ├── VitalCharts (Recharts)
            │   ├── TimeFilter
            │   └── AddVitalsForm
            │
            ├── ReportsSection
            │   ├── FileUploader
            │   ├── ReportList
            │   └── ReportViewer
            │
            └── AIAssistant
                ├── GenerateButton
                ├── InsightsDisplay
                └── Chatbot
```

### Design System

**Color Palette:**
```css
Primary Blue: hsl(210, 100%, 50%)
Secondary Green: hsl(160, 60%, 45%)
Accent Purple: hsl(280, 60%, 60%)
Warning Orange: hsl(30, 100%, 55%)
Danger Red: hsl(0, 80%, 55%)
```

**Typography:**
- Font: Inter (sans-serif)
- Heading Weights: 600-700
- Body: 400-500

**Effects:**
- Glassmorphism on cards
- Smooth transitions (250ms cubic-bezier)
- Hover lift effects
- Pulsing animations on icons

---

## 🔐 Security Implementation

### Backend
- ✅ JWT token validation
- ✅ Password hashing (bcrypt, 10 rounds)
- ✅ Role-based middleware
- ✅ File upload validation
- ✅ CORS configuration
- ✅ Helmet.js security headers
- ✅ Input sanitization
- ✅ Error handling (no stack traces in prod)

### Frontend
- ✅ Token storage in localStorage
- ✅ Automatic token injection
- ✅ Auth context for global state
- ✅ Protected routes
- ✅ Auto-logout on 401

### Recommended Production Enhancements
- [ ] HTTP-only cookies for tokens
- [ ] Rate limiting
- [ ] Request logging
- [ ] HTTPS enforcement
- [ ] Environment-based secrets
- [ ] Database encryption at rest
- [ ] File virus scanning

---

## 📊 Performance Considerations

### Database Optimization
- Indexed fields: email, patientId, status, timestamp
- Compound indexes on frequent queries
- Pagination support (ready to implement)
- Lean queries for list views

### File Handling
- 10MB upload limit
- Streaming downloads
- Lazy loading for large lists
- Background AI processing

### Frontend
- Code splitting (via Vite)
- Lazy route loading
- Optimized re-renders
- Debounced search

---

## 🚀 Deployment Roadmap

### Development (Current)
- ✅ Local MongoDB
- ✅ Development servers
- ✅ Sample data seeding

### Staging (Next)
- [ ] MongoDB Atlas
- [ ] Environment variables management
- [ ] CI/CD pipeline setup
- [ ] Testing suite

### Production (Future)
- [ ] Cloud hosting (AWS/Azure/GCP)
- [ ] Load balancing
- [ ] CDN for static assets
- [ ] Monitoring & logging
- [ ] Backup strategies
- [ ] SSL certificates

---

## 📝 Next Development Tasks

### High Priority
1. **Complete Vitals Monitor UI**
   - Integrate Recharts
   - Implement time filters
   - Add vital recording form
   
2. **Build Reports Section**
   - File upload UI with drag-drop
   - Report gallery view
   - PDF/Image preview

3. **Implement AI Insights UI**
   - "Generate Analysis" button
   - Insights display with formatting
   - Chatbot interface

### Medium Priority
4. **User Management (Admin)**
   - Staff list view
   - Add/edit/deactivate staff
   - Permission management

5. **Enhanced Patient Profile**
   - Edit mode
   - Medical history timeline
   - Allergy highlighting

6. **Notifications System**
   - Critical vital alerts
   - New report notifications
   - AI insight badges

### Low Priority
7. **Analytics Dashboard**
   - Patient statistics
   - Vital trends overview
   - Resource utilization

8. **Export Functionality**
   - PDF patient reports
   - CSV data export
   - Print views

---

## 🐛 Known Limitations

1. **AI Service**
   - Requires Gemini API key
   - Rate limits apply (free tier)
   - File processing is placeholder

2. **Real-time Updates**
   - No WebSocket implementation
   - Manual refresh needed

3. **Mobile Optimization**
   - Responsive but not PWA
   - No offline support

4. **Testing**
   - No automated tests yet
   - Manual testing only

---

## 📚 Technology Stack Details

### Backend Dependencies
```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.3",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "multer": "^1.4.5-lts.1",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "helmet": "^7.1.0",
  "morgan": "^1.10.0",
  "axios": "^1.6.2"
}
```

### Frontend Dependencies
```json
{
  "react": "^18.2.0",
  "react-router-dom": "^6.20.1",
  "axios": "^1.6.2",
  "recharts": "^2.10.3",
  "lucide-react": "^0.294.0"
}
```

### AI Service Dependencies
```
fastapi==0.109.0
uvicorn==0.27.0
langchain==0.1.0
langchain-google-genai==0.0.6
google-generativeai==0.3.2
PyPDF2==3.0.1
Pillow==10.2.0
```

---

**Project Status**: ✅ **Backend Complete** | 🟡 **Frontend 70% Complete** | 🟡 **AI Service Complete (Testing Required)**

**Estimated Time to Full Completion**: 8-12 hours of focused development

**Main Missing Components**: 
1. Recharts integration (2-3 hours)
2. Reports UI with file upload (2-3 hours)
3. AI Insights UI with chat (2-3 hours)
4. Testing & bug fixes (2-3 hours)
