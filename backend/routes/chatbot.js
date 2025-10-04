const express = require('express');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const natural = require('natural');
const sentiment = require('sentiment');
const { authenticateToken } = require('../middleware/auth');
const { CreditScore } = require('../models/CreditScore');
const { Transaction } = require('../models/Wallet');
const { Job } = require('../models/Job');
const { SavingsGoal } = require('../models/Savings');

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/chatbot';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = /jpeg|jpg|png|gif|pdf|txt|mp3|wav|mp4/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, documents, and audio files are allowed.'));
    }
  }
});

// Content safety checker
class ContentSafetyChecker {
  static async checkTextSafety(text) {
    const sentimentAnalyzer = new sentiment();
    const analysis = sentimentAnalyzer.analyze(text);
    
    // Check for inappropriate content
    const inappropriateWords = [
      'hate', 'violence', 'threat', 'scam', 'fraud', 'illegal',
      'drug', 'weapon', 'terrorist', 'bomb', 'kill', 'murder'
    ];
    
    const hasInappropriateContent = inappropriateWords.some(word => 
      text.toLowerCase().includes(word)
    );
    
    return {
      isSafe: !hasInappropriateContent && analysis.score > -5,
      sentiment: analysis,
      inappropriateContent: hasInappropriateContent,
      reason: hasInappropriateContent ? 'Contains inappropriate content' : 'Content is safe'
    };
  }

  static async checkImageSafety(imagePath) {
    try {
      // Use AI to analyze image content
      const imageBuffer = fs.readFileSync(imagePath);
      
      // Check image metadata
      const metadata = await sharp(imageBuffer).metadata();
      
      // Basic safety checks
      const safetyChecks = {
        isSafe: true,
        reasons: []
      };
      
      // Check file size
      if (metadata.size > 5 * 1024 * 1024) { // 5MB
        safetyChecks.reasons.push('File size too large');
        safetyChecks.isSafe = false;
      }
      
      // Check dimensions
      if (metadata.width > 4000 || metadata.height > 4000) {
        safetyChecks.reasons.push('Image dimensions too large');
        safetyChecks.isSafe = false;
      }
      
      return safetyChecks;
    } catch (error) {
      return {
        isSafe: false,
        reasons: ['Image processing error'],
        error: error.message
      };
    }
  }

  static async checkAudioSafety(audioPath) {
    try {
      // Basic audio file validation
      const stats = fs.statSync(audioPath);
      
      return {
        isSafe: stats.size < 10 * 1024 * 1024, // 10MB limit
        reasons: stats.size >= 10 * 1024 * 1024 ? ['Audio file too large'] : []
      };
    } catch (error) {
      return {
        isSafe: false,
        reasons: ['Audio processing error'],
        error: error.message
      };
    }
  }
}

// Voice processing utilities
class VoiceProcessor {
  static async transcribeAudio(audioPath) {
    try {
      // In production, use OpenAI Whisper or Google Speech-to-Text
      // For now, simulate transcription
      return {
        text: 'Simulated transcription of audio content',
        confidence: 0.85,
        language: 'en'
      };
    } catch (error) {
      throw new Error(`Audio transcription failed: ${error.message}`);
    }
  }

  static async generateSpeech(text, voice = 'alloy') {
    try {
      const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice,
        input: text,
        response_format: 'mp3'
      });

      return response;
    } catch (error) {
      throw new Error(`Speech generation failed: ${error.message}`);
    }
  }
}

// AI Chatbot with financial expertise
class FinancialChatbot {
  constructor() {
    this.systemPrompt = `You are Jashoo, a helpful financial assistant for gig economy workers in Kenya. 
    You provide advice on:
    - Financial planning and budgeting
    - Savings strategies
    - Loan and credit management
    - Gig work optimization
    - Investment opportunities
    - Financial literacy education
    
    Always respond in a helpful, professional manner. If the user asks in Swahili, respond in Swahili.
    Never provide financial advice that could be harmful or illegal.
    Always encourage users to consult with financial professionals for major decisions.`;
  }

  async generateResponse(userMessage, userContext) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: this.buildContextualMessage(userMessage, userContext) }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      throw new Error(`AI response generation failed: ${error.message}`);
    }
  }

  buildContextualMessage(userMessage, userContext) {
    let contextualMessage = userMessage;
    
    if (userContext) {
      contextualMessage += `\n\nUser Context:
      - Current Credit Score: ${userContext.creditScore || 'Not available'}
      - Monthly Income: ${userContext.monthlyIncome || 'Not available'} KES
      - Monthly Expenses: ${userContext.monthlyExpenses || 'Not available'} KES
      - Savings Rate: ${userContext.savingsRate || 'Not available'}%
      - Active Jobs: ${userContext.activeJobs || 0}
      - Completed Jobs: ${userContext.completedJobs || 0}`;
    }

    return contextualMessage;
  }

  async analyzeFinancialQuestion(question) {
    const financialKeywords = [
      'loan', 'credit', 'debt', 'savings', 'investment', 'budget',
      'income', 'expense', 'financial', 'money', 'pesa', 'deni',
      'akiba', 'uwezo', 'mapato', 'gharama'
    ];

    const isFinancialQuestion = financialKeywords.some(keyword => 
      question.toLowerCase().includes(keyword)
    );

    return {
      isFinancial: isFinancialQuestion,
      category: this.categorizeQuestion(question),
      priority: isFinancialQuestion ? 'high' : 'medium'
    };
  }

  categorizeQuestion(question) {
    const categories = {
      'loan': ['loan', 'deni', 'credit', 'borrow'],
      'savings': ['savings', 'akiba', 'save', 'investment'],
      'budget': ['budget', 'expense', 'gharama', 'spending'],
      'income': ['income', 'mapato', 'earn', 'job'],
      'general': ['help', 'advice', 'question', 'swali']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => question.toLowerCase().includes(keyword))) {
        return category;
      }
    }

    return 'general';
  }
}

