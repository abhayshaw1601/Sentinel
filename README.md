# Sentinel

A comprehensive, AI-powered ICU management system for monitoring patient vitals, managing medical records, and receiving intelligent healthcare insights.

## 📋 Project Overview

This is a **production-ready, AI-powered Smart ICU Dashboard** built with:

### Tech Stack
- **Frontend**: React.js (Vite) + Recharts + Tailwind CSS (via variable tokens)
- **Backend**: Node.js + Express.js + MongoDB + Multer
- **AI Service**: Python + FastAPI + LangChain + Google Gemini API
- **Authentication**: JWT-based with role management (Admin/Staff)

## 🎯 Features

### ✅ Core Capabilities
- **Authentication & Role Management**: Secure JWT-based auth with Admin and Staff roles. Access control for sensitive operations.
- **Patient Management**: Full CRUD for patient records. Track admission status, medical history, allergies, and emergency contacts.
- **Real-time Vitals Monitoring**: Dynamic graphs and historical data for Heart Rate, BP, O2 Saturation, Temperature, Respiratory Rate, Blood Sugar, and CO2 levels.
- **Medical Records Hub**: Upload, view, and manage text reports, images (X-rays, scans), and PDFs (lab reports).
- **AI Command Center**: Multimodal RAG system for intelligent patient insights and chatbot assistance.

### ✅ Completed Tasks
- **Backend**: Fully implemented with all API endpoints active.
- **AI Service**: fully functional with Gemini 1.5 Flash integration.
- **Frontend**:
    - **Vitals Monitor**: Complete with real-time charts and manual entry form.
    - **Reports Section**: Complete with file upload, preview, and download.
    - **AI Insights**: Integrated and functional.
    - **Dashboard**: Modern UI with glassmorphism and responsive design.

## 📦 Prerequisites

- **Node.js** 18+
- **Python** 3.9+
- **MongoDB** (Local or Atlas)
- **Google Gemini API Key** ([Get it here](https://makersuite.google.com/app/apikey))

## 🚀 Quick Start

### 1. Automated Setup (Recommended for Windows)

```powershell
# Run the setup wizard from the project root
.\setup.ps1
```

Follow the prompts to install dependencies for all services.

### 2. Manual Setup

#### Backend
```bash
cd backend
npm install
# Create .env from .env.example and set MONGODB_URI & JWT_SECRET
npm run seed  # Seeding sample data
npm run dev
```
*Runs on: `http://localhost:5000`*

#### AI Service
```bash
cd ai-service
python -m venv venv
# Windows: venv\Scripts\activate | Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
# Create .env from .env.example and set GEMINI_API_KEY
uvicorn main:app --reload
```
*Runs on: `http://localhost:8000`*

#### Frontend
```bash
cd frontend
npm install
npm run dev
```
*Runs on: `http://localhost:5173`*

## 🔑 Default Credentials

> **Note**: Change these immediately in a production environment.

**Admin Account**
- Email: `admin@icu.com`
- Password: `admin123`

**Staff Account**
- Email: `staff1@icu.com`
- Password: `staff123`

## 📊 Database Schema

- **users**: Admin and staff accounts with hashed passwords.
- **patients**: Demographics, admission info, and medical history.
- **vitals**: Time-series vital sign readings linked to patients.
- **reports**: Metadata for uploaded medical files and text reports.

## 📖 API Documentation

Once services are running:
- **Backend API Docs**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs) (if configured) or check `routes` folder.
- **AI Service Docs**: [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)

## 🧪 Testing

```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test

# AI Service
cd ai-service && pytest
```

## 📝 License

MIT License
