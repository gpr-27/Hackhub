require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const MongoStore = require('connect-mongo');

const app = express();

// Enhanced CORS configuration with credentials support
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000', 
      'http://localhost:3002', 
      'http://192.168.1.4:3000', 
      'http://192.168.1.4:3002',
      'https://mental-health-app-027.netlify.app'
    ];
    
    // Allow any Netlify subdomain for easier deployment
    if (origin && origin.includes('.netlify.app')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));

// Handle preflight OPTIONS requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
  res.sendStatus(200);
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB connection with fallback for development
const mongoConnectionString = process.env.MONGODB_CONNECTION_STRING || 'mongodb://localhost:27017/healthcareDB';

mongoose.connect(mongoConnectionString, {
  ssl: mongoConnectionString.includes('mongodb+srv'),
  tls: mongoConnectionString.includes('mongodb+srv'),
  tlsAllowInvalidCertificates: false,
  tlsAllowInvalidHostnames: false,
})
.then(() => console.log('Connected to MongoDB - Database: healthcareDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Please create a .env file with your MongoDB Atlas connection string');
  console.log('MONGODB_CONNECTION_STRING=mongodb+srv://username:password@cluster.mongodb.net/healthcareDB');
});

// JWT configuration
const jwtSecret = process.env.JWT_SECRET || 'health-app-jwt-secret-2024-production-key';

// Session configuration
const sessionSecret = process.env.SESSION_SECRET || 'default-session-secret-change-in-production';

// JWT helper functions
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      name: user.name 
    }, 
    jwtSecret, 
    { expiresIn: '7d' }
  );
};

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware that supports both JWT and session authentication
const authenticateUser = (req, res, next) => {
  // Try JWT first
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    try {
      const decoded = jwt.verify(token, jwtSecret);
      console.log('🔍 User authenticated via JWT:', decoded.email);
      req.user = {
        _id: decoded.id,
        email: decoded.email,
        name: decoded.name
      };
      return next();
    } catch (err) {
      console.log('❌ JWT verification failed:', err.message);
      // Don't return here, fall back to session
    }
  }
  
  // Fall back to session
  if (req.session.user) {
    console.log('🔍 User authenticated via session:', req.session.user.email);
    req.user = req.session.user;
    return next();
  }
  
  console.log('❌ User not authenticated - no valid JWT or session');
  return res.status(401).json({ error: 'Not authenticated' });
};

app.use(session({
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoConnectionString,
    ttl: 14 * 24 * 60 * 60, // 14 days
    autoRemove: 'native'
  }),
  cookie: {
    maxAge: 14 * 24 * 60 * 60 * 1000, // 14 days in milliseconds
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Only secure in production
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain: undefined // Let browser handle domain automatically
  }
}));

// Medication Schema
const MedicationSchema = new mongoose.Schema({
  name: String,
  time: String,
  dosage: String,
  tillDate: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});
const Medication = mongoose.model('Medication', MedicationSchema);

// Chat Message Schema
const ChatMessageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: String,
    enum: ['user', 'bot'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});
const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);

// Health Record Schemas
// Emergency Contact Schema
const EmergencyContactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  relationship: String,
  phone: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['family', 'medical', 'friend', 'work'],
    default: 'family'
  },
  dateAdded: {
    type: Date,
    default: Date.now
  }
});
const EmergencyContact = mongoose.model('EmergencyContact', EmergencyContactSchema);

// Health Profile Schema
const HealthProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dateOfBirth: String,
  gender: String,
  bloodType: String,
  height: String,
  weight: String,
  allergies: [String],
  chronicConditions: [String],
  emergencyContact: String,
  insurance: {
    provider: String,
    policyNumber: String,
    groupNumber: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});
const HealthProfile = mongoose.model('HealthProfile', HealthProfileSchema);

