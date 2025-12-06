export interface Customer {
    id: string;
    name: string;
    age: number;
    city: string;
    pan: string;
    phone: string;
    address: string;
    salary: number;
    currentLoans: number;
    preApprovedLimit: number;
}

export interface Offer {
    preApprovedAmount: number;
    baseInterestRate: number;
    tenureMonths: number[];
}

export interface ChatState {
    sessionId: string;
    customerId: string;
    conversationHistory: { role: 'user' | 'bot'; content: string }[];
    currentState: 'START' | 'COLLECTING_LOAN_DETAILS' | 'KYC' | 'UNDERWRITING' | 'SALARY_SLIP_UPLOAD' | 'APPROVED' | 'REJECTED';
    loanDetails?: {
        amount?: number;
        tenure?: number;
        purpose?: string;
    };
    kycStatus?: 'VERIFIED' | 'FAILED' | 'PENDING';
    underwritingDecision?: 'APPROVED' | 'REJECTED' | 'NEED_SALARY_SLIP';
    sanctionDetails?: {
        applicationId?: string;
        sanctionedAmount?: number;
        interestRate?: number;
        emi?: number;
        tenure?: number;
    };
}

export interface AgentResponse {
    nextState: ChatState['currentState'];
    botMessage: string;
    actions?: string[];
    meta?: any;
}