// Chatbot routes
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { message, includeContext = true } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Check content safety
    const safetyCheck = await ContentSafetyChecker.checkTextSafety(message);
    if (!safetyCheck.isSafe) {
      return res.status(400).json({
        success: false,
        message: 'Message contains inappropriate content',
        reason: safetyCheck.reason
      });
    }

    // Get user context if requested
    let userContext = null;
    if (includeContext) {
      userContext = await getUserFinancialContext(req.user.userId);
    }

    // Initialize chatbot
    const chatbot = new FinancialChatbot();
    
    // Analyze question
    const analysis = await chatbot.analyzeFinancialQuestion(message);
    
    // Generate response
    const response = await chatbot.generateResponse(message, userContext);

    // Log interaction
    logger.info('Chatbot interaction', {
      userId: req.user.userId,
      question: message,
      category: analysis.category,
      response: response.substring(0, 100) + '...',
      timestamp: new Date()
    });

    res.json({
      success: true,
      data: {
        response,
        analysis,
        userContext: includeContext ? userContext : null,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Voice chat endpoint
router.post('/voice-chat', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Audio file is required'
      });
    }

    // Check audio safety
    const safetyCheck = await ContentSafetyChecker.checkAudioSafety(req.file.path);
    if (!safetyCheck.isSafe) {
      // Clean up file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Audio file is not safe',
        reasons: safetyCheck.reasons
      });
    }

    // Transcribe audio
    const transcription = await VoiceProcessor.transcribeAudio(req.file.path);
    
    // Process transcribed text
    const chatbot = new FinancialChatbot();
    const userContext = await getUserFinancialContext(req.user.userId);
    const response = await chatbot.generateResponse(transcription.text, userContext);

    // Generate speech response
    const speechResponse = await VoiceProcessor.generateSpeech(response);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      data: {
        transcription: transcription.text,
        response,
        audioResponse: speechResponse, // In production, save to file and return URL
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Voice chat error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to process voice message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Image analysis endpoint
router.post('/analyze-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required'
      });
    }

    // Check image safety
    const safetyCheck = await ContentSafetyChecker.checkImageSafety(req.file.path);
    if (!safetyCheck.isSafe) {
      // Clean up file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Image is not safe',
        reasons: safetyCheck.reasons
      });
    }

    // Analyze image with AI
    const imageBuffer = fs.readFileSync(req.file.path);
    const base64Image = imageBuffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image and provide financial advice if it contains financial documents, receipts, or financial information. If it\'s not financial-related, just describe what you see.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      data: {
        analysis: response.choices[0].message.content,
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Image analysis error:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to analyze image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get chat history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // In production, store chat history in database
    // For now, return empty array
    const chatHistory = [];

    res.json({
      success: true,
      data: {
        chatHistory,
        pagination: {
          page,
          limit,
          total: 0,
          pages: 0
        }
      }
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper function to get user financial context
async function getUserFinancialContext(userId) {
  try {
    const creditScore = await CreditScore.findOne({ userId });
    const recentTransactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);
    const activeJobs = await Job.countDocuments({ assignedTo: userId, status: 'inProgress' });
    const completedJobs = await Job.countDocuments({ assignedTo: userId, status: 'completed' });
    const savingsGoals = await SavingsGoal.find({ userId, isActive: true });

    const monthlyIncome = recentTransactions
      .filter(t => t.type === 'earning')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthlyExpenses = recentTransactions
      .filter(t => t.type === 'withdrawal' || t.type === 'payment')
      .reduce((sum, t) => sum + t.amount, 0);

    const savingsRate = monthlyIncome > 0 ? (monthlyIncome - monthlyExpenses) / monthlyIncome : 0;

    return {
      creditScore: creditScore?.currentScore || null,
      monthlyIncome,
      monthlyExpenses,
      savingsRate: Math.round(savingsRate * 100),
      activeJobs,
      completedJobs,
      activeSavingsGoals: savingsGoals.length
    };
  } catch (error) {
    console.error('Error getting user context:', error);
    return null;
  }
}

module.exports = router;