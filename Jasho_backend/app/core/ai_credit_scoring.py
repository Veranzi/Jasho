"""
AI Credit Scoring System
Tracks incomes, deposits, expenditure, withdrawals, loans, and payment patterns to build credit scores
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import redis
from scipy import stats
import joblib
import warnings
warnings.filterwarnings('ignore')

logger = logging.getLogger(__name__)

class CreditDataProcessor:
    """Processes credit-related data for AI analysis"""
    
    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            db=5,
            decode_responses=True
        )
        
        # Credit score factors and weights
        self.credit_factors = {
            'payment_history': 0.35,      # 35% - Most important
            'credit_utilization': 0.30,   # 30% - How much credit is being used
            'credit_length': 0.15,        # 15% - Length of credit history
            'new_credit': 0.10,           # 10% - Recent credit applications
            'credit_mix': 0.10            # 10% - Types of credit used
        }
        
        # Credit score ranges
        self.credit_score_ranges = {
            'excellent': (750, 850),
            'good': (700, 749),
            'fair': (650, 699),
            'poor': (600, 649),
            'very_poor': (300, 599)
        }
    
    def process_user_financial_data(self, user_id: str, financial_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process user's financial data for credit scoring"""
        try:
            processed_data = {
                'user_id': user_id,
                'processed_at': datetime.utcnow().isoformat(),
                'credit_factors': {},
                'financial_metrics': {},
                'risk_indicators': [],
                'recommendations': []
            }
            
            # Process income data
            income_metrics = self._process_income_data(financial_data.get('incomes', []))
            processed_data['financial_metrics']['income'] = income_metrics
            
            # Process deposit data
            deposit_metrics = self._process_deposit_data(financial_data.get('deposits', []))
            processed_data['financial_metrics']['deposits'] = deposit_metrics
            
            # Process expenditure data
            expenditure_metrics = self._process_expenditure_data(financial_data.get('expenditures', []))
            processed_data['financial_metrics']['expenditure'] = expenditure_metrics
            
            # Process withdrawal data
            withdrawal_metrics = self._process_withdrawal_data(financial_data.get('withdrawals', []))
            processed_data['financial_metrics']['withdrawals'] = withdrawal_metrics
            
            # Process loan data
            loan_metrics = self._process_loan_data(financial_data.get('loans', []))
            processed_data['financial_metrics']['loans'] = loan_metrics
            
            # Calculate credit factors
            credit_factors = self._calculate_credit_factors(processed_data['financial_metrics'])
            processed_data['credit_factors'] = credit_factors
            
            # Identify risk indicators
            risk_indicators = self._identify_risk_indicators(processed_data['financial_metrics'])
            processed_data['risk_indicators'] = risk_indicators
            
            # Generate recommendations
            recommendations = self._generate_credit_recommendations(processed_data)
            processed_data['recommendations'] = recommendations
            
            return processed_data
            
        except Exception as e:
            logger.error(f"Financial data processing failed: {str(e)}")
            return {'error': str(e)}
    
    def _process_income_data(self, incomes: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process income data"""
        try:
            if not incomes:
                return {'total_income': 0, 'income_stability': 0, 'income_growth': 0}
            
            # Calculate total income
            total_income = sum(income.get('amount', 0) for income in incomes)
            
            # Calculate income stability (coefficient of variation)
            income_amounts = [income.get('amount', 0) for income in incomes]
            if len(income_amounts) > 1:
                income_stability = 1 - (np.std(income_amounts) / np.mean(income_amounts))
            else:
                income_stability = 1.0
            
            # Calculate income growth
            if len(income_amounts) > 1:
                recent_income = np.mean(income_amounts[-3:])  # Last 3 months
                older_income = np.mean(income_amounts[:-3]) if len(income_amounts) > 3 else recent_income
                income_growth = (recent_income - older_income) / older_income if older_income > 0 else 0
            else:
                income_growth = 0
            
            return {
                'total_income': total_income,
                'average_monthly_income': total_income / len(incomes) if incomes else 0,
                'income_stability': max(0, min(1, income_stability)),
                'income_growth': income_growth,
                'income_frequency': len(incomes),
                'last_income_date': max(income.get('date', '') for income in incomes) if incomes else None
            }
            
        except Exception as e:
            logger.error(f"Income data processing failed: {str(e)}")
            return {'error': str(e)}
    
    def _process_deposit_data(self, deposits: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process deposit data"""
        try:
            if not deposits:
                return {'total_deposits': 0, 'deposit_consistency': 0}
            
            # Calculate total deposits
            total_deposits = sum(deposit.get('amount', 0) for deposit in deposits)
            
            # Calculate deposit consistency
            deposit_amounts = [deposit.get('amount', 0) for deposit in deposits]
            if len(deposit_amounts) > 1:
                deposit_consistency = 1 - (np.std(deposit_amounts) / np.mean(deposit_amounts))
            else:
                deposit_consistency = 1.0
            
            # Calculate deposit frequency
            deposit_frequency = len(deposits)
            
            # Calculate average deposit amount
            average_deposit = total_deposits / len(deposits)
            
            return {
                'total_deposits': total_deposits,
                'average_deposit': average_deposit,
                'deposit_consistency': max(0, min(1, deposit_consistency)),
                'deposit_frequency': deposit_frequency,
                'last_deposit_date': max(deposit.get('date', '') for deposit in deposits) if deposits else None
            }
            
        except Exception as e:
            logger.error(f"Deposit data processing failed: {str(e)}")
            return {'error': str(e)}
    
    def _process_expenditure_data(self, expenditures: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process expenditure data"""
        try:
            if not expenditures:
                return {'total_expenditure': 0, 'expenditure_categories': {}}
            
            # Calculate total expenditure
            total_expenditure = sum(expenditure.get('amount', 0) for expenditure in expenditures)
            
            # Categorize expenditures
            expenditure_categories = {}
            for expenditure in expenditures:
                category = expenditure.get('category', 'other')
                if category not in expenditure_categories:
                    expenditure_categories[category] = 0
                expenditure_categories[category] += expenditure.get('amount', 0)
            
            # Calculate expenditure patterns
            expenditure_amounts = [expenditure.get('amount', 0) for expenditure in expenditures]
            if len(expenditure_amounts) > 1:
                expenditure_volatility = np.std(expenditure_amounts) / np.mean(expenditure_amounts)
            else:
                expenditure_volatility = 0
            
            return {
                'total_expenditure': total_expenditure,
                'average_expenditure': total_expenditure / len(expenditures),
                'expenditure_categories': expenditure_categories,
                'expenditure_volatility': expenditure_volatility,
                'expenditure_frequency': len(expenditures),
                'last_expenditure_date': max(expenditure.get('date', '') for expenditure in expenditures) if expenditures else None
            }
            
        except Exception as e:
            logger.error(f"Expenditure data processing failed: {str(e)}")
            return {'error': str(e)}
    
    def _process_withdrawal_data(self, withdrawals: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process withdrawal data"""
        try:
            if not withdrawals:
                return {'total_withdrawals': 0, 'withdrawal_patterns': {}}
            
            # Calculate total withdrawals
            total_withdrawals = sum(withdrawal.get('amount', 0) for withdrawal in withdrawals)
            
            # Analyze withdrawal patterns
            withdrawal_amounts = [withdrawal.get('amount', 0) for withdrawal in withdrawals]
            withdrawal_times = [withdrawal.get('time', '') for withdrawal in withdrawals]
            
            # Calculate withdrawal frequency
            withdrawal_frequency = len(withdrawals)
            
            # Calculate average withdrawal amount
            average_withdrawal = total_withdrawals / len(withdrawals)
            
            return {
                'total_withdrawals': total_withdrawals,
                'average_withdrawal': average_withdrawal,
                'withdrawal_frequency': withdrawal_frequency,
                'withdrawal_amounts': withdrawal_amounts,
                'withdrawal_times': withdrawal_times,
                'last_withdrawal_date': max(withdrawal.get('date', '') for withdrawal in withdrawals) if withdrawals else None
            }
            
        except Exception as e:
            logger.error(f"Withdrawal data processing failed: {str(e)}")
            return {'error': str(e)}
    
    def _process_loan_data(self, loans: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process loan data and payment history"""
        try:
            if not loans:
                return {'total_loans': 0, 'payment_history_score': 1.0}
            
            # Calculate total loan amount
            total_loan_amount = sum(loan.get('amount', 0) for loan in loans)
            
            # Analyze payment history
            payment_history_scores = []
            for loan in loans:
                payments = loan.get('payments', [])
                if payments:
                    # Calculate on-time payment percentage
                    on_time_payments = sum(1 for payment in payments if payment.get('on_time', True))
                    payment_score = on_time_payments / len(payments)
                    payment_history_scores.append(payment_score)
                else:
                    payment_history_scores.append(0.5)  # Neutral score for no payment history
            
            # Calculate overall payment history score
            overall_payment_score = np.mean(payment_history_scores) if payment_history_scores else 0.5
            
            # Calculate loan utilization
            total_credit_limit = sum(loan.get('credit_limit', loan.get('amount', 0)) for loan in loans)
            loan_utilization = total_loan_amount / total_credit_limit if total_credit_limit > 0 else 0
            
            return {
                'total_loans': len(loans),
                'total_loan_amount': total_loan_amount,
                'payment_history_score': overall_payment_score,
                'loan_utilization': min(1.0, loan_utilization),
                'average_loan_amount': total_loan_amount / len(loans),
                'active_loans': len([loan for loan in loans if loan.get('status') == 'active']),
                'defaulted_loans': len([loan for loan in loans if loan.get('status') == 'defaulted'])
            }
            
        except Exception as e:
            logger.error(f"Loan data processing failed: {str(e)}")
            return {'error': str(e)}
    
    def _calculate_credit_factors(self, financial_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate credit factors based on financial metrics"""
        try:
            credit_factors = {}
            
            # Payment History (35%)
            loan_metrics = financial_metrics.get('loans', {})
            payment_history_score = loan_metrics.get('payment_history_score', 0.5)
            credit_factors['payment_history'] = {
                'score': payment_history_score,
                'weight': self.credit_factors['payment_history'],
                'weighted_score': payment_history_score * self.credit_factors['payment_history']
            }
            
            # Credit Utilization (30%)
            loan_utilization = loan_metrics.get('loan_utilization', 0)
            utilization_score = max(0, 1 - loan_utilization)  # Lower utilization is better
            credit_factors['credit_utilization'] = {
                'score': utilization_score,
                'weight': self.credit_factors['credit_utilization'],
                'weighted_score': utilization_score * self.credit_factors['credit_utilization']
            }
            
            # Credit Length (15%)
            # This would be calculated based on the length of credit history
            credit_length_score = 0.7  # Placeholder - would be calculated from actual data
            credit_factors['credit_length'] = {
                'score': credit_length_score,
                'weight': self.credit_factors['credit_length'],
                'weighted_score': credit_length_score * self.credit_factors['credit_length']
            }
            
            # New Credit (10%)
            # This would be calculated based on recent credit applications
            new_credit_score = 0.8  # Placeholder - would be calculated from actual data
            credit_factors['new_credit'] = {
                'score': new_credit_score,
                'weight': self.credit_factors['new_credit'],
                'weighted_score': new_credit_score * self.credit_factors['new_credit']
            }
            
            # Credit Mix (10%)
            # This would be calculated based on the variety of credit types
            credit_mix_score = 0.6  # Placeholder - would be calculated from actual data
            credit_factors['credit_mix'] = {
                'score': credit_mix_score,
                'weight': self.credit_factors['credit_mix'],
                'weighted_score': credit_mix_score * self.credit_factors['credit_mix']
            }
            
            return credit_factors
            
        except Exception as e:
            logger.error(f"Credit factors calculation failed: {str(e)}")
            return {}
    
    def _identify_risk_indicators(self, financial_metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Identify risk indicators in financial data"""
        risk_indicators = []
        
        try:
            # Check for irregular income patterns
            income_metrics = financial_metrics.get('income', {})
            if income_metrics.get('income_stability', 1) < 0.7:
                risk_indicators.append({
                    'type': 'income_instability',
                    'severity': 'medium',
                    'description': 'Irregular income patterns detected',
                    'recommendation': 'Consider diversifying income sources'
                })
            
            # Check for high expenditure volatility
            expenditure_metrics = financial_metrics.get('expenditure', {})
            if expenditure_metrics.get('expenditure_volatility', 0) > 0.5:
                risk_indicators.append({
                    'type': 'expenditure_volatility',
                    'severity': 'high',
                    'description': 'High expenditure volatility detected',
                    'recommendation': 'Create a budget and track expenses'
                })
            
            # Check for loan defaults
            loan_metrics = financial_metrics.get('loans', {})
            if loan_metrics.get('defaulted_loans', 0) > 0:
                risk_indicators.append({
                    'type': 'loan_defaults',
                    'severity': 'high',
                    'description': 'Previous loan defaults detected',
                    'recommendation': 'Focus on improving payment history'
                })
            
            # Check for high loan utilization
            if loan_metrics.get('loan_utilization', 0) > 0.8:
                risk_indicators.append({
                    'type': 'high_loan_utilization',
                    'severity': 'medium',
                    'description': 'High loan utilization detected',
                    'recommendation': 'Consider paying down existing loans'
                })
            
            return risk_indicators
            
        except Exception as e:
            logger.error(f"Risk indicators identification failed: {str(e)}")
            return []
    
    def _generate_credit_recommendations(self, processed_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate credit improvement recommendations"""
        recommendations = []
        
        try:
            credit_factors = processed_data.get('credit_factors', {})
            risk_indicators = processed_data.get('risk_indicators', [])
            
            # Payment history recommendations
            payment_history_score = credit_factors.get('payment_history', {}).get('score', 0.5)
            if payment_history_score < 0.8:
                recommendations.append({
                    'category': 'payment_history',
                    'priority': 'high',
                    'title': 'Improve Payment History',
                    'description': 'Make all loan payments on time to improve your credit score',
                    'action_items': [
                        'Set up automatic payments',
                        'Create payment reminders',
                        'Pay at least the minimum amount due'
                    ]
                })
            
            # Credit utilization recommendations
            utilization_score = credit_factors.get('credit_utilization', {}).get('score', 0.5)
            if utilization_score < 0.7:
                recommendations.append({
                    'category': 'credit_utilization',
                    'priority': 'medium',
                    'title': 'Reduce Credit Utilization',
                    'description': 'Keep your credit utilization below 30%',
                    'action_items': [
                        'Pay down existing balances',
                        'Request credit limit increases',
                        'Avoid taking on new debt'
                    ]
                })
            
            # Income stability recommendations
            income_metrics = processed_data.get('financial_metrics', {}).get('income', {})
            if income_metrics.get('income_stability', 1) < 0.7:
                recommendations.append({
                    'category': 'income_stability',
                    'priority': 'medium',
                    'title': 'Stabilize Income',
                    'description': 'Work on creating more stable income sources',
                    'action_items': [
                        'Diversify income sources',
                        'Build emergency savings',
                        'Consider part-time work'
                    ]
                })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Credit recommendations generation failed: {str(e)}")
            return []

class AICreditScorer:
    """AI-powered credit scoring system"""
    
    def __init__(self):
        self.data_processor = CreditDataProcessor()
        self.model = None
        self.scaler = StandardScaler()
        self.label_encoder = LabelEncoder()
        self.model_path = "models/credit_scoring_model.pkl"
        
        # Load or create model
        self._load_or_create_model()
    
    def _load_or_create_model(self):
        """Load existing model or create new one"""
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                logger.info("Credit scoring model loaded successfully")
            else:
                self._create_training_model()
                logger.info("New credit scoring model created")
        except Exception as e:
            logger.error(f"Model loading/creation failed: {str(e)}")
            self._create_training_model()
    
    def _create_training_model(self):
        """Create and train a new credit scoring model"""
        try:
            # Generate synthetic training data
            training_data = self._generate_synthetic_training_data()
            
            # Prepare features and target
            X = training_data.drop(['credit_score'], axis=1)
            y = training_data['credit_score']
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train model
            self.model = GradientBoostingRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=6,
                random_state=42
            )
            
            self.model.fit(X_train_scaled, y_train)
            
            # Evaluate model
            y_pred = self.model.predict(X_test_scaled)
            accuracy = self.model.score(X_test_scaled, y_test)
            
            logger.info(f"Model training completed. R² score: {accuracy:.4f}")
            
            # Save model
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            joblib.dump(self.model, self.model_path)
            
        except Exception as e:
            logger.error(f"Model training failed: {str(e)}")
            # Create a simple fallback model
            self.model = GradientBoostingRegressor(random_state=42)
    
    def _generate_synthetic_training_data(self) -> pd.DataFrame:
        """Generate synthetic training data for model training"""
        try:
            np.random.seed(42)
            n_samples = 1000
            
            # Generate synthetic features
            data = {
                'payment_history_score': np.random.beta(2, 2, n_samples),
                'credit_utilization': np.random.beta(2, 5, n_samples),
                'credit_length_score': np.random.beta(3, 2, n_samples),
                'new_credit_score': np.random.beta(4, 2, n_samples),
                'credit_mix_score': np.random.beta(3, 3, n_samples),
                'income_stability': np.random.beta(3, 2, n_samples),
                'expenditure_volatility': np.random.beta(2, 5, n_samples),
                'loan_utilization': np.random.beta(2, 5, n_samples),
                'defaulted_loans': np.random.poisson(0.5, n_samples),
                'active_loans': np.random.poisson(2, n_samples)
            }
            
            # Calculate credit scores based on features
            credit_scores = []
            for i in range(n_samples):
                score = 300  # Base score
                
                # Payment history (35%)
                score += data['payment_history_score'][i] * 200
                
                # Credit utilization (30%)
                score += (1 - data['credit_utilization'][i]) * 150
                
                # Credit length (15%)
                score += data['credit_length_score'][i] * 100
                
                # New credit (10%)
                score += data['new_credit_score'][i] * 50
                
                # Credit mix (10%)
                score += data['credit_mix_score'][i] * 50
                
                # Penalties
                score -= data['defaulted_loans'][i] * 50
                score -= data['expenditure_volatility'][i] * 30
                
                # Cap score between 300 and 850
                score = max(300, min(850, score))
                credit_scores.append(score)
            
            data['credit_score'] = credit_scores
            
            return pd.DataFrame(data)
            
        except Exception as e:
            logger.error(f"Synthetic data generation failed: {str(e)}")
            return pd.DataFrame()
    
    def calculate_credit_score(self, user_id: str, financial_data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate AI-powered credit score for user"""
        try:
            # Process financial data
            processed_data = self.data_processor.process_user_financial_data(user_id, financial_data)
            
            if 'error' in processed_data:
                return processed_data
            
            # Prepare features for model
            features = self._prepare_features(processed_data)
            
            # Predict credit score
            if self.model:
                features_scaled = self.scaler.transform([features])
                predicted_score = self.model.predict(features_scaled)[0]
            else:
                # Fallback calculation
                predicted_score = self._calculate_fallback_score(processed_data)
            
            # Ensure score is within valid range
            predicted_score = max(300, min(850, predicted_score))
            
            # Determine credit rating
            credit_rating = self._determine_credit_rating(predicted_score)
            
            # Calculate confidence score
            confidence_score = self._calculate_confidence_score(processed_data)
            
            result = {
                'user_id': user_id,
                'credit_score': int(predicted_score),
                'credit_rating': credit_rating,
                'confidence_score': confidence_score,
                'calculated_at': datetime.utcnow().isoformat(),
                'credit_factors': processed_data.get('credit_factors', {}),
                'risk_indicators': processed_data.get('risk_indicators', []),
                'recommendations': processed_data.get('recommendations', []),
                'model_version': '1.0'
            }
            
            # Cache result
            self._cache_credit_score(user_id, result)
            
            return result
            
        except Exception as e:
            logger.error(f"Credit score calculation failed: {str(e)}")
            return {'error': str(e)}
    
    def _prepare_features(self, processed_data: Dict[str, Any]) -> List[float]:
        """Prepare features for model prediction"""
        try:
            credit_factors = processed_data.get('credit_factors', {})
            financial_metrics = processed_data.get('financial_metrics', {})
            
            features = [
                credit_factors.get('payment_history', {}).get('score', 0.5),
                credit_factors.get('credit_utilization', {}).get('score', 0.5),
                credit_factors.get('credit_length', {}).get('score', 0.5),
                credit_factors.get('new_credit', {}).get('score', 0.5),
                credit_factors.get('credit_mix', {}).get('score', 0.5),
                financial_metrics.get('income', {}).get('income_stability', 0.5),
                financial_metrics.get('expenditure', {}).get('expenditure_volatility', 0.5),
                financial_metrics.get('loans', {}).get('loan_utilization', 0.5),
                financial_metrics.get('loans', {}).get('defaulted_loans', 0),
                financial_metrics.get('loans', {}).get('active_loans', 0)
            ]
            
            return features
            
        except Exception as e:
            logger.error(f"Feature preparation failed: {str(e)}")
            return [0.5] * 10  # Default features
    
    def _calculate_fallback_score(self, processed_data: Dict[str, Any]) -> float:
        """Calculate fallback credit score when model is not available"""
        try:
            credit_factors = processed_data.get('credit_factors', {})
            
            # Calculate weighted score
            weighted_score = 0
            total_weight = 0
            
            for factor, data in credit_factors.items():
                if 'weighted_score' in data:
                    weighted_score += data['weighted_score']
                    total_weight += data['weight']
            
            # Convert to credit score range (300-850)
            if total_weight > 0:
                normalized_score = weighted_score / total_weight
                credit_score = 300 + (normalized_score * 550)
            else:
                credit_score = 600  # Default score
            
            return credit_score
            
        except Exception as e:
            logger.error(f"Fallback score calculation failed: {str(e)}")
            return 600
    
    def _determine_credit_rating(self, credit_score: float) -> str:
        """Determine credit rating based on score"""
        for rating, (min_score, max_score) in self.data_processor.credit_score_ranges.items():
            if min_score <= credit_score <= max_score:
                return rating
        return 'fair'
    
    def _calculate_confidence_score(self, processed_data: Dict[str, Any]) -> float:
        """Calculate confidence score for the credit score prediction"""
        try:
            confidence_factors = []
            
            # Data completeness
            financial_metrics = processed_data.get('financial_metrics', {})
            data_completeness = 0
            
            for metric_type in ['income', 'deposits', 'expenditure', 'withdrawals', 'loans']:
                if financial_metrics.get(metric_type, {}):
                    data_completeness += 0.2
            
            confidence_factors.append(data_completeness)
            
            # Data recency
            recent_data_score = 0.8  # Placeholder - would check actual data dates
            confidence_factors.append(recent_data_score)
            
            # Data consistency
            consistency_score = 0.7  # Placeholder - would check for data consistency
            confidence_factors.append(consistency_score)
            
            return np.mean(confidence_factors)
            
        except Exception as e:
            logger.error(f"Confidence score calculation failed: {str(e)}")
            return 0.5
    
    def _cache_credit_score(self, user_id: str, credit_score_data: Dict[str, Any]):
        """Cache credit score data"""
        try:
            key = f"credit_score:{user_id}"
            self.data_processor.redis_client.setex(key, 86400, json.dumps(credit_score_data))  # 24 hours
        except Exception as e:
            logger.error(f"Credit score caching failed: {str(e)}")
    
    def get_credit_score(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get cached credit score"""
        try:
            key = f"credit_score:{user_id}"
            cached_data = self.data_processor.redis_client.get(key)
            if cached_data:
                return json.loads(cached_data)
            return None
        except Exception as e:
            logger.error(f"Credit score retrieval failed: {str(e)}")
            return None
    
    def update_model(self, new_training_data: List[Dict[str, Any]]):
        """Update the credit scoring model with new data"""
        try:
            # This would implement model retraining with new data
            # For now, just log the request
            logger.info(f"Model update requested with {len(new_training_data)} new samples")
            
            # In production, this would:
            # 1. Validate new training data
            # 2. Retrain model with combined data
            # 3. Validate model performance
            # 4. Deploy new model if performance is acceptable
            
        except Exception as e:
            logger.error(f"Model update failed: {str(e)}")

# Global AI credit scorer instance
ai_credit_scorer = AICreditScorer()
