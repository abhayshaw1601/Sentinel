# 🏥 Sentinel: Smart ICU Dashboard - Technical Deep Dive

## 📖 Project Rationale & Philosophy

**Sentinel** is designed to address the critical need for modernized, intelligent patient monitoring in Intensive Care Units. Traditional systems are often fragmented, with vitals on one screen and medical records on another. Sentinel bridges this gap by creating a **Unified Command Center** that not only aggregates data but uses AI to interpret it.

### Core Architectural Decisions

1.  **Microservices Architecture**:
    *   **Decision**: We separated the application into three distinct services: `Frontend`, `Backend`, and `AI Service`.
    *   **Why?**:
        *   **Scalability**: The AI service (heavy computation) can be scaled independently from the CRUD backend.
        *   **Technology Fit**: Python is the lingua franca of AI, while Node.js excels at I/O-heavy web server tasks. Separation allows us to use the best tool for each job.
        *   **Resilience**: If the AI service goes down or lags, the core hospital operations (admitting patients, recording vitals) remain unaffected.

2.  **Multimodal RAG (Retrieval-Augmented Generation)**:
    *   **Decision**: Instead of just chat, we feed the AI real-time patient data and medical reports.
    *   **Why?**: Generic AI brings general knowledge. medical AI needs *context*. By injecting the specific patient's latest vitals and lab reports into the prompt context, we turn a generic chatbot into a specific patient assistant.

---

## 🛠️ Technology Stack: The "Why" and "How"

### 1. Frontend: React + Vite + Glassmorphism

#### **Why React?**
*   **Component Reusability**: Medical dashboards are complex. We reused components like `PatientCard` and `VitalChart` across different views.
*   **Virtual DOM**: Real-time vitals require frequent UI updates. React's efficient diffing algorithm ensures the dashboard doesn't lag even when rendering live data streams.

#### **Why Vite?**
*   **Developer Experience**: Instant server start and Hot Module Replacement (HMR) made iterating on the UI design rapid.
*   **Performance**: Builds optimized, minified bundles perfect for production deployment.

#### **How we used it**:
*   **State Management**: Used `Context API` (`AuthContext`) to manage user sessions globally without prop drilling.
*   **Data Visualization**: Integrated **Recharts** for the Vitals Monitor. We chose it for its composable nature, allowing us to easily layer Reference Lines (e.g., "High BP Threshold") over the data lines.
*   **Glassmorphism**: We used translucent backgrounds (`backdrop-filter: blur`) to create a modern, clean aesthetic that reduces visual clutter—crucial for high-stress medical environments.

### 2. Backend: Node.js + Express

#### **Why Node.js?**
*   **Non-blocking I/O**: The ICU dashboard handles multiple simultaneous requests (vitals updates, file uploads). Node's event-driven architecture handles this concurrency efficiently.
*   **JSON Native**: Medical data (patients, vitals) is naturally hierarchical JSON. Node handles this without conversion overhead.

#### **How we used it**:
*   **Middleware Pattern**: We built a chain of responsibility:
    1.  `helmet` adds security headers.
    2.  `verifyToken` checks JWTs.
    3.  `upload.single()` processes files.
    4.  Controller logic executes.
*   **Stream Processing**: For file uploads, we used **Multer** to stream data directly to storage, preventing memory overflows with large medical images.

### 3. Database: MongoDB

#### **Why MongoDB?**
*   **Flexible Schema**: Medical records vary wildy. One patient has detailed cardiac history, another has none. A NoSQL document store allows us to save these heterogeneous records without complex join tables.
*   **Time-Series Suitability**: Vitals data is time-series data. MongoDB handles append-only log data (like heart rate readings every minute) very well.

#### **How we used it**:
*   **Mongoose Models**: We enforced *structure where it matters* (e.g., ensuring every patient has a `patientId`) while allowing flexibility in `medicalHistory`.
*   **Indexing**: We created compound indexes on `patientId` + `timestamp` to ensure the "Last 24h Vitals" query returns in milliseconds, even with millions of records.

### 4. AI Service: Python + FastAPI + Gemini

#### **Why Python & FastAPI?**
*   **Ecosystem**: Python has the best libraries for data processing (`pandas`) and AI interaction (`langchain`).
*   **Async Speed**: FastAPI is built on Starlette and Pydantic, making it one of the fastest Python frameworks, comparable to Node.js. It supports async/await natively, which is crucial when waiting for the external Google API to respond.

#### **Why Google Gemini 1.5 Flash?**
*   **Multimodal Native**: Unlike older models, Gemini can natively "see" images and "read" PDFs without complex OCR pre-processing pipelines. We send the raw file bytes, and it understands them.
*   **Context Window**: Its large context window allows us to send the *entire* patient history in one go for comprehensive analysis.

#### **How we used it**:
*   **Chain of Thought**: We use LangChain to structure the prompts. We don't just ask "Is this bad?". We ask "Analyze the vitals, compare with history, and *then* output the risk score."
*   **Proxy Pattern**: The Frontend never calls Google directly (security risk). It calls our Node backend -> which calls the Python service -> which calls Google. This keeps API keys secure on the server.

---

## 🔒 Security & Data Integrity

*   **JWT (JSON Web Tokens)**: We use stateless authentication. The server doesn't store sessions; it verifies the signature of the token sent by the client. This makes the backend horizontally scalable.
*   **Bcrypt**: Passwords are never stored plain text. We salt and hash them, making rainbow table attacks infeasible.
*   **Role-Based Access Control (RBAC)**: Middleware checks `req.user.role`. Usage: Only `admin` can delete patient records, preventing accidental data loss by staff.

## 🚀 Future Scalability

The current design is built for growth:
*   **Horizontal Scaling**: The Node.js API is stateless and can be replicated behind a load balancer.
*   **Sharding**: MongoDB can shard the `vitals` collection by `patientId` as data grows into the terabytes.
*   **Real-time Upgrade**: The architecture is ready for a WebSocket layer (Socket.io) to push vitals instead of polling.