// Medical History Schema
const MedicalHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  condition: {
    type: String,
    required: true
  },
  diagnosisDate: String,
  doctor: String,
  treatment: String,
  status: {
    type: String,
    enum: ['active', 'resolved', 'chronic'],
    default: 'active'
  },
  notes: String,
  dateAdded: {
    type: Date,
    default: Date.now
  }
});
const MedicalHistory = mongoose.model('MedicalHistory', MedicalHistorySchema);

// Lab Report Schema
const LabReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testName: {
    type: String,
    required: true
  },
  testDate: String,
  doctor: String,
  results: String,
  normalRange: String,
  status: {
    type: String,
    enum: ['normal', 'abnormal', 'pending'],
    default: 'pending'
  },
  notes: String,
  dateAdded: {
    type: Date,
    default: Date.now
  }
});
const LabReport = mongoose.model('LabReport', LabReportSchema);

// Doctor Visit Schema
const DoctorVisitSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  specialty: String,
  visitDate: String,
  visitType: {
    type: String,
    enum: ['routine', 'emergency', 'follow-up', 'consultation', 'specialist'],
    default: 'routine'
  },
  status: {
    type: String,
    enum: ['completed', 'scheduled', 'cancelled', 'rescheduled'],
    default: 'completed'
  },
  symptoms: String,
  diagnosis: String,
  treatment: String,
  nextAppointment: String,
  notes: String,
  dateAdded: {
    type: Date,
    default: Date.now
  }
});
const DoctorVisit = mongoose.model('DoctorVisit', DoctorVisitSchema);

// Prescription Schema (different from Medication - this is doctor prescribed)
const PrescriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  medicationName: {
    type: String,
    required: true
  },
  dosage: String,
  frequency: String,
  duration: String,
  prescribedBy: String,
  prescriptionDate: String,
  instructions: String,
  refillsRemaining: Number,
  status: {
    type: String,
    enum: ['active', 'completed', 'discontinued'],
    default: 'active'
  },
  dateAdded: {
    type: Date,
    default: Date.now
  }
});
const Prescription = mongoose.model('Prescription', PrescriptionSchema);

// Vital Signs Schema
const VitalSignsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String,
    required: true
  },
  heartRate: Number,
  systolicBP: Number,
  diastolicBP: Number,
  temperature: Number,
  weight: Number,
  height: Number,
  bloodGlucose: Number,
  oxygenSaturation: Number,
  respiratoryRate: Number,
  status: {
    type: String,
    enum: ['normal', 'abnormal'],
    default: 'normal'
  },
  notes: String,
  dateAdded: {
    type: Date,
    default: Date.now
  }
});
const VitalSigns = mongoose.model('VitalSigns', VitalSignsSchema);

// Mood Schema
const MoodSchema = new mongoose.Schema({
  mood: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  notes: {
    type: String,
    default: ''
  },
  date: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});
const Mood = mongoose.model('Mood', MoodSchema);

// Get all medications for the logged-in user
app.get('/api/medications', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const meds = await Medication.find({ userId });
    res.json(meds);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch medications' });
  }
});

// Add a medication
app.post('/api/medications', authenticateUser, async (req, res) => {
  try {
    const { name, time, dosage, tillDate } = req.body;
    const userId = req.user._id;
    
    const med = new Medication({ name, time, dosage, tillDate, userId });
    await med.save();
    res.json(med);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add medication' });
  }
});

// Delete a medication by ID
app.delete('/api/medications/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Ensure the medication belongs to the logged-in user
    const medication = await Medication.findById(req.params.id);
    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    
    if (medication.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this medication' });
    }
    
    await Medication.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete medication' });
  }
});

// Update a medication by ID
app.put('/api/medications/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, time, dosage, tillDate } = req.body;
    
    // Ensure the medication belongs to the logged-in user
    const medication = await Medication.findById(req.params.id);
    if (!medication) {
      return res.status(404).json({ error: 'Medication not found' });
    }
    
    if (medication.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this medication' });
    }
    
    // Update the medication
    const updatedMedication = await Medication.findByIdAndUpdate(
      req.params.id, 
      { name, time, dosage, tillDate },
      { new: true } // Return the updated document
    );
    
    res.json(updatedMedication);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update medication' });
  }
});

