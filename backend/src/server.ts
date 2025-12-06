import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
import multer from 'multer';
import chatbotRoutes from './routes/chatbot';
import applicationsRoutes from './routes/applications';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - allow all origins for deployed app
app.use(cors({
    origin: [
        'http://localhost:5173', 
        'http://localhost:5174', 
        'http://127.0.0.1:5173',
        'https://nbfc-chatbot-tata-capital-loan-assistant-888g.onrender.com',
        'https://nbfc-chatbot-tata-capital-loan-assistant.onrender.com',
        /\.onrender\.com$/,  // Allow all Render subdomains
        /\.vercel\.app$/     // Allow all Vercel subdomains
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check / root route
app.get('/', (req, res) => {
    res.json({ status: 'ok', message: 'NBFC Chatbot API is running' });
});

// File Upload Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `salary_slip_${Date.now()}_${file.originalname}`);
    }
});
const upload = multer({ storage });

// Create uploads dir if not exists
import fs from 'fs';
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Routes
app.use('/api/chat', chatbotRoutes);
app.use('/api/applications', applicationsRoutes);

// Upload Route
app.post('/api/upload', upload.single('file'), (req, res) => {
    // In a real app, we would process the file here.
    // For MVP, we just accept it and return success.
    res.json({ success: true, message: 'File uploaded successfully' });
});

// Download Route for Sanction Letter
app.get('/api/sanction-letter/:applicationId', (req, res) => {
    const { applicationId } = req.params;
    const filePath = path.join(__dirname, '../uploads', `sanction_${applicationId}.pdf`);

    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).json({ error: 'File not found' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
