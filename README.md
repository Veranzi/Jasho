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
└── README.md
