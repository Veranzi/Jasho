"""
Firebase Configuration and Authentication
Handles Firebase initialization, authentication, and user management
"""

import os
import json
from typing import Optional, Dict, Any
from firebase_admin import credentials, initialize_app, auth as firebase_auth, db
from firebase_admin.exceptions import FirebaseError
import pyrebase
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

class FirebaseConfig:
    """Firebase configuration and authentication manager"""
    
    def __init__(self):
        self.firebase_app = None
        self.pyrebase_app = None
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK and Pyrebase"""
        try:
            # Try to load from JSON file first
            service_account_path = os.path.join(os.path.dirname(__file__), '..', '..', 'firebase-service-account.json')
            
            if os.path.exists(service_account_path):
                logger.info("Loading Firebase credentials from service account file")
                cred = credentials.Certificate(service_account_path)
                with open(service_account_path, 'r') as f:
                    firebase_config = json.load(f)
            else:
                # Fallback to environment variables
                logger.info("Loading Firebase credentials from environment variables")
                firebase_config = {
                    "type": "service_account",
                    "project_id": os.getenv("FIREBASE_PROJECT_ID", "jasho-dad1b"),
                    "private_key_id": os.getenv("FIREBASE_PRIVATE_KEY_ID"),
                    "private_key": os.getenv("FIREBASE_PRIVATE_KEY", "").replace('\\n', '\n'),
                    "client_email": os.getenv("FIREBASE_CLIENT_EMAIL"),
                    "client_id": os.getenv("FIREBASE_CLIENT_ID"),
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                    "client_x509_cert_url": os.getenv("FIREBASE_CLIENT_CERT_URL")
                }
                
                # Initialize Firebase Admin SDK
                if not firebase_config["private_key"]:
                    logger.warning("Firebase private key not found, using default credentials")
                    cred = credentials.ApplicationDefault()
                else:
                    cred = credentials.Certificate(firebase_config)
            
            self.firebase_app = initialize_app(cred, {
                'databaseURL': os.getenv("FIREBASE_DATABASE_URL", "https://jasho-dad1b-default-rtdb.firebaseio.com/")
            })
            
            # Initialize Pyrebase for client-side operations
            pyrebase_config = {
                "apiKey": os.getenv("FIREBASE_API_KEY"),
                "authDomain": f"{firebase_config['project_id']}.firebaseapp.com",
                "databaseURL": os.getenv("FIREBASE_DATABASE_URL"),
                "projectId": firebase_config['project_id'],
                "storageBucket": f"{firebase_config['project_id']}.appspot.com",
                "messagingSenderId": os.getenv("FIREBASE_MESSAGING_SENDER_ID"),
                "appId": os.getenv("FIREBASE_APP_ID")
            }
            
            self.pyrebase_app = pyrebase.initialize_app(pyrebase_config)
            
            logger.info("Firebase initialized successfully")
            
        except Exception as e:
            logger.error(f"Firebase initialization failed: {str(e)}")
            raise
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify Firebase ID token and return user data"""
        try:
            decoded_token = firebase_auth.verify_id_token(token)
            return decoded_token
        except FirebaseError as e:
            logger.error(f"Token verification failed: {str(e)}")
            return None
    
    def create_user(self, email: str, password: str, display_name: str = None) -> Optional[Dict[str, Any]]:
        """Create a new Firebase user"""
        try:
            user = firebase_auth.create_user(
                email=email,
                password=password,
                display_name=display_name
            )
            return {
                "uid": user.uid,
                "email": user.email,
                "display_name": user.display_name,
                "email_verified": user.email_verified
            }
        except FirebaseError as e:
            logger.error(f"User creation failed: {str(e)}")
            return None
    
    def update_user(self, uid: str, **kwargs) -> bool:
        """Update Firebase user data"""
        try:
            firebase_auth.update_user(uid, **kwargs)
            return True
        except FirebaseError as e:
            logger.error(f"User update failed: {str(e)}")
            return False
    
    def delete_user(self, uid: str) -> bool:
        """Delete Firebase user"""
        try:
            firebase_auth.delete_user(uid)
            return True
        except FirebaseError as e:
            logger.error(f"User deletion failed: {str(e)}")
            return False
    
    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        try:
            user = firebase_auth.get_user_by_email(email)
            return {
                "uid": user.uid,
                "email": user.email,
                "display_name": user.display_name,
                "email_verified": user.email_verified
            }
        except FirebaseError as e:
            logger.error(f"Get user by email failed: {str(e)}")
            return None
    
    def send_email_verification(self, uid: str) -> bool:
        """Send email verification"""
        try:
            user = firebase_auth.get_user(uid)
            if not user.email_verified:
                # Generate email verification link
                action_code_settings = firebase_auth.ActionCodeSettings(
                    url=f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/verify-email",
                    handle_code_in_app=True
                )
                link = firebase_auth.generate_email_verification_link(
                    user.email, action_code_settings
                )
                # In production, send this link via email service
                logger.info(f"Email verification link: {link}")
                return True
            return False
        except FirebaseError as e:
            logger.error(f"Email verification failed: {str(e)}")
            return False
    
    def send_password_reset(self, email: str) -> bool:
        """Send password reset email"""
        try:
            action_code_settings = firebase_auth.ActionCodeSettings(
                url=f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/reset-password",
                handle_code_in_app=True
            )
            link = firebase_auth.generate_password_reset_link(
                email, action_code_settings
            )
            # In production, send this link via email service
            logger.info(f"Password reset link: {link}")
            return True
        except FirebaseError as e:
            logger.error(f"Password reset failed: {str(e)}")
            return False
    
    def get_custom_token(self, uid: str, additional_claims: Dict[str, Any] = None) -> Optional[str]:
        """Generate custom token for user"""
        try:
            token = firebase_auth.create_custom_token(uid, additional_claims)
            return token.decode('utf-8')
        except FirebaseError as e:
            logger.error(f"Custom token creation failed: {str(e)}")
            return None

# Global Firebase instance
firebase_config = FirebaseConfig()

class UserProfile(BaseModel):
    """User profile model for Firebase integration"""
    uid: str
    email: str
    display_name: Optional[str] = None
    phone_number: Optional[str] = None
    email_verified: bool = False
    photo_url: Optional[str] = None
    created_at: Optional[str] = None
    last_sign_in: Optional[str] = None
    custom_claims: Optional[Dict[str, Any]] = None

class AuthResponse(BaseModel):
    """Authentication response model"""
    success: bool
    message: str
    user: Optional[UserProfile] = None
    token: Optional[str] = None
    refresh_token: Optional[str] = None