// Mood API Endpoints

// Get all mood entries for the logged-in user
app.get('/api/moods', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const moods = await Mood.find({ userId }).sort({ date: -1, timestamp: -1 });
    res.json(moods);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mood entries' });
  }
});

// Add a mood entry
app.post('/api/moods', authenticateUser, async (req, res) => {
  try {
    const { mood, notes, date } = req.body;
    const userId = req.user._id;
    
    if (!mood || !date) {
      return res.status(400).json({ error: 'Mood and date are required' });
    }
    
    // Allow multiple mood entries per day - no constraint check needed
    
    const moodEntry = new Mood({ mood, notes: notes || '', date, userId });
    await moodEntry.save();
    res.json(moodEntry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add mood entry' });
  }
});

// Update a mood entry by ID
app.put('/api/moods/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const { mood, notes } = req.body;
    
    // Ensure the mood entry belongs to the logged-in user
    const moodEntry = await Mood.findById(req.params.id);
    if (!moodEntry) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }
    
    if (moodEntry.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to update this mood entry' });
    }
    
    // Update the mood entry
    const updatedMood = await Mood.findByIdAndUpdate(
      req.params.id, 
      { mood, notes },
      { new: true }
    );
    
    res.json(updatedMood);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update mood entry' });
  }
});

// Delete a mood entry by ID
app.delete('/api/moods/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Ensure the mood entry belongs to the logged-in user
    const moodEntry = await Mood.findById(req.params.id);
    if (!moodEntry) {
      return res.status(404).json({ error: 'Mood entry not found' });
    }
    
    if (moodEntry.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorized to delete this mood entry' });
    }
    
    await Mood.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete mood entry' });
  }
});

// User Schema
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    default: ''
  },
  dateOfBirth: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    enum: ['', 'male', 'female', 'other', 'prefer-not-to-say'],
    default: ''
  },
  address: {
    type: String,
    default: ''
  },
  lastLogin: {
    type: Date,
    default: () => new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000))
  },
  createdAt: {
    type: Date,
    default: () => new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000))
  },
  updatedAt: {
    type: Date,
    default: () => new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000))
  }
}, {
  timestamps: false // Using custom IST timestamps
});
const User = mongoose.model('User', UserSchema);

// Utility function to get IST time
const getISTTime = () => {
  return new Date(new Date().getTime() + (5.5 * 60 * 60 * 1000));
};

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'User already exists' });
    
    // Create user with IST timestamps
    const istTime = getISTTime();
    const user = new User({ 
      name, 
      email, 
      password,
      createdAt: istTime,
      updatedAt: istTime,
      lastLogin: istTime
    });
    await user.save();
    res.json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Update last login time to IST
    user.lastLogin = getISTTime();
    await user.save();
    
    // Store user in session (for compatibility)
    req.session.user = {
      _id: user._id,
      email: user.email,
      name: user.name
    };
    
    // Generate JWT token
    const token = generateToken(user);
    
    console.log('🔐 Login success - Session ID:', req.sessionID);
    console.log('🔐 Login success - Session data:', req.session);
    console.log('🔐 Login success - JWT token generated:', token.substring(0, 50) + '...');
    console.log('🔐 JWT Secret being used:', jwtSecret.substring(0, 10) + '...');
    
    res.json({ 
      id: user._id,
      email: user.email, 
      name: user.name, 
      isAuthenticated: true,
      lastLogin: user.lastLogin,
      token: token // Include JWT token in response
    });
  } catch (err) {
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

// Check if user is authenticated (supports both JWT and sessions)
app.get('/api/auth/check', (req, res) => {
  console.log('🔍 Auth check - Session ID:', req.sessionID);
  console.log('🔍 Auth check - Session data:', req.session);
  console.log('🔍 Auth check - Cookies:', req.headers.cookie);
  console.log('🔍 Auth check - Authorization header:', req.headers.authorization);
  
  // Try JWT first
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    console.log('🔍 JWT Token received:', token.substring(0, 50) + '...');
    console.log('🔍 JWT Secret for verification:', jwtSecret.substring(0, 10) + '...');
    try {
      const decoded = jwt.verify(token, jwtSecret);
      console.log('✅ User authenticated via JWT:', decoded);
      const response = {
        isAuthenticated: true,
        user: {
          id: decoded.id,
          name: decoded.name,
          email: decoded.email
        }
      };
      console.log('📤 Sending JWT auth response:', response);
      return res.status(200).json(response);
    } catch (err) {
      console.log('❌ JWT verification failed:', err.message);
      console.log('❌ JWT verification error details:', err);
    }
  }
  
  // Fall back to session
  if (req.session.user) {
    console.log('✅ User authenticated via session:', req.session.user);
    const response = {
      isAuthenticated: true,
      user: {
        id: req.session.user._id,
        name: req.session.user.name,
        email: req.session.user.email
      }
    };
    console.log('📤 Sending session auth response:', response);
    return res.status(200).json(response);
  } else {
    console.log('❌ User not authenticated - no session or token');
    const response = { isAuthenticated: false };
    console.log('📤 Sending unauthenticated response:', response);
    return res.status(200).json(response);
  }
});

