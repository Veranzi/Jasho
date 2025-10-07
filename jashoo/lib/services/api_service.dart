import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:image_picker/image_picker.dart';

class ApiService {
  static String get baseUrl {
    if (Platform.isAndroid) return 'http://10.0.2.2:3000/api';
    return 'http://localhost:3000/api';
  }
  static String get imageBaseUrl {
    if (Platform.isAndroid) return 'http://10.0.2.2:3000/uploads/profile-images';
    return 'http://localhost:3000/uploads/profile-images';
  }
  
  // Singleton pattern
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  String? _token;
  String? get token => _token;

  // Initialize with stored token
  Future<void> initialize() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('jwt_token');
  }

  // Set authentication token
  Future<void> setToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('jwt_token', token);
  }

  // Clear authentication token
  Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('jwt_token');
  }

  // Get headers with authentication
  Map<String, String> _getHeaders({bool includeAuth = true}) {
    final headers = {
      'Content-Type': 'application/json',
    };
    
    if (includeAuth && _token != null) {
      headers['Authorization'] = 'Bearer $_token';
    }
    
    return headers;
  }

  // Make HTTP request with error handling
  Future<Map<String, dynamic>> _makeRequest(
    String method,
    String endpoint, {
    Map<String, dynamic>? body,
    Map<String, String>? headers,
    bool includeAuth = true,
  }) async {
    try {
      final url = Uri.parse('${ApiService.baseUrl}$endpoint');
      final requestHeaders = {..._getHeaders(includeAuth: includeAuth), ...?headers};
      
      http.Response response;
      
      switch (method.toUpperCase()) {
        case 'GET':
          response = await http.get(url, headers: requestHeaders);
          break;
        case 'POST':
          response = await http.post(
            url,
            headers: requestHeaders,
            body: body != null ? jsonEncode(body) : null,
          );
          break;
        case 'PUT':
          response = await http.put(
            url,
            headers: requestHeaders,
            body: body != null ? jsonEncode(body) : null,
          );
          break;
        case 'DELETE':
          response = await http.delete(url, headers: requestHeaders);
          break;
        default:
          throw Exception('Unsupported HTTP method: $method');
      }

      final responseData = jsonDecode(response.body) as Map<String, dynamic>;
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return responseData;
      } else {
        throw ApiException(
          message: responseData['message'] ?? 'Request failed',
          code: responseData['code'] ?? 'UNKNOWN_ERROR',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      
      // Handle network errors
      if (e is SocketException) {
        throw ApiException(
          message: 'No internet connection',
          code: 'NETWORK_ERROR',
          statusCode: 0,
        );
      }
      
      throw ApiException(
        message: 'Request failed: ${e.toString()}',
        code: 'REQUEST_ERROR',
        statusCode: 0,
      );
    }
  }

  // Make multipart request for file uploads
  Future<Map<String, dynamic>> _makeMultipartRequest(
    String method,
    String endpoint, {
    Map<String, String>? fields,
    Map<String, File>? files,
    bool includeAuth = true,
  }) async {
    try {
      final url = Uri.parse('${ApiService.baseUrl}$endpoint');
      final request = http.MultipartRequest(method, url);
      
      // Add headers
      final headers = _getHeaders(includeAuth: includeAuth);
      request.headers.addAll(headers);
      
      // Add fields
      if (fields != null) {
        request.fields.addAll(fields);
      }
      
      // Add files
      if (files != null) {
        for (final entry in files.entries) {
          request.files.add(await http.MultipartFile.fromPath(
            entry.key,
            entry.value.path,
          ));
        }
      }
      
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);
      final responseData = jsonDecode(response.body) as Map<String, dynamic>;
      
      if (response.statusCode >= 200 && response.statusCode < 300) {
        return responseData;
      } else {
        throw ApiException(
          message: responseData['message'] ?? 'Upload failed',
          code: responseData['code'] ?? 'UPLOAD_ERROR',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      
      throw ApiException(
        message: 'Upload failed: ${e.toString()}',
        code: 'UPLOAD_ERROR',
        statusCode: 0,
      );
    }
  }

  // Authentication endpoints
  Future<Map<String, dynamic>> register({
    required String email,
    required String password,
    required String fullName,
    required String phoneNumber,
    required String location,
    List<String>? skills,
    String? dateOfBirth,
    String? gender,
  }) async {
    return await _makeRequest('POST', '/auth/register', body: {
      'email': email,
      'password': password,
      'fullName': fullName,
      'phoneNumber': phoneNumber,
      'location': location,
      if (skills != null) 'skills': skills,
      if (dateOfBirth != null) 'dateOfBirth': dateOfBirth,
      if (gender != null) 'gender': gender,
    }, includeAuth: false);
  }

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    final response = await _makeRequest('POST', '/auth/login', body: {
      'email': email,
      'password': password,
    }, includeAuth: false);
    
    // Store token if login successful
    if (response['success'] == true && response['data']?['token'] != null) {
      await setToken(response['data']['token']);
    }
    
    return response;
  }

  Future<Map<String, dynamic>> logout() async {
    final response = await _makeRequest('POST', '/auth/logout');
    await clearToken();
    return response;
  }

  // Firebase phone login/register
  Future<Map<String, dynamic>> loginWithFirebasePhone({
    required String idToken,
    String? fullName,
    String? location,
  }) async {
    final response = await _makeRequest(
      'POST',
      '/auth/firebase-phone',
      body: {
        'idToken': idToken,
        if (fullName != null) 'fullName': fullName,
        if (location != null) 'location': location,
      },
      includeAuth: false,
    );

    if (response['success'] == true && response['data']?['token'] != null) {
      await setToken(response['data']['token']);
    }

    return response;
  }

  Future<Map<String, dynamic>> verifyEmail({required String token}) async {
    return await _makeRequest('POST', '/auth/verify-email', body: {
      'token': token,
    });
  }

  Future<Map<String, dynamic>> verifyPhone({
    required String phoneNumber,
    required String code,
  }) async {
    return await _makeRequest('POST', '/auth/verify-phone', body: {
      'phoneNumber': phoneNumber,
      'code': code,
    });
  }

  Future<Map<String, dynamic>> resendEmailVerification() async {
    return await _makeRequest('POST', '/auth/resend-email-verification');
  }

  Future<Map<String, dynamic>> resendPhoneVerification() async {
    return await _makeRequest('POST', '/auth/resend-phone-verification');
  }

  Future<Map<String, dynamic>> forgotPassword({required String email}) async {
    return await _makeRequest('POST', '/auth/forgot-password', body: {
      'email': email,
    }, includeAuth: false);
  }

  Future<Map<String, dynamic>> resetPassword({
    required String token,
    required String password,
  }) async {
    return await _makeRequest('POST', '/auth/reset-password', body: {
      'token': token,
      'password': password,
    }, includeAuth: false);
  }

  Future<Map<String, dynamic>> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    return await _makeRequest('POST', '/auth/change-password', body: {
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }

  // User endpoints
  Future<Map<String, dynamic>> getUserProfile() async {
    return await _makeRequest('GET', '/user/profile');
  }

  Future<Map<String, dynamic>> updateUserProfile({
    String? fullName,
    List<String>? skills,
    String? location,
    Map<String, double>? coordinates,
  }) async {
    return await _makeRequest('PUT', '/user/profile', body: {
      if (fullName != null) 'fullName': fullName,
      if (skills != null) 'skills': skills,
      if (location != null) 'location': location,
      if (coordinates != null) 'coordinates': coordinates,
    });
  }

  Future<Map<String, dynamic>> completeKyc({
    required String idType,
    required String idNumber,
    String? photoUrl,
    List<String>? documentUrls,
  }) async {
    return await _makeRequest('POST', '/user/kyc', body: {
      'idType': idType,
      'idNumber': idNumber,
      if (photoUrl != null) 'photoUrl': photoUrl,
      if (documentUrls != null) 'documentUrls': documentUrls,
    });
  }

  Future<Map<String, dynamic>> linkAbsaAccount({required String accountNumber}) async {
    return await _makeRequest('POST', '/user/absa-account', body: {
      'accountNumber': accountNumber,
    });
  }

  Future<Map<String, dynamic>> updateLanguage({required String language}) async {
    return await _makeRequest('PUT', '/user/language', body: {
      'language': language,
    });
  }

  Future<Map<String, dynamic>> updateNotifications({
    bool? email,
    bool? sms,
    bool? push,
    bool? marketing,
  }) async {
    return await _makeRequest('PUT', '/user/notifications', body: {
      if (email != null) 'email': email,
      if (sms != null) 'sms': sms,
      if (push != null) 'push': push,
      if (marketing != null) 'marketing': marketing,
    });
  }

  Future<Map<String, dynamic>> getPublicProfile({required String userId}) async {
    return await _makeRequest('GET', '/user/$userId', includeAuth: false);
  }

  // Wallet endpoints
  Future<Map<String, dynamic>> getWalletBalance() async {
    return await _makeRequest('GET', '/wallet/balance');
  }

  Future<Map<String, dynamic>> getTransactionHistory({
    int page = 1,
    int limit = 20,
    String? type,
    String? status,
    String? startDate,
    String? endDate,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    
    if (type != null) queryParams['type'] = type;
    if (status != null) queryParams['status'] = status;
    if (startDate != null) queryParams['startDate'] = startDate;
    if (endDate != null) queryParams['endDate'] = endDate;
    
    final queryString = queryParams.entries
        .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
        .join('&');
    
    return await _makeRequest('GET', '/wallet/transactions?$queryString');
  }

  Future<Map<String, dynamic>> setTransactionPin({required String pin}) async {
    return await _makeRequest('POST', '/wallet/pin', body: {
      'pin': pin,
    });
  }

  Future<Map<String, dynamic>> verifyTransactionPin({required String pin}) async {
    return await _makeRequest('POST', '/wallet/verify-pin', body: {
      'pin': pin,
    });
  }

  Future<Map<String, dynamic>> deposit({
    required double amount,
    String currencyCode = 'KES',
    String description = 'Deposit',
    String? method,
    String? hustle,
    String category = 'Deposit',
    String? network,
  }) async {
    return await _makeRequest('POST', '/wallet/deposit', body: {
      'amount': amount,
      'currencyCode': currencyCode,
      'description': description,
      if (method != null) 'method': method,
      if (hustle != null) 'hustle': hustle,
      'category': category,
      if (network != null) 'network': network,
    });
  }

  Future<Map<String, dynamic>> withdraw({
    required double amount,
    required String pin,
    String currencyCode = 'KES',
    String category = 'Expense',
    String? method,
    String? hustle,
    String? network,
  }) async {
    return await _makeRequest('POST', '/wallet/withdraw', body: {
      'amount': amount,
      'pin': pin,
      'currencyCode': currencyCode,
      'category': category,
      if (method != null) 'method': method,
      if (hustle != null) 'hustle': hustle,
      if (network != null) 'network': network,
    });
  }

  Future<Map<String, dynamic>> convertCurrency({
    required double amount,
    required String pin,
    required double rate,
    String fromCurrency = 'KES',
    String toCurrency = 'USDT',
    String? network,
  }) async {
    return await _makeRequest('POST', '/wallet/convert', body: {
      'amount': amount,
      'pin': pin,
      'rate': rate,
      'fromCurrency': fromCurrency,
      'toCurrency': toCurrency,
      if (network != null) 'network': network,
    });
  }

  Future<Map<String, dynamic>> transfer({
    required String recipientUserId,
    required double amount,
    required String pin,
    String currencyCode = 'KES',
    String? description,
    String? network,
  }) async {
    return await _makeRequest('POST', '/wallet/transfer', body: {
      'recipientUserId': recipientUserId,
      'amount': amount,
      'pin': pin,
      'currencyCode': currencyCode,
      if (description != null) 'description': description,
      if (network != null) 'network': network,
    });
  }

  // Jobs endpoints
  Future<Map<String, dynamic>> getJobs({
    int page = 1,
    int limit = 20,
    String? category,
    String? location,
    double? minPrice,
    double? maxPrice,
    String? urgency,
    String? searchQuery,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    
    if (category != null) queryParams['category'] = category;
    if (location != null) queryParams['location'] = location;
    if (minPrice != null) queryParams['minPrice'] = minPrice.toString();
    if (maxPrice != null) queryParams['maxPrice'] = maxPrice.toString();
    if (urgency != null) queryParams['urgency'] = urgency;
    if (searchQuery != null) queryParams['q'] = searchQuery;
    
    final queryString = queryParams.entries
        .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
        .join('&');
    
    return await _makeRequest('GET', '/jobs?$queryString');
  }

  Future<Map<String, dynamic>> getJob({required String jobId}) async {
    return await _makeRequest('GET', '/jobs/$jobId');
  }

  Future<Map<String, dynamic>> postJob({
    required String title,
    required String description,
    required String location,
    required double priceKes,
    required String category,
    String urgency = 'normal',
    int? estimatedDuration,
    List<String>? requirements,
    List<String>? skills,
    Map<String, dynamic>? schedule,
  }) async {
    return await _makeRequest('POST', '/jobs', body: {
      'title': title,
      'description': description,
      'location': location,
      'priceKes': priceKes,
      'category': category,
      'urgency': urgency,
      if (estimatedDuration != null) 'estimatedDuration': estimatedDuration,
      if (requirements != null) 'requirements': requirements,
      if (skills != null) 'skills': skills,
      if (schedule != null) 'schedule': schedule,
    });
  }

  Future<Map<String, dynamic>> applyForJob({
    required String jobId,
    String? message,
    double? proposedPrice,
    int? estimatedDuration,
  }) async {
    return await _makeRequest('POST', '/jobs/$jobId/apply', body: {
      if (message != null) 'message': message,
      if (proposedPrice != null) 'proposedPrice': proposedPrice,
      if (estimatedDuration != null) 'estimatedDuration': estimatedDuration,
    });
  }

  Future<Map<String, dynamic>> completeJob({
    required String jobId,
    double? rating,
    String? review,
    String? completionNotes,
    List<String>? completionImages,
  }) async {
    return await _makeRequest('POST', '/jobs/$jobId/complete', body: {
      if (rating != null) 'rating': rating,
      if (review != null) 'review': review,
      if (completionNotes != null) 'completionNotes': completionNotes,
      if (completionImages != null) 'completionImages': completionImages,
    });
  }

  Future<Map<String, dynamic>> getUserJobs({
    required String type, // 'posted' or 'assigned'
    int page = 1,
    int limit = 20,
    String? status,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    
    if (status != null) queryParams['status'] = status;
    
    final queryString = queryParams.entries
        .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
        .join('&');
    
    return await _makeRequest('GET', '/jobs/user/$type?$queryString');
  }

  Future<Map<String, dynamic>> getUserApplications({
    int page = 1,
    int limit = 20,
    String? status,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    
    if (status != null) queryParams['status'] = status;
    
    final queryString = queryParams.entries
        .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
        .join('&');
    
    return await _makeRequest('GET', '/jobs/applications/my?$queryString');
  }

  // Profile Image endpoints
  Future<Map<String, dynamic>> uploadProfileImage({required File imageFile}) async {
    return await _makeMultipartRequest('POST', '/profile-image/upload', files: {
      'profileImage': imageFile,
    });
  }

  Future<Map<String, dynamic>> updateProfileImage({required File imageFile}) async {
    return await _makeMultipartRequest('PUT', '/profile-image/', files: {
      'profileImage': imageFile,
    });
  }

  Future<Map<String, dynamic>> getProfileImage({
    required String userId,
    String size = 'medium',
  }) async {
    return await _makeRequest('GET', '/profile-image/$userId?size=$size', includeAuth: false);
  }

  Future<Map<String, dynamic>> deleteProfileImage() async {
    return await _makeRequest('DELETE', '/profile-image/');
  }

  Future<Map<String, dynamic>> validateImage({required File imageFile}) async {
    return await _makeMultipartRequest('POST', '/profile-image/validate', files: {
      'profileImage': imageFile,
    });
  }

  // AI endpoints
  Future<Map<String, dynamic>> getAISuggestions() async {
    return await _makeRequest('GET', '/ai/suggestions');
  }

  Future<Map<String, dynamic>> getAIInsights({int period = 30}) async {
    return await _makeRequest('GET', '/ai/insights?period=$period');
  }

  Future<Map<String, dynamic>> getMarketTrends({
    int period = 30,
    String? location,
  }) async {
    final queryParams = <String, String>{
      'period': period.toString(),
    };
    
    if (location != null) queryParams['location'] = location;
    
    final queryString = queryParams.entries
        .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
        .join('&');
    
    return await _makeRequest('GET', '/ai/market-trends?$queryString');
  }

  // Chatbot endpoints
  Future<Map<String, dynamic>> sendChatMessage({
    required String message,
    bool includeContext = true,
  }) async {
    return await _makeRequest('POST', '/chatbot/chat', body: {
      'message': message,
      'includeContext': includeContext,
    });
  }

  Future<Map<String, dynamic>> sendVoiceMessage({required File audioFile}) async {
    return await _makeMultipartRequest('POST', '/chatbot/voice-chat', files: {
      'audio': audioFile,
    });
  }

  Future<Map<String, dynamic>> analyzeImage({required File imageFile}) async {
    return await _makeMultipartRequest('POST', '/chatbot/analyze-image', files: {
      'image': imageFile,
    });
  }

  Future<Map<String, dynamic>> getChatHistory({
    int page = 1,
    int limit = 20,
  }) async {
    return await _makeRequest('GET', '/chatbot/history?page=$page&limit=$limit');
  }

  // Heatmap endpoints
  Future<Map<String, dynamic>> getJobHeatmap({
    String? startDate,
    String? endDate,
    String? category,
    String? location,
    double? minPrice,
    double? maxPrice,
    int limit = 1000,
  }) async {
    final queryParams = <String, String>{
      'limit': limit.toString(),
    };
    
    if (startDate != null) queryParams['startDate'] = startDate;
    if (endDate != null) queryParams['endDate'] = endDate;
    if (category != null) queryParams['category'] = category;
    if (location != null) queryParams['location'] = location;
    if (minPrice != null) queryParams['minPrice'] = minPrice.toString();
    if (maxPrice != null) queryParams['maxPrice'] = maxPrice.toString();
    
    final queryString = queryParams.entries
        .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
        .join('&');
    
    return await _makeRequest('GET', '/heatmap/jobs?$queryString', includeAuth: false);
  }

  Future<Map<String, dynamic>> getJobDensity({int period = 30}) async {
    return await _makeRequest('GET', '/heatmap/density?period=$period', includeAuth: false);
  }

  Future<Map<String, dynamic>> getCategoryDistribution({
    int period = 30,
    String? location,
  }) async {
    final queryParams = <String, String>{
      'period': period.toString(),
    };
    
    if (location != null) queryParams['location'] = location;
    
    final queryString = queryParams.entries
        .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
        .join('&');
    
    return await _makeRequest('GET', '/heatmap/categories?$queryString', includeAuth: false);
  }

  Future<Map<String, dynamic>> getTrendingAreas({int period = 7}) async {
    return await _makeRequest('GET', '/heatmap/trending?period=$period', includeAuth: false);
  }

  // Credit Score endpoints
  Future<Map<String, dynamic>> getCreditScore() async {
    return await _makeRequest('GET', '/credit-score/score');
  }

  Future<Map<String, dynamic>> getCreditAnalysis() async {
    return await _makeRequest('GET', '/credit-score/analysis');
  }

  Future<Map<String, dynamic>> getCreditHistory({
    int page = 1,
    int limit = 20,
  }) async {
    return await _makeRequest('GET', '/credit-score/history?page=$page&limit=$limit');
  }

  Future<Map<String, dynamic>> recalculateCreditScore() async {
    return await _makeRequest('POST', '/credit-score/recalculate');
  }

  Future<Map<String, dynamic>> getLoanEligibility({
    required double amount,
    required int termMonths,
  }) async {
    return await _makeRequest('GET', '/credit-score/eligibility?amount=$amount&termMonths=$termMonths');
  }

  Future<Map<String, dynamic>> getCreditFactors() async {
    return await _makeRequest('GET', '/credit-score/factors');
  }

  Future<Map<String, dynamic>> getCreditComparison() async {
    return await _makeRequest('GET', '/credit-score/comparison');
  }

  // Gamification endpoints
  Future<Map<String, dynamic>> getGamificationProfile() async {
    return await _makeRequest('GET', '/gamification/profile');
  }

  Future<Map<String, dynamic>> getLeaderboard({
    int page = 1,
    int limit = 20,
    String type = 'points',
  }) async {
    return await _makeRequest('GET', '/gamification/leaderboard?page=$page&limit=$limit&type=$type');
  }

  Future<Map<String, dynamic>> getBadges() async {
    return await _makeRequest('GET', '/gamification/badges');
  }

  Future<Map<String, dynamic>> redeemPoints({
    required int points,
    String? reason,
  }) async {
    return await _makeRequest('POST', '/gamification/redeem', body: {
      'points': points,
      if (reason != null) 'reason': reason,
    });
  }

  Future<Map<String, dynamic>> getAchievements() async {
    return await _makeRequest('GET', '/gamification/achievements');
  }

  Future<Map<String, dynamic>> getGamificationStatistics() async {
    return await _makeRequest('GET', '/gamification/statistics');
  }

  // Savings endpoints
  Future<Map<String, dynamic>> getSavingsGoals({
    int page = 1,
    int limit = 20,
  }) async {
    return await _makeRequest('GET', '/savings/goals?page=$page&limit=$limit');
  }

  Future<Map<String, dynamic>> createSavingsGoal({
    required String name,
    required double target,
    DateTime? dueDate,
    String category = 'Personal',
    String? hustle,
  }) async {
    return await _makeRequest('POST', '/savings/goals', body: {
      'name': name,
      'target': target,
      if (dueDate != null) 'dueDate': dueDate.toIso8601String(),
      'category': category,
      if (hustle != null) 'hustle': hustle,
    });
  }

  Future<Map<String, dynamic>> contributeToSavingsGoal({
    required String goalId,
    required double amount,
    required String pin,
    String source = 'manual',
    String? hustle,
  }) async {
    return await _makeRequest('POST', '/savings/goals/$goalId/contribute', body: {
      'amount': amount,
      'pin': pin,
      'source': source,
      if (hustle != null) 'hustle': hustle,
    });
  }

  Future<Map<String, dynamic>> getLoanRequests({
    int page = 1,
    int limit = 20,
    String? status,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    
    if (status != null) queryParams['status'] = status;
    
    final queryString = queryParams.entries
        .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
        .join('&');
    
    return await _makeRequest('GET', '/savings/loans?$queryString');
  }

  Future<Map<String, dynamic>> requestLoan({
    required double amount,
    required String purpose,
    int termMonths = 12,
    String? collateral,
    Map<String, String>? guarantor,
  }) async {
    return await _makeRequest('POST', '/savings/loans', body: {
      'amount': amount,
      'purpose': purpose,
      'termMonths': termMonths,
      if (collateral != null) 'collateral': collateral,
      if (guarantor != null) 'guarantor': guarantor,
    });
  }

  Future<Map<String, dynamic>> getSavingsStatistics() async {
    return await _makeRequest('GET', '/savings/statistics');
  }
}

// Custom exception class for API errors
class ApiException implements Exception {
  final String message;
  final String code;
  final int statusCode;

  ApiException({
    required this.message,
    required this.code,
    required this.statusCode,
  });

  @override
  String toString() => 'ApiException: $message (Code: $code, Status: $statusCode)';
}
