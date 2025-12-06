import { ChatState, AgentResponse, Customer } from '../types';
import { generateSanctionLetter } from '../utils/pdfGenerator';
import customersData from '../data/customers.json';
import fs from 'fs';
import path from 'path';

const customers = customersData as Customer[];

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

const readApplications = (): Application[] => {
    try {
        const data = fs.readFileSync(applicationsFilePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading applications:', error);
        return [];
    }
};

const writeApplications = (applications: Application[]): void => {
    try {
        fs.writeFileSync(applicationsFilePath, JSON.stringify(applications, null, 4));
    } catch (error) {
        console.error('Error writing applications:', error);
    }
};

export const sanctionAgent = async (state: ChatState): Promise<AgentResponse> => {
    const customer = customers.find(c => c.id === state.customerId);
    if (!customer || !state.sanctionDetails) {
        return {
            nextState: 'REJECTED',
            botMessage: "Error generating sanction letter. Data missing.",
            actions: []
        };
    }

    // Generate PDF
    const applicationId = `APP${Date.now()}`;
    const pdfData = {
        applicationId,
        customerName: customer.name,
        sanctionedAmount: state.sanctionDetails.sanctionedAmount || state.loanDetails?.amount || 0,
        tenure: state.sanctionDetails.tenure || state.loanDetails?.tenure || 12,
        interestRate: state.sanctionDetails.interestRate || 0.15,
        emi: state.sanctionDetails.emi || 0
    };

    try {
        await generateSanctionLetter(pdfData);
        console.log(`Sanction letter generated for application: ${applicationId}`);
    } catch (err) {
        console.error("PDF Generation Failed:", err);
    }

    // Save application to recent applications
    try {
        const applications = readApplications();
        const newApplication: Application = {
            id: applicationId,
            customerId: state.customerId,
            date: new Date().toISOString().split('T')[0],
            amount: pdfData.sanctionedAmount,
            status: 'Approved',
            tenure: pdfData.tenure,
            interestRate: pdfData.interestRate,
            emi: pdfData.emi
        };
        applications.unshift(newApplication);
        writeApplications(applications);
        console.log(`Application ${applicationId} saved to recent applications`);
    } catch (err) {
        console.error("Failed to save application:", err);
    }

    return {
        nextState: 'APPROVED',
        botMessage: `📄 Your sanction letter has been generated successfully!\n\nReference: ${applicationId}\n\nPlease download and save it for your records.`,
        actions: ['DOWNLOAD_SANCTION_LETTER'],
        meta: { 
            applicationId,
            loanAmount: pdfData.sanctionedAmount,
            tenure: pdfData.tenure,
            emi: pdfData.emi,
            interestRate: pdfData.interestRate
        }
    };
};