// Get user profile
app.get('/api/auth/profile', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    
    // Fetch complete user data
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || null,
      phone: user.phone || '',
      dateOfBirth: user.dateOfBirth || '',
      gender: user.gender || '',
      address: user.address || '',
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile', details: err.message });
  }
});

// Update user profile
app.put('/api/auth/profile', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    
    const { name, email, avatar, phone, dateOfBirth, gender, address } = req.body;
    
    // Update user in database with IST timestamp
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        name,
        email,
        avatar,
        phone,
        dateOfBirth,
        gender,
        address,
        updatedAt: getISTTime()
      },
      { new: true }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Update session data if session exists
    if (req.session.user) {
      req.session.user.name = updatedUser.name;
      req.session.user.email = updatedUser.email;
    }
    
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        phone: updatedUser.phone,
        dateOfBirth: updatedUser.dateOfBirth,
        gender: updatedUser.gender,
        address: updatedUser.address,
        updatedAt: updatedUser.updatedAt,
        lastLogin: updatedUser.lastLogin
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile', details: err.message });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

// Health Chat API Endpoints
// Get chat history for the logged-in user
app.get('/api/chat/messages', authenticateUser, async (req, res) => {
  try {
    // Use the authenticated user's ID
    const userId = req.user._id;
    
    const messages = await ChatMessage.find({ userId })
      .sort({ timestamp: 1 })
      .limit(100);
    
    res.json(messages);
  } catch (err) {
    console.error('Error fetching chat messages:', err);
    res.status(500).json({ error: 'Failed to fetch chat messages' });
  }
});

// Save a new chat message
app.post('/api/chat/messages', authenticateUser, async (req, res) => {
  try {
    // Use the authenticated user's ID
    const userId = req.user._id;
    
    const { message, sender } = req.body;
    
    if (!message || !sender) {
      return res.status(400).json({ error: 'Message and sender are required' });
    }
    
    console.log('💾 Saving chat message for user:', req.user.email, 'User ID:', userId);
    
    const chatMessage = new ChatMessage({
      userId,
      message,
      sender
    });
    
    const savedMessage = await chatMessage.save();
    console.log('✅ Chat message saved successfully:', savedMessage._id);
    res.json(savedMessage);
  } catch (err) {
    console.error('❌ Error saving chat message:', err);
    res.status(500).json({ error: 'Failed to save chat message' });
  }
});

// Smart Health Record API Endpoints

// Emergency Contacts APIs
app.get('/api/emergency-contacts', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const contacts = await EmergencyContact.find({ userId }).sort({ dateAdded: -1 });
    res.json(contacts);
  } catch (err) {
    console.error('Error fetching emergency contacts:', err);
    res.status(500).json({ error: 'Failed to fetch emergency contacts' });
  }
});

app.post('/api/emergency-contacts', authenticateUser, async (req, res) => {
  try {
    const userId = req.user._id;
    const contact = new EmergencyContact({ ...req.body, userId });
    const savedContact = await contact.save();
    res.json(savedContact);
  } catch (err) {
    console.error('Error adding emergency contact:', err);
    res.status(500).json({ error: 'Failed to add emergency contact', details: err.message });
  }
});

app.put('/api/emergency-contacts/:id', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const contact = await EmergencyContact.findById(req.params.id);
    if (!contact || contact.userId.toString() !== userId.toString()) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    const updatedContact = await EmergencyContact.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, userId }, 
      { new: true }
    );
    res.json(updatedContact);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update emergency contact' });
  }
});

app.delete('/api/emergency-contacts/:id', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const contact = await EmergencyContact.findById(req.params.id);
    if (!contact || contact.userId.toString() !== userId.toString()) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    await EmergencyContact.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete emergency contact' });
  }
});

// Health Profile APIs
app.get('/api/health-profile', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const profile = await HealthProfile.findOne({ userId });
    res.json(profile || {});
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch health profile' });
  }
});

app.post('/api/health-profile', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const existingProfile = await HealthProfile.findOne({ userId });
    
    if (existingProfile) {
      const updatedProfile = await HealthProfile.findByIdAndUpdate(
        existingProfile._id,
        { ...req.body, userId, lastUpdated: new Date() },
        { new: true }
      );
      res.json(updatedProfile);
    } else {
      const profile = new HealthProfile({ ...req.body, userId });
      await profile.save();
      res.json(profile);
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to save health profile' });
  }
});

// Medical History APIs
app.get('/api/medical-history', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const history = await MedicalHistory.find({ userId }).sort({ dateAdded: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch medical history' });
  }
});

app.post('/api/medical-history', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const record = new MedicalHistory({ ...req.body, userId });
    await record.save();
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add medical history record' });
  }
});

app.put('/api/medical-history/:id', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const record = await MedicalHistory.findById(req.params.id);
    if (!record || record.userId.toString() !== userId.toString()) {
      return res.status(404).json({ error: 'Record not found' });
    }
    const updatedRecord = await MedicalHistory.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, userId }, 
      { new: true }
    );
    res.json(updatedRecord);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update medical history record' });
  }
});

app.delete('/api/medical-history/:id', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const record = await MedicalHistory.findById(req.params.id);
    if (!record || record.userId.toString() !== userId.toString()) {
      return res.status(404).json({ error: 'Record not found' });
    }
    await MedicalHistory.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete medical history record' });
  }
});

// Lab Reports APIs
app.get('/api/lab-reports', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const reports = await LabReport.find({ userId }).sort({ dateAdded: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lab reports' });
  }
});

app.post('/api/lab-reports', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const report = new LabReport({ ...req.body, userId });
    await report.save();
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add lab report' });
  }
});

app.put('/api/lab-reports/:id', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const report = await LabReport.findById(req.params.id);
    if (!report || report.userId.toString() !== userId.toString()) {
      return res.status(404).json({ error: 'Report not found' });
    }
    const updatedReport = await LabReport.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, userId }, 
      { new: true }
    );
    res.json(updatedReport);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update lab report' });
  }
});

app.delete('/api/lab-reports/:id', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const report = await LabReport.findById(req.params.id);
    if (!report || report.userId.toString() !== userId.toString()) {
      return res.status(404).json({ error: 'Report not found' });
    }
    await LabReport.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete lab report' });
  }
});

// Doctor Visits APIs
app.get('/api/doctor-visits', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const visits = await DoctorVisit.find({ userId }).sort({ dateAdded: -1 });
    res.json(visits);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch doctor visits' });
  }
});

app.post('/api/doctor-visits', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const visit = new DoctorVisit({ ...req.body, userId });
    await visit.save();
    res.json(visit);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add doctor visit' });
  }
});

