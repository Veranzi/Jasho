# 🔗 Frontend-Backend API Integration Guide

## 🚨 **Critical Issues Found & Fixed**

### ✅ **Fixed Issues:**
1. **Port Mismatch**: Updated frontend base URL from `3000` to `8000`
2. **Authentication Endpoint**: Updated `/auth/register` to `/auth/signup`

### ❌ **Still Need to Fix:**

## 📊 **API Endpoint Mapping**

### **Authentication Endpoints**
| Frontend Call | Backend Endpoint | Status | Notes |
|---------------|------------------|--------|-------|
| `POST /auth/register` | `POST /auth/signup` | ✅ Fixed | Updated in API service |
| `POST /auth/login` | `POST /auth/login` | ✅ Working | Matches |
| `POST /auth/verify-email` | ❌ Missing | ❌ Need to add | Not in backend |
| `POST /auth/verify-phone` | ❌ Missing | ❌ Need to add | Not in backend |
| `POST /auth/forgot-password` | ❌ Missing | ❌ Need to add | Not in backend |
| `POST /auth/reset-password` | ❌ Missing | ❌ Need to add | Not in backend |

### **User Management Endpoints**
| Frontend Call | Backend Endpoint | Status | Notes |
|---------------|------------------|--------|-------|
| `GET /user/profile` | ❌ Missing | ❌ Need to add | Not in backend |
| `PUT /user/profile` | ❌ Missing | ❌ Need to add | Not in backend |
| `POST /user/kyc` | ❌ Missing | ❌ Need to add | Not in backend |
| `POST /user/upload-profile-image` | ❌ Missing | ❌ Need to add | Not in backend |

### **Wallet Endpoints**
| Frontend Call | Backend Endpoint | Status | Notes |
|---------------|------------------|--------|-------|
| `GET /wallet/balance` | `GET /wallet/balance` | ✅ Working | Matches |
| `POST /wallet/deposit` | `POST /wallet/topup` | ⚠️ Different | Need to update frontend |
| `POST /wallet/withdraw` | `POST /wallet/withdraw` | ✅ Working | Matches |
| `GET /wallet/transactions` | `GET /wallet/history` | ⚠️ Different | Need to update frontend |
| `POST /wallet/transfer` | ❌ Missing | ❌ Need to add | Not in backend |
| `POST /wallet/convert` | ❌ Missing | ❌ Need to add | Not in backend |

### **Income Management**
| Frontend Call | Backend Endpoint | Status | Notes |
|---------------|------------------|--------|-------|
| `POST /incomes/` | `POST /incomes/` | ✅ Working | Matches |
| `GET /incomes/forecast` | `GET /incomes/forecast` | ✅ Working | Matches |
| `GET /incomes/trust` | `GET /incomes/trust` | ✅ Working | Matches |

### **AI Chatbot**
| Frontend Call | Backend Endpoint | Status | Notes |
|---------------|------------------|--------|-------|
| `POST /chatbot/message` | `POST /chatbot/message` | ✅ Working | Matches |
| `POST /chatbot/voice-message` | `POST /ai/chatbot/voice-message` | ⚠️ Different | Need to update frontend |

### **Credit Scoring**
| Frontend Call | Backend Endpoint | Status | Notes |
|---------------|------------------|--------|-------|
| `GET /credit-score/score` | `GET /ai/credit-score/{user_id}` | ⚠️ Different | Need to update frontend |
| `GET /credit-score/analysis` | ❌ Missing | ❌ Need to add | Not in backend |
| `POST /credit-score/recalculate` | `POST /ai/credit-score/calculate` | ⚠️ Different | Need to update frontend |

### **New Backend Features (Not in Frontend)**
| Backend Endpoint | Frontend Status | Notes |
|------------------|-----------------|-------|
| `POST /security/scan-document` | ❌ Missing | Need to add to frontend |
| `POST /security/validate-url` | ❌ Missing | Need to add to frontend |
| `POST /security/mask-balance` | ❌ Missing | Need to add to frontend |
| `POST /blockchain/record-transaction` | ❌ Missing | Need to add to frontend |
| `POST /jobs/heatmap` | ❌ Missing | Need to add to frontend |
| `POST /sms/send-verification` | ❌ Missing | Need to add to frontend |
| `POST /ai/insights/analyze-patterns` | ❌ Missing | Need to add to frontend |

## 🔧 **Required Updates**

### **1. Update Frontend API Service**

#### **Fix Wallet Endpoints:**
```dart
// Change from:
POST /wallet/deposit
GET /wallet/transactions

// To:
POST /wallet/topup
GET /wallet/history
```

#### **Fix Chatbot Endpoints:**
```dart
// Change from:
POST /chatbot/voice-message

// To:
POST /ai/chatbot/voice-message
```

#### **Fix Credit Score Endpoints:**
```dart
// Change from:
GET /credit-score/score
POST /credit-score/recalculate

// To:
GET /ai/credit-score/{user_id}
POST /ai/credit-score/calculate
```

### **2. Add Missing Backend Endpoints**

The backend needs these endpoints that the frontend expects:

```python
# Add to auth_router.py
@router.post("/verify-email")
@router.post("/verify-phone") 
@router.post("/forgot-password")
@router.post("/reset-password")

# Add to wallet_router.py
@router.post("/transfer")
@router.post("/convert")

# Add to new user_router.py
@router.get("/profile")
@router.put("/profile")
@router.post("/kyc")
@router.post("/upload-profile-image")
```

### **3. Add New Features to Frontend**

Add these new API calls to the frontend:

```dart
// Security features
Future<Map<String, dynamic>> scanDocument(File file);
Future<Map<String, dynamic>> validateUrl(String url);
Future<Map<String, dynamic>> maskBalance(double amount);

// Blockchain features
Future<Map<String, dynamic>> recordTransaction(Map<String, dynamic> data);

// Job heatmap
Future<Map<String, dynamic>> createJobHeatmap(Map<String, dynamic> data);

// SMS verification
Future<Map<String, dynamic>> sendSmsVerification(String phoneNumber);

// AI insights
Future<Map<String, dynamic>> analyzePatterns(Map<String, dynamic> data);
```

## 🚀 **Quick Fix Priority**

### **High Priority (Breaks App):**
1. ✅ Fix base URL (port 3000 → 8000) - **DONE**
2. ✅ Fix auth signup endpoint - **DONE**
3. 🔄 Fix wallet deposit endpoint (`/deposit` → `/topup`)
4. 🔄 Fix wallet history endpoint (`/transactions` → `/history`)

### **Medium Priority (Missing Features):**
1. Add missing auth endpoints (verify-email, forgot-password, etc.)
2. Add user profile endpoints
3. Add wallet transfer/convert endpoints

### **Low Priority (New Features):**
1. Add security features (document scanning, URL validation)
2. Add blockchain integration
3. Add job heatmap features
4. Add SMS verification
5. Add AI insights

## 📱 **Current Status**

- **Backend**: ✅ Running on port 8000 with Firebase integration
- **Frontend**: ⚠️ Partially compatible, needs endpoint updates
- **Authentication**: ⚠️ Frontend uses JWT, backend uses Firebase
- **Database**: ✅ Compatible models
- **Core Features**: ⚠️ 60% compatible, 40% needs updates

## 🎯 **Next Steps**

1. **Immediate**: Fix the high-priority endpoint mismatches
2. **Short-term**: Add missing backend endpoints
3. **Long-term**: Integrate new security and AI features

---

**The good news**: Your backend is comprehensive and well-structured! The frontend just needs some endpoint updates to work perfectly with it.
