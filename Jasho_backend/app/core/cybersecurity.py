"""
Cybersecurity Layer for Jasho Financial App
Implements balance masking, transaction security, and comprehensive security protocols
"""

import os
import hashlib
import hmac
import secrets
import time
from typing import Dict, Any, Optional, List, Tuple
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from argon2 import PasswordHasher
import jwt
import logging
from datetime import datetime, timedelta
import redis
import json

logger = logging.getLogger(__name__)

class SecurityConfig:
    """Security configuration and constants"""
    
    # Encryption keys (in production, these should be in environment variables)
    ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", Fernet.generate_key())
    JWT_SECRET = os.getenv("JWT_SECRET", secrets.token_urlsafe(32))
    JWT_ALGORITHM = "HS256"
    JWT_EXPIRATION = 3600  # 1 hour
    
    # Security settings
    MAX_LOGIN_ATTEMPTS = 5
    LOCKOUT_DURATION = 900  # 15 minutes
    SESSION_TIMEOUT = 1800  # 30 minutes
    
    # Balance masking settings
    MASK_CHAR = "*"
    VISIBLE_DIGITS = 4
    MASK_PATTERN = "****"

class BalanceMasker:
    """Handles balance masking and display security"""
    
    def __init__(self):
        self.fernet = Fernet(SecurityConfig.ENCRYPTION_KEY)
    
    def mask_balance(self, balance: float, user_id: str) -> Dict[str, Any]:
        """Mask balance for display with security features"""
        try:
            # Encrypt the actual balance
            encrypted_balance = self.fernet.encrypt(str(balance).encode())
            
            # Create masked display
            balance_str = f"{balance:.2f}"
            if len(balance_str) <= SecurityConfig.VISIBLE_DIGITS:
                masked_display = SecurityConfig.MASK_PATTERN
            else:
                # Show last few digits
                visible_part = balance_str[-SecurityConfig.VISIBLE_DIGITS:]
                masked_display = SecurityConfig.MASK_PATTERN + visible_part
            
            return {
                "encrypted_balance": encrypted_balance.decode(),
                "masked_display": masked_display,
                "currency": "KES",
                "last_updated": datetime.utcnow().isoformat(),
                "security_level": "high"
            }
        except Exception as e:
            logger.error(f"Balance masking failed: {str(e)}")
            return {"error": "Balance masking failed"}
    
    def unmask_balance(self, encrypted_balance: str, user_id: str) -> Optional[float]:
        """Unmask balance for authorized operations"""
        try:
            decrypted = self.fernet.decrypt(encrypted_balance.encode())
            return float(decrypted.decode())
        except Exception as e:
            logger.error(f"Balance unmasking failed: {str(e)}")
            return None
    
    def generate_balance_token(self, user_id: str, amount: float) -> str:
        """Generate a secure token for balance operations"""
        payload = {
            "user_id": user_id,
            "amount": amount,
            "timestamp": time.time(),
            "nonce": secrets.token_hex(16)
        }
        return jwt.encode(payload, SecurityConfig.JWT_SECRET, algorithm=SecurityConfig.JWT_ALGORITHM)

class TransactionSecurity:
    """Handles transaction security and validation"""
    
    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            db=0,
            decode_responses=True
        )
    
    def validate_transaction(self, transaction_data: Dict[str, Any]) -> Tuple[bool, str]:
        """Validate transaction for security threats"""
        try:
            # Check for suspicious patterns
            if self._detect_suspicious_pattern(transaction_data):
                return False, "Suspicious transaction pattern detected"
            
            # Validate amount
            if not self._validate_amount(transaction_data.get("amount", 0)):
                return False, "Invalid transaction amount"
            
            # Check rate limiting
            if not self._check_rate_limit(transaction_data.get("user_id")):
                return False, "Transaction rate limit exceeded"
            
            # Validate transaction type
            if not self._validate_transaction_type(transaction_data.get("type")):
                return False, "Invalid transaction type"
            
            return True, "Transaction validated"
            
        except Exception as e:
            logger.error(f"Transaction validation failed: {str(e)}")
            return False, "Transaction validation failed"
    
    def _detect_suspicious_pattern(self, transaction_data: Dict[str, Any]) -> bool:
        """Detect suspicious transaction patterns"""
        user_id = transaction_data.get("user_id")
        amount = transaction_data.get("amount", 0)
        
        # Check for rapid successive transactions
        recent_transactions = self._get_recent_transactions(user_id, minutes=5)
        if len(recent_transactions) > 10:
            return True
        
        # Check for unusually large amounts
        if amount > 1000000:  # 1M KES threshold
            return True
        
        # Check for round number patterns (potential testing)
        if amount % 1000 == 0 and amount > 10000:
            return True
        
        return False
    
    def _validate_amount(self, amount: float) -> bool:
        """Validate transaction amount"""
        return 0 < amount <= 10000000  # Max 10M KES
    
    def _check_rate_limit(self, user_id: str) -> bool:
        """Check transaction rate limiting"""
        key = f"tx_rate_limit:{user_id}"
        current_count = self.redis_client.get(key)
        
        if current_count is None:
            self.redis_client.setex(key, 300, 1)  # 5 minutes
            return True
        
        if int(current_count) >= 20:  # Max 20 transactions per 5 minutes
            return False
        
        self.redis_client.incr(key)
        return True
    
    def _validate_transaction_type(self, tx_type: str) -> bool:
        """Validate transaction type"""
        valid_types = ["deposit", "withdrawal", "transfer", "payment", "loan", "savings"]
        return tx_type in valid_types
    
    def _get_recent_transactions(self, user_id: str, minutes: int = 5) -> List[Dict]:
        """Get recent transactions for pattern analysis"""
        # This would typically query the database
        # For now, return empty list
        return []
    
    def lock_transaction_history(self, user_id: str, reason: str = "security") -> bool:
        """Lock transaction history download for security"""
        try:
            lock_data = {
                "user_id": user_id,
                "locked_at": datetime.utcnow().isoformat(),
                "reason": reason,
                "locked_by": "security_system"
            }
            
            key = f"tx_history_lock:{user_id}"
            self.redis_client.setex(key, 3600, json.dumps(lock_data))  # 1 hour lock
            
            logger.info(f"Transaction history locked for user {user_id}: {reason}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to lock transaction history: {str(e)}")
            return False
    
    def unlock_transaction_history(self, user_id: str) -> bool:
        """Unlock transaction history"""
        try:
            key = f"tx_history_lock:{user_id}"
            self.redis_client.delete(key)
            logger.info(f"Transaction history unlocked for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to unlock transaction history: {str(e)}")
            return False

class DocumentSecurity:
    """Handles document scanning and security validation"""
    
    def __init__(self):
        self.malware_signatures = self._load_malware_signatures()
        self.safe_extensions = {'.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'}
    
    def scan_document(self, file_path: str, file_content: bytes) -> Dict[str, Any]:
        """Scan document for security threats"""
        try:
            scan_result = {
                "safe": True,
                "threats": [],
                "recommendations": []
            }
            
            # Check file extension
            if not self._check_file_extension(file_path):
                scan_result["safe"] = False
                scan_result["threats"].append("Unsafe file extension")
            
            # Check file size
            if len(file_content) > 10 * 1024 * 1024:  # 10MB limit
                scan_result["safe"] = False
                scan_result["threats"].append("File too large")
            
            # Check for malware signatures
            malware_detected = self._scan_for_malware(file_content)
            if malware_detected:
                scan_result["safe"] = False
                scan_result["threats"].extend(malware_detected)
            
            # Check for suspicious content
            suspicious_content = self._check_suspicious_content(file_content)
            if suspicious_content:
                scan_result["threats"].extend(suspicious_content)
            
            return scan_result
            
        except Exception as e:
            logger.error(f"Document scanning failed: {str(e)}")
            return {"safe": False, "threats": ["Scanning failed"], "recommendations": []}
    
    def _check_file_extension(self, file_path: str) -> bool:
        """Check if file extension is safe"""
        ext = os.path.splitext(file_path)[1].lower()
        return ext in self.safe_extensions
    
    def _scan_for_malware(self, content: bytes) -> List[str]:
        """Scan for malware signatures"""
        threats = []
        
        # Simple signature-based detection
        for signature, threat_name in self.malware_signatures.items():
            if signature in content:
                threats.append(f"Malware detected: {threat_name}")
        
        return threats
    
    def _check_suspicious_content(self, content: bytes) -> List[str]:
        """Check for suspicious content patterns"""
        threats = []
        
        # Check for executable patterns
        if b'\x4d\x5a' in content:  # PE executable signature
            threats.append("Executable file detected")
        
        # Check for script patterns
        if b'<script' in content.lower() or b'javascript:' in content.lower():
            threats.append("Script content detected")
        
        return threats
    
    def _load_malware_signatures(self) -> Dict[bytes, str]:
        """Load malware signatures for detection"""
        # In production, this would load from a database or file
        return {
            b'malware_signature_1': 'Trojan.Generic',
            b'malware_signature_2': 'Virus.Win32',
            # Add more signatures as needed
        }

class URLSecurity:
    """Handles URL and QR code security validation"""
    
    def __init__(self):
        self.malicious_domains = self._load_malicious_domains()
        self.safe_domains = self._load_safe_domains()
    
    def validate_url(self, url: str) -> Dict[str, Any]:
        """Validate URL for security threats"""
        try:
            result = {
                "safe": True,
                "threats": [],
                "domain_reputation": "unknown",
                "recommendations": []
            }
            
            # Parse URL
            from urllib.parse import urlparse
            parsed = urlparse(url)
            
            # Check domain reputation
            domain_reputation = self._check_domain_reputation(parsed.netloc)
            result["domain_reputation"] = domain_reputation
            
            if domain_reputation == "malicious":
                result["safe"] = False
                result["threats"].append("Malicious domain detected")
            
            # Check for suspicious patterns
            suspicious_patterns = self._check_suspicious_patterns(url)
            if suspicious_patterns:
                result["threats"].extend(suspicious_patterns)
                result["safe"] = False
            
            # Check SSL certificate
            if parsed.scheme == "https":
                ssl_valid = self._check_ssl_certificate(parsed.netloc)
                if not ssl_valid:
                    result["threats"].append("Invalid SSL certificate")
                    result["safe"] = False
            
            return result
            
        except Exception as e:
            logger.error(f"URL validation failed: {str(e)}")
            return {"safe": False, "threats": ["URL validation failed"], "recommendations": []}
    
    def validate_qr_code(self, qr_data: str) -> Dict[str, Any]:
        """Validate QR code content for security"""
        try:
            result = {
                "safe": True,
                "threats": [],
                "content_type": "unknown",
                "recommendations": []
            }
            
            # Check if it's a URL
            if qr_data.startswith(('http://', 'https://')):
                url_result = self.validate_url(qr_data)
                result.update(url_result)
                result["content_type"] = "url"
            
            # Check for other suspicious patterns
            elif qr_data.startswith('javascript:'):
                result["safe"] = False
                result["threats"].append("JavaScript code detected")
                result["content_type"] = "javascript"
            
            elif qr_data.startswith('data:'):
                result["safe"] = False
                result["threats"].append("Data URI detected")
                result["content_type"] = "data_uri"
            
            return result
            
        except Exception as e:
            logger.error(f"QR code validation failed: {str(e)}")
            return {"safe": False, "threats": ["QR code validation failed"], "recommendations": []}
    
    def _check_domain_reputation(self, domain: str) -> str:
        """Check domain reputation"""
        if domain in self.malicious_domains:
            return "malicious"
        elif domain in self.safe_domains:
            return "safe"
        else:
            return "unknown"
    
    def _check_suspicious_patterns(self, url: str) -> List[str]:
        """Check for suspicious URL patterns"""
        threats = []
        
        # Check for IP addresses (potential phishing)
        import re
        ip_pattern = r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b'
        if re.search(ip_pattern, url):
            threats.append("IP address in URL (potential phishing)")
        
        # Check for suspicious subdomains
        suspicious_subdomains = ['secure', 'login', 'account', 'verify']
        for subdomain in suspicious_subdomains:
            if f'.{subdomain}.' in url.lower():
                threats.append(f"Suspicious subdomain: {subdomain}")
        
        return threats
    
    def _check_ssl_certificate(self, domain: str) -> bool:
        """Check SSL certificate validity"""
        try:
            import ssl
            import socket
            
            context = ssl.create_default_context()
            with socket.create_connection((domain, 443), timeout=10) as sock:
                with context.wrap_socket(sock, server_hostname=domain) as ssock:
                    cert = ssock.getpeercert()
                    return cert is not None
        except:
            return False
    
    def _load_malicious_domains(self) -> set:
        """Load list of known malicious domains"""
        # In production, this would load from a threat intelligence feed
        return {
            'malicious-site.com',
            'phishing-example.org',
            # Add more malicious domains
        }
    
    def _load_safe_domains(self) -> set:
        """Load list of known safe domains"""
        return {
            'google.com',
            'facebook.com',
            'twitter.com',
            'github.com',
            # Add more safe domains
        }

class SecurityManager:
    """Main security manager that coordinates all security features"""
    
    def __init__(self):
        self.balance_masker = BalanceMasker()
        self.transaction_security = TransactionSecurity()
        self.document_security = DocumentSecurity()
        self.url_security = URLSecurity()
        self.password_hasher = PasswordHasher()
    
    def secure_balance_display(self, balance: float, user_id: str) -> Dict[str, Any]:
        """Securely display balance with masking"""
        return self.balance_masker.mask_balance(balance, user_id)
    
    def validate_transaction(self, transaction_data: Dict[str, Any]) -> Tuple[bool, str]:
        """Validate transaction security"""
        return self.transaction_security.validate_transaction(transaction_data)
    
    def scan_document(self, file_path: str, file_content: bytes) -> Dict[str, Any]:
        """Scan document for security threats"""
        return self.document_security.scan_document(file_path, file_content)
    
    def validate_url(self, url: str) -> Dict[str, Any]:
        """Validate URL security"""
        return self.url_security.validate_url(url)
    
    def validate_qr_code(self, qr_data: str) -> Dict[str, Any]:
        """Validate QR code security"""
        return self.url_security.validate_qr_code(qr_data)
    
    def hash_password(self, password: str) -> str:
        """Hash password securely"""
        return self.password_hasher.hash(password)
    
    def verify_password(self, password: str, hashed: str) -> bool:
        """Verify password against hash"""
        try:
            self.password_hasher.verify(hashed, password)
            return True
        except:
            return False

# Global security manager instance
security_manager = SecurityManager()
