# 🚀 Complete Flutter-Backend Integration Guide

This guide will help you integrate your Flutter frontend with the Jashoo backend API.

## 📋 Prerequisites

1. **Backend Running**: Ensure the Jashoo backend is running on `http://localhost:3000`
2. **Dependencies**: Install all required Flutter packages
3. **Network Access**: Ensure your Flutter app can access the backend API

## 🔧 Setup Instructions

### 1. Install Dependencies

Replace your current `pubspec.yaml` with `pubspec_integrated.yaml`:

```bash
cd jashoo
cp pubspec_integrated.yaml pubspec.yaml
flutter pub get
```

### 2. Update Main Entry Point

Replace your current `main.dart` with `main_integrated.dart`:

```bash
cp main_integrated.dart main.dart
```

### 3. Backend Configuration

Ensure your backend is running with the correct configuration:

```bash
cd jashoo-backend
./setup.sh
npm run dev
```

## 🎯 Key Integration Features

### ✅ **Complete API Integration**

**Authentication System:**
- ✅ User registration with email/phone verification
- ✅ Login with JWT token management
- ✅ Password reset and change functionality
- ✅ Session persistence across app restarts

**User Management:**
- ✅ Profile loading and updating
- ✅ KYC completion with document upload
- ✅ Absa account linking
- ✅ Language and notification preferences

**Wallet System:**
- ✅ Real-time balance loading
- ✅ Transaction history with pagination
- ✅ Transaction PIN management
- ✅ Deposit, withdrawal, and transfer operations
- ✅ Currency conversion (KES ↔ USDT ↔ USD)

**Profile Images:**
- ✅ Camera capture and gallery selection
- ✅ Image validation and processing
- ✅ Multiple image sizes (thumbnail, medium, large, original)
- ✅ Secure image storage and serving

**Job Marketplace:**
- ✅ Job posting and browsing
- ✅ Job application management
- ✅ Job completion and rating
- ✅ User job history

**Savings & Loans:**
- ✅ Savings goals creation and management
- ✅ Loan requests and tracking
- ✅ Contribution tracking
- ✅ Financial statistics

**AI Features:**
- ✅ Personalized financial insights
- ✅ Market trends and analysis
- ✅ Credit score monitoring
- ✅ AI-powered suggestions

**Gamification:**
- ✅ Points and badges system
- ✅ Leaderboards
- ✅ Achievement tracking
- ✅ Level progression

**Geographic Heatmap:**
- ✅ Job location visualization
- ✅ Category-based color coding
- ✅ Real-time job density
- ✅ Trending areas

**Voice Chatbot:**
- ✅ Text-based chat
- ✅ Voice message support
- ✅ Image analysis
- ✅ Content safety filtering

## 🔄 Provider Updates

### AuthProvider
```dart
// Now includes real API integration
final authProvider = Provider.of<AuthProvider>(context, listen: false);

// Register new user
await authProvider.register(
  email: 'user@example.com',
  password: 'password123',
  fullName: 'John Doe',
  phoneNumber: '+254700000000',
  location: 'Nairobi, Kenya',
);

// Login user
await authProvider.login(
  email: 'user@example.com',
  password: 'password123',
);

// Check authentication status
if (authProvider.isLoggedIn) {
  print('User ID: ${authProvider.userId}');
  print('Email: ${authProvider.email}');
}
```

### UserProvider
```dart
// Load user profile from API
await userProvider.loadProfile();

// Update profile
await userProvider.updateProfile(
  fullName: 'John Doe Updated',
  skills: ['Boda Rider', 'Delivery'],
  location: 'Nairobi, Westlands',
);

// Complete KYC
await userProvider.completeKyc(
  idType: 'ID',
  idNumber: '12345678',
  photoUrl: 'https://example.com/photo.jpg',
);

// Link Absa account
await userProvider.linkAbsaAccount(accountNumber: '123456789012');
```

### WalletProvider
```dart
// Load wallet data
await walletProvider.loadBalance();
await walletProvider.loadTransactions();

// Set transaction PIN
await walletProvider.setTransactionPin(pin: '1234');

// Deposit money
await walletProvider.depositKes(
  amount: 1000,
  description: 'Mobile deposit',
  method: 'M-PESA',
);

// Withdraw money
await walletProvider.withdrawKes(
  amount: 500,
  pin: '1234',
  category: 'Expense',
);

// Transfer to another user
await walletProvider.transfer(
  recipientUserId: 'user123',
  amount: 200,
  pin: '1234',
  description: 'Payment for services',
);

// Convert currency
await walletProvider.convertKesToUsdt(
  kesAmount: 1000,
  rate: 150.0,
  pin: '1234',
);
```

## 📱 Profile Image Integration

### Using ImageService
```dart
final imageService = ImageService();

// Pick image from camera
final XFile? image = await imageService.pickImage(
  source: ImageSource.camera,
  maxWidth: 1024,
  maxHeight: 1024,
  imageQuality: 90,
);

// Validate image before upload
final validation = await imageService.validateImage(image!);
if (validation.isValid) {
  // Upload profile image
  final result = await imageService.uploadProfileImage(
    imageFile: image,
    validateFirst: true,
  );
  
  if (result.success) {
    print('Image uploaded: ${result.profileImage?.url}');
  }
}
```

