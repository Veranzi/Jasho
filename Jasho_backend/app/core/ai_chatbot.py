"""
Responsible AI Chatbot with Voice Support
Implements safe AI chatbot with content filtering, voice processing, and responsible AI practices
"""

import os
import io
import base64
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import openai
import speech_recognition as sr
import pyttsx3
from gtts import gTTS
import librosa
import soundfile as sf
import numpy as np
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch
import redis
from PIL import Image
import cv2
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from nltk.corpus import stopwords
import re
import hashlib
import time

logger = logging.getLogger(__name__)

class ContentFilter:
    """Handles content filtering and safety checks"""
    
    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            db=3,
            decode_responses=True
        )
        
        # Load content classification models
        self.toxicity_classifier = pipeline(
            "text-classification",
            model="unitary/toxic-bert",
            return_all_scores=True
        )
        
        self.sentiment_analyzer = SentimentIntensityAnalyzer()
        
        # Download required NLTK data
        try:
            nltk.download('vader_lexicon', quiet=True)
            nltk.download('stopwords', quiet=True)
        except:
            pass
        
        # Content safety rules
        self.prohibited_keywords = {
            'hate_speech': ['hate', 'kill', 'destroy', 'harm', 'violence'],
            'financial_fraud': ['scam', 'fraud', 'steal', 'hack', 'phishing'],
            'personal_info': ['ssn', 'password', 'credit card', 'bank account'],
            'inappropriate': ['explicit', 'adult', 'nsfw']
        }
        
        # Safe financial topics
        self.safe_financial_topics = {
            'budgeting', 'savings', 'investments', 'loans', 'credit',
            'financial planning', 'expense tracking', 'income management'
        }
    
    def filter_text_content(self, text: str, user_id: str) -> Dict[str, Any]:
        """Filter text content for safety and appropriateness"""
        try:
            filter_result = {
                "safe": True,
                "filtered_text": text,
                "violations": [],
                "confidence_scores": {},
                "recommendations": []
            }
            
            # Check for prohibited keywords
            keyword_violations = self._check_prohibited_keywords(text)
            if keyword_violations:
                filter_result["violations"].extend(keyword_violations)
                filter_result["safe"] = False
            
            # Toxicity classification
            toxicity_result = self._classify_toxicity(text)
            filter_result["confidence_scores"]["toxicity"] = toxicity_result
            
            if toxicity_result["max_score"] > 0.7:
                filter_result["safe"] = False
                filter_result["violations"].append("Toxic content detected")
            
            # Sentiment analysis
            sentiment_result = self._analyze_sentiment(text)
            filter_result["confidence_scores"]["sentiment"] = sentiment_result
            
            # Check for personal information
            pii_violations = self._check_personal_information(text)
            if pii_violations:
                filter_result["violations"].extend(pii_violations)
                filter_result["safe"] = False
            
            # Financial topic validation
            if not self._validate_financial_topic(text):
                filter_result["violations"].append("Non-financial topic detected")
                filter_result["safe"] = False
            
            # Generate filtered text if needed
            if not filter_result["safe"]:
                filter_result["filtered_text"] = self._sanitize_text(text)
                filter_result["recommendations"].append("Content has been filtered for safety")
            
            # Cache filter result
            self._cache_filter_result(text, filter_result, user_id)
            
            return filter_result
            
        except Exception as e:
            logger.error(f"Text content filtering failed: {str(e)}")
            return {
                "safe": False,
                "filtered_text": "",
                "violations": ["Content filtering failed"],
                "error": str(e)
            }
    
    def filter_image_content(self, image_data: bytes, user_id: str) -> Dict[str, Any]:
        """Filter image content for safety"""
        try:
            filter_result = {
                "safe": True,
                "violations": [],
                "image_analysis": {},
                "recommendations": []
            }
            
            # Load image
            image = Image.open(io.BytesIO(image_data))
            
            # Check image properties
            width, height = image.size
            filter_result["image_analysis"]["dimensions"] = {"width": width, "height": height}
            
            # Check for inappropriate content (simplified)
            if self._detect_inappropriate_image(image):
                filter_result["safe"] = False
                filter_result["violations"].append("Inappropriate image content")
            
            # Check image size
            if width > 10000 or height > 10000:
                filter_result["violations"].append("Image too large")
                filter_result["safe"] = False
            
            # Check for metadata
            if hasattr(image, '_getexif') and image._getexif():
                filter_result["violations"].append("Image contains metadata")
                filter_result["safe"] = False
            
            return filter_result
            
        except Exception as e:
            logger.error(f"Image content filtering failed: {str(e)}")
            return {
                "safe": False,
                "violations": ["Image filtering failed"],
                "error": str(e)
            }
    
    def filter_voice_content(self, audio_data: bytes, user_id: str) -> Dict[str, Any]:
        """Filter voice content for safety"""
        try:
            filter_result = {
                "safe": True,
                "violations": [],
                "audio_analysis": {},
                "recommendations": []
            }
            
            # Convert audio to text for analysis
            text_content = self._speech_to_text(audio_data)
            
            if text_content:
                # Filter the transcribed text
                text_filter_result = self.filter_text_content(text_content, user_id)
                filter_result.update(text_filter_result)
                filter_result["audio_analysis"]["transcribed_text"] = text_content
            
            # Analyze audio properties
            audio_properties = self._analyze_audio_properties(audio_data)
            filter_result["audio_analysis"]["properties"] = audio_properties
            
            return filter_result
            
        except Exception as e:
            logger.error(f"Voice content filtering failed: {str(e)}")
            return {
                "safe": False,
                "violations": ["Voice filtering failed"],
                "error": str(e)
            }
    
    def _check_prohibited_keywords(self, text: str) -> List[str]:
        """Check for prohibited keywords"""
        violations = []
        text_lower = text.lower()
        
        for category, keywords in self.prohibited_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    violations.append(f"Prohibited keyword detected: {keyword}")
        
        return violations
    
    def _classify_toxicity(self, text: str) -> Dict[str, Any]:
        """Classify text for toxicity"""
        try:
            results = self.toxicity_classifier(text)
            
            # Find the highest scoring category
            max_score = 0
            max_label = ""
            
            for result in results[0]:
                if result['score'] > max_score:
                    max_score = result['score']
                    max_label = result['label']
            
            return {
                "max_score": max_score,
                "max_label": max_label,
                "all_scores": results[0]
            }
            
        except Exception as e:
            logger.error(f"Toxicity classification failed: {str(e)}")
            return {"max_score": 0, "max_label": "unknown", "all_scores": []}
    
    def _analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Analyze text sentiment"""
        try:
            scores = self.sentiment_analyzer.polarity_scores(text)
            return scores
        except Exception as e:
            logger.error(f"Sentiment analysis failed: {str(e)}")
            return {"compound": 0, "pos": 0, "neu": 0, "neg": 0}
    
    def _check_personal_information(self, text: str) -> List[str]:
        """Check for personal information"""
        violations = []
        
        # Check for SSN pattern
        ssn_pattern = r'\b\d{3}-\d{2}-\d{4}\b'
        if re.search(ssn_pattern, text):
            violations.append("SSN pattern detected")
        
        # Check for credit card pattern
        cc_pattern = r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b'
        if re.search(cc_pattern, text):
            violations.append("Credit card pattern detected")
        
        # Check for email pattern
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        if re.search(email_pattern, text):
            violations.append("Email address detected")
        
        return violations
    
    def _validate_financial_topic(self, text: str) -> bool:
        """Validate if text is about financial topics"""
        text_lower = text.lower()
        
        # Check if any safe financial topics are mentioned
        for topic in self.safe_financial_topics:
            if topic in text_lower:
                return True
        
        # Check for financial keywords
        financial_keywords = ['money', 'cash', 'payment', 'transaction', 'balance', 'account']
        for keyword in financial_keywords:
            if keyword in text_lower:
                return True
        
        return False
    
    def _sanitize_text(self, text: str) -> str:
        """Sanitize text by removing or replacing inappropriate content"""
        sanitized = text
        
        # Replace prohibited keywords with asterisks
        for category, keywords in self.prohibited_keywords.items():
            for keyword in keywords:
                sanitized = re.sub(re.escape(keyword), '*' * len(keyword), sanitized, flags=re.IGNORECASE)
        
        return sanitized
    
    def _detect_inappropriate_image(self, image: Image.Image) -> bool:
        """Detect inappropriate image content (simplified)"""
        # This is a simplified implementation
        # In production, you would use a proper image classification model
        
        # Check for skin tone detection (basic heuristic)
        try:
            # Convert to RGB if needed
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Get image data
            pixels = list(image.getdata())
            
            # Check for predominantly skin-colored pixels
            skin_pixels = 0
            total_pixels = len(pixels)
            
            for r, g, b in pixels:
                # Basic skin tone detection
                if (r > 95 and g > 40 and b > 20 and
                    max(r, g, b) - min(r, g, b) > 15 and
                    abs(r - g) > 15 and r > g and r > b):
                    skin_pixels += 1
            
            # If more than 30% of pixels are skin-colored, flag as potentially inappropriate
            if skin_pixels / total_pixels > 0.3:
                return True
            
        except Exception as e:
            logger.error(f"Image inappropriate content detection failed: {str(e)}")
        
        return False
    
    def _speech_to_text(self, audio_data: bytes) -> Optional[str]:
        """Convert speech to text"""
        try:
            # Save audio to temporary file
            temp_file = io.BytesIO(audio_data)
            
            # Use speech recognition
            recognizer = sr.Recognizer()
            with sr.AudioFile(temp_file) as source:
                audio = recognizer.record(source)
            
            text = recognizer.recognize_google(audio)
            return text
            
        except Exception as e:
            logger.error(f"Speech to text conversion failed: {str(e)}")
            return None
    
    def _analyze_audio_properties(self, audio_data: bytes) -> Dict[str, Any]:
        """Analyze audio properties"""
        try:
            # Load audio
            audio, sample_rate = librosa.load(io.BytesIO(audio_data), sr=None)
            
            return {
                "duration": len(audio) / sample_rate,
                "sample_rate": sample_rate,
                "channels": 1,  # Assuming mono
                "amplitude_mean": float(np.mean(np.abs(audio))),
                "amplitude_std": float(np.std(audio))
            }
            
        except Exception as e:
            logger.error(f"Audio properties analysis failed: {str(e)}")
            return {}
    
    def _cache_filter_result(self, content: str, result: Dict[str, Any], user_id: str):
        """Cache filter result for future reference"""
        try:
            content_hash = hashlib.md5(content.encode()).hexdigest()
            key = f"filter_result:{content_hash}:{user_id}"
            self.redis_client.setex(key, 3600, json.dumps(result))  # 1 hour
        except Exception as e:
            logger.error(f"Failed to cache filter result: {str(e)}")

class VoiceProcessor:
    """Handles voice processing and synthesis"""
    
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.tts_engine = pyttsx3.init()
        self._configure_tts()
    
    def _configure_tts(self):
        """Configure text-to-speech engine"""
        try:
            # Set voice properties
            voices = self.tts_engine.getProperty('voices')
            if voices:
                # Use a female voice if available
                for voice in voices:
                    if 'female' in voice.name.lower() or 'woman' in voice.name.lower():
                        self.tts_engine.setProperty('voice', voice.id)
                        break
            
            # Set speech rate
            self.tts_engine.setProperty('rate', 150)
            
            # Set volume
            self.tts_engine.setProperty('volume', 0.8)
            
        except Exception as e:
            logger.error(f"TTS configuration failed: {str(e)}")
    
    def speech_to_text(self, audio_data: bytes) -> Dict[str, Any]:
        """Convert speech to text"""
        try:
            # Save audio to temporary file
            temp_file = io.BytesIO(audio_data)
            
            with sr.AudioFile(temp_file) as source:
                # Adjust for ambient noise
                self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                audio = self.recognizer.record(source)
            
            # Recognize speech
            text = self.recognizer.recognize_google(audio)
            
            return {
                "success": True,
                "text": text,
                "confidence": 0.9  # Google's confidence is not directly available
            }
            
        except sr.UnknownValueError:
            return {
                "success": False,
                "error": "Could not understand audio"
            }
        except sr.RequestError as e:
            return {
                "success": False,
                "error": f"Speech recognition service error: {str(e)}"
            }
        except Exception as e:
            logger.error(f"Speech to text failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def text_to_speech(self, text: str, output_format: str = "wav") -> Dict[str, Any]:
        """Convert text to speech"""
        try:
            # Filter text for safety
            content_filter = ContentFilter()
            filter_result = content_filter.filter_text_content(text, "system")
            
            if not filter_result["safe"]:
                return {
                    "success": False,
                    "error": "Text contains inappropriate content"
                }
            
            # Generate speech
            if output_format == "wav":
                # Use pyttsx3 for WAV output
                audio_data = self._generate_wav_audio(filter_result["filtered_text"])
            else:
                # Use gTTS for MP3 output
                audio_data = self._generate_mp3_audio(filter_result["filtered_text"])
            
            return {
                "success": True,
                "audio_data": base64.b64encode(audio_data).decode(),
                "format": output_format,
                "duration": self._estimate_audio_duration(text)
            }
            
        except Exception as e:
            logger.error(f"Text to speech failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _generate_wav_audio(self, text: str) -> bytes:
        """Generate WAV audio using pyttsx3"""
        try:
            # Create temporary file
            temp_file = io.BytesIO()
            
            # Save speech to temporary file
            self.tts_engine.save_to_file(text, temp_file)
            self.tts_engine.runAndWait()
            
            return temp_file.getvalue()
            
        except Exception as e:
            logger.error(f"WAV audio generation failed: {str(e)}")
            return b""
    
    def _generate_mp3_audio(self, text: str) -> bytes:
        """Generate MP3 audio using gTTS"""
        try:
            tts = gTTS(text=text, lang='en', slow=False)
            audio_buffer = io.BytesIO()
            tts.write_to_fp(audio_buffer)
            return audio_buffer.getvalue()
            
        except Exception as e:
            logger.error(f"MP3 audio generation failed: {str(e)}")
            return b""
    
    def _estimate_audio_duration(self, text: str) -> float:
        """Estimate audio duration based on text length"""
        # Rough estimate: 150 words per minute
        word_count = len(text.split())
        return (word_count / 150) * 60

class AIAssistant:
    """Main AI assistant with responsible AI practices"""
    
    def __init__(self):
        self.content_filter = ContentFilter()
        self.voice_processor = VoiceProcessor()
        self.openai_client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Conversation history
        self.conversation_history = {}
        
        # System prompt for responsible AI
        self.system_prompt = """
        You are Jasho, a responsible AI financial assistant. Your role is to help users with:
        - Financial planning and budgeting
        - Savings strategies
        - Investment guidance
        - Loan information
        - Expense tracking
        
        Important guidelines:
        1. Always provide accurate, helpful financial information
        2. Never provide personal financial advice without disclaimers
        3. Encourage users to consult with financial professionals for major decisions
        4. Be respectful and professional at all times
        5. If asked about non-financial topics, politely redirect to financial topics
        6. Never share or request personal information like SSN, passwords, or account numbers
        7. Always prioritize user safety and security
        
        Respond in a helpful, friendly, and professional manner.
        """
    
    def process_message(self, message: str, user_id: str, message_type: str = "text") -> Dict[str, Any]:
        """Process user message and generate response"""
        try:
            # Filter content for safety
            filter_result = self.content_filter.filter_text_content(message, user_id)
            
            if not filter_result["safe"]:
                return {
                    "success": False,
                    "response": "I cannot process that message due to content safety concerns. Please rephrase your question about financial topics.",
                    "violations": filter_result["violations"]
                }
            
            # Get conversation history
            conversation = self._get_conversation_history(user_id)
            
            # Generate AI response
            ai_response = self._generate_ai_response(
                filter_result["filtered_text"],
                conversation,
                user_id
            )
            
            # Filter AI response for safety
            response_filter_result = self.content_filter.filter_text_content(ai_response, user_id)
            
            # Update conversation history
            self._update_conversation_history(user_id, message, response_filter_result["filtered_text"])
            
            return {
                "success": True,
                "response": response_filter_result["filtered_text"],
                "message_type": message_type,
                "timestamp": datetime.utcnow().isoformat(),
                "conversation_id": self._get_conversation_id(user_id)
            }
            
        except Exception as e:
            logger.error(f"Message processing failed: {str(e)}")
            return {
                "success": False,
                "response": "I'm sorry, I encountered an error. Please try again.",
                "error": str(e)
            }
    
    def process_voice_message(self, audio_data: bytes, user_id: str) -> Dict[str, Any]:
        """Process voice message and generate voice response"""
        try:
            # Convert speech to text
            stt_result = self.voice_processor.speech_to_text(audio_data)
            
            if not stt_result["success"]:
                return {
                    "success": False,
                    "response": "I couldn't understand your voice message. Please try again.",
                    "error": stt_result["error"]
                }
            
            # Process the transcribed text
            text_response = self.process_message(stt_result["text"], user_id, "voice")
            
            if not text_response["success"]:
                return text_response
            
            # Convert response to speech
            tts_result = self.voice_processor.text_to_speech(text_response["response"])
            
            if not tts_result["success"]:
                return {
                    "success": False,
                    "response": text_response["response"],
                    "error": "Voice synthesis failed"
                }
            
            return {
                "success": True,
                "response": text_response["response"],
                "audio_response": tts_result["audio_data"],
                "audio_format": tts_result["format"],
                "transcribed_text": stt_result["text"],
                "message_type": "voice",
                "timestamp": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Voice message processing failed: {str(e)}")
            return {
                "success": False,
                "response": "I'm sorry, I couldn't process your voice message. Please try again.",
                "error": str(e)
            }
    
    def _generate_ai_response(self, message: str, conversation: List[Dict], user_id: str) -> str:
        """Generate AI response using OpenAI"""
        try:
            # Prepare messages for OpenAI
            messages = [{"role": "system", "content": self.system_prompt}]
            
            # Add conversation history
            for msg in conversation[-10:]:  # Last 10 messages
                messages.append({"role": "user", "content": msg["user_message"]})
                messages.append({"role": "assistant", "content": msg["assistant_response"]})
            
            # Add current message
            messages.append({"role": "user", "content": message})
            
            # Generate response
            response = self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                max_tokens=500,
                temperature=0.7,
                top_p=0.9
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logger.error(f"AI response generation failed: {str(e)}")
            return "I'm sorry, I'm having trouble generating a response right now. Please try again later."
    
    def _get_conversation_history(self, user_id: str) -> List[Dict]:
        """Get conversation history for user"""
        return self.conversation_history.get(user_id, [])
    
    def _update_conversation_history(self, user_id: str, user_message: str, assistant_response: str):
        """Update conversation history"""
        if user_id not in self.conversation_history:
            self.conversation_history[user_id] = []
        
        self.conversation_history[user_id].append({
            "user_message": user_message,
            "assistant_response": assistant_response,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Keep only last 20 messages
        if len(self.conversation_history[user_id]) > 20:
            self.conversation_history[user_id] = self.conversation_history[user_id][-20:]
    
    def _get_conversation_id(self, user_id: str) -> str:
        """Generate conversation ID"""
        return hashlib.md5(f"{user_id}_{int(time.time())}".encode()).hexdigest()[:16]

# Global AI assistant instance
ai_assistant = AIAssistant()
