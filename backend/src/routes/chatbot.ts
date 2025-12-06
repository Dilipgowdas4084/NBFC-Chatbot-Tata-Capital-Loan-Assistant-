import express from 'express';
import { masterAgent } from '../services/masterAgent';
import { ChatState } from '../types';

const router = express.Router();

// In-memory session store for MVP
const sessions: Record<string, ChatState> = {};

router.post('/message', async (req, res) => {
    try {
        const { sessionId, customerId, latestUserMessage, currentState, action } = req.body;

        console.log(`Received message: ${latestUserMessage} | State: ${currentState} | Action: ${action}`);

        // Initialize session if not exists
        if (!sessions[sessionId]) {
            sessions[sessionId] = {
                sessionId,
                customerId,
                conversationHistory: [],
                currentState: 'START'
            };
        }

        const session = sessions[sessionId];

        // Update session with request data
        // For stateless-ish behavior, we trust the frontend state mostly, 
        // but keeping server session helps with persistence if needed.
        // For this MVP we'll sync them.
        session.currentState = currentState || session.currentState;
        if (latestUserMessage) {
            session.conversationHistory.push({ role: 'user', content: latestUserMessage });
        }

        // Pass to Master Agent
        const response = await masterAgent(session, latestUserMessage || '');

        // Update session
        session.currentState = response.nextState;
        session.conversationHistory.push({ role: 'bot', content: response.botMessage });

        // Merge meta into session if needed (e.g. loanDetails, sanctionDetails)
        if (response.meta) {
            if (response.meta.loanAmount) {
                session.loanDetails = {
                    amount: response.meta.loanAmount,
                    tenure: response.meta.tenure
                };
            }
            if (response.meta.kycStatus) {
                session.kycStatus = response.meta.kycStatus;
            }
            if (response.meta.decision) {
                session.underwritingDecision = response.meta.decision;
                
                // If loan is approved, set up sanction details
                if (response.meta.decision === 'APPROVED') {
                    session.sanctionDetails = {
                        sanctionedAmount: response.meta.loanAmount || session.loanDetails?.amount || 0,
                        tenure: response.meta.tenure || session.loanDetails?.tenure || 12,
                        interestRate: response.meta.interestRate || 0.15,
                        emi: response.meta.emi || 0
                    };
                }
            }
            if (response.meta.applicationId) {
                session.sanctionDetails = {
                    ...session.sanctionDetails,
                    applicationId: response.meta.applicationId,
                    sanctionedAmount: response.meta.loanAmount || session.sanctionDetails?.sanctionedAmount || session.loanDetails?.amount || 0,
                    tenure: response.meta.tenure || session.sanctionDetails?.tenure || 12,
                    interestRate: response.meta.interestRate || session.sanctionDetails?.interestRate || 0.15,
                    emi: response.meta.emi || session.sanctionDetails?.emi || 0
                };
            }
        }

        res.json({
            botMessage: response.botMessage,
            nextState: response.nextState,
            actions: response.actions,
            meta: response.meta
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