### Profile Image Widget
```dart
class ProfileImageWidget extends StatelessWidget {
  final String? imageUrl;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 100,
        height: 100,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: Colors.grey.shade300, width: 2),
        ),
        child: ClipOval(
          child: imageUrl != null
              ? CachedNetworkImage(
                  imageUrl: imageUrl!,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => CircularProgressIndicator(),
                  errorWidget: (context, url, error) => Icon(
                    Icons.person,
                    size: 50,
                    color: Colors.grey,
                  ),
                )
              : Icon(
                  Icons.person,
                  size: 50,
                  color: Colors.grey,
                ),
        ),
      ),
    );
  }
}
```

## 🔐 Security Features

### Balance Masking
```dart
// Backend automatically masks sensitive balance data
final balance = walletProvider.balance;
print('Masked Balance: ${balance?.maskedKesBalance}'); // Shows "12***50"
print('Real Balance: ${balance?.kesBalance}'); // Shows actual amount
```

### Transaction Security
```dart
// All transactions require PIN verification
await walletProvider.withdrawKes(
  amount: 1000,
  pin: '1234', // Required for security
  category: 'Expense',
);
```

### Image Security
```dart
// Images are automatically scanned for malware
final result = await imageService.uploadProfileImage(imageFile: image);
if (!result.success) {
  print('Image failed security check: ${result.error}');
}
```

## 🌐 Network Configuration

### API Service Configuration
```dart
// Update base URL for production
class ApiService {
  static const String baseUrl = 'https://your-backend-domain.com/api';
  // ... rest of configuration
}
```

### Error Handling
```dart
try {
  await authProvider.login(email: email, password: password);
} catch (e) {
  if (e is ApiException) {
    print('API Error: ${e.message}');
    print('Error Code: ${e.code}');
    print('Status Code: ${e.statusCode}');
  }
}
```

## 🧪 Testing Integration

### Test Authentication
```dart
// Test user registration
final success = await authProvider.register(
  email: 'test@example.com',
  password: 'password123',
  fullName: 'Test User',
  phoneNumber: '+254700000000',
  location: 'Nairobi, Kenya',
);

assert(success == true);
assert(authProvider.isLoggedIn == true);
```

### Test Wallet Operations
```dart
// Test deposit
await walletProvider.depositKes(amount: 1000);
assert(walletProvider.balance?.kesBalance == 1000);

// Test withdrawal
await walletProvider.withdrawKes(amount: 500, pin: '1234');
assert(walletProvider.balance?.kesBalance == 500);
```

### Test Profile Image
```dart
// Test image upload
final image = await imageService.pickImage(source: ImageSource.camera);
final result = await imageService.uploadProfileImage(imageFile: image!);
assert(result.success == true);
assert(result.profileImage?.url != null);
```

## 🚀 Production Deployment

### 1. Update API URLs
```dart
// In api_service.dart
static const String baseUrl = 'https://api.jashoo.com/api';
```

### 2. Configure Environment Variables
```dart
// Create .env file
BASE_URL=https://api.jashoo.com
API_KEY=your-production-api-key
```

### 3. Enable Production Features
```dart
// In main.dart
void main() {
  // Enable production logging
  Logger.root.level = Level.INFO;
  
  // Initialize Firebase for production
  Firebase.initializeApp();
  
  runApp(IntegratedJashooApp());
}
```

## 🔧 Troubleshooting

### Common Issues

**1. Network Connection Errors**
```dart
// Check network connectivity
final connectivity = await Connectivity().checkConnectivity();
if (connectivity == ConnectivityResult.none) {
  // Show offline message
}
```

**2. Authentication Token Expired**
```dart
// Token is automatically refreshed by ApiService
// If refresh fails, user will be logged out automatically
```

**3. Image Upload Failures**
```dart
// Check image size and format
final sizeMB = await imageService.getImageSizeInMB(image);
if (sizeMB > 5.0) {
  // Compress image before upload
  final compressedImage = await imageService.compressImage(imageFile: image);
}
```

**4. API Rate Limiting**
```dart
// ApiService automatically handles rate limiting
// Implement retry logic for critical operations
```

## 📊 Monitoring & Analytics

### Track User Actions
```dart
// Log user interactions
void trackUserAction(String action, Map<String, dynamic> properties) {
  // Send to analytics service
  Analytics.track(action, properties);
}
```

### Monitor API Performance
```dart
// ApiService automatically logs request/response times
// Check logs for performance issues
```

## 🎉 Success!

Your Flutter app is now fully integrated with the Jashoo backend! 

**Key Benefits:**
- ✅ Real-time data synchronization
- ✅ Secure authentication and authorization
- ✅ Advanced security features
- ✅ Comprehensive error handling
- ✅ Offline capability with local storage
- ✅ Production-ready architecture

**Next Steps:**
1. Test all features thoroughly
2. Deploy to production
3. Monitor performance and user feedback
4. Iterate and improve based on usage data

Happy coding! 🚀