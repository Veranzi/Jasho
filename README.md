# Jasho Backend

**Tagline:** Powering Your Hustle, Growing Your Wealth  

Jasho is a gig-worker super app that helps hustlers track multiple incomes, save smarter, access micro-loans, and protect themselves from scams.  
This repository contains the **backend service** that powers the mobile app,web dashboard, chatbot, and USSD features — handling authentication, income tracking, savings, wallet, and integrations with M-Pesa and Absa APIs.

---

## 🌍 Why Jasho?

Gig workers form the backbone of Africa’s economy but face:
- **Unpredictable income** across multiple hustles  
- **Limited access to credit & insurance** due to lack of formal records  
- **Exposure to fraud/scams** in digital platforms  
- **Exclusion from digital finance** (many still on feature phones via USSD)  

Jasho solves this with:
- A unified income tracker (“Income Mirror”)  
- AI-powered financial forecasting (“Financial Weather Radar”)  
- Alternative credit scoring (“Hustle Trust Score”)  
- Savings, micro-insurance & rewards  
- Multichannel access (Mobile App, Web, Chatbot, USSD)  

---


## 🚀 Tech Stack
- **Backend Framework:** FastAPI
- **Database ORM:** SQLModel (SQLAlchemy + Pydantic)
- **Database:** PostgreSQL
- **Auth & Security:** JWT (via `python-jose`), password hashing (`passlib`)
- **Migrations:** Alembic
- **Environment Config:** python-dotenv
- **Async HTTP Calls:** httpx
- **Server:** Uvicorn

---

## 📂 Project Structure
```bash
Jasho-backend/
├── alembic/                  # migrations folder
│   ├── versions/
│   └── env.py
├── app/                      # main backend app
│   ├── main.py               # FastAPI entrypoint
│   ├── core/                 # config & security
│   ├── db/                   # db session, base
│   ├── models/               # SQLModel models
│   ├── schemas/              # Pydantic schemas
│   ├── routers/              # API routes
│   └── services/             # business logic
├── tests/                    # tests
├── .env                      # environment variables
├── alembic.ini               # alembic config
├── requirements.txt          # dependencies
└── README.md                 # This file
```
## ⚙️ Setup Instructions
1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/jasho-backend.git
cd jasho-backend
```
2. Create and activate a virtual environment
```bash
python -m venv venv
source venv/bin/activate   # Mac/Linux
venv\Scripts\activate      # Windows
```
3. Install dependencies
```bash
pip install -r requirements.txt
```
4. Setup environment variables
```bash
Create a .env file in the project root:

DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/jasho
SECRET_KEY=supersecret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```
5. Run database migrations
```bash
alembic upgrade head
```
6. Start the server
```bash
uvicorn app.main:app --reload
```
## 🛠️ Features (MVP Scope)

✅ User registration & login (JWT auth)

✅ Income tracking (manual entry, M-Pesa SMS parsing)

✅ Wallet & savings goals

✅ Gig/job logging

✅ Chatbot + USSD endpoints

🔜 AI income forecasting (LSTM/Prophet)

🔜 Hustle Trust Score (alternative credit scoring)

🔜 Fraud/Scam detection

## 🧪 Running Tests
pytest

🌍 Roadmap

## Phase 1 (Hackathon MVP):

Auth, wallet, income tracker, chatbot (Eng/Swa), USSD menus

## Phase 2 (Pilot w/ Absa):

Hustle Trust Score

Savings + micro-insurance

Fraud shield

## Phase 3 (Scaling):

Community noticeboard

Gamification (badges, airtime/data rewards)

Multi-country expansion (Tanzania, Uganda, Nigeria)

## 🤝 Contributing

We welcome contributions!

Fork the repo

Create a feature branch (git checkout -b feature-x)

Commit changes (git commit -m "Add feature x")

Push branch (git push origin feature-x)

Create Pull Request

## 📜 License

This project is licensed under the MIT License. See LICENSE file for details.

Jasho Backend — Built for hustlers, by hustlers.
