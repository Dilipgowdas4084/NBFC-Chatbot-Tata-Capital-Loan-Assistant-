import axios from 'axios';

// Use environment variable for API URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const sendMessage = async (
    sessionId: string,
    customerId: string,
    latestUserMessage: string,
    currentState: string,
    action?: string
) => {
    const response = await axios.post(`${API_BASE_URL}/chat/message`, {
        sessionId,
        customerId,
        latestUserMessage,
        currentState,
        action
    });
    return response.data;
};

export const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
    return response.data;
};

export const getSanctionLetterUrl = (applicationId: string) => {
    return `${API_BASE_URL}/sanction-letter/${applicationId}`;
};

// Applications API
export interface Application {
    id: string;
    customerId: string;
    date: string;
    amount: number;
    status: 'Approved' | 'Pending' | 'Rejected';
    tenure: number;
    interestRate: number;
    emi: number;
}

export const getApplications = async (customerId: string): Promise<Application[]> => {
    const response = await axios.get(`${API_BASE_URL}/applications/${customerId}`);
    return response.data;
};

export const addApplication = async (application: Partial<Application>): Promise<Application> => {
    const response = await axios.post(`${API_BASE_URL}/applications`, application);
    return response.data;
};
