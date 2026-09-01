# 🧠 MindSync - Immersive Mood Tracking & Therapy Platform

Welcome to **MindSync**, a full-stack mental health web application designed to provide users with an immersive ambient audio environment based on real-time mood evaluation. 

> **Focus:** Bridging the gap between patients and caretakers through intelligent emotional tracking, rapid feedback loops, and secure data management.

## 🎥 Project Demo
Check out the video walk-through of the application:

[▶️ Click here to watch the Demo Video](./mindsync_demo.mp4)

## 🌟 The Problem it Solves
Managing and tracking mental health wellness often lacks real-time, actionable feedback. MindSync bridges the gap between patients and their caretakers by offering intelligent emotional tracking, providing immediate therapeutic audio responses, and ensuring caretakers are updated with live alerts and comprehensive mood analytics.

## ✨ Key Features
* **Real-Time Mood & Therapy:** Immersive ambient audio environment generated dynamically based on real-time mood evaluation.
* **Rapid Feedback Panel:** Engineered a modular 1-step rapid feedback evaluation panel.
* **Medication Tracking:** Features a synchronized daily medication compliance tracker for patients.
* **Caretaker Dashboard:** Dedicated role-based access (`care_taker`) to monitor patient emotional history and receive critical status updates securely.
* **Secure Architecture:** Token-based authentication and decoupled frontend-backend microservices.

## 💻 Tech Stack
* **Frontend:** React.js, Tailwind CSS
* **Backend:** FastAPI, Python, RESTful APIs
* **Database:** PostgreSQL (Hosted on Neon), SQLAlchemy ORM
* **Caching & State Management:** Redis
* **Validation:** Pydantic
* **Deployment:** Vercel (Frontend), WSO2 Choreo (Backend)

## 📸 Screenshots

### 1. Authentication & Onboarding
<p align="center">
  <img src="./login.png" alt="Login & Role Selection" width="48%" />
  <img src="./invite-patient.png" alt="Invite Patient Modal" width="48%" />
</p>

### 2. Patient Experience: AI Wellness & Mood Studio
<p align="center">
  <img src="./ai-chat.png" alt="WellnessAI Chat Integration" width="48%" />
  <img src="./mood-studio.png" alt="Mood Studio & Healing Tracks" width="48%" />
</p>

### 3. Caretaker Dashboard: Alerts & Analytics
<p align="center">
  <img src="./live-alerts.png" alt="Live Patient Alerts" width="48%" />
  <img src="./analytics.png" alt="Mood Analytics & Interaction Timeline" width="48%" />
</p>

## 🚀 How to Run Locally

### Prerequisites
Make sure you have the following installed on your machine:
* [Python 3.8+](https://www.python.org/downloads/) (For the FastAPI backend)
* [Node.js](https://nodejs.org/) (For running and building the React frontend)
* [Docker](https://www.docker.com/) (For running the Redis server locally)

### 1. Start Redis Server (via Docker)
Before starting the backend, ensure your Redis instance is up and running for caching and state management.
```bash
docker run -d --name mindsync-redis -p 6379:6379 redis
```

### 2. Backend Setup
```bash
cd backend

# Create and activate virtual environment
python -m venv .venv
# On Windows: .venv\Scripts\activate
# On Mac/Linux: source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file and add your database and redis URIs
# Example: 
# DATABASE_URL=postgresql://user:password@hostname/dbname
# REDIS_URL=redis://localhost:6379

# Run the backend server
uvicorn main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend

# Install Node modules
npm install

# Start the React app
npm start
```
## 📜 License
This project is licensed under the MIT License.
