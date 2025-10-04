# Jasho Financial Backend

A comprehensive financial services backend with advanced cybersecurity, AI-powered insights, blockchain integration, and real-time features.

## 🚀 Features

### 🔐 Cybersecurity Layer
- **Balance Masking**: Secure display of financial balances with encryption
- **Transaction Security**: Advanced validation and fraud detection
- **Document Scanning**: Safe scanning of uploaded documents with malware detection
- **URL/QR Code Validation**: Security validation for URLs and QR codes
- **Content Filtering**: AI-powered content filtering for safe interactions

### 🤖 AI-Powered Systems
- **Responsible AI Chatbot**: Voice-enabled chatbot with content filtering
- **Credit Scoring**: AI-based credit scoring using machine learning
- **Pattern Learning**: User behavior analysis and financial pattern recognition
- **Predictive Analytics**: Financial needs prediction and recommendations
- **Insights Generation**: Personalized financial insights and recommendations

### ⛓️ Blockchain Integration
- **Transaction Recording**: All transactions recorded on blockchain
- **Smart Contracts**: Automated contract execution
- **Transaction History**: Immutable transaction history
- **Verification**: Blockchain-based transaction verification

### 📱 SMS Verification
- **Multi-Provider Support**: Twilio and Africa's Talking integration
- **Rate Limiting**: Protection against SMS abuse
- **Verification Types**: Signup, login, transaction, and password reset
- **Analytics**: SMS delivery and success rate tracking

### 🗺️ Job Heatmap Visualization
- **Interactive Maps**: Folium and Plotly-based heatmaps
- **Job Distribution**: Visual representation of job opportunities
- **Category Analysis**: Job categorization and analysis
- **Clustering**: AI-powered job clustering and insights

### 🔥 Firebase Integration
- **Authentication**: Firebase Auth integration
- **Real-time Database**: Firebase Realtime Database
- **User Management**: Comprehensive user profile management
- **Security**: Firebase security rules and validation

## 🛠️ Technology Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLModel
- **Cache**: Redis
- **Authentication**: Firebase Auth
- **Blockchain**: Ethereum/Web3
- **AI/ML**: OpenAI, scikit-learn, TensorFlow
- **SMS**: Twilio, Africa's Talking
- **Security**: Cryptography, YARA, ClamAV
- **Monitoring**: Prometheus, Winston

## 📋 Prerequisites

- Python 3.8+
- PostgreSQL 12+
- Redis 6+
- Node.js 16+ (for some dependencies)

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Jasho_backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

5. **Set up database**
   ```bash
   # Create PostgreSQL database
   createdb jasho_db
   
   # Run migrations
   alembic upgrade head
   ```

6. **Start Redis server**
   ```bash
   redis-server
   ```

7. **Run the application**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## 🔧 Configuration

### Environment Variables

Copy `env.example` to `.env` and configure the following:

