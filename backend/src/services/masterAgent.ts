import { ChatState, AgentResponse } from '../types';
import { salesAgent } from './salesAgent';
import { verificationAgent } from './verificationAgent';
import { underwritingAgent } from './underwritingAgent';
import { sanctionAgent } from './sanctionAgent';
import { calculateEMI } from '../utils/emiCalculator';
import customersData from '../data/customers.json';
import creditScoresData from '../data/creditScores.json';
import offersData from '../data/offers.json';

const customers = customersData as any[];
const creditScores = creditScoresData as Record<string, number>;
const offers = offersData as any;

// Helper to format currency
const formatCurrency = (amount: number): string => `₹${amount.toLocaleString('en-IN')}`;

// Helper function to generate loan calculation table
const generateEMICalculationTable = (
    amount: number,
    interestRate: number,
    tenures: number[] = [12, 24, 36]
): string => {
    let table = `📊 **EMI CALCULATION TABLE**\n\n`;
    table += `**Loan Amount:** ${formatCurrency(amount)}\n`;
    table += `**Interest Rate:** ${(interestRate * 100).toFixed(1)}% p.a.\n\n`;
    table += `| Tenure | EMI | Total Interest | Total Payment |\n`;
    table += `|--------|-----|----------------|---------------|\n`;
    
    for (const tenure of tenures) {
        const emi = calculateEMI(amount, interestRate, tenure);
        const totalPayment = emi * tenure;
        const totalInterest = totalPayment - amount;
        table += `| ${tenure} months | ${formatCurrency(emi)} | ${formatCurrency(totalInterest)} | ${formatCurrency(totalPayment)} |\n`;
    }
    
    table += `\n💡 Choose a tenure that fits your monthly budget!`;
    return table;
};

// Helper function to handle conversational queries
const handleConversationalQuery = (
    state: ChatState,
    message: string
): AgentResponse | null => {
    const lowerMessage = message.toLowerCase();
    const customer = customers.find(c => c.id === state.customerId);
    const creditScore = customer ? (creditScores[customer.pan] || 650) : 650;
    const preApprovedLimit = customer ? (offers[state.customerId]?.preApprovedAmount || customer.preApprovedLimit || 0) : 0;
    const interestRate = offers[state.customerId]?.baseInterestRate || 0.15;

    // Check for "why" questions about rejection
    if (lowerMessage.includes('why') && (lowerMessage.includes('reject') || lowerMessage.includes('denied') || lowerMessage.includes('not approved'))) {
        let reasons: string[] = [];
        
        if (creditScore < 700) {
            reasons.push(`• Your credit score is ${creditScore}, but we require a minimum of 700 for loan approval`);
        }
        
        const requestedAmount = state.loanDetails?.amount || 0;
        if (requestedAmount > 2 * preApprovedLimit) {
            reasons.push(`• The requested amount ${formatCurrency(requestedAmount)} exceeds 2× your pre-approved limit of ${formatCurrency(preApprovedLimit)}`);
        }

        if (reasons.length === 0) {
            reasons.push("• The loan application didn't meet our current eligibility criteria");
        }

        return {
            nextState: state.currentState,
            botMessage: `📋 **Here's why your application wasn't approved:**\n\n${reasons.join('\n')}\n\n💡 **What you can do:**\n• Improve your credit score by paying existing dues on time\n• Try applying for a smaller amount within your limit\n• Contact our support team for personalized guidance\n\nWould you like to try a new application with a different amount?`,
            actions: ['TRY_AGAIN']
        };
    }

    // Check for EMI calculation requests (e.g., "calculate emi for 50000" or "emi for 100000")
    const emiCalcMatch = lowerMessage.match(/(?:calculate|show|what(?:'s| is)?|compute)?\s*(?:emi|loan|payment)?\s*(?:for|of|on)?\s*(?:rs\.?|₹|inr)?\s*(\d{4,9})/i);
    if (emiCalcMatch && (lowerMessage.includes('emi') || lowerMessage.includes('calculate') || lowerMessage.includes('loan detail') || lowerMessage.includes('breakdown'))) {
        const amount = parseInt(emiCalcMatch[1]);
        const table = generateEMICalculationTable(amount, interestRate);
        
        return {
            nextState: state.currentState,
            botMessage: table + `\n\nWould you like to apply for this loan amount?`,
            actions: []
        };
    }

    // Check for questions about eligibility/criteria
    if (lowerMessage.includes('eligib') || lowerMessage.includes('criteria') || lowerMessage.includes('qualify') || lowerMessage.includes('requirement')) {
        return {
            nextState: state.currentState,
            botMessage: `📋 **Loan Eligibility Criteria:**\n\n✅ **Instant Approval:**\n• Amount ≤ Pre-approved limit (${formatCurrency(preApprovedLimit)})\n• Credit score ≥ 700\n\n📄 **With Salary Verification:**\n• Amount up to 2× pre-approved limit (${formatCurrency(preApprovedLimit * 2)})\n• EMI should be ≤ 50% of monthly salary\n• Credit score ≥ 700\n\n❌ **Not Eligible:**\n• Amount > 2× pre-approved limit\n• Credit score < 700\n\nYour current credit score: ${creditScore}\nYour pre-approved limit: ${formatCurrency(preApprovedLimit)}\n\nWould you like to proceed with a loan application?`,
            actions: []
        };
    }

    // Check for credit score questions
    if (lowerMessage.includes('credit score') || lowerMessage.includes('cibil') || lowerMessage.includes('my score')) {
        const scoreStatus = creditScore >= 700 ? '✅ Excellent! You meet our criteria.' : '⚠️ Below our minimum requirement of 700.';
        return {
            nextState: state.currentState,
            botMessage: `📊 **Your Credit Score: ${creditScore}**\n\n${scoreStatus}\n\n💡 **Tips to improve your score:**\n• Pay all EMIs and credit card bills on time\n• Keep credit utilization below 30%\n• Avoid multiple loan applications in short periods\n• Check your credit report for errors\n\nIs there anything else you'd like to know?`,
            actions: []
        };
    }

    // Check for limit/amount questions
    if (lowerMessage.includes('limit') || lowerMessage.includes('maximum') || lowerMessage.includes('how much can i') || lowerMessage.includes('eligible amount')) {
        return {
            nextState: state.currentState,
            botMessage: `💰 **Your Loan Limits:**\n\n🟢 **Instant Approval:** Up to ${formatCurrency(preApprovedLimit)}\n🟡 **With Salary Proof:** Up to ${formatCurrency(preApprovedLimit * 2)}\n\nThese limits are based on your profile and credit history. Would you like to apply for a loan?`,
            actions: []
        };
    }

    // Check for interest rate questions  
    if (lowerMessage.includes('interest') || lowerMessage.includes('rate')) {
        return {
            nextState: state.currentState,
            botMessage: `📈 **Interest Rate Information:**\n\n• Your personalized rate: **${(interestRate * 100).toFixed(1)}% p.a.**\n• EMI calculated on reducing balance\n• No hidden charges\n• Flexible tenures: 12, 24, or 36 months\n\n💡 Type "calculate emi for [amount]" to see detailed breakdown!\nExample: "calculate emi for 100000"`,
            actions: []
        };
    }

    // Check for EMI-only questions (without amount)
    if (lowerMessage.includes('emi') && !emiCalcMatch) {
        const sampleAmount = preApprovedLimit > 0 ? preApprovedLimit : 100000;
        const table = generateEMICalculationTable(sampleAmount, interestRate);
        
        return {
            nextState: state.currentState,
            botMessage: `Here's a sample EMI calculation for ${formatCurrency(sampleAmount)}:\n\n${table}\n\n💡 Want EMI for a different amount? Just say "calculate emi for [amount]"\nExample: "calculate emi for 200000"`,
            actions: []
        };
    }

    // Check for loan details of current application
    if ((lowerMessage.includes('loan detail') || lowerMessage.includes('my loan') || lowerMessage.includes('show detail') || lowerMessage.includes('breakdown')) && state.loanDetails?.amount) {
        const amount = state.loanDetails.amount;
        const tenure = state.loanDetails.tenure || 12;
        const emi = calculateEMI(amount, interestRate, tenure);
        const totalPayment = emi * tenure;
        const totalInterest = totalPayment - amount;
        const processingFee = Math.round(amount * 0.02);

        return {
            nextState: state.currentState,
            botMessage: `📋 **Your Current Loan Application:**\n\n| Description | Amount |\n|-------------|--------|\n| Principal Amount | ${formatCurrency(amount)} |\n| Interest Rate | ${(interestRate * 100).toFixed(1)}% p.a. |\n| Tenure | ${tenure} months |\n| **Monthly EMI** | **${formatCurrency(emi)}** |\n| Total Interest | ${formatCurrency(totalInterest)} |\n| Processing Fee (2%) | ${formatCurrency(processingFee)} |\n| **Total Repayment** | **${formatCurrency(totalPayment)}** |\n| **Total Cost** | **${formatCurrency(totalPayment + processingFee)}** |\n\nIs there anything you'd like to change?`,
            actions: []
        };
    }

    // Check for help/support
    if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('contact') || lowerMessage.includes('speak to')) {
        return {
            nextState: state.currentState,
            botMessage: `🤝 **How can I help you?**\n\nI can assist you with:\n• 💰 Checking your loan eligibility\n• 📊 Understanding your credit score\n• 💳 Applying for a personal loan\n• 🧮 Calculating EMI (try "calculate emi for 100000")\n• 📋 Explaining rejection reasons\n• 📞 Connecting you to support\n\n**Need human assistance?**\nCall: 1800-XXX-XXXX (Toll Free)\nEmail: support@tatacapital.com\n\nWhat would you like to do?`,
            actions: []
        };
    }

    // Check for "try again" or "new application"
    if (lowerMessage.includes('try again') || lowerMessage.includes('new application') || lowerMessage.includes('start over') || lowerMessage.includes('apply again')) {
        return {
            nextState: 'START',
            botMessage: `🔄 Sure! Let's start fresh.\n\nHello ${customer?.name || 'there'}! 👋\n\nI see you have a pre-approved loan offer of up to ${formatCurrency(preApprovedLimit)}! Would you like to proceed with a new loan application?`,
            actions: []
        };
    }

    return null; // No conversational match, continue with normal flow
};

export const masterAgent = async (
    state: ChatState,
    latestUserMessage: string
): Promise<AgentResponse> => {
    console.log(`[MasterAgent] Current State: ${state.currentState}`);

    // First, check for conversational queries that can be answered in any state
    const conversationalResponse = handleConversationalQuery(state, latestUserMessage);
    if (conversationalResponse) {
        console.log(`[MasterAgent] Handled conversational query`);
        return conversationalResponse;
    }

    let response: AgentResponse = {
        nextState: state.currentState,
        botMessage: "I didn't understand that. Could you please rephrase? You can ask me about your eligibility, credit score, or loan limits.",
        actions: []
    };

    switch (state.currentState) {
        case 'START':
            response = await salesAgent(state, latestUserMessage);
            break;

        case 'COLLECTING_LOAN_DETAILS':
            response = await salesAgent(state, latestUserMessage);
            break;

        case 'KYC':
            response = verificationAgent(state);
            break;

        case 'UNDERWRITING':
            response = underwritingAgent(state, false);
            break;

        case 'SALARY_SLIP_UPLOAD':
            response = underwritingAgent(state, true);
            break;

        case 'APPROVED':
            response = await sanctionAgent(state);
            break;

        case 'REJECTED':
            // More helpful message for rejected state
            response = {
                nextState: 'REJECTED',
                botMessage: "Your application has been closed. You can ask me:\n• **'Why was I rejected?'** - to understand the reasons\n• **'What are the eligibility criteria?'** - to know requirements\n• **'Try again'** - to start a new application\n\nHow can I help you?",
                actions: ['TRY_AGAIN', 'EXPLAIN_REJECTION']
            };
            break;

        default:
            response = {
                nextState: 'START',
                botMessage: "Let's start over. How can I help you with your loan needs today?",
                actions: []
            };
    }

    return response;
};
