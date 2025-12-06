import express from 'express';
import fs from 'fs';
import path from 'path';

const router = express.Router();

interface Application {
    id: string;
    customerId: string;
    date: string;
    amount: number;
    status: 'Approved' | 'Pending' | 'Rejected';
    tenure: number;
    interestRate: number;
    emi: number;
}

const applicationsFilePath = path.join(__dirname, '../data/applications.json');

// Helper to read applications from file
const readApplications = (): Application[] => {
    try {
        const data = fs.readFileSync(applicationsFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading applications:', error);
        return [];
    }
};

// Helper to write applications to file
const writeApplications = (applications: Application[]): void => {
    try {
        fs.writeFileSync(applicationsFilePath, JSON.stringify(applications, null, 4));
    } catch (error) {
        console.error('Error writing applications:', error);
    }
};

// GET /api/applications/:customerId - Get all applications for a customer
router.get('/:customerId', (req, res) => {
    const { customerId } = req.params;
    const applications = readApplications();
    const customerApplications = applications.filter(app => app.customerId === customerId);
    
    // Sort by date descending (most recent first)
    customerApplications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    res.json(customerApplications);
});

// POST /api/applications - Add a new application
router.post('/', (req, res) => {
    const { id, customerId, amount, status, tenure, interestRate, emi } = req.body;
    
    if (!id || !customerId || !amount) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const applications = readApplications();
    
    const newApplication: Application = {
        id,
        customerId,
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        amount,
        status: status || 'Approved',
        tenure: tenure || 12,
        interestRate: interestRate || 0.15,
        emi: emi || 0
    };

    applications.unshift(newApplication); // Add to beginning of array
    writeApplications(applications);

    console.log(`New application added: ${id} for customer ${customerId}`);
    
    res.status(201).json(newApplication);
});

// PUT /api/applications/:applicationId - Update an application status
router.put('/:applicationId', (req, res) => {
    const { applicationId } = req.params;
    const updates = req.body;
    
    const applications = readApplications();
    const index = applications.findIndex(app => app.id === applicationId);
    
    if (index === -1) {
        return res.status(404).json({ error: 'Application not found' });
    }

    applications[index] = { ...applications[index], ...updates };
    writeApplications(applications);

    res.json(applications[index]);
});

export default router;
