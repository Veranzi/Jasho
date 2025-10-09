import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'providers/auth_provider.dart';
import 'providers/user_provider.dart';
import 'providers/wallet_provider.dart';
import 'providers/jobs_provider.dart';
import 'providers/savings_provider.dart';
import 'providers/gamification_provider.dart';
import 'providers/ai_provider.dart';
import 'services/api_service.dart';
import 'services/image_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize services
  await _initializeServices();
  
  runApp(IntegratedJashooApp());
}

Future<void> _initializeServices() async {
  // Initialize API service
  await ApiService().initialize();
  
  // Initialize image service
  // ImageService is already initialized as singleton
}

class IntegratedJashooApp extends StatelessWidget {
  const IntegratedJashooApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => UserProvider()),
        ChangeNotifierProvider(create: (_) => WalletProvider()),
        ChangeNotifierProvider(create: (_) => JobsProvider()),
        ChangeNotifierProvider(create: (_) => SavingsProvider()),
        ChangeNotifierProvider(create: (_) => GamificationProvider()),
        ChangeNotifierProvider(create: (_) => AiProvider()),
      ],
      child: MaterialApp(
        title: 'Jashoo - Integrated',
        theme: ThemeData(
          primarySwatch: Colors.blue,
          visualDensity: VisualDensity.adaptivePlatformDensity,
        ),
        home: AppInitializer(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}

class AppInitializer extends StatefulWidget {
  const AppInitializer({super.key});

  @override
  _AppInitializerState createState() => _AppInitializerState();
}

class _AppInitializerState extends State<AppInitializer> {
  bool _isInitializing = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initializeApp();
  }

  Future<void> _initializeApp() async {
    try {
      // Initialize authentication
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      await authProvider.initialize();

      // If user is logged in, load their data
      if (authProvider.isLoggedIn) {
        await _loadUserData();
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _isInitializing = false;
      });
    }
  }

  Future<void> _loadUserData() async {
    // A helper to safely execute data loading functions.
    Future<void> _safeLoad(String name, Future<void> Function() loader) async {
      try {
        await loader();
      } catch (e) {
        print('Error loading $name data: $e');
      }
    }

    // Load initial data sequentially.
    await _safeLoad('user profile', () => context.read<UserProvider>().loadProfile());
    await _safeLoad('wallet balance', () => context.read<WalletProvider>().loadBalance());
    await _safeLoad('wallet transactions', () => context.read<WalletProvider>().loadTransactions());

    // Load remaining data in parallel for better performance.
    await Future.wait([
      _safeLoad('jobs', () => context.read<JobsProvider>().loadJobs()),
      _safeLoad('savings goals', () => context.read<SavingsProvider>().loadSavingsGoals()),
      _safeLoad('loan requests', () => context.read<SavingsProvider>().loadLoanRequests()),
      _safeLoad('gamification', () => context.read<GamificationProvider>().loadProfile()),
      _safeLoad('AI suggestions', () => context.read<AiProvider>().loadSuggestions()),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    if (_isInitializing) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 20),
              Text('Initializing Jashoo...'),
              if (_error != null) ...[
                SizedBox(height: 20),
                Text(
                  'Error: $_error',
                  style: TextStyle(color: Colors.red),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      );
    }

    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        if (authProvider.isLoggedIn) {
          return MainAppScreen();
        } else {
          return LoginScreen(onLoginSuccess: _loadUserData);
        }
      },
    );
  }
}

class MainAppScreen extends StatelessWidget {
  const MainAppScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Jashoo - Integrated'),
        actions: [
          Consumer<AuthProvider>(
            builder: (context, authProvider, child) {
              return PopupMenuButton<String>(
                onSelected: (value) async {
                  if (value == 'logout') {
                    await authProvider.logout();
                  }
                },
                itemBuilder: (context) => [
                  PopupMenuItem(
                    value: 'logout',
                    child: Text('Logout'),
                  ),
                ],
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildUserInfo(),
            SizedBox(height: 20),
            _buildWalletInfo(),
            SizedBox(height: 20),
            _buildQuickActions(),
            SizedBox(height: 20),
            _buildRecentTransactions(),
          ],
        ),
      ),
    );
  }

  Widget _buildUserInfo() {
    return Consumer<UserProvider>(
      builder: (context, userProvider, child) {
        if (userProvider.isLoading) {
          return Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Row(
                children: [
                  CircularProgressIndicator(),
                  SizedBox(width: 16),
                  Text('Loading profile...'),
                ],
              ),
            ),
          );
        }

        final profile = userProvider.profile;
        if (profile == null) {
          return Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Text('No profile data'),
            ),
          );
        }

        return Card(
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Welcome, ${profile.fullName}!',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                SizedBox(height: 8),
                Text('Email: ${profile.email ?? 'N/A'}'),
                Text('Phone: ${profile.phoneNumber ?? 'N/A'}'),
                Text('Location: ${profile.location}'),
                Text('Rating: ${profile.rating.toStringAsFixed(1)}/5'),
                Text('Verified: ${profile.isVerified ? 'Yes' : 'No'}'),
                if (profile.isKycComplete == true)
                  Text('KYC: Complete'),
                else
                  Text('KYC: Incomplete'),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildWalletInfo() {
    return Consumer<WalletProvider>(
      builder: (context, walletProvider, child) {
        if (walletProvider.isLoading) {
          return Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Row(
                children: [
                  CircularProgressIndicator(),
                  SizedBox(width: 16),
                  Text('Loading wallet...'),
                ],
              ),
            ),
          );
        }

        final balance = walletProvider.balance;
        if (balance == null) {
          return Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Text('No wallet data'),
            ),
          );
        }

        return Card(
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Wallet Balance',
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                    ElevatedButton(
                      onPressed: () => walletProvider.toggleCurrency(),
                      child: Text(walletProvider.getCurrencySymbol()),
                    ),
                  ],
                ),
                SizedBox(height: 8),
                Text(
                  '${walletProvider.currentBalance.toStringAsFixed(2)} ${walletProvider.getCurrencySymbol()}',
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
                SizedBox(height: 8),
                Text('KES: ${balance.kesBalance.toStringAsFixed(2)}'),
                Text('USDT: ${balance.usdtBalance.toStringAsFixed(2)}'),
                Text('USD: ${balance.usdBalance.toStringAsFixed(2)}'),
                Text('PIN Set: ${balance.hasPin ? 'Yes' : 'No'}'),
                Text('Status: ${balance.status}'),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildQuickActions() {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Quick Actions',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                ElevatedButton(
                  onPressed: () => _showDepositDialog(),
                  child: Text('Deposit'),
                ),
                ElevatedButton(
                  onPressed: () => _showWithdrawDialog(),
                  child: Text('Withdraw'),
                ),
                ElevatedButton(
                  onPressed: () => _showTransferDialog(),
                  child: Text('Transfer'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentTransactions() {
    return Consumer<WalletProvider>(
      builder: (context, walletProvider, child) {
        final transactions = walletProvider.getRecentTransactions();
        
        return Card(
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Recent Transactions',
                  style: Theme.of(context).textTheme.titleLarge,
                ),
                SizedBox(height: 16),
                if (transactions.isEmpty)
                  Text('No recent transactions')
                else
                  ...transactions.take(5).map((txn) => ListTile(
                    title: Text(txn.description),
                    subtitle: Text('${txn.amount.toStringAsFixed(2)} ${txn.currencyCode}'),
                    trailing: Text(txn.status),
                    leading: Icon(_getTransactionIcon(txn.type)),
                  )),
              ],
            ),
          ),
        );
      },
    );
  }

  IconData _getTransactionIcon(String type) {
    switch (type) {
      case 'deposit':
        return Icons.arrow_downward;
      case 'withdrawal':
        return Icons.arrow_upward;
      case 'transfer':
        return Icons.swap_horiz;
      case 'earning':
        return Icons.work;
      case 'convert':
        return Icons.swap_vert;
      default:
        return Icons.payment;
    }
  }

  void _showDepositDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Deposit Money'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              decoration: InputDecoration(labelText: 'Amount (KES)'),
              keyboardType: TextInputType.number,
            ),
            TextField(
              decoration: InputDecoration(labelText: 'Description'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              // Implement deposit logic
              Navigator.pop(context);
            },
            child: Text('Deposit'),
          ),
        ],
      ),
    );
  }

  void _showWithdrawDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Withdraw Money'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              decoration: InputDecoration(labelText: 'Amount (KES)'),
              keyboardType: TextInputType.number,
            ),
            TextField(
              decoration: InputDecoration(labelText: 'PIN'),
              obscureText: true,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              // Implement withdraw logic
              Navigator.pop(context);
            },
            child: Text('Withdraw'),
          ),
        ],
      ),
    );
  }

  void _showTransferDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Transfer Money'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              decoration: InputDecoration(labelText: 'Recipient User ID'),
            ),
            TextField(
              decoration: InputDecoration(labelText: 'Amount (KES)'),
              keyboardType: TextInputType.number,
            ),
            TextField(
              decoration: InputDecoration(labelText: 'PIN'),
              obscureText: true,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              // Implement transfer logic
              Navigator.pop(context);
            },
            child: Text('Transfer'),
          ),
        ],
      ),
    );
  }
}

class LoginScreen extends StatefulWidget {
  final Future<void> Function()? onLoginSuccess;
  const LoginScreen({super.key, this.onLoginSuccess});

  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _fullNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _locationController = TextEditingController(text: 'Nairobi, Kenya');
  bool _isLogin = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Jashoo Login'),
      ),
      body: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              _isLogin ? 'Login to Jashoo' : 'Register for Jashoo',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            SizedBox(height: 32),
            TextField(
              controller: _emailController,
              decoration: InputDecoration(
                labelText: 'Email',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
            ),
            if (!_isLogin) ...[
              SizedBox(height: 16),
              TextField(
                controller: _fullNameController,
                decoration: InputDecoration(
                  labelText: 'Full Name',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.name,
              ),
              SizedBox(height: 16),
              TextField(
                controller: _phoneController,
                decoration: InputDecoration(
                  labelText: 'Phone Number (e.g., +254...)' ,
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.phone,
              ),
              SizedBox(height: 16),
              TextField(
                controller: _locationController,
                decoration: InputDecoration(
                  labelText: 'Location',
                  border: OutlineInputBorder(),
                ),
              ),
            ],
            SizedBox(height: 16),
            TextField(
              controller: _passwordController,
              decoration: InputDecoration(
                labelText: 'Password',
                border: OutlineInputBorder(),
              ),
              obscureText: true,
            ),
            SizedBox(height: 24),
            Consumer<AuthProvider>(
              builder: (context, authProvider, child) {
                return Column(
                  children: [
                    if (authProvider.isLoading)
                      CircularProgressIndicator()
                    else
                      ElevatedButton(
                        onPressed: _isLogin ? _login : _register,
                        child: Text(_isLogin ? 'Login' : 'Register'),
                      ),
                    if (authProvider.error != null) ...[
                      SizedBox(height: 16),
                      Text(
                        authProvider.error!,
                        style: TextStyle(color: Colors.red),
                        textAlign: TextAlign.center,
                      ),
                    ],
                  ],
                );
              },
            ),
            SizedBox(height: 16),
            TextButton(
              onPressed: () {
                setState(() {
                  _isLogin = !_isLogin;
                  // Clear registration fields if switching back to login
                  _fullNameController.clear();
                  _phoneController.clear();
                });
              },
              child: Text(_isLogin ? 'Need an account? Register' : 'Have an account? Login'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _login() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.login(
      email: _emailController.text,
      password: _passwordController.text,
    );

    if (success) {
      // Reload user data
      await widget.onLoginSuccess?.call();
    }
  }

  Future<void> _register() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.register(
      email: _emailController.text,
      password: _passwordController.text,
      fullName: _fullNameController.text,
      phoneNumber: _phoneController.text,
      location: _locationController.text,
    );

    if (success) {
      // Reload user data
      await widget.onLoginSuccess?.call();
    }
  }
}