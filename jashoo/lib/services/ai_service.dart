import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/ai_insight_model.dart';
import '../models/credit_score_model.dart';
import '../models/transaction_model.dart';
import '../models/user_model.dart';

class AIService {
  static final AIService _instance = AIService._internal();
  factory AIService() => _instance;
  AIService._internal();

  final String _baseUrl = 'https://api.hustleos.ai'; // Replace with your AI API
  final String _apiKey = 'your-ai-api-key'; // Replace with your actual API key

  // Income Forecasting
  Future<IncomeForecast> generateIncomeForecast({
    required String userId,
    required List<TransactionModel> transactions,
    required UserModel user,
    required int forecastDays,
  }) async {
    try {
      // Prepare data for AI model
      final inputData = {
        'user_id': userId,
        'transactions': transactions.map((t) => {
          'amount': t.amount,
          'type': t.type.toString(),
          'timestamp': t.timestamp.toIso8601String(),
          'category': t.category,
          'gig_id': t.gigId,
        }).toList(),
        'user_profile': {
          'gig_types': user.gigTypes,
          'location': user.profile.location,
          'experience_level': user.profile.experienceLevel,
        },
        'forecast_days': forecastDays,
      };

      // Call AI API for income forecasting
      final response = await _callAIEndpoint('/forecast/income', inputData);
      
      if (response['success']) {
        return IncomeForecast.fromJson(response['data']);
      } else {
        // Fallback to rule-based forecasting
        return _generateFallbackForecast(transactions, forecastDays);
      }
    } catch (e) {
      // Fallback to rule-based forecasting
      return _generateFallbackForecast(transactions, forecastDays);
    }
  }

  // Credit Score Calculation
  Future<CreditScoreModel> calculateCreditScore({
    required String userId,
    required List<TransactionModel> transactions,
    required List<CreditEvent> creditHistory,
    required UserModel user,
  }) async {
    try {
      final inputData = {
        'user_id': userId,
        'transactions': transactions.map((t) => {
          'amount': t.amount,
          'type': t.type.toString(),
          'timestamp': t.timestamp.toIso8601String(),
          'status': t.status.toString(),
        }).toList(),
        'credit_history': creditHistory.map((c) => {
          'type': c.type,
          'amount': c.amount,
          'date': c.date.toIso8601String(),
          'status': c.status,
        }).toList(),
        'user_profile': {
          'gig_types': user.gigTypes,
          'experience_level': user.profile.experienceLevel,
          'location': user.profile.location,
        },
      };

      final response = await _callAIEndpoint('/credit/score', inputData);
      
      if (response['success']) {
        return CreditScoreModel.fromJson(response['data']);
      } else {
        return _generateFallbackCreditScore(transactions, creditHistory, user);
      }
    } catch (e) {
      return _generateFallbackCreditScore(transactions, creditHistory, user);
    }
  }

  // Fraud Detection
  Future<FraudDetection?> detectFraud({
    required String userId,
    required TransactionModel transaction,
    required List<TransactionModel> recentTransactions,
  }) async {
    try {
      final inputData = {
        'user_id': userId,
        'transaction': {
          'amount': transaction.amount,
          'type': transaction.type.toString(),
          'timestamp': transaction.timestamp.toIso8601String(),
          'location': transaction.location,
          'payment_method': transaction.paymentMethod.toString(),
        },
        'recent_transactions': recentTransactions.map((t) => {
          'amount': t.amount,
          'type': t.type.toString(),
          'timestamp': t.timestamp.toIso8601String(),
          'location': t.location,
        }).toList(),
      };

      final response = await _callAIEndpoint('/fraud/detect', inputData);
      
      if (response['success'] && response['data']['risk_score'] > 0.7) {
        return FraudDetection.fromJson(response['data']);
      }
      return null;
    } catch (e) {
      return _generateFallbackFraudDetection(transaction, recentTransactions);
    }
  }

  // Job Recommendation
  Future<List<Map<String, dynamic>>> recommendJobs({
    required String userId,
    required UserModel user,
    required List<TransactionModel> transactions,
    required double latitude,
    required double longitude,
  }) async {
    try {
      final inputData = {
        'user_id': userId,
        'user_profile': {
          'skills': user.profile.skills,
          'experience_level': user.profile.experienceLevel,
          'gig_types': user.gigTypes,
          'location': user.profile.location,
        },
        'income_history': transactions
            .where((t) => t.type == TransactionType.income)
            .map((t) => {
              'amount': t.amount,
              'timestamp': t.timestamp.toIso8601String(),
              'category': t.category,
            })
            .toList(),
        'location': {
          'latitude': latitude,
          'longitude': longitude,
        },
      };

      final response = await _callAIEndpoint('/jobs/recommend', inputData);
      
      if (response['success']) {
        return List<Map<String, dynamic>>.from(response['data']['recommendations']);
      } else {
        return _generateFallbackJobRecommendations(user, latitude, longitude);
      }
    } catch (e) {
      return _generateFallbackJobRecommendations(user, latitude, longitude);
    }
  }

  // Generate AI Insights
  Future<List<AIInsightModel>> generateInsights({
    required String userId,
    required List<TransactionModel> transactions,
    required UserModel user,
  }) async {
    final insights = <AIInsightModel>[];

    // Income pattern analysis
    final incomeInsight = _analyzeIncomePatterns(transactions, user);
    if (incomeInsight != null) insights.add(incomeInsight);

    // Expense pattern analysis
    final expenseInsight = _analyzeExpensePatterns(transactions, user);
    if (expenseInsight != null) insights.add(expenseInsight);

    // Savings opportunity analysis
    final savingsInsight = _analyzeSavingsOpportunities(transactions, user);
    if (savingsInsight != null) insights.add(savingsInsight);

    return insights;
  }

  // Private helper methods
  Future<Map<String, dynamic>> _callAIEndpoint(String endpoint, Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse('$_baseUrl$endpoint'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $_apiKey',
      },
      body: jsonEncode(data),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('AI API call failed: ${response.statusCode}');
    }
  }

  // Fallback methods for when AI API is unavailable
  IncomeForecast _generateFallbackForecast(List<TransactionModel> transactions, int forecastDays) {
    final incomeTransactions = transactions
        .where((t) => t.type == TransactionType.income)
        .toList();

    if (incomeTransactions.isEmpty) {
      return IncomeForecast(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        userId: '',
        forecastDate: DateTime.now(),
        periods: [],
        totalProjectedIncome: 0,
        confidence: 0.1,
      );
    }

    // Calculate average daily income
    final totalIncome = incomeTransactions.fold<double>(0, (sum, t) => sum + t.amount);
    final days = incomeTransactions.length;
    final avgDailyIncome = totalIncome / days;

    // Generate forecast periods
    final periods = <ForecastPeriod>[];
    final now = DateTime.now();
    
    for (int i = 0; i < forecastDays; i += 7) {
      final startDate = now.add(Duration(days: i));
      final endDate = startDate.add(const Duration(days: 6));
      final projectedIncome = avgDailyIncome * 7;
      
      periods.add(ForecastPeriod(
        startDate: startDate,
        endDate: endDate,
        projectedIncome: projectedIncome,
        minIncome: projectedIncome * 0.7,
        maxIncome: projectedIncome * 1.3,
        confidence: 0.6,
      ));
    }

    return IncomeForecast(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      userId: '',
      forecastDate: DateTime.now(),
      periods: periods,
      totalProjectedIncome: avgDailyIncome * forecastDays,
      confidence: 0.6,
    );
  }

  CreditScoreModel _generateFallbackCreditScore(
    List<TransactionModel> transactions,
    List<CreditEvent> creditHistory,
    UserModel user,
  ) {
    int score = 300; // Starting score

    // Factor 1: Income consistency (30% weight)
    final incomeTransactions = transactions.where((t) => t.type == TransactionType.income).toList();
    if (incomeTransactions.isNotEmpty) {
      final avgIncome = incomeTransactions.fold<double>(0, (sum, t) => sum + t.amount) / incomeTransactions.length;
      score += (avgIncome / 1000).round() * 10; // 10 points per 1000 KES average income
    }

    // Factor 2: Payment history (40% weight)
    final onTimePayments = creditHistory.where((c) => c.status == 'paid').length;
    final totalPayments = creditHistory.length;
    if (totalPayments > 0) {
      final paymentRatio = onTimePayments / totalPayments;
      score += (paymentRatio * 200).round();
    }

    // Factor 3: Transaction frequency (20% weight)
    final transactionCount = transactions.length;
    score += (transactionCount / 10).round() * 5; // 5 points per 10 transactions

    // Factor 4: Account age (10% weight)
    final accountAge = DateTime.now().difference(user.createdAt).inDays;
    score += (accountAge / 30).round() * 2; // 2 points per month

    // Cap score at 850
    score = score > 850 ? 850 : score;

    final factors = [
      CreditFactor(
        name: 'Income Consistency',
        description: 'Regular income from gig work',
        weight: 0.3,
        score: (incomeTransactions.isNotEmpty ? 80 : 20).toDouble(),
        impact: 'positive',
      ),
      CreditFactor(
        name: 'Payment History',
        description: 'History of on-time payments',
        weight: 0.4,
        score: (totalPayments > 0 ? (onTimePayments / totalPayments * 100) : 0).toDouble(),
        impact: 'positive',
      ),
      CreditFactor(
        name: 'Transaction Activity',
        description: 'Regular financial activity',
        weight: 0.2,
        score: (transactionCount > 10 ? 80 : transactionCount * 8).toDouble(),
        impact: 'positive',
      ),
      CreditFactor(
        name: 'Account Age',
        description: 'Length of account history',
        weight: 0.1,
        score: (accountAge > 365 ? 90 : accountAge / 4).toDouble(),
        impact: 'positive',
      ),
    ];

    CreditRating rating;
    if (score >= 750) rating = CreditRating.excellent;
    else if (score >= 700) rating = CreditRating.good;
    else if (score >= 650) rating = CreditRating.fair;
    else if (score >= 600) rating = CreditRating.poor;
    else rating = CreditRating.veryPoor;

    return CreditScoreModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      userId: user.id,
      score: score,
      rating: rating,
      factors: factors,
      calculatedAt: DateTime.now(),
      validUntil: DateTime.now().add(const Duration(days: 30)),
      confidence: 0.7,
      modelVersion: 'fallback-v1.0',
    );
  }

  FraudDetection? _generateFallbackFraudDetection(
    TransactionModel transaction,
    List<TransactionModel> recentTransactions,
  ) {
    // Simple rule-based fraud detection
    final avgAmount = recentTransactions.fold<double>(0, (sum, t) => sum + t.amount) / recentTransactions.length;
    
    // Flag if transaction is 3x larger than average
    if (transaction.amount > avgAmount * 3) {
      return FraudDetection(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        userId: transaction.userId,
        transactionId: transaction.id,
        type: FraudType.suspiciousTransaction,
        riskScore: 0.8,
        description: 'Transaction amount significantly higher than average',
        indicators: ['unusual_amount'],
        detectedAt: DateTime.now(),
        status: FraudStatus.detected,
      );
    }

    return null;
  }

  List<Map<String, dynamic>> _generateFallbackJobRecommendations(
    UserModel user,
    double latitude,
    double longitude,
  ) {
    // Simple job recommendations based on user profile
    final recommendations = <Map<String, dynamic>>[];

    if (user.gigTypes.contains('delivery')) {
      recommendations.add({
        'id': 'delivery_${DateTime.now().millisecondsSinceEpoch}',
        'title': 'Food Delivery Driver',
        'category': 'delivery',
        'pay_rate': 500.0,
        'location': 'Nairobi',
        'distance': 2.5,
        'match_score': 0.9,
      });
    }

    if (user.gigTypes.contains('transport')) {
      recommendations.add({
        'id': 'transport_${DateTime.now().millisecondsSinceEpoch}',
        'title': 'Ride Share Driver',
        'category': 'transport',
        'pay_rate': 800.0,
        'location': 'Nairobi',
        'distance': 1.2,
        'match_score': 0.85,
      });
    }

    return recommendations;
  }

  AIInsightModel? _analyzeIncomePatterns(List<TransactionModel> transactions, UserModel user) {
    final incomeTransactions = transactions.where((t) => t.type == TransactionType.income).toList();
    
    if (incomeTransactions.length < 5) return null;

    // Analyze weekly patterns
    final weeklyIncome = <int, List<double>>{};
    for (final transaction in incomeTransactions) {
      final weekday = transaction.timestamp.weekday;
      weeklyIncome.putIfAbsent(weekday, () => []).add(transaction.amount);
    }

    // Find best day for income
    double maxAvgIncome = 0;
    int bestDay = 1;
    for (final entry in weeklyIncome.entries) {
      final avgIncome = entry.value.fold<double>(0, (sum, amount) => sum + amount) / entry.value.length;
      if (avgIncome > maxAvgIncome) {
        maxAvgIncome = avgIncome;
        bestDay = entry.key;
      }
    }

    final dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return AIInsightModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      userId: user.id,
      type: InsightType.incomeForecast,
      title: 'Income Pattern Detected',
      description: 'Your highest earning day is ${dayNames[bestDay - 1]} with an average of KES ${maxAvgIncome.toStringAsFixed(0)}',
      category: 'income',
      confidence: 0.8,
      generatedAt: DateTime.now(),
      validUntil: DateTime.now().add(const Duration(days: 30)),
      recommendations: [
        'Focus more work on ${dayNames[bestDay - 1]}s',
        'Consider increasing availability on your best earning day',
      ],
      priority: Priority.medium,
    );
  }

  AIInsightModel? _analyzeExpensePatterns(List<TransactionModel> transactions, UserModel user) {
    final expenseTransactions = transactions.where((t) => t.type == TransactionType.expense).toList();
    
    if (expenseTransactions.length < 10) return null;

    // Analyze expense categories
    final categoryExpenses = <String, List<double>>{};
    for (final transaction in expenseTransactions) {
      final category = transaction.category ?? 'uncategorized';
      categoryExpenses.putIfAbsent(category, () => []).add(transaction.amount);
    }

    // Find highest spending category
    String highestCategory = '';
    double highestAmount = 0;
    for (final entry in categoryExpenses.entries) {
      final totalAmount = entry.value.fold<double>(0, (sum, amount) => sum + amount);
      if (totalAmount > highestAmount) {
        highestAmount = totalAmount;
        highestCategory = entry.key;
      }
    }

    return AIInsightModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      userId: user.id,
      type: InsightType.expensePattern,
      title: 'Expense Pattern Analysis',
      description: 'You spend most on $highestCategory (KES ${highestAmount.toStringAsFixed(0)})',
      category: 'expenses',
      confidence: 0.7,
      generatedAt: DateTime.now(),
      validUntil: DateTime.now().add(const Duration(days: 30)),
      recommendations: [
        'Review your $highestCategory expenses',
        'Look for ways to reduce spending in this category',
      ],
      priority: Priority.medium,
    );
  }

  AIInsightModel? _analyzeSavingsOpportunities(List<TransactionModel> transactions, UserModel user) {
    final incomeTransactions = transactions.where((t) => t.type == TransactionType.income).toList();
    final expenseTransactions = transactions.where((t) => t.type == TransactionType.expense).toList();
    
    if (incomeTransactions.isEmpty || expenseTransactions.isEmpty) return null;

    final totalIncome = incomeTransactions.fold<double>(0, (sum, t) => sum + t.amount);
    final totalExpenses = expenseTransactions.fold<double>(0, (sum, t) => sum + t.amount);
    final savingsRate = (totalIncome - totalExpenses) / totalIncome;

    if (savingsRate < 0.1) {
      return AIInsightModel(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        userId: user.id,
        type: InsightType.savingsOpportunity,
        title: 'Savings Opportunity',
        description: 'You could save more. Current savings rate: ${(savingsRate * 100).toStringAsFixed(1)}%',
        category: 'savings',
        confidence: 0.8,
        generatedAt: DateTime.now(),
        validUntil: DateTime.now().add(const Duration(days: 30)),
        recommendations: [
          'Try to save at least 10% of your income',
          'Set up automatic savings transfers',
          'Review and reduce unnecessary expenses',
        ],
        priority: Priority.high,
      );
    }

    return null;
  }
}