app.put('/api/doctor-visits/:id', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const visit = await DoctorVisit.findById(req.params.id);
    if (!visit || visit.userId.toString() !== userId.toString()) {
      return res.status(404).json({ error: 'Visit not found' });
    }
    const updatedVisit = await DoctorVisit.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, userId }, 
      { new: true }
    );
    res.json(updatedVisit);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update doctor visit' });
  }
});

app.delete('/api/doctor-visits/:id', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const visit = await DoctorVisit.findById(req.params.id);
    if (!visit || visit.userId.toString() !== userId.toString()) {
      return res.status(404).json({ error: 'Visit not found' });
    }
    await DoctorVisit.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete doctor visit' });
  }
});

// Prescriptions APIs
app.get('/api/prescriptions', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const prescriptions = await Prescription.find({ userId }).sort({ dateAdded: -1 });
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

app.post('/api/prescriptions', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const prescription = new Prescription({ ...req.body, userId });
    await prescription.save();
    res.json(prescription);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add prescription' });
  }
});

app.put('/api/prescriptions/:id', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription || prescription.userId.toString() !== userId.toString()) {
      return res.status(404).json({ error: 'Prescription not found' });
    }
    const updatedPrescription = await Prescription.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, userId }, 
      { new: true }
    );
    res.json(updatedPrescription);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update prescription' });
  }
});

app.delete('/api/prescriptions/:id', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription || prescription.userId.toString() !== userId.toString()) {
      return res.status(404).json({ error: 'Prescription not found' });
    }
    await Prescription.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete prescription' });
  }
});

// Vital Signs APIs
app.get('/api/vital-signs', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const vitals = await VitalSigns.find({ userId }).sort({ date: -1, dateAdded: -1 });
    res.json(vitals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vital signs' });
  }
});

app.post('/api/vital-signs', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const vitals = new VitalSigns({ ...req.body, userId });
    await vitals.save();
    res.json(vitals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add vital signs' });
  }
});

app.put('/api/vital-signs/:id', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const vitals = await VitalSigns.findById(req.params.id);
    if (!vitals || vitals.userId.toString() !== userId.toString()) {
      return res.status(404).json({ error: 'Vital signs record not found' });
    }
    const updatedVitals = await VitalSigns.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, userId }, 
      { new: true }
    );
    res.json(updatedVitals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update vital signs record' });
  }
});

app.delete('/api/vital-signs/:id', authenticateUser, async (req, res) => {
  try {
    // Authentication handled by authenticateUser middleware
    const userId = req.user._id;
    const vitals = await VitalSigns.findById(req.params.id);
    if (!vitals || vitals.userId.toString() !== userId.toString()) {
      return res.status(404).json({ error: 'Vital signs record not found' });
    }
    await VitalSigns.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete vital signs record' });
  }
});

// Test endpoint to verify server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working properly' });
});

// Database info endpoint - to check MongoDB collections and structure
app.get('/api/db-info', async (req, res) => {
  try {
    // Get database information
    const dbName = mongoose.connection.name;
    
    // Get collections information
    const collections = await mongoose.connection.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Get counts for each collection
    const counts = {};
    for (const name of collectionNames) {
      counts[name] = await mongoose.connection.db.collection(name).countDocuments();
    }
    
    // Get sample data from chatmessages collection if it exists
    let chatMessageSample = [];
    if (collectionNames.includes('chatmessages')) {
      chatMessageSample = await mongoose.connection.db
        .collection('chatmessages')
        .find({})
        .limit(5)
        .toArray();
    }
    
    res.json({
      database: dbName,
      collections: collectionNames,
      documentCounts: counts,
      chatMessageSample
    });
  } catch (err) {
    console.error('Error getting database info:', err);
    res.status(500).json({ error: 'Failed to get database info', details: err.message });
  }
});

// User lookup endpoint - to identify users by ID
app.get('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ error: 'Failed to fetch user', details: err.message });
  }
});

// Get all users endpoint - for debugging
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude password field
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users', details: err.message });
  }
});

app.listen(3001, () => console.log('Server running on port 3001'));