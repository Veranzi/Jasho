# 🚀 Quick Start Guide - No Docker Required

This guide will help you set up and run the Jasho Financial Backend without Docker.

## 📋 Prerequisites

- **Python 3.8+** (Download from [python.org](https://python.org))
- **PostgreSQL** (Download from [postgresql.org](https://postgresql.org))
- **Redis** (Download from [redis.io](https://redis.io))

## ⚡ Super Quick Setup (3 Steps)

### Step 1: Run Setup Script
```bash
python setup.py
```

### Step 2: Configure Environment
Edit the `.env` file with your settings:
```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/jasho_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Firebase (already configured)
FIREBASE_PROJECT_ID=jasho-dad1b
```

### Step 3: Start the Server
**Windows:**
```bash
start.bat
```

**Mac/Linux:**
```bash
./start.sh
```

**Or manually:**
```bash
# Activate virtual environment
venv\Scripts\activate  # Windows
# or
source venv/bin/activate  # Mac/Linux

# Start server
python run.py
```

## 🌐 Access Your Backend

- **API Server**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🛠️ Manual Setup (Alternative)

If you prefer to set up manually:

### 1. Create Virtual Environment
```bash
python -m venv venv
```

### 2. Activate Virtual Environment
**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements-simple.txt
```

### 4. Configure Environment
```bash
cp env.example .env
# Edit .env with your configuration
```

### 5. Start Server
```bash
python run.py
```

## 🗄️ Database Setup

### PostgreSQL Setup
1. Install PostgreSQL
2. Create database:
```sql
CREATE DATABASE jasho_db;
CREATE USER jasho_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE jasho_db TO jasho_user;
```

3. Update `.env`:
```
DATABASE_URL=postgresql://jasho_user:your_password@localhost:5432/jasho_db
```

### Redis Setup
1. Install Redis
2. Start Redis server:
```bash
redis-server
```

## 🔥 Firebase Setup (Already Done!)

Your Firebase configuration is already set up with:
- Project ID: `jasho-dad1b`
- Service account credentials included
- Real-time database configured

## 🚀 Deployment Options (No Docker)

### Option 1: Railway (Recommended)
1. Push to GitHub
2. Connect to [Railway](https://railway.app)
3. Deploy automatically

### Option 2: Heroku
1. Install Heroku CLI
2. Create Heroku app
3. Deploy:
```bash
git push heroku main
```

### Option 3: Vercel
1. Install Vercel CLI
2. Deploy:
```bash
vercel --prod
```

### Option 4: DigitalOcean App Platform
1. Connect GitHub repository
2. Configure build settings
3. Deploy

## 🔧 Troubleshooting

### Common Issues

**Port 8000 already in use:**
```bash
# Change port in run.py
uvicorn.run("app.main:app", port=8001)
```

**Database connection error:**
- Check PostgreSQL is running
- Verify database credentials in `.env`

**Redis connection error:**
- Check Redis is running
- Verify Redis host/port in `.env`

**Firebase error:**
- Check internet connection
- Verify Firebase project ID

### Getting Help

1. Check the logs in the terminal
2. Visit http://localhost:8000/health for system status
3. Check the API documentation at http://localhost:8000/docs

## 📱 Features Available

✅ **Authentication** - Firebase Auth integration  
✅ **Security** - Balance masking, document scanning  
✅ **AI Chatbot** - Voice-enabled, responsible AI  
✅ **Credit Scoring** - AI-powered credit analysis  
✅ **Blockchain** - Transaction recording  
✅ **SMS Verification** - Multi-provider support  
✅ **Job Heatmap** - Interactive visualizations  
✅ **AI Insights** - Pattern learning and predictions  

## 🎯 Next Steps

1. **Test the API**: Visit http://localhost:8000/docs
2. **Configure SMS**: Add Twilio/Africa's Talking credentials
3. **Set up Blockchain**: Configure Ethereum RPC
4. **Deploy**: Choose your preferred deployment platform

---

**🎉 You're all set! Your Jasho Financial Backend is running without Docker!**
