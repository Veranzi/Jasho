"""
Document Security and Scanning System
Handles safe scanning of documents, URL validation, and QR code security
"""

import os
import io
import hashlib
import magic
import yara
import cv2
import numpy as np
from typing import Dict, Any, List, Optional, Tuple
from PIL import Image
import pytesseract
from pyzbar import pyzbar
import qrcode
import requests
from urllib.parse import urlparse, urljoin
import dns.resolver
import ssl
import socket
import logging
from datetime import datetime
import redis
import json
import re
from bs4 import BeautifulSoup
import clamd

logger = logging.getLogger(__name__)

class DocumentScanner:
    """Handles document scanning and security validation"""
    
    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            db=2,
            decode_responses=True
        )
        
        # Initialize ClamAV for malware scanning
        try:
            self.clamd_client = clamd.ClamdUnixSocket()
        except:
            self.clamd_client = None
            logger.warning("ClamAV not available, using fallback scanning")
        
        # Load YARA rules for malware detection
        self.yara_rules = self._load_yara_rules()
        
        # Safe file extensions
        self.safe_extensions = {
            '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff',
            '.doc', '.docx', '.txt', '.rtf', '.odt',
            '.xls', '.xlsx', '.csv', '.ods'
        }
        
        # Maximum file sizes (in bytes)
        self.max_file_sizes = {
            '.pdf': 10 * 1024 * 1024,  # 10MB
            '.jpg': 5 * 1024 * 1024,   # 5MB
            '.jpeg': 5 * 1024 * 1024,  # 5MB
            '.png': 5 * 1024 * 1024,   # 5MB
            '.doc': 10 * 1024 * 1024,  # 10MB
            '.docx': 10 * 1024 * 1024, # 10MB
            '.txt': 1 * 1024 * 1024,   # 1MB
        }
    
    def scan_document(self, file_path: str, file_content: bytes, user_id: str) -> Dict[str, Any]:
        """Comprehensive document security scan"""
        try:
            scan_result = {
                "safe": True,
                "threats": [],
                "warnings": [],
                "recommendations": [],
                "file_info": {},
                "scan_timestamp": datetime.utcnow().isoformat()
            }
            
            # Basic file information
            file_info = self._get_file_info(file_path, file_content)
            scan_result["file_info"] = file_info
            
            # Check file extension
            if not self._check_file_extension(file_path):
                scan_result["safe"] = False
                scan_result["threats"].append("Unsafe file extension")
            
            # Check file size
            if not self._check_file_size(file_path, len(file_content)):
                scan_result["safe"] = False
                scan_result["threats"].append("File size exceeds limit")
            
            # Check file type consistency
            if not self._check_file_type_consistency(file_path, file_content):
                scan_result["warnings"].append("File type mismatch detected")
            
            # Malware scanning
            malware_result = self._scan_for_malware(file_content)
            if malware_result["threats"]:
                scan_result["safe"] = False
                scan_result["threats"].extend(malware_result["threats"])
            
            # Content analysis
            content_result = self._analyze_content(file_content, file_info["mime_type"])
            if content_result["threats"]:
                scan_result["safe"] = False
                scan_result["threats"].extend(content_result["threats"])
            
            if content_result["warnings"]:
                scan_result["warnings"].extend(content_result["warnings"])
            
            # OCR text extraction and analysis
            if file_info["mime_type"].startswith("image/"):
                ocr_result = self._extract_and_analyze_text(file_content)
                if ocr_result["threats"]:
                    scan_result["safe"] = False
                    scan_result["threats"].extend(ocr_result["threats"])
            
            # Generate recommendations
            scan_result["recommendations"] = self._generate_recommendations(scan_result)
            
            # Cache scan result
            self._cache_scan_result(file_path, scan_result, user_id)
            
            return scan_result
            
        except Exception as e:
            logger.error(f"Document scanning failed: {str(e)}")
            return {
                "safe": False,
                "threats": ["Scanning failed"],
                "warnings": [],
                "recommendations": ["Contact support"],
                "error": str(e)
            }
    
    def _get_file_info(self, file_path: str, file_content: bytes) -> Dict[str, Any]:
        """Get comprehensive file information"""
        try:
            # File extension
            file_ext = os.path.splitext(file_path)[1].lower()
            
            # MIME type detection
            mime_type = magic.from_buffer(file_content, mime=True)
            
            # File size
            file_size = len(file_content)
            
            # File hash
            file_hash = hashlib.sha256(file_content).hexdigest()
            
            return {
                "filename": os.path.basename(file_path),
                "extension": file_ext,
                "mime_type": mime_type,
                "size": file_size,
                "hash": file_hash
            }
            
        except Exception as e:
            logger.error(f"File info extraction failed: {str(e)}")
            return {}
    
    def _check_file_extension(self, file_path: str) -> bool:
        """Check if file extension is safe"""
        ext = os.path.splitext(file_path)[1].lower()
        return ext in self.safe_extensions
    
    def _check_file_size(self, file_path: str, file_size: int) -> bool:
        """Check if file size is within limits"""
        ext = os.path.splitext(file_path)[1].lower()
        max_size = self.max_file_sizes.get(ext, 5 * 1024 * 1024)  # Default 5MB
        return file_size <= max_size
    
    def _check_file_type_consistency(self, file_path: str, file_content: bytes) -> bool:
        """Check if file extension matches actual file type"""
        try:
            ext = os.path.splitext(file_path)[1].lower()
            mime_type = magic.from_buffer(file_content, mime=True)
            
            # MIME type to extension mapping
            mime_to_ext = {
                'application/pdf': '.pdf',
                'image/jpeg': '.jpg',
                'image/png': '.png',
                'image/gif': '.gif',
                'application/msword': '.doc',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
                'text/plain': '.txt'
            }
            
            expected_ext = mime_to_ext.get(mime_type)
            return expected_ext == ext
            
        except Exception as e:
            logger.error(f"File type consistency check failed: {str(e)}")
            return False
    
    def _scan_for_malware(self, file_content: bytes) -> Dict[str, Any]:
        """Scan file for malware using multiple methods"""
        result = {"threats": [], "warnings": []}
        
        try:
            # ClamAV scanning
            if self.clamd_client:
                scan_result = self.clamd_client.scan_stream(io.BytesIO(file_content))
                if scan_result:
                    for file_path, (status, virus_name) in scan_result.items():
                        if status == 'FOUND':
                            result["threats"].append(f"Malware detected: {virus_name}")
            
            # YARA rule scanning
            if self.yara_rules:
                matches = self.yara_rules.match(data=file_content)
                for match in matches:
                    result["threats"].append(f"YARA rule match: {match.rule}")
            
            # Heuristic scanning
            heuristic_threats = self._heuristic_malware_scan(file_content)
            result["threats"].extend(heuristic_threats)
            
        except Exception as e:
            logger.error(f"Malware scanning failed: {str(e)}")
            result["warnings"].append("Malware scanning unavailable")
        
        return result
    
    def _heuristic_malware_scan(self, file_content: bytes) -> List[str]:
        """Heuristic malware detection"""
        threats = []
        
        # Check for executable signatures
        if b'\x4d\x5a' in file_content:  # PE executable
            threats.append("Executable file detected")
        
        if b'\x7f\x45\x4c\x46' in file_content:  # ELF executable
            threats.append("Linux executable detected")
        
        # Check for suspicious strings
        suspicious_strings = [
            b'cmd.exe',
            b'powershell',
            b'regsvr32',
            b'rundll32',
            b'<script>',
            b'javascript:',
            b'eval(',
            b'base64_decode'
        ]
        
        for suspicious in suspicious_strings:
            if suspicious in file_content.lower():
                threats.append(f"Suspicious content: {suspicious.decode()}")
        
        return threats
    
    def _analyze_content(self, file_content: bytes, mime_type: str) -> Dict[str, Any]:
        """Analyze file content for security threats"""
        result = {"threats": [], "warnings": []}
        
        try:
            if mime_type.startswith("text/"):
                # Text file analysis
                text_content = file_content.decode('utf-8', errors='ignore')
                text_threats = self._analyze_text_content(text_content)
                result["threats"].extend(text_threats)
            
            elif mime_type == "application/pdf":
                # PDF analysis
                pdf_threats = self._analyze_pdf_content(file_content)
                result["threats"].extend(pdf_threats)
            
            elif mime_type.startswith("image/"):
                # Image analysis
                image_threats = self._analyze_image_content(file_content)
                result["threats"].extend(image_threats)
            
        except Exception as e:
            logger.error(f"Content analysis failed: {str(e)}")
            result["warnings"].append("Content analysis failed")
        
        return result
    
    def _analyze_text_content(self, text_content: str) -> List[str]:
        """Analyze text content for threats"""
        threats = []
        
        # Check for malicious URLs
        url_pattern = r'https?://[^\s<>"{}|\\^`\[\]]+'
        urls = re.findall(url_pattern, text_content)
        
        for url in urls:
            url_result = self._check_url_safety(url)
            if not url_result["safe"]:
                threats.append(f"Malicious URL detected: {url}")
        
        # Check for suspicious patterns
        suspicious_patterns = [
            r'password\s*[:=]\s*\w+',
            r'api[_-]?key\s*[:=]\s*\w+',
            r'secret\s*[:=]\s*\w+',
            r'token\s*[:=]\s*\w+'
        ]
        
        for pattern in suspicious_patterns:
            if re.search(pattern, text_content, re.IGNORECASE):
                threats.append("Sensitive information detected")
        
        return threats
    
    def _analyze_pdf_content(self, pdf_content: bytes) -> List[str]:
        """Analyze PDF content for threats"""
        threats = []
        
        # Check for JavaScript in PDF
        if b'/JavaScript' in pdf_content or b'/JS' in pdf_content:
            threats.append("JavaScript detected in PDF")
        
        # Check for embedded files
        if b'/EmbeddedFile' in pdf_content:
            threats.append("Embedded files detected in PDF")
        
        # Check for forms
        if b'/AcroForm' in pdf_content:
            threats.append("Interactive forms detected in PDF")
        
        return threats
    
    def _analyze_image_content(self, image_content: bytes) -> List[str]:
        """Analyze image content for threats"""
        threats = []
        
        try:
            # Check for steganography indicators
            image = Image.open(io.BytesIO(image_content))
            
            # Check image dimensions
            width, height = image.size
            if width > 10000 or height > 10000:
                threats.append("Unusually large image dimensions")
            
            # Check for metadata
            if hasattr(image, '_getexif') and image._getexif():
                threats.append("Metadata present in image")
            
        except Exception as e:
            logger.error(f"Image analysis failed: {str(e)}")
        
        return threats
    
    def _extract_and_analyze_text(self, image_content: bytes) -> Dict[str, Any]:
        """Extract text from image using OCR and analyze it"""
        result = {"threats": [], "warnings": []}
        
        try:
            # Extract text using OCR
            image = Image.open(io.BytesIO(image_content))
            extracted_text = pytesseract.image_to_string(image)
            
            if extracted_text.strip():
                # Analyze extracted text
                text_threats = self._analyze_text_content(extracted_text)
                result["threats"].extend(text_threats)
            
        except Exception as e:
            logger.error(f"OCR text extraction failed: {str(e)}")
            result["warnings"].append("Text extraction failed")
        
        return result
    
    def _check_url_safety(self, url: str) -> Dict[str, Any]:
        """Check URL safety"""
        try:
            # Parse URL
            parsed = urlparse(url)
            
            # Check domain reputation
            domain_reputation = self._check_domain_reputation(parsed.netloc)
            
            # Check for suspicious patterns
            suspicious_patterns = self._check_suspicious_url_patterns(url)
            
            return {
                "safe": domain_reputation == "safe" and not suspicious_patterns,
                "domain_reputation": domain_reputation,
                "suspicious_patterns": suspicious_patterns
            }
            
        except Exception as e:
            logger.error(f"URL safety check failed: {str(e)}")
            return {"safe": False, "error": str(e)}
    
    def _check_domain_reputation(self, domain: str) -> str:
        """Check domain reputation"""
        # This would typically query a threat intelligence service
        malicious_domains = {
            'malicious-site.com',
            'phishing-example.org',
            'malware-distribution.net'
        }
        
        if domain in malicious_domains:
            return "malicious"
        else:
            return "unknown"
    
    def _check_suspicious_url_patterns(self, url: str) -> List[str]:
        """Check for suspicious URL patterns"""
        suspicious = []
        
        # Check for IP addresses
        ip_pattern = r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b'
        if re.search(ip_pattern, url):
            suspicious.append("IP address in URL")
        
        # Check for suspicious subdomains
        suspicious_subdomains = ['secure', 'login', 'account', 'verify', 'update']
        for subdomain in suspicious_subdomains:
            if f'.{subdomain}.' in url.lower():
                suspicious.append(f"Suspicious subdomain: {subdomain}")
        
        return suspicious
    
    def _generate_recommendations(self, scan_result: Dict[str, Any]) -> List[str]:
        """Generate security recommendations based on scan results"""
        recommendations = []
        
        if not scan_result["safe"]:
            recommendations.append("Do not open this file")
            recommendations.append("Delete the file immediately")
            recommendations.append("Run a full system scan")
        
        if scan_result["warnings"]:
            recommendations.append("Review file before opening")
            recommendations.append("Scan with additional antivirus software")
        
        if scan_result["file_info"].get("size", 0) > 5 * 1024 * 1024:
            recommendations.append("Large file - consider compressing")
        
        return recommendations
    
    def _cache_scan_result(self, file_path: str, scan_result: Dict[str, Any], user_id: str):
        """Cache scan result for future reference"""
        try:
            file_hash = scan_result["file_info"].get("hash")
            if file_hash:
                key = f"scan_result:{file_hash}"
                self.redis_client.setex(key, 86400, json.dumps(scan_result))  # 24 hours
        except Exception as e:
            logger.error(f"Failed to cache scan result: {str(e)}")
    
    def _load_yara_rules(self) -> Optional[yara.Rules]:
        """Load YARA rules for malware detection"""
        try:
            # In production, this would load from a rules file
            rules_source = """
            rule SuspiciousPE {
                strings:
                    $mz = { 4d 5a }
                condition:
                    $mz
            }
            """
            return yara.compile(source=rules_source)
        except Exception as e:
            logger.error(f"Failed to load YARA rules: {str(e)}")
            return None

