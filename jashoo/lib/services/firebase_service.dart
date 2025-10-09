import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_analytics/firebase_analytics.dart';

class FirebaseService {
  static final FirebaseService _instance = FirebaseService._internal();
  factory FirebaseService() => _instance;
  FirebaseService._internal();

  late FirebaseAuth _auth;
  late FirebaseFirestore _firestore;
  late FirebaseStorage _storage;
  late FirebaseMessaging _messaging;
  late FirebaseAnalytics _analytics;

  FirebaseAuth get auth => _auth;
  FirebaseFirestore get firestore => _firestore;
  FirebaseStorage get storage => _storage;
  FirebaseMessaging get messaging => _messaging;
  FirebaseAnalytics get analytics => _analytics;

  Future<void> initialize() async {
    await Firebase.initializeApp();
    _auth = FirebaseAuth.instance;
    _firestore = FirebaseFirestore.instance;
    _storage = FirebaseStorage.instance;
    _messaging = FirebaseMessaging.instance;
    _analytics = FirebaseAnalytics.instance;

    // Configure Firestore settings
    _firestore.settings = const Settings(
      persistenceEnabled: true,
      cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
    );

    // Request notification permissions
    await _messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    // Configure analytics
    await _analytics.setAnalyticsCollectionEnabled(true);
  }

  // User Management
  Future<UserCredential?> signInWithPhoneNumber({
    required String phoneNumber,
    required String verificationId,
    required String smsCode,
  }) async {
    try {
      final credential = PhoneAuthProvider.credential(
        verificationId: verificationId,
        smsCode: smsCode,
      );
      return await _auth.signInWithCredential(credential);
    } catch (e) {
      throw Exception('Phone authentication failed: $e');
    }
  }

  Future<void> verifyPhoneNumber({
    required String phoneNumber,
    required Function(String verificationId) onCodeSent,
    required Function(String error) onError,
  }) async {
    await _auth.verifyPhoneNumber(
      phoneNumber: phoneNumber,
      verificationCompleted: (PhoneAuthCredential credential) async {
        await _auth.signInWithCredential(credential);
      },
      verificationFailed: (FirebaseAuthException e) {
        onError(e.message ?? 'Verification failed');
      },
      codeSent: (String verificationId, int? resendToken) {
        onCodeSent(verificationId);
      },
      codeAutoRetrievalTimeout: (String verificationId) {},
      timeout: const Duration(seconds: 60),
    );
  }

  Future<void> signOut() async {
    await _auth.signOut();
  }

  User? get currentUser => _auth.currentUser;

  Stream<User?> get authStateChanges => _auth.authStateChanges();

  // Firestore Operations
  Future<void> createUserDocument(String userId, Map<String, dynamic> userData) async {
    await _firestore.collection('users').doc(userId).set(userData);
  }

  Future<DocumentSnapshot> getUserDocument(String userId) async {
    return await _firestore.collection('users').doc(userId).get();
  }

  Future<void> updateUserDocument(String userId, Map<String, dynamic> updates) async {
    await _firestore.collection('users').doc(userId).update(updates);
  }

  Stream<DocumentSnapshot> getUserDocumentStream(String userId) {
    return _firestore.collection('users').doc(userId).snapshots();
  }

  // Transactions
  Future<void> addTransaction(String userId, Map<String, dynamic> transactionData) async {
    await _firestore
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .add(transactionData);
  }

  Stream<QuerySnapshot> getTransactionsStream(String userId) {
    return _firestore
        .collection('users')
        .doc(userId)
        .collection('transactions')
        .orderBy('timestamp', descending: true)
        .snapshots();
  }

  // Credit Scores
  Future<void> addCreditScore(String userId, Map<String, dynamic> creditScoreData) async {
    await _firestore
        .collection('users')
        .doc(userId)
        .collection('credit_scores')
        .add(creditScoreData);
  }

  Stream<QuerySnapshot> getCreditScoresStream(String userId) {
    return _firestore
        .collection('users')
        .doc(userId)
        .collection('credit_scores')
        .orderBy('calculatedAt', descending: true)
        .snapshots();
  }

  // AI Insights
  Future<void> addAIInsight(String userId, Map<String, dynamic> insightData) async {
    await _firestore
        .collection('users')
        .doc(userId)
        .collection('ai_insights')
        .add(insightData);
  }

  Stream<QuerySnapshot> getAIInsightsStream(String userId) {
    return _firestore
        .collection('users')
        .doc(userId)
        .collection('ai_insights')
        .orderBy('generatedAt', descending: true)
        .snapshots();
  }

  // Jobs
  Future<void> addJob(Map<String, dynamic> jobData) async {
    await _firestore.collection('jobs').add(jobData);
  }

  Stream<QuerySnapshot> getJobsStream() {
    return _firestore
        .collection('jobs')
        .where('status', isEqualTo: 'active')
        .orderBy('postedAt', descending: true)
        .snapshots();
  }

  Stream<QuerySnapshot> getJobsByLocationStream(double latitude, double longitude, int radiusKm) {
    // Note: This is a simplified version. For production, you'd want to use
    // GeoFlutterFire or similar for proper geospatial queries
    return _firestore
        .collection('jobs')
        .where('status', isEqualTo: 'active')
        .orderBy('postedAt', descending: true)
        .snapshots();
  }

  // Savings
  Future<void> addSavingsAccount(String userId, Map<String, dynamic> savingsData) async {
    await _firestore
        .collection('users')
        .doc(userId)
        .collection('savings_accounts')
        .add(savingsData);
  }

  Stream<QuerySnapshot> getSavingsAccountsStream(String userId) {
    return _firestore
        .collection('users')
        .doc(userId)
        .collection('savings_accounts')
        .snapshots();
  }

  // Loans
  Future<void> addLoan(String userId, Map<String, dynamic> loanData) async {
    await _firestore
        .collection('users')
        .doc(userId)
        .collection('loans')
        .add(loanData);
  }

  Stream<QuerySnapshot> getLoansStream(String userId) {
    return _firestore
        .collection('users')
        .doc(userId)
        .collection('loans')
        .orderBy('disbursedAt', descending: true)
        .snapshots();
  }

  // Insurance
  Future<void> addInsurancePolicy(String userId, Map<String, dynamic> policyData) async {
    await _firestore
        .collection('users')
        .doc(userId)
        .collection('insurance_policies')
        .add(policyData);
  }

  Stream<QuerySnapshot> getInsurancePoliciesStream(String userId) {
    return _firestore
        .collection('users')
        .doc(userId)
        .collection('insurance_policies')
        .snapshots();
  }

  // Gamification
  Future<void> updateUserProfile(String userId, Map<String, dynamic> profileData) async {
    await _firestore
        .collection('users')
        .doc(userId)
        .collection('gamification')
        .doc('profile')
        .set(profileData, SetOptions(merge: true));
  }

  Future<DocumentSnapshot> getUserProfile(String userId) async {
    return await _firestore
        .collection('users')
        .doc(userId)
        .collection('gamification')
        .doc('profile')
        .get();
  }

  // File Upload
  Future<String> uploadFile(String path, List<int> fileBytes) async {
    final ref = _storage.ref().child(path);
    final uploadTask = ref.putData(fileBytes);
    final snapshot = await uploadTask;
    return await snapshot.ref.getDownloadURL();
  }

  // Analytics
  Future<void> logEvent(String name, Map<String, dynamic> parameters) async {
    await _analytics.logEvent(name: name, parameters: parameters);
  }

  // Batch Operations
  Future<void> batchWrite(List<Map<String, dynamic>> operations) async {
    final batch = _firestore.batch();
    
    for (final operation in operations) {
      final docRef = _firestore
          .collection(operation['collection'])
          .doc(operation['document']);
      
      switch (operation['type']) {
        case 'set':
          batch.set(docRef, operation['data']);
          break;
        case 'update':
          batch.update(docRef, operation['data']);
          break;
        case 'delete':
          batch.delete(docRef);
          break;
      }
    }
    
    await batch.commit();
  }
}
