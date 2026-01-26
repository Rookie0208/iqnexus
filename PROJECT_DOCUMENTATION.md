# 📚 IQNexus - Student Olympiad Management System

> **Complete Documentation for the IQNexus Platform**  
> A comprehensive education management system for organizing, managing, and conducting Olympiad examinations.

---

## 📑 Table of Contents

1. [Project Overview](#-project-overview)
2. [System Architecture](#-system-architecture)
3. [Technology Stack](#-technology-stack)
4. [Application Structure](#-application-structure)
5. [Database Design](#-database-design)
6. [API Documentation](#-api-documentation)
7. [User Flows](#-user-flows)
8. [Features Breakdown](#-features-breakdown)
9. [Deployment Architecture](#-deployment-architecture)
10. [Getting Started](#-getting-started)

---

## 🎯 Project Overview

**IQNexus** is an end-to-end Olympiad Management Platform designed to handle the complete lifecycle of competitive examinations for students across schools. The system manages:

- 📝 Student registrations and data management
- 🏫 School administration and partnerships
- 🎫 Admit card generation and distribution
- 📊 Results management and certificate generation
- 📖 Study material distribution
- 💬 Feedback collection and management

### Olympiad Exams Supported

| Exam Code | Full Name | Levels |
|-----------|-----------|--------|
| **IQMO** | IQNexus Mathematics Olympiad | L1 (Basic), L2 (Advanced) |
| **IQSO** | IQNexus Science Olympiad | L1, L2 |
| **IQEO** | IQNexus English Olympiad | L1, L2 |
| **IQRO** | IQNexus Reasoning Olympiad | L1, L2 |
| **IQGKO** | IQNexus General Knowledge Olympiad | L1 |
| **IQKD** | IQNexus Kindergarten Exam | L1, L2 |

---

## 🏗 System Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              IQNEXUS PLATFORM                                   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           NGINX REVERSE PROXY                                   │
│                    (Load Balancing, SSL Termination)                            │
│                         Ports: 80 (HTTP), 443 (HTTPS)                          │
└─────────────────────────────────────────────────────────────────────────────────┘
                    │                    │                    │
                    ▼                    ▼                    ▼
     ┌──────────────────────┐ ┌──────────────────┐ ┌──────────────────────┐
     │   CLIENT PORTAL      │ │   ADMIN PANEL    │ │    BACKEND API       │
     │   (React + Redux)    │ │  (React + Vite)  │ │   (Express.js)       │
     │   Port: 3000         │ │   Port: 3001     │ │   Port: 5001         │
     │                      │ │                  │ │                      │
     │  • Student Login     │ │  • Dashboard     │ │  • REST API          │
     │  • Dashboard         │ │  • Data Mgmt     │ │  • File Upload       │
     │  • Admit Cards       │ │  • Reports       │ │  • PDF Generation    │
     │  • Results           │ │  • Bulk Upload   │ │  • AWS S3 Integration│
     │  • Study Materials   │ │  • Admit Cards   │ │                      │
     └──────────────────────┘ └──────────────────┘ └──────────────────────┘
                                                            │
                              ┌──────────────────────────────┤
                              │                              │
                              ▼                              ▼
                 ┌──────────────────────┐     ┌──────────────────────────┐
                 │     MongoDB          │     │      AWS S3 Bucket       │
                 │   (Database)         │     │   (File Storage)         │
                 │   Port: 27017        │     │                          │
                 │                      │     │  • Study Materials PDFs  │
                 │  • Students          │     │  • Admit Card Images     │
                 │  • Schools           │     │  • Certificates          │
                 │  • Results           │     │                          │
                 │  • Study Materials   │     │                          │
                 │  • Answer Keys       │     │                          │
                 └──────────────────────┘     └──────────────────────────┘
```

### Request Flow Diagram

```
┌──────────┐     HTTPS      ┌───────────┐     Proxy      ┌──────────┐
│  User    │ ───────────▶   │   NGINX   │ ──────────▶    │  React   │
│ Browser  │                │           │                │   App    │
└──────────┘                └───────────┘                └──────────┘
                                  │                           │
                                  │ /api/*                    │ API Call
                                  ▼                           ▼
                            ┌───────────┐              ┌──────────────┐
                            │  Backend  │◀─────────────│   Axios      │
                            │   API     │              │   Request    │
                            └───────────┘              └──────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
             ┌───────────┐               ┌───────────────┐
             │  MongoDB  │               │    AWS S3     │
             │ Database  │               │    Storage    │
             └───────────┘               └───────────────┘
```

---

## 💻 Technology Stack

### Frontend Applications

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Client Portal** | React | 19.0.0 | Student-facing web application |
| **Admin Panel** | React + Vite | 19.0.0 / 6.2.0 | Administrative dashboard |
| **State Management** | Redux Toolkit | 2.8.1 | Client app state |
| **Styling** | Tailwind CSS | 4.1.6 | UI styling |
| **HTTP Client** | Axios | 1.8.4 | API communication |
| **Routing** | React Router DOM | 7.2.0+ | Navigation |
| **UI Components** | Ant Design, Lucide | - | UI elements and icons |
| **PDF Generation** | jsPDF, html2canvas | - | Document generation |

### Backend Application

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| **Runtime** | Node.js | LTS | JavaScript runtime |
| **Framework** | Express.js | 4.21.2 | REST API framework |
| **Database** | MongoDB + Mongoose | 8.13.1 | Data persistence |
| **File Upload** | Multer | 1.4.5 | File handling |
| **Cloud Storage** | AWS SDK | 2.1692.0 | S3 integration |
| **PDF/Image** | node-html-to-image, pdfkit | - | Document generation |
| **Excel Parsing** | xlsx | 0.18.5 | Bulk data import |
| **Auth** | JWT | 9.0.2 | Authentication tokens |

### Infrastructure

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Containerization** | Docker | Application containers |
| **Orchestration** | Docker Compose | Multi-container management |
| **Reverse Proxy** | NGINX | Load balancing, SSL |
| **Database** | MongoDB 7.0 | Document storage |
| **Cloud Storage** | AWS S3 | File storage |

---

## 📁 Application Structure

### Project Directory Overview

```
iqnexus/
│
├── 📄 docker-compose.yml          # Container orchestration
├── 📄 docker.md                   # Docker documentation
├── 📄 PROJECT_DOCUMENTATION.md    # This file
│
├── 📁 iqnexus-admin-main/         # Admin Panel Application
│   ├── 📁 src/
│   │   ├── 📄 App.jsx             # Main app with routes
│   │   ├── 📄 Api.js              # API configuration
│   │   ├── 📁 pages/              # React page components
│   │   │   ├── 📄 Home.jsx                    # Dashboard
│   │   │   ├── 📄 AllStudents.jsx             # Student management
│   │   │   ├── 📄 AllSchools.jsx              # School management
│   │   │   ├── 📄 AdmitCard.jsx               # Admit card generation
│   │   │   ├── 📄 UploadBulkStudentData.jsx   # Bulk upload
│   │   │   ├── 📄 StudyMaterial.jsx           # Material management
│   │   │   ├── 📄 AnswerKeyUpload.jsx         # Answer key upload
│   │   │   ├── 📄 uploadResults.jsx           # Results upload
│   │   │   └── ... (30+ pages)
│   │   └── 📁 assets/             # Static assets
│   ├── 📄 Dockerfile              # Container config
│   └── 📄 package.json            # Dependencies
│
├── 📁 iqnexus-client-main/        # Student Portal Application
│   ├── 📁 src/
│   │   ├── 📄 App.jsx             # Main app with routes
│   │   ├── 📄 Api.js              # API configuration
│   │   ├── 📁 pages/              # React page components
│   │   │   ├── 📄 LoginPage.jsx   # Student login
│   │   │   ├── 📄 Dashboard.jsx   # Student dashboard
│   │   │   ├── 📄 AdmitCard.jsx   # View/download admit card
│   │   │   ├── 📄 Results.jsx     # View exam results
│   │   │   ├── 📄 StudyMaterials.jsx  # Access study materials
│   │   │   ├── 📄 Certificates.jsx    # View certificates
│   │   │   ├── 📄 Feedback.jsx    # Submit feedback
│   │   │   └── 📄 AnswerKey.jsx   # View answer keys
│   │   ├── 📁 redux/              # Redux state management
│   │   │   └── 📄 authSlice.js    # Authentication state
│   │   ├── 📁 services/           # Utility services
│   │   └── 📁 styles/             # CSS styles
│   ├── 📄 Dockerfile              # Container config
│   └── 📄 package.json            # Dependencies
│
├── 📁 iqnexus-backend-main/       # Backend API Application
│   ├── 📄 index.js                # Express server entry point
│   ├── 📁 controllers/            # Request handlers
│   │   ├── 📄 studentController.js
│   │   ├── 📄 schoolController.js
│   │   ├── 📄 admitCardController.js
│   │   ├── 📄 resultController.js
│   │   ├── 📄 certificateController.js
│   │   ├── 📄 AnswerController.js
│   │   ├── 📄 feedbackController.js
│   │   ├── 📄 kindergartenController.js
│   │   └── ... (16 controllers)
│   ├── 📁 models/                 # MongoDB schemas
│   │   ├── 📄 newStudentModel.model.js
│   │   ├── 📄 schoolModel.js
│   │   ├── 📄 kindergarten.model.js
│   │   ├── 📄 answersModel.js
│   │   ├── 📄 feedbackModel.js
│   │   └── 📄 TeacherInchargeModel.js
│   ├── 📁 routes/                 # API route definitions
│   │   ├── 📄 index.js            # Route aggregator
│   │   ├── 📄 studentRoutes.js
│   │   ├── 📄 schoolRoutes.js
│   │   └── ... (13 route files)
│   ├── 📁 services/               # Business logic
│   │   ├── 📄 admitCardService.js
│   │   ├── 📄 certificateService.js
│   │   ├── 📄 studentService.js
│   │   └── 📄 studyMaterialService.js
│   ├── 📁 designs/                # HTML templates
│   │   ├── 📄 admitCard.html
│   │   └── 📄 certificate.html
│   ├── 📁 uploads/                # Temp upload directory
│   └── 📁 utils/                  # Utility functions
│
└── 📁 nginx/                      # Reverse proxy configuration
    ├── 📄 nginx.conf              # Main NGINX config
    ├── 📁 conf.d/                 # Additional configs
    ├── 📁 ssl/                    # SSL certificates
    └── 📁 logs/                   # Access/error logs
```

---

## 🗄 Database Design

### Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            DATABASE: Epoch-olympiad-foundation_New              │
└─────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐         ┌──────────────────────────┐
│      schools-datas       │         │   student_data_latests   │
├──────────────────────────┤         ├──────────────────────────┤
│ _id: ObjectId           │         │ _id: ObjectId            │
│ schoolCode: Number [PK] │◀───────┐│ rollNo: String [PK]      │
│ schoolName: String      │        ││ schoolCode: Number [FK]  │────┐
│ schoolEmail: String     │        ││ studentName: String      │    │
│ city: String            │        ││ class: String            │    │
│ area: String            │        ││ section: String          │    │
│ country: String         │        ││ fatherName: String       │    │
│ principalName: String   │        ││ motherName: String       │    │
│ principalMobNo: String  │        ││ dob: String              │    │
│ incharge: String        │        ││ mobNo: String            │    │
│ inchargeDob: String     │        ││ IAOL1/ITSTL1/IMOL1...    │    │
│ remark: String          │        ││ result: {                │    │
└──────────────────────────┘        ││   IAOL1: {marks, pass}  │    │
                                    ││   IAOL2: {...}          │    │
                                    ││   ...                   │    │
                                    ││ }                       │    │
                                    │└──────────────────────────┘    │
                                    │                                │
┌──────────────────────────┐        │ ┌──────────────────────────┐   │
│   kindergarten_students  │        │ │     TeacherIncharges     │   │
├──────────────────────────┤        │ ├──────────────────────────┤   │
│ _id: ObjectId           │        │ │ _id: ObjectId            │   │
│ rollNo: String [PK]     │        │ │ schoolCode: Number [FK]  │───┤
│ schoolCode: Number [FK] │────────┘ │ class: String            │   │
│ studentName: String     │          │ section: String          │   │
│ class: "KD"             │          │ classTeacher: String     │   │
│ section: LKG/UKG/PG     │          │ classTeacherMobNo: String│   │
│ IQKD1: String           │          │ examInchargeName: String │   │
│ IQKD2: String           │          │ examInchargeMobNo: String│   │
│ ...                     │          └──────────────────────────┘   │
└──────────────────────────┘                                        │
                                                                    │
┌──────────────────────────┐         ┌──────────────────────────┐   │
│       Questions          │         │    study_materials       │   │
├──────────────────────────┤         ├──────────────────────────┤   │
│ _id: ObjectId           │         │ _id: String              │   │
│ examLevel: String       │         │ category: String         │   │
│ subject: String         │         │ class: String            │   │
│ class: String           │         │ examId: String           │   │
│ questions: Object       │         │ cost: String             │   │
│ createdAt: Date         │         │ pdfLink: String (S3 URL) │   │
│ updatedAt: Date         │         │ kgSection: String        │   │
└──────────────────────────┘         └──────────────────────────┘   │
                                                                    │
┌──────────────────────────┐         ┌──────────────────────────┐   │
│       Feedbacks          │         │    admitCards (GridFS)   │   │
├──────────────────────────┤         ├──────────────────────────┤   │
│ _id: ObjectId           │         │ filename: String         │   │
│ category: String        │         │ metadata: Object         │◀──┘
│ rollNo: String          │         │ uploadDate: Date         │
│ mobileNo: String        │         │ (Binary data in chunks)  │
│ message: String         │         └──────────────────────────┘
│ status: pending/resolved│
│ createdAt: Date         │
└──────────────────────────┘
```

### Key Data Models

#### Student Model (Regular Students)
```javascript
{
  rollNo: String,           // Unique identifier
  schoolCode: Number,       // Reference to school
  class: String,            // "1" to "12"
  section: String,          // "A", "B", etc.
  studentName: String,
  fatherName: String,
  motherName: String,
  dob: String,
  mobNo: String,            // Used for login
  
  // Exam participation flags (L1 = Basic, L2 = Advanced)
  IAOL1: "0" | "1",         // Reasoning Olympiad Level 1
  ITSTL1: "0" | "1",        // Science/Tech Olympiad Level 1
  IMOL1: "0" | "1",         // Maths Olympiad Level 1
  IGKOL1: "0" | "1",        // GK Olympiad Level 1
  IENGOL1: "0" | "1",       // English Olympiad Level 1
  IAOL2: "0" | "1",         // Advanced levels...
  
  // Results embedded document
  result: {
    IAOL1: { marksObtained, totalMarks, passOrFail },
    IMOL1: { marksObtained, totalMarks, passOrFail },
    // ... other exams
  }
}
```

---

## 🔌 API Documentation

### API Endpoints Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              API ROUTES STRUCTURE                                │
│                              Base URL: /api                                      │
└─────────────────────────────────────────────────────────────────────────────────┘

📁 STUDENT ROUTES (/students)
├── GET  /get-student              → Get student by mobile (Auth header)
├── GET  /all-students             → Get all students (paginated)
├── POST /students                 → Filter students with criteria
├── POST /add-student              → Add single student
├── PUT  /student                  → Update student data
├── POST /upload-studentData       → Bulk upload from Excel
└── GET  /dashboard-analytics      → Get statistics

📁 SCHOOL ROUTES (/schools)
├── GET  /schools                  → Get all schools (paginated)
├── GET  /school/:id               → Get school by code
├── POST /school                   → Add new school
├── PUT  /school                   → Update school
├── DELETE /school/:schoolCode     → Delete school
└── POST /upload-school-data       → Bulk upload schools

📁 KINDERGARTEN ROUTES (/kindergarten)
├── GET  /kg-students              → Get KG students
├── POST /kg-student               → Add KG student
└── POST /upload-kg-data           → Bulk upload KG data

📁 ADMIT CARD ROUTES (/admit-card)
├── POST /admit-card-students      → Get students for admit cards
├── POST /generate-admit-cards     → Generate admit cards for school
├── POST /fetch-admit-card         → Fetch admit card image
└── GET  /student-admit-card/:mob  → Get student's admit card

📁 RESULT ROUTES (/results)
├── POST /uploadResult             → Upload results from Excel
└── GET  /getresult                → Get student result

📁 CERTIFICATE ROUTES (/certificates)
├── GET  /certificate/:mobNo       → Fetch certificate
└── POST /document/:type           → Generate certificate/document

📁 ANSWER KEY ROUTES (/answers)
├── POST /upload-answers           → Upload answer key
└── POST /fetch-answers            → Get answer keys for student

📁 STUDY MATERIAL ROUTES (/study-materials)
├── POST /study-material           → Upload study material
├── POST /fetchStudyMaterial       → Get materials for student
├── GET  /admin/study-materials    → Get all materials (admin)
└── DELETE /study-material/:id     → Delete material

📁 FEEDBACK ROUTES (/feedback)
├── POST /feedback                 → Submit feedback
└── GET  /feedbacks                → Get all feedbacks

📁 PARTICIPATION ROUTES
├── POST /allStudents              → Get attendance list
├── POST /participation-list       → Get filtered participation

📁 EXAM INCHARGE ROUTES
├── GET  /exam-incharge/:id        → Get incharge by ID
├── POST /exam-incharge            → Create/upload incharges
└── GET  /exam-incharges           → List all incharges

📁 HEALTH CHECK
└── GET  /health                   → Server health status
```

### Authentication Flow

```
┌─────────────────┐     ┌──────────────────────────────────────────────────────┐
│   Student       │     │                  LOGIN FLOW                           │
│   Client        │     └──────────────────────────────────────────────────────┘
└────────┬────────┘
         │
         │  1. Enter Mobile Number
         ▼
┌─────────────────┐     GET /get-student
│   Login Page    │────────────────────────────────────────────────┐
└─────────────────┘     Headers: { Authorization: "Bearer {mobile}" }
                                                                    │
         ┌──────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐     2. Lookup by mobNo
│   Backend API   │────────────────────────▶ MongoDB
└────────┬────────┘                          │
         │                                   │
         │◀──────────────────────────────────┘
         │     3. Return student data (or multiple profiles)
         │
         ▼
┌─────────────────┐     4. User selects profile (if multiple)
│  Profile Select │
└────────┬────────┘
         │
         │  5. Store in Redux + localStorage
         ▼
┌─────────────────┐
│   Dashboard     │     Session expires in 7 days
└─────────────────┘
```

---

## 👥 User Flows

### Student Portal User Journey

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           STUDENT USER JOURNEY                                   │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────┐
    │  START  │
    └────┬────┘
         │
         ▼
┌─────────────────┐     Enter mobile number
│   Login Page    │─────────────────────────┐
└─────────────────┘                         │
                                            ▼
                               ┌──────────────────────┐
                               │ Multiple profiles?   │
                               └──────────┬───────────┘
                                    │           │
                              Yes   │           │  No
                                    ▼           ▼
                         ┌────────────────┐  ┌────────────────┐
                         │ Select Profile │  │ Auto-login     │
                         └───────┬────────┘  └───────┬────────┘
                                 │                   │
                                 └─────────┬─────────┘
                                           ▼
                              ┌──────────────────────┐
                              │     DASHBOARD        │
                              │                      │
                              │ • Student Info       │
                              │ • Enrolled Exams     │
                              │ • Quick Actions      │
                              └──────────┬───────────┘
                                         │
           ┌─────────────┬───────────────┼───────────────┬─────────────┐
           ▼             ▼               ▼               ▼             ▼
    ┌───────────┐ ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
    │  Admit    │ │  Results  │  │  Study    │  │Certificate│  │ Feedback  │
    │  Card     │ │           │  │ Materials │  │           │  │           │
    └─────┬─────┘ └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘
          │             │              │              │              │
          ▼             ▼              ▼              ▼              ▼
    ┌───────────┐ ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
    │ Select    │ │ View exam │  │ View/     │  │ Download  │  │ Submit    │
    │ Level     │ │ scores    │  │ Download  │  │ PDF       │  │ Issue     │
    │ (L1/L2)   │ │ per exam  │  │ PDFs      │  │           │  │           │
    └─────┬─────┘ └─────┬─────┘  └───────────┘  └───────────┘  └───────────┘
          │             │
          ▼             ▼
    ┌───────────┐ ┌───────────┐
    │ Download  │ │ Download  │
    │ PDF/PNG   │ │ Result    │
    │           │ │ Card PDF  │
    └───────────┘ └───────────┘
```

### Admin Panel User Journey

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            ADMIN USER JOURNEY                                    │
└─────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────┐
    │  START  │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│   Admin Login   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              ADMIN DASHBOARD                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                 │
│  │ Total Students  │  │ Total Schools   │  │ Study Materials │                 │
│  │     XXXX        │  │      XXX        │  │       XX        │                 │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    │               │               │               │               │
    ▼               ▼               ▼               ▼               ▼
┌─────────┐   ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ Student │   │ School  │     │ Admit   │     │ Study   │     │ Results │
│ Mgmt    │   │ Mgmt    │     │ Cards   │     │Material │     │ Upload  │
└────┬────┘   └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │             │               │               │               │
     ▼             ▼               ▼               ▼               │
┌─────────────────────────────────────────────────────────────┐    │
│                    BULK OPERATIONS                           │    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │    │
│  │ Upload Excel │  │ Upload Excel │  │ Generate for │      │    │
│  │ (Students)   │  │ (Schools)    │  │ School+Level │      │    │
│  └──────────────┘  └──────────────┘  └──────────────┘      │    │
└─────────────────────────────────────────────────────────────┘    │
                                                                    │
     ┌──────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         REPORTS & LISTS                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │
│  │ School-wise │ │ Class-wise  │ │Section-wise │ │ Cost-wise   │   │
│  │ Participation│ │ List       │ │ List        │ │ Report      │   │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features Breakdown

### Student Portal Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Mobile Login** | Login using registered mobile number | ✅ |
| **Multi-profile Support** | Select from multiple student profiles on same mobile | ✅ |
| **Dashboard** | View personal info, enrolled exams, participation status | ✅ |
| **Admit Card Download** | Download admit cards for L1/L2 levels as PDF | ✅ |
| **View Results** | Check exam results with marks breakdown | ✅ |
| **Study Materials** | Access and download PDFs based on enrolled exams | ✅ |
| **Answer Keys** | View answer keys for attempted exams | ✅ |
| **Certificates** | Download participation/achievement certificates | ✅ |
| **Feedback System** | Submit issues and feedback | ✅ |
| **Session Persistence** | Auto-login for 7 days | ✅ |

### Admin Panel Features

| Feature | Description | Status |
|---------|-------------|--------|
| **Dashboard Analytics** | View total students, schools, materials count | ✅ |
| **Student Management** | Add, edit, delete, search students | ✅ |
| **Bulk Student Upload** | Import students from Excel/CSV | ✅ |
| **School Management** | Add, edit, delete, search schools | ✅ |
| **Bulk School Upload** | Import schools from Excel | ✅ |
| **Kindergarten Management** | Separate management for KG students | ✅ |
| **Admit Card Generation** | Batch generate for school+level | ✅ |
| **Study Material Upload** | Upload PDFs to S3, link to exams | ✅ |
| **Answer Key Upload** | Upload answer keys per exam/class | ✅ |
| **Results Upload** | Upload results from Excel | ✅ |
| **Participation Reports** | Generate school-wise, class-wise lists | ✅ |
| **Teacher/Incharge Data** | Manage exam incharge information | ✅ |
| **Feedback Management** | View and manage student feedback | ✅ |
| **Qualified List** | Export qualified students for L2 | ✅ |

---

## 🚀 Deployment Architecture

### Docker Compose Services

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DOCKER COMPOSE ARCHITECTURE                              │
│                              Network: iqnexus-network                            │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              NGINX (iqnexus-nginx)                               │
│                              Ports: 80, 443 → External                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  /            → client:3000     (Student Portal)                        │    │
│  │  /admin       → admin:3000      (Admin Panel)                           │    │
│  │  /api         → backend:5001    (API Server)                            │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ iqnexus-client  │  │  iqnexus-admin  │  │ iqnexus-backend │
│ Port: 3000      │  │  Port: 3000     │  │  Port: 5001     │
│ React App       │  │  Vite+React     │  │  Express API    │
│                 │  │                 │  │                 │
│ Dockerfile:     │  │  Dockerfile:    │  │  Dockerfile:    │
│ - Node build    │  │  - Vite build   │  │  - Node runtime │
│ - Serve static  │  │  - Serve static │  │  - nodemon dev  │
└─────────────────┘  └─────────────────┘  └────────┬────────┘
                                                   │
                                                   ▼
                                          ┌─────────────────┐
                                          │ iqnexus-mongodb │
                                          │ Port: 27017     │
                                          │ (Internal only) │
                                          │                 │
                                          │ Volume:         │
                                          │ mongodb_data    │
                                          └─────────────────┘
```

### Environment Variables

| Service | Variable | Description |
|---------|----------|-------------|
| **Backend** | `MONGO_URI` | MongoDB connection string |
| **Backend** | `DATABASE_NAME` | Database name |
| **Backend** | `AWS_KEY` | AWS S3 access key |
| **Backend** | `AWS_SECRET` | AWS S3 secret key |
| **Backend** | `AWS_REGION` | AWS region (ap-south-1) |
| **Backend** | `AWS_BUCKET_NAME` | S3 bucket name |
| **Client** | `REACT_APP_BASE_API_URL` | API base URL |
| **Admin** | `VITE_API_BASE_URL` | API base URL for Vite |

---

## 🚀 Getting Started

### Prerequisites

- Docker & Docker Compose installed
- Node.js 18+ (for local development)
- MongoDB (local or Atlas for development)
- AWS S3 bucket configured

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/jayantasonowal/iqnexus.git
cd iqnexus

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Access the applications:
# - Student Portal: http://localhost (or https://your-domain.com)
# - Admin Panel: http://localhost:3001 (or https://your-domain.com/admin)
# - API: http://localhost/api
```

### Local Development

```bash
# Backend
cd iqnexus-backend-main
npm install
npm run dev  # Runs on port 5001

# Client Portal
cd iqnexus-client-main
npm install
npm start    # Runs on port 3000

# Admin Panel
cd iqnexus-admin-main
npm install
npm run dev  # Runs on port 5173 (Vite)
```

### Project Health Check

```bash
# Check API health
curl http://localhost:5001/health

# Response:
# { "message": "Server is Healthy" }
```

---

## 📊 Quick Reference

### Exam Code Mapping

```
Internal Code → Display Name
──────────────────────────────
IAOL1/L2     → IQRO (Reasoning)
ITSTL1/L2    → IQSO (Science)
IMOL1/L2     → IQMO (Maths)
IGKOL1       → IQGKO (GK)
IENGOL1/L2   → IQEO (English)
IQKD1/L2     → IQKD (Kindergarten)
```

### Class Structure

```
Regular Classes: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
Kindergarten: KD (with sections: LKG, UKG, PG)
```

---

## 📝 Notes

1. **Mobile Number as Primary Identifier**: Students log in using their mobile number, which can have multiple profiles (siblings, etc.)

2. **GridFS for Large Files**: Admit card images are stored in MongoDB GridFS for efficient binary storage

3. **AWS S3 Integration**: Study materials (PDFs) are uploaded to S3 with public URLs stored in the database

4. **Exam Levels**: 
   - L1 (Level 1) = Basic Level
   - L2 (Level 2) = Advanced Level (for qualified students)

5. **Session Management**: Client uses Redux + localStorage with 7-day expiration

---

## 📄 License

This project is proprietary software. All rights reserved.

---

> **Document Version**: 1.0  
> **Last Updated**: January 2026  
> **Author**: IQNexus Development Team
