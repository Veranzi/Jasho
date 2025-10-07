const express = require('express');
const multer = require('multer');
const OpenAI = require('openai');
const { authenticateToken } = require('../middleware/auth');
const { validateChatMessage, validateFileUpload } = require('../middleware/validation');
const { logger } = require('../middleware/cybersecurity');
const User = require('../models/User');
const { Wallet, Transaction } = require('../models/Wallet');
const { Job } = require('../models/Job');
const { SavingsGoal } = require('../models/Savings');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/chatbot/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = (process.env.ALLOWED_FILE_TYPES || 'jpg,jpeg,png,gif,pdf,txt,mp3,wav,mp4').split(',');
    const fileExtension = file.originalname.split('.').pop().toLowerCase();
    
    if (allowedTypes.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${fileExtension} not allowed`), false);
    }
  }
});

const router = express.Router();

// Content safety checker
class ContentSafetyChecker {
  static checkTextSafety(text) {
    const inappropriateWords = [
      'spam', 'scam', 'fraud', 'hack', 'malware', 'virus',
      'phishing', 'illegal', 'unlawful', 'harmful'
    ];
    
    const lowerText = text.toLowerCase();
    const hasInappropriateContent = inappropriateWords.some(word => 
      lowerText.includes(word)
    );
    
    return {
      isSafe: !hasInappropriateContent,
      flaggedWords: inappropriateWords.filter(word => lowerText.includes(word))
    };
  }

  static checkImageSafety(imagePath) {
    // Simplified image safety check
    // In production, use Google Vision API or similar
    return {
      isSafe: true,
      metadata: {
        size: 'unknown',
        dimensions: 'unknown'
      }
    };
  }

  static checkAudioSafety(audioPath) {
    // Simplified audio safety check
    return {
      isSafe: true,
      duration: 'unknown'
    };
  }
}

// Voice processor
class VoiceProcessor {
  static async transcribeAudio(audioPath) {
    try {
      if (process.env.SPEECH_TO_TEXT_ENABLED !== 'true') {
        return {
          success: false,
          error: 'Speech-to-text not enabled'
        };
      }

      // Use OpenAI Whisper for transcription
      const transcription = await openai.audio.transcriptions.create({
        file: require('fs').createReadStream(audioPath),
        model: process.env.WHISPER_MODEL || 'whisper-1',
        language: 'en'
      });

      return {
        success: true,
        text: transcription.text
      };
    } catch (error) {
      logger.error('Audio transcription error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async generateSpeech(text, voice = 'alloy') {
    try {
      if (process.env.TEXT_TO_SPEECH_ENABLED !== 'true') {
        return {
          success: false,
          error: 'Text-to-speech not enabled'
        };
      }

      const response = await openai.audio.speech.create({
        model: process.env.TTS_MODEL || 'tts-1',
        voice: voice,
        input: text
      });

      const buffer = Buffer.from(await response.arrayBuffer());
      
      return {
        success: true,
        audioBuffer: buffer,
        format: 'mp3'
      };
    } catch (error) {
      logger.error('Speech generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Financial chatbot
class FinancialChatbot {
  constructor() {
    this.systemPrompt = `You are Jashoo, an AI financial assistant for gig economy workers in Kenya. 
    You help users with:
    - Financial planning and budgeting
    - Savings goals and strategies
    - Job marketplace insights
    - Credit score improvement
    - Investment advice
    - Expense tracking
    - Loan and credit guidance
    
    Always provide practical, actionable advice in both English and Swahili when appropriate.
    Be encouraging and supportive while maintaining professional financial guidance.
    Never provide specific investment recommendations without proper disclaimers.`;
  }

  async generateResponse(userMessage, userContext, language = 'en') {
    try {
      const contextualMessage = this.buildContextualMessage(userMessage, userContext);
      
      const response = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: contextualMessage }
        ],
        max_tokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 500,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
      });

      const aiResponse = response.choices[0].message.content;
      
      // Analyze the response for financial advice
      const analysis = this.analyzeFinancialQuestion(userMessage);
      
      return {
        success: true,
        response: aiResponse,
        analysis: analysis,
        language: language,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error('Chatbot response generation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  buildContextualMessage(userMessage, userContext) {
    let contextualMessage = userMessage;
    
    if (userContext) {
      contextualMessage += `\n\nUser Context:
      - Monthly Income: ${userContext.monthlyIncome || 'Not specified'} KES
      - Monthly Expenses: ${userContext.monthlyExpenses || 'Not specified'} KES
      - Savings Rate: ${userContext.savingsRate || 'Not specified'}%
      - Credit Score: ${userContext.creditScore || 'Not available'}
      - Active Jobs: ${userContext.activeJobs || 0}
      - Savings Goals: ${userContext.savingsGoals || 0}
      - Location: ${userContext.location || 'Not specified'}`;
    }
    
    return contextualMessage;
  }

  analyzeFinancialQuestion(question) {
    const lowerQuestion = question.toLowerCase();
    
    const categories = {
      budgeting: ['budget', 'expense', 'spending', 'money management'],
      savings: ['save', 'savings', 'goal', 'target', 'emergency fund'],
      investment: ['invest', 'investment', 'stocks', 'bonds', 'portfolio'],
      credit: ['credit', 'score', 'loan', 'debt', 'borrow'],
      job: ['job', 'work', 'gig', 'earning', 'income'],
      insurance: ['insurance', 'protection', 'coverage']
    };
    
    const detectedCategories = Object.keys(categories).filter(category =>
      categories[category].some(keyword => lowerQuestion.includes(keyword))
    );
    
    return {
      categories: detectedCategories,
      isFinancialQuestion: detectedCategories.length > 0,
      priority: detectedCategories.includes('credit') ? 'high' : 'medium'
    };
  }

  categorizeQuestion(question) {
    const analysis = this.analyzeFinancialQuestion(question);
    return analysis.categories[0] || 'general';
  }
}

// Initialize chatbot
const chatbot = new FinancialChatbot();

// Text chat endpoint
router.post('/chat', authenticateToken, validateChatMessage, async (req, res) => {
  try {
    const { message, includeContext = true } = req.body;
    const userId = req.user.userId;

    // Check content safety
    const safetyCheck = ContentSafetyChecker.checkTextSafety(message);
    if (!safetyCheck.isSafe) {
      return res.status(400).json({
        success: false,
        message: 'Message contains inappropriate content',
        code: 'INAPPROPRIATE_CONTENT',
        flaggedWords: safetyCheck.flaggedWords
      });
    }

    // Get user context if requested
    let userContext = null;
    if (includeContext) {
      userContext = await getUserFinancialContext(userId);
    }

    // Get user language preference
    const user = await User.findById(userId);
    const language = user?.preferences?.language || 'en';

    // Generate AI response
    const aiResponse = await chatbot.generateResponse(message, userContext, language);

    if (!aiResponse.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate response',
        code: 'RESPONSE_GENERATION_ERROR'
      });
    }

    // Log the interaction
    logger.info('Chatbot interaction', {
      userId,
      message: message.substring(0, 100), // Log first 100 chars
      responseLength: aiResponse.response.length,
      categories: aiResponse.analysis.categories,
      language,
      timestamp: new Date()
    });

    res.json({
      success: true,
      data: {
        response: aiResponse.response,
        analysis: aiResponse.analysis,
        language: aiResponse.language,
        timestamp: aiResponse.timestamp
      }
    });
  } catch (error) {
    logger.error('Chat endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Chat service error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'CHAT_ERROR'
    });
  }
});

// Voice chat endpoint
router.post('/voice-chat', authenticateToken, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Audio file is required',
        code: 'AUDIO_FILE_REQUIRED'
      });
    }

    const userId = req.user.userId;

    // Check audio safety
    const safetyCheck = ContentSafetyChecker.checkAudioSafety(req.file.path);
    if (!safetyCheck.isSafe) {
      return res.status(400).json({
        success: false,
        message: 'Audio file failed safety check',
        code: 'UNSAFE_AUDIO'
      });
    }

    // Transcribe audio
    const transcription = await VoiceProcessor.transcribeAudio(req.file.path);
    if (!transcription.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to transcribe audio',
        code: 'TRANSCRIPTION_ERROR',
        error: transcription.error
      });
    }

    // Check transcribed text safety
    const textSafetyCheck = ContentSafetyChecker.checkTextSafety(transcription.text);
    if (!textSafetyCheck.isSafe) {
      return res.status(400).json({
        success: false,
        message: 'Transcribed content contains inappropriate material',
        code: 'INAPPROPRIATE_TRANSCRIPTION',
        flaggedWords: textSafetyCheck.flaggedWords
      });
    }

    // Get user context
    const userContext = await getUserFinancialContext(userId);
    const user = await User.findById(userId);
    const language = user?.preferences?.language || 'en';

    // Generate AI response
    const aiResponse = await chatbot.generateResponse(transcription.text, userContext, language);

    if (!aiResponse.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate response',
        code: 'RESPONSE_GENERATION_ERROR'
      });
    }

    // Generate speech response
    const speechResponse = await VoiceProcessor.generateSpeech(aiResponse.response);

    // Clean up uploaded file
    require('fs').unlinkSync(req.file.path);

    res.json({
      success: true,
      data: {
        transcription: transcription.text,
        response: aiResponse.response,
        analysis: aiResponse.analysis,
        language: aiResponse.language,
        audioResponse: speechResponse.success ? {
          format: speechResponse.format,
          size: speechResponse.audioBuffer.length
        } : null,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Voice chat endpoint error:', error);
    
    // Clean up file if it exists
    if (req.file && require('fs').existsSync(req.file.path)) {
      require('fs').unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Voice chat service error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'VOICE_CHAT_ERROR'
    });
  }
});

// Image analysis endpoint
router.post('/analyze-image', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Image file is required',
        code: 'IMAGE_FILE_REQUIRED'
      });
    }

    const userId = req.user.userId;

    // Check image safety
    const safetyCheck = ContentSafetyChecker.checkImageSafety(req.file.path);
    if (!safetyCheck.isSafe) {
      return res.status(400).json({
        success: false,
        message: 'Image failed safety check',
        code: 'UNSAFE_IMAGE'
      });
    }

    // Analyze image with OpenAI Vision
    const imageAnalysis = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze this image and provide financial insights if it contains financial documents, receipts, or financial information. If it\'s not financial-related, just describe what you see.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${require('fs').readFileSync(req.file.path, 'base64')}`
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    const analysis = imageAnalysis.choices[0].message.content;

    // Clean up uploaded file
    require('fs').unlinkSync(req.file.path);

    res.json({
      success: true,
      data: {
        analysis,
        timestamp: new Date()
      }
    });
  } catch (error) {
    logger.error('Image analysis endpoint error:', error);
    
    // Clean up file if it exists
    if (req.file && require('fs').existsSync(req.file.path)) {
      require('fs').unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Image analysis service error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'IMAGE_ANALYSIS_ERROR'
    });
  }
});

// Get chat history (placeholder)
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // In a real implementation, you would store chat history in database
    // For now, return empty array
    res.json({
      success: true,
      data: {
        history: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0
        }
      }
    });
  } catch (error) {
    logger.error('Get chat history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'GET_HISTORY_ERROR'
    });
  }
});

// Helper function to get user financial context
async function getUserFinancialContext(userId) {
  try {
    const user = await User.findById(userId);
    const wallet = await Wallet.findByUserId(userId);
    const recentJobs = await Job.findByUser(userId, 'assigned', { limit: 5 });
    const savingsGoals = await SavingsGoal.find({ userId, isActive: true });

    // Calculate financial metrics
    const monthlyIncome = recentJobs.reduce((sum, job) => sum + job.priceKes, 0);
    const totalSaved = savingsGoals.reduce((sum, goal) => sum + goal.saved, 0);
    const savingsRate = monthlyIncome > 0 ? (totalSaved / monthlyIncome) * 100 : 0;

    return {
      monthlyIncome,
      monthlyExpenses: wallet?.statistics?.totalWithdrawals || 0,
      savingsRate,
      creditScore: null, // Would get from credit score service
      activeJobs: recentJobs.length,
      savingsGoals: savingsGoals.length,
      location: user?.location,
      skills: user?.skills || []
    };
  } catch (error) {
    logger.error('Failed to get user financial context:', error);
    return null;
  }
}

module.exports = router;