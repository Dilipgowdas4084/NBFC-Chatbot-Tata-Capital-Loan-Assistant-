import { ChatState, AgentResponse, Offer } from '../types';
import offersData from '../data/offers.json';
import { generateSalesResponse } from './gemini';

const offers = offersData as Record<string, Offer>;

export const salesAgent = async (state: ChatState, message: string): Promise<AgentResponse> => {
    const offer = offers[state.customerId];
    const customerProfile = {
        name: "Valued Customer",
        // In real app, fetch name from customer DB using state.customerId
    };

    // Call Gemini
    const { botMessage, extracted } = await generateSalesResponse(
        state.conversationHistory,
        message,
        customerProfile,
        offer
    );

    // Update State based on extraction
    if (extracted.amount) {
        state.loanDetails = { ...state.loanDetails, amount: extracted.amount };
    }

    if (extracted.tenure) {
        // Validate tenure if needed, or rely on Gemini's negotiation prompt
        state.loanDetails = { ...state.loanDetails, tenure: extracted.tenure };
    }

    // Determine Next State
    // If we have both Amount and Tenure, and the intent was likely confirmation or providing details
    if (state.loanDetails?.amount && state.loanDetails?.tenure && extracted.intent !== 'NEGOTIATION') {
        // We can move to KYC
        // But we should check if the bot message was a "closing" statement. 
        // For MVP, if we have details, we assume the bot's message led to this.

        // However, we need to respect the bot's flow. 
        // If Gemini *asked* for confirmation ("Shall we proceed?"), we are still technically in sales until user says Yes.
        // But if the user JUST provided the tenure, Gemini might have said "Great, let's verify".

        // Let's use a heuristic: if we have details, suggest CONFIRM_KYC action
        // The frontend/master agent will handle the user's "Yes" in the NEXT turn.
        // Wait, Master Agent handles 'KYC' state transition on "Yes".
        // So Sales Agent should return 'KYC' or 'COLLECTING' depending on if we are "done".

        return {
            nextState: 'KYC', // Master agent will switch to Verification only after user CONFIRMS this state prompt
            botMessage: botMessage,
            actions: ['CONFIRM_KYC']
        };
    }

    // Default stay in loop
    return {
        nextState: 'COLLECTING_LOAN_DETAILS',
        botMessage: botMessage,
        actions: []
    };
};
