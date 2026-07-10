# 🧠 MindSync - Immersive Mood Tracking & Therapy Platform

**MindSync** is a full-stack mental health web application designed to provide users with an immersive ambient audio environment based on real-time mood evaluation. 

> **Focus:** Bridging the gap between patients and caretakers through intelligent emotional tracking, rapid feedback loops, and secure data management.

---

## ✨ Key Features

* **Real-Time Mood & Therapy:** Immersive ambient audio environment generated dynamically based on real-time mood evaluation.
* **Rapid Feedback Panel:** Engineered a modular 1-step rapid feedback evaluation panel.
* **Medication Tracking:** Features a synchronized daily medication compliance tracker for patients.
* **Caretaker Dashboard:** Dedicated role-based access (`care_taker`) to monitor patient emotional history securely.
* **Secure Architecture:** Token-based authentication and decoupled frontend-backend microservices.

---

## 💻 Tech Stack

| Component | Technologies Used |
| :--- | :--- |
| **Frontend** | React.js, Tailwind CSS |
| **Backend** | FastAPI, Python, RESTful APIs |
| **Database** | PostgreSQL (Neon), SQLAlchemy ORM |
| **Validation**| Pydantic |
| **Deployment**| Vercel, Choreo, GitHub |

---

## 📸 Screenshots
*Coming Soon...*

## 🎥 Demo Video
*Coming Soon...*

---

## 🚀 How to Run Locally

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
```

---

## 📜 License
This project is licensed under the MIT License.