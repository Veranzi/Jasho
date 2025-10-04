"""
SMS Verification System
Handles SMS verification during signup and other authentication processes
"""

import os
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import redis
import requests
import secrets
import hashlib
import hmac
import time
from twilio.rest import Client
from africastalking.SMS import SMS as AT_SMS
import africastalking

logger = logging.getLogger(__name__)

class SMSConfig:
    """SMS configuration and constants"""
    
    # Twilio configuration
    TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
    TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")
    
    # Africa's Talking configuration
    AT_USERNAME = os.getenv("AT_USERNAME")
    AT_API_KEY = os.getenv("AT_API_KEY")
    AT_SENDER_ID = os.getenv("AT_SENDER_ID", "JASHO")
    
    # SMS settings
    SMS_CODE_LENGTH = 6
    SMS_CODE_EXPIRY_MINUTES = 10
    MAX_ATTEMPTS = 3
    RATE_LIMIT_WINDOW_MINUTES = 15
    MAX_SMS_PER_WINDOW = 5
    
    # SMS templates
    VERIFICATION_TEMPLATE = "Your Jasho verification code is: {code}. Valid for {minutes} minutes. Do not share this code."
    RESET_PASSWORD_TEMPLATE = "Your Jasho password reset code is: {code}. Valid for {minutes} minutes. Do not share this code."
    LOGIN_VERIFICATION_TEMPLATE = "Your Jasho login verification code is: {code}. Valid for {minutes} minutes. Do not share this code."
    TRANSACTION_VERIFICATION_TEMPLATE = "Your Jasho transaction verification code is: {code}. Valid for {minutes} minutes. Do not share this code."

class SMSProvider:
    """Base SMS provider class"""
    
    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            db=7,
            decode_responses=True
        )
    
    def send_sms(self, phone_number: str, message: str) -> Dict[str, Any]:
        """Send SMS message"""
        raise NotImplementedError
    
    def validate_phone_number(self, phone_number: str) -> bool:
        """Validate phone number format"""
        # Basic validation for Kenyan phone numbers
        import re
        kenyan_pattern = r'^(\+254|254|0)?[17]\d{8}$'
        return bool(re.match(kenyan_pattern, phone_number))
    
    def normalize_phone_number(self, phone_number: str) -> str:
        """Normalize phone number to international format"""
        # Remove any non-digit characters except +
        cleaned = ''.join(c for c in phone_number if c.isdigit() or c == '+')
        
        # Convert to international format
        if cleaned.startswith('0'):
            cleaned = '+254' + cleaned[1:]
        elif cleaned.startswith('254'):
            cleaned = '+' + cleaned
        elif not cleaned.startswith('+254'):
            cleaned = '+254' + cleaned
        
        return cleaned

class TwilioSMSProvider(SMSProvider):
    """Twilio SMS provider implementation"""
    
    def __init__(self):
        super().__init__()
        if SMSConfig.TWILIO_ACCOUNT_SID and SMSConfig.TWILIO_AUTH_TOKEN:
            self.client = Client(SMSConfig.TWILIO_ACCOUNT_SID, SMSConfig.TWILIO_AUTH_TOKEN)
        else:
            self.client = None
            logger.warning("Twilio credentials not configured")
    
    def send_sms(self, phone_number: str, message: str) -> Dict[str, Any]:
        """Send SMS using Twilio"""
        try:
            if not self.client:
                return {'success': False, 'error': 'Twilio not configured'}
            
            # Normalize phone number
            normalized_number = self.normalize_phone_number(phone_number)
            
            # Send SMS
            message_obj = self.client.messages.create(
                body=message,
                from_=SMSConfig.TWILIO_PHONE_NUMBER,
                to=normalized_number
            )
            
            return {
                'success': True,
                'message_id': message_obj.sid,
                'status': message_obj.status,
                'provider': 'twilio'
            }
            
        except Exception as e:
            logger.error(f"Twilio SMS sending failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def get_message_status(self, message_id: str) -> Dict[str, Any]:
        """Get SMS message status from Twilio"""
        try:
            if not self.client:
                return {'success': False, 'error': 'Twilio not configured'}
            
            message = self.client.messages(message_id).fetch()
            
            return {
                'success': True,
                'status': message.status,
                'error_code': message.error_code,
                'error_message': message.error_message
            }
            
        except Exception as e:
            logger.error(f"Twilio message status check failed: {str(e)}")
            return {'success': False, 'error': str(e)}

class AfricasTalkingSMSProvider(SMSProvider):
    """Africa's Talking SMS provider implementation"""
    
    def __init__(self):
        super().__init__()
        if SMSConfig.AT_USERNAME and SMSConfig.AT_API_KEY:
            africastalking.initialize(SMSConfig.AT_USERNAME, SMSConfig.AT_API_KEY)
            self.sms = AT_SMS()
        else:
            self.sms = None
            logger.warning("Africa's Talking credentials not configured")
    
    def send_sms(self, phone_number: str, message: str) -> Dict[str, Any]:
        """Send SMS using Africa's Talking"""
        try:
            if not self.sms:
                return {'success': False, 'error': "Africa's Talking not configured"}
            
            # Normalize phone number
            normalized_number = self.normalize_phone_number(phone_number)
            
            # Send SMS
            response = self.sms.send(message, [normalized_number], SMSConfig.AT_SENDER_ID)
            
            return {
                'success': True,
                'message_id': response['SMSMessageData']['Recipients'][0]['messageId'],
                'status': response['SMSMessageData']['Recipients'][0]['status'],
                'provider': 'africas_talking'
            }
            
        except Exception as e:
            logger.error(f"Africa's Talking SMS sending failed: {str(e)}")
            return {'success': False, 'error': str(e)}

class SMSVerificationManager:
    """Main SMS verification manager"""
    
    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            db=7,
            decode_responses=True
        )
        
        # Initialize SMS providers
        self.providers = []
        
        # Add Twilio provider
        twilio_provider = TwilioSMSProvider()
        if twilio_provider.client:
            self.providers.append(twilio_provider)
        
        # Add Africa's Talking provider
        at_provider = AfricasTalkingSMSProvider()
        if at_provider.sms:
            self.providers.append(at_provider)
        
        if not self.providers:
            logger.warning("No SMS providers configured")
    
    def send_verification_code(self, phone_number: str, verification_type: str = "signup", 
                              user_id: str = None) -> Dict[str, Any]:
        """Send verification code via SMS"""
        try:
            # Validate phone number
            if not self._validate_phone_number(phone_number):
                return {'success': False, 'error': 'Invalid phone number format'}
            
            # Check rate limiting
            if not self._check_rate_limit(phone_number):
                return {'success': False, 'error': 'Rate limit exceeded. Please try again later.'}
            
            # Generate verification code
            verification_code = self._generate_verification_code()
            
            # Get SMS template
            template = self._get_sms_template(verification_type)
            message = template.format(
                code=verification_code,
                minutes=SMSConfig.SMS_CODE_EXPIRY_MINUTES
            )
            
            # Send SMS using available providers
            sms_result = self._send_sms_with_fallback(phone_number, message)
            
            if not sms_result['success']:
                return sms_result
            
            # Store verification code
            self._store_verification_code(phone_number, verification_code, verification_type, user_id)
            
            # Update rate limiting
            self._update_rate_limit(phone_number)
            
            return {
                'success': True,
                'message': 'Verification code sent successfully',
                'expires_in_minutes': SMSConfig.SMS_CODE_EXPIRY_MINUTES,
                'attempts_remaining': SMSConfig.MAX_ATTEMPTS
            }
            
        except Exception as e:
            logger.error(f"SMS verification sending failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def verify_code(self, phone_number: str, code: str, verification_type: str = "signup") -> Dict[str, Any]:
        """Verify SMS code"""
        try:
            # Validate inputs
            if not self._validate_phone_number(phone_number):
                return {'success': False, 'error': 'Invalid phone number format'}
            
            if not code or len(code) != SMSConfig.SMS_CODE_LENGTH:
                return {'success': False, 'error': 'Invalid verification code format'}
            
            # Get stored verification data
            verification_data = self._get_verification_data(phone_number, verification_type)
            
            if not verification_data:
                return {'success': False, 'error': 'No verification code found or expired'}
            
            # Check attempts
            if verification_data['attempts'] >= SMSConfig.MAX_ATTEMPTS:
                return {'success': False, 'error': 'Maximum verification attempts exceeded'}
            
            # Check expiry
            if datetime.utcnow() > verification_data['expires_at']:
                return {'success': False, 'error': 'Verification code expired'}
            
            # Verify code
            if verification_data['code'] == code:
                # Mark as verified
                self._mark_as_verified(phone_number, verification_type)
                
                return {
                    'success': True,
                    'message': 'Verification successful',
                    'verified_at': datetime.utcnow().isoformat()
                }
            else:
                # Increment attempts
                self._increment_attempts(phone_number, verification_type)
                
                remaining_attempts = SMSConfig.MAX_ATTEMPTS - (verification_data['attempts'] + 1)
                
                return {
                    'success': False,
                    'error': 'Invalid verification code',
                    'attempts_remaining': remaining_attempts
                }
            
        except Exception as e:
            logger.error(f"SMS verification failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def resend_verification_code(self, phone_number: str, verification_type: str = "signup") -> Dict[str, Any]:
        """Resend verification code"""
        try:
            # Check if resend is allowed
            if not self._can_resend_code(phone_number, verification_type):
                return {'success': False, 'error': 'Resend not allowed. Please wait before requesting a new code.'}
            
            # Send new verification code
            return self.send_verification_code(phone_number, verification_type)
            
        except Exception as e:
            logger.error(f"SMS resend failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def check_verification_status(self, phone_number: str, verification_type: str = "signup") -> Dict[str, Any]:
        """Check verification status"""
        try:
            verification_data = self._get_verification_data(phone_number, verification_type)
            
            if not verification_data:
                return {
                    'verified': False,
                    'status': 'no_code',
                    'message': 'No verification code found'
                }
            
            if verification_data.get('verified', False):
                return {
                    'verified': True,
                    'status': 'verified',
                    'verified_at': verification_data.get('verified_at'),
                    'message': 'Phone number is verified'
                }
            
            if datetime.utcnow() > verification_data['expires_at']:
                return {
                    'verified': False,
                    'status': 'expired',
                    'message': 'Verification code expired'
                }
            
            if verification_data['attempts'] >= SMSConfig.MAX_ATTEMPTS:
                return {
                    'verified': False,
                    'status': 'max_attempts',
                    'message': 'Maximum verification attempts exceeded'
                }
            
            return {
                'verified': False,
                'status': 'pending',
                'attempts_remaining': SMSConfig.MAX_ATTEMPTS - verification_data['attempts'],
                'expires_at': verification_data['expires_at'].isoformat(),
                'message': 'Verification code is pending'
            }
            
        except Exception as e:
            logger.error(f"Verification status check failed: {str(e)}")
            return {'error': str(e)}
    
    def _validate_phone_number(self, phone_number: str) -> bool:
        """Validate phone number format"""
        if not phone_number:
            return False
        
        # Basic validation for Kenyan phone numbers
        import re
        kenyan_pattern = r'^(\+254|254|0)?[17]\d{8}$'
        return bool(re.match(kenyan_pattern, phone_number))
    
    def _generate_verification_code(self) -> str:
        """Generate random verification code"""
        return str(secrets.randbelow(10**SMSConfig.SMS_CODE_LENGTH)).zfill(SMSConfig.SMS_CODE_LENGTH)
    
    def _get_sms_template(self, verification_type: str) -> str:
        """Get SMS template for verification type"""
        templates = {
            'signup': SMSConfig.VERIFICATION_TEMPLATE,
            'reset_password': SMSConfig.RESET_PASSWORD_TEMPLATE,
            'login': SMSConfig.LOGIN_VERIFICATION_TEMPLATE,
            'transaction': SMSConfig.TRANSACTION_VERIFICATION_TEMPLATE
        }
        return templates.get(verification_type, SMSConfig.VERIFICATION_TEMPLATE)
    
    def _send_sms_with_fallback(self, phone_number: str, message: str) -> Dict[str, Any]:
        """Send SMS with provider fallback"""
        if not self.providers:
            return {'success': False, 'error': 'No SMS providers available'}
        
        # Try each provider until one succeeds
        for provider in self.providers:
            result = provider.send_sms(phone_number, message)
            if result['success']:
                return result
        
        return {'success': False, 'error': 'All SMS providers failed'}
    
    def _store_verification_code(self, phone_number: str, code: str, verification_type: str, user_id: str = None):
        """Store verification code in Redis"""
        try:
            key = f"sms_verification:{phone_number}:{verification_type}"
            
            verification_data = {
                'code': code,
                'created_at': datetime.utcnow().isoformat(),
                'expires_at': (datetime.utcnow() + timedelta(minutes=SMSConfig.SMS_CODE_EXPIRY_MINUTES)).isoformat(),
                'attempts': 0,
                'verified': False,
                'user_id': user_id,
                'verification_type': verification_type
            }
            
            # Store with expiry
            self.redis_client.setex(key, SMSConfig.SMS_CODE_EXPIRY_MINUTES * 60, json.dumps(verification_data))
            
        except Exception as e:
            logger.error(f"Verification code storage failed: {str(e)}")
    
    def _get_verification_data(self, phone_number: str, verification_type: str) -> Optional[Dict[str, Any]]:
        """Get verification data from Redis"""
        try:
            key = f"sms_verification:{phone_number}:{verification_type}"
            data = self.redis_client.get(key)
            
            if data:
                verification_data = json.loads(data)
                # Convert string dates back to datetime objects
                verification_data['expires_at'] = datetime.fromisoformat(verification_data['expires_at'])
                return verification_data
            
            return None
            
        except Exception as e:
            logger.error(f"Verification data retrieval failed: {str(e)}")
            return None
    
    def _mark_as_verified(self, phone_number: str, verification_type: str):
        """Mark phone number as verified"""
        try:
            key = f"sms_verification:{phone_number}:{verification_type}"
            data = self.redis_client.get(key)
            
            if data:
                verification_data = json.loads(data)
                verification_data['verified'] = True
                verification_data['verified_at'] = datetime.utcnow().isoformat()
                
                # Store for longer period when verified
                self.redis_client.setex(key, 86400, json.dumps(verification_data))  # 24 hours
                
        except Exception as e:
            logger.error(f"Verification marking failed: {str(e)}")
    
    def _increment_attempts(self, phone_number: str, verification_type: str):
        """Increment verification attempts"""
        try:
            key = f"sms_verification:{phone_number}:{verification_type}"
            data = self.redis_client.get(key)
            
            if data:
                verification_data = json.loads(data)
                verification_data['attempts'] += 1
                
                # Recalculate expiry
                expires_at = datetime.fromisoformat(verification_data['expires_at'])
                remaining_seconds = (expires_at - datetime.utcnow()).total_seconds()
                
                if remaining_seconds > 0:
                    self.redis_client.setex(key, int(remaining_seconds), json.dumps(verification_data))
                
        except Exception as e:
            logger.error(f"Attempt increment failed: {str(e)}")
    
    def _check_rate_limit(self, phone_number: str) -> bool:
        """Check if phone number is within rate limits"""
        try:
            key = f"sms_rate_limit:{phone_number}"
            current_count = self.redis_client.get(key)
            
            if current_count is None:
                return True
            
            return int(current_count) < SMSConfig.MAX_SMS_PER_WINDOW
            
        except Exception as e:
            logger.error(f"Rate limit check failed: {str(e)}")
            return True  # Allow if check fails
    
    def _update_rate_limit(self, phone_number: str):
        """Update rate limiting for phone number"""
        try:
            key = f"sms_rate_limit:{phone_number}"
            current_count = self.redis_client.get(key)
            
            if current_count is None:
                self.redis_client.setex(key, SMSConfig.RATE_LIMIT_WINDOW_MINUTES * 60, 1)
            else:
                self.redis_client.incr(key)
                
        except Exception as e:
            logger.error(f"Rate limit update failed: {str(e)}")
    
    def _can_resend_code(self, phone_number: str, verification_type: str) -> bool:
        """Check if resend is allowed"""
        try:
            verification_data = self._get_verification_data(phone_number, verification_type)
            
            if not verification_data:
                return True
            
            # Check if enough time has passed since last send
            created_at = datetime.fromisoformat(verification_data['created_at'])
            time_since_creation = datetime.utcnow() - created_at
            
            # Allow resend after 2 minutes
            return time_since_creation.total_seconds() > 120
            
        except Exception as e:
            logger.error(f"Resend check failed: {str(e)}")
            return True  # Allow if check fails

class SMSAnalytics:
    """SMS analytics and monitoring"""
    
    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            db=7,
            decode_responses=True
        )
    
    def track_sms_sent(self, phone_number: str, verification_type: str, provider: str, success: bool):
        """Track SMS sending events"""
        try:
            event_data = {
                'phone_number': phone_number,
                'verification_type': verification_type,
                'provider': provider,
                'success': success,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Store in Redis with TTL
            key = f"sms_analytics:{datetime.utcnow().strftime('%Y%m%d')}"
            self.redis_client.lpush(key, json.dumps(event_data))
            self.redis_client.expire(key, 86400 * 30)  # Keep for 30 days
            
        except Exception as e:
            logger.error(f"SMS analytics tracking failed: {str(e)}")
    
    def get_sms_statistics(self, date: str = None) -> Dict[str, Any]:
        """Get SMS statistics for a specific date"""
        try:
            if not date:
                date = datetime.utcnow().strftime('%Y%m%d')
            
            key = f"sms_analytics:{date}"
            events = self.redis_client.lrange(key, 0, -1)
            
            total_sent = len(events)
            successful_sends = 0
            failed_sends = 0
            provider_stats = {}
            type_stats = {}
            
            for event_json in events:
                event = json.loads(event_json)
                
                if event['success']:
                    successful_sends += 1
                else:
                    failed_sends += 1
                
                # Provider statistics
                provider = event['provider']
                if provider not in provider_stats:
                    provider_stats[provider] = {'sent': 0, 'successful': 0, 'failed': 0}
                provider_stats[provider]['sent'] += 1
                if event['success']:
                    provider_stats[provider]['successful'] += 1
                else:
                    provider_stats[provider]['failed'] += 1
                
                # Type statistics
                verification_type = event['verification_type']
                if verification_type not in type_stats:
                    type_stats[verification_type] = 0
                type_stats[verification_type] += 1
            
            return {
                'date': date,
                'total_sent': total_sent,
                'successful_sends': successful_sends,
                'failed_sends': failed_sends,
                'success_rate': (successful_sends / total_sent * 100) if total_sent > 0 else 0,
                'provider_stats': provider_stats,
                'type_stats': type_stats
            }
            
        except Exception as e:
            logger.error(f"SMS statistics retrieval failed: {str(e)}")
            return {'error': str(e)}

# Global SMS verification manager
sms_verification_manager = SMSVerificationManager()
sms_analytics = SMSAnalytics()