class QRCodeSecurity:
    """Handles QR code security validation"""
    
    def __init__(self):
        self.document_scanner = DocumentScanner()
    
    def scan_qr_code(self, qr_data: str, user_id: str) -> Dict[str, Any]:
        """Scan QR code for security threats"""
        try:
            scan_result = {
                "safe": True,
                "threats": [],
                "warnings": [],
                "recommendations": [],
                "content_type": "unknown",
                "scan_timestamp": datetime.utcnow().isoformat()
            }
            
            # Determine content type
            content_type = self._determine_content_type(qr_data)
            scan_result["content_type"] = content_type
            
            # Analyze based on content type
            if content_type == "url":
                url_result = self.document_scanner._check_url_safety(qr_data)
                if not url_result["safe"]:
                    scan_result["safe"] = False
                    scan_result["threats"].append("Malicious URL detected")
            
            elif content_type == "javascript":
                scan_result["safe"] = False
                scan_result["threats"].append("JavaScript code detected")
            
            elif content_type == "data_uri":
                scan_result["safe"] = False
                scan_result["threats"].append("Data URI detected")
            
            elif content_type == "wifi":
                wifi_result = self._analyze_wifi_qr(qr_data)
                if wifi_result["threats"]:
                    scan_result["safe"] = False
                    scan_result["threats"].extend(wifi_result["threats"])
            
            elif content_type == "contact":
                contact_result = self._analyze_contact_qr(qr_data)
                if contact_result["threats"]:
                    scan_result["threats"].extend(contact_result["threats"])
            
            # Generate recommendations
            scan_result["recommendations"] = self._generate_qr_recommendations(scan_result)
            
            return scan_result
            
        except Exception as e:
            logger.error(f"QR code scanning failed: {str(e)}")
            return {
                "safe": False,
                "threats": ["QR code scanning failed"],
                "warnings": [],
                "recommendations": ["Do not scan this QR code"],
                "error": str(e)
            }
    
    def _determine_content_type(self, qr_data: str) -> str:
        """Determine the type of content in QR code"""
        if qr_data.startswith(('http://', 'https://')):
            return "url"
        elif qr_data.startswith('javascript:'):
            return "javascript"
        elif qr_data.startswith('data:'):
            return "data_uri"
        elif qr_data.startswith('WIFI:'):
            return "wifi"
        elif qr_data.startswith('BEGIN:VCARD'):
            return "contact"
        elif qr_data.startswith('tel:'):
            return "phone"
        elif qr_data.startswith('mailto:'):
            return "email"
        elif qr_data.startswith('sms:'):
            return "sms"
        else:
            return "text"
    
    def _analyze_wifi_qr(self, wifi_data: str) -> Dict[str, Any]:
        """Analyze WiFi QR code for security"""
        result = {"threats": [], "warnings": []}
        
        try:
            # Parse WiFi QR code format: WIFI:T:WPA;S:NetworkName;P:Password;H:false;;
            if 'T:WEP' in wifi_data:
                result["warnings"].append("WEP encryption is insecure")
            
            if 'H:true' in wifi_data:
                result["warnings"].append("Hidden network detected")
            
        except Exception as e:
            logger.error(f"WiFi QR analysis failed: {str(e)}")
        
        return result
    
    def _analyze_contact_qr(self, contact_data: str) -> Dict[str, Any]:
        """Analyze contact QR code for security"""
        result = {"threats": [], "warnings": []}
        
        try:
            # Check for suspicious contact information
            if 'URL:' in contact_data:
                urls = re.findall(r'URL:([^\r\n]+)', contact_data)
                for url in urls:
                    url_result = self.document_scanner._check_url_safety(url)
                    if not url_result["safe"]:
                        result["threats"].append(f"Malicious URL in contact: {url}")
            
        except Exception as e:
            logger.error(f"Contact QR analysis failed: {str(e)}")
        
        return result
    
    def _generate_qr_recommendations(self, scan_result: Dict[str, Any]) -> List[str]:
        """Generate recommendations for QR code scan results"""
        recommendations = []
        
        if not scan_result["safe"]:
            recommendations.append("Do not proceed with this QR code")
            recommendations.append("Delete or ignore this QR code")
        
        if scan_result["content_type"] == "url":
            recommendations.append("Verify the website before visiting")
            recommendations.append("Check for HTTPS encryption")
        
        if scan_result["content_type"] == "wifi":
            recommendations.append("Verify network name with owner")
            recommendations.append("Use VPN when connecting to public WiFi")
        
        return recommendations

class SecurityScanner:
    """Main security scanner that coordinates all scanning operations"""
    
    def __init__(self):
        self.document_scanner = DocumentScanner()
        self.qr_scanner = QRCodeSecurity()
    
    def scan_document(self, file_path: str, file_content: bytes, user_id: str) -> Dict[str, Any]:
        """Scan document for security threats"""
        return self.document_scanner.scan_document(file_path, file_content, user_id)
    
    def scan_qr_code(self, qr_data: str, user_id: str) -> Dict[str, Any]:
        """Scan QR code for security threats"""
        return self.qr_scanner.scan_qr_code(qr_data, user_id)
    
    def validate_url(self, url: str) -> Dict[str, Any]:
        """Validate URL for security threats"""
        return self.document_scanner._check_url_safety(url)

# Global security scanner instance
security_scanner = SecurityScanner()