#### Database
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_HOST`: Redis host
- `REDIS_PORT`: Redis port

#### Firebase
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Service account private key
- `FIREBASE_CLIENT_EMAIL`: Service account email
- `FIREBASE_DATABASE_URL`: Firebase Realtime Database URL

#### Security
- `ENCRYPTION_KEY`: 32-byte encryption key
- `JWT_SECRET`: JWT signing secret

#### Blockchain
- `ETHEREUM_RPC_URL`: Ethereum RPC endpoint
- `BLOCKCHAIN_PRIVATE_KEY`: Blockchain wallet private key
- `SMART_CONTRACT_ADDRESS`: Smart contract address

#### SMS
- `TWILIO_ACCOUNT_SID`: Twilio account SID
- `TWILIO_AUTH_TOKEN`: Twilio auth token
- `AT_USERNAME`: Africa's Talking username
- `AT_API_KEY`: Africa's Talking API key

#### AI
- `OPENAI_API_KEY`: OpenAI API key

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Security
- `POST /security/scan-document` - Scan uploaded documents
- `POST /security/validate-url` - Validate URLs for threats
- `POST /security/validate-qr-code` - Validate QR codes
- `POST /security/mask-balance` - Mask balance for display

#### Blockchain
- `POST /blockchain/record-transaction` - Record transaction on blockchain
- `GET /blockchain/transaction-history/{user_id}` - Get transaction history

#### AI Chatbot
- `POST /ai/chatbot/message` - Process text messages
- `POST /ai/chatbot/voice-message` - Process voice messages

#### Credit Scoring
- `POST /ai/credit-score/calculate` - Calculate credit score
- `GET /ai/credit-score/{user_id}` - Get user's credit score

#### AI Insights
- `POST /ai/insights/analyze-patterns` - Analyze user patterns
- `POST /ai/insights/predict-needs` - Predict financial needs

#### SMS Verification
- `POST /sms/send-verification` - Send verification SMS
- `POST /sms/verify-code` - Verify SMS code
- `GET /sms/verification-status/{phone_number}` - Check verification status

#### Job Heatmap
- `POST /jobs/heatmap` - Create job heatmap
- `GET /jobs/heatmap/statistics` - Get heatmap statistics

## 🔒 Security Features

### Balance Masking
```python
# Example: Mask balance for display
masked_balance = security_manager.secure_balance_display(15000.50, "user123")
# Returns: {"masked_display": "****50", "encrypted_balance": "...", ...}
```

### Document Scanning
```python
# Example: Scan uploaded document
scan_result = security_scanner.scan_document("document.pdf", file_content, "user123")
# Returns: {"safe": True, "threats": [], "recommendations": [], ...}
```

### Transaction Validation
```python
# Example: Validate transaction
is_valid, message = security_manager.validate_transaction(transaction_data)
# Returns: (True, "Transaction validated") or (False, "Error message")
```

## 🤖 AI Features

### Credit Scoring
```python
# Example: Calculate credit score
credit_score = ai_credit_scorer.calculate_credit_score("user123", financial_data)
# Returns: {"credit_score": 750, "credit_rating": "good", "recommendations": [...]}
```

### Pattern Analysis
```python
# Example: Analyze user patterns
analysis = ai_insights_manager.analyze_user_patterns("user123", user_data)
# Returns: {"patterns": {...}, "insights": [...], "predictions": {...}}
```

### Chatbot
```python
# Example: Process chatbot message
response = ai_assistant.process_message("How can I save money?", "user123")
# Returns: {"success": True, "response": {...}, "message_type": "text"}
```

## ⛓️ Blockchain Features

### Transaction Recording
```python
# Example: Record transaction on blockchain
result = blockchain_manager.process_transaction(transaction_data)
# Returns: {"success": True, "transaction_hash": "...", "block_number": 12345}
```

### Transaction History
```python
# Example: Get blockchain transaction history
history = blockchain_manager.get_user_transaction_history("user123", "0x...")
# Returns: [{"from_address": "...", "to_address": "...", "amount": 100, ...}]
```

## 📱 SMS Features

### Send Verification
```python
# Example: Send verification SMS
result = sms_verification_manager.send_verification_code("+254712345678", "signup")
# Returns: {"success": True, "message": "Verification code sent successfully"}
```

### Verify Code
```python
# Example: Verify SMS code
result = sms_verification_manager.verify_code("+254712345678", "123456", "signup")
# Returns: {"success": True, "message": "Verification successful"}
```

## 🗺️ Job Heatmap Features

### Create Heatmap
```python
# Example: Create job heatmap
heatmap = job_heatmap_manager.create_heatmap(jobs_data, "folium")
# Returns: {"heatmap": {"html": "...", "processed_data": {...}}}
```

## 🧪 Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_security.py
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:8000/health
```

### System Status
```bash
curl http://localhost:8000/system/status
```

### SMS Analytics
```bash
curl http://localhost:8000/analytics/sms-statistics
```

## 🚀 Deployment

### Docker
```bash
# Build image
docker build -t jasho-backend .

# Run container
docker run -p 8000:8000 --env-file .env jasho-backend
```

### Production
1. Set `ENVIRONMENT=production` in `.env`
2. Configure production database
3. Set up SSL certificates
4. Configure load balancer
5. Set up monitoring and logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, email support@jasho.com or create an issue in the repository.

## 🔄 Changelog

### v1.0.0
- Initial release
- Core security features
- AI-powered systems
- Blockchain integration
- SMS verification
- Job heatmap visualization
- Firebase integration

---

**Built with ❤️ for the Jasho Financial Platform**