import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("GEMINI_API_KEY is not set. Falling back to regex mode or error.");
}

const genAI = new GoogleGenerativeAI(API_KEY || '');
// Using gemini-2.0-flash - the latest available model
// Make sure the API key has access to the Generative Language API.
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

interface ExtractionResult {
    amount?: number;
    tenure?: number;
    intent?: 'LOAN_INQUIRY' | 'OFF_TOPIC' | 'NEGOTIATION' | 'OTHER';
    sentiment?: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'HESITANT';
}

export const generateSalesResponse = async (
    conversationHistory: { role: string, content: string }[],
    latestUserMessage: string,
    customerProfile: any,
    currentOffer: any
): Promise<{ botMessage: string, extracted: ExtractionResult }> => {

    if (!API_KEY) {
        return {
            botMessage: "System Error: Gemini API key missing. Please check backend logs.",
            extracted: {}
        };
    }

    const prompt = `
    You are an expert conversational Sales Agent for Tata Capital, a leading Indian NBFC.
    Your goal is to sell text-based personal loans to the customer.

    **Customer Profile**:
    Name: ${customerProfile.name}
    Pre-approved Limit: ₹${currentOffer?.preApprovedAmount || 'N/A'}
    Valid Tenures: ${currentOffer?.tenureMonths?.join(', ') || '12, 24, 36'} months.
    
    **Instructions**:
    1. **Be Persuasive**: highlighting benefits, low interest rates, and quick disbursement.
    2. **Stay on Topic**: If the user asks about anything unrelated to loans/finance (e.g., "capital of France"), politely refuse and steer back to loans.
    3. **Negotiate**: If user asks for a tenure not in the valid list, suggest the closest valid ones. If amount > limit, suggest the limit.
    4. **Extract Data**: Try to identify if the user mentioned a Loan Amount or Tenure.
    
    **IMPORTANT - Handle Customer Doubts Like a Pro Salesperson**:
    If the customer shows ANY hesitation, doubt, or says things like:
    - "I'm not sure", "let me think", "maybe later", "I don't know"
    - "interest is too high", "EMI seems high", "can't afford"
    - "need to discuss with family", "will get back to you"
    - "what if I can't pay", "is it safe", "hidden charges?"
    - "I already have loans", "debt is bad"
    - "not the right time", "economy is bad"
    
    Then respond with these PRO sales techniques:
    
    1. **Empathize First**: "I completely understand your concern..."
    2. **Address the Specific Doubt**: Provide facts and reassurance
    3. **Create Urgency**: "This pre-approved offer is valid only for limited time..."
    4. **Show Value**: "Think about what you could achieve with this money - home renovation, child's education, dream vacation..."
    5. **Reduce Risk Perception**: "You can prepay anytime with ZERO charges", "Flexible EMI options", "No hidden fees"
    6. **Social Proof**: "Thousands of customers like you have benefited..."
    7. **Make it Easy**: "It takes just 2 minutes to complete", "100% digital process"
    8. **Offer Alternatives**: If EMI is high, suggest longer tenure. If amount is high, suggest lower amount.
    9. **Ask Soft Close**: "Would you like me to show you how affordable the EMI would be?"
    
    **Objection Handling Examples**:
    - "Interest too high" → "Our rates are among the lowest in the industry at just X%! Plus, the convenience of instant approval and zero collateral makes it unbeatable."
    - "Need to think" → "Absolutely! But let me share - this pre-approved rate is locked for you only until [date]. Once it expires, you'd have to reapply at potentially higher rates. Shall I reserve this for you?"
    - "Already have loans" → "That's actually smart financial planning! Consolidating with our lower rate could reduce your overall EMI burden. Want me to calculate?"
    - "Family decision" → "Of course, family matters! I can send you a detailed comparison that you can share with them. Meanwhile, shall I block this special rate for 48 hours?"
    
    **Conversation History**:
    ${conversationHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}
    USER: ${latestUserMessage}
    
    **Output Format**:
    Return ONLY a JSON object (no markdown formatting) with this structure:
    {
        "botMessage": "your string response here",
        "extracted": {
            "amount": number | null,
            "tenure": number | null,
            "intent": "LOAN_INQUIRY" | "OFF_TOPIC" | "NEGOTIATION" | "OTHER",
            "sentiment": "POSITIVE" | "NEGATIVE" | "HESITANT" | "NEUTRAL"
        }
    }
    `;

    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean up markdown if Gemini adds it
        const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanJson);

        return {
            botMessage: parsed.botMessage,
            extracted: parsed.extracted
        };
    } catch (error: any) {
        console.error("Gemini Error Details:", JSON.stringify(error, null, 2));

        // Fallback to Regex Logic if API fails
        console.log("Falling back to Regex logic due to API error.");

        const amountMatch = latestUserMessage.match(/(\d{4,9})/);
        const tenureMatch = latestUserMessage.match(/\b(12|24|36|48|60)\b/);

        // 1. Negotiation / Tenure check
        if (customerProfile.loanDetails?.amount && !customerProfile.loanDetails?.tenure && tenureMatch) {
            const tenure = parseInt(tenureMatch[0]);

            if (currentOffer && !currentOffer.tenureMonths.includes(tenure)) {
                return {
                    botMessage: `I understand you're looking for ${tenure} months. However, for this special offer, we can provide flexible tenures of ${currentOffer.tenureMonths.join(', ')} months. Which one would work best for your monthly budget?`,
                    extracted: { intent: 'NEGOTIATION' }
                };
            }

            const rate = currentOffer ? (currentOffer.baseInterestRate * 100).toFixed(1) : '15.0';
            const loanAmount = customerProfile.loanDetails.amount;
            const emiEst = Math.round((loanAmount * (1 + (currentOffer?.baseInterestRate || 0.15) / 12 * tenure)) / tenure);

            return {
                botMessage: `Fantastic choice! A ${tenure}-month tenure keeps your payments manageable. \n\nBased on your premium profile, I can unlock an exclusive interest rate of just ${rate}% p.a. for you. This means your estimated EMI would be roughly ₹${emiEst}.\n\nShall we quickly verify your details to lock in this offer?`,
                extracted: { tenure, amount: loanAmount, intent: 'LOAN_INQUIRY' }
            };
        }

        // 2. Amount Collection
        if (amountMatch) {
            const amount = parseInt(amountMatch[0]);
            const maxLimit = currentOffer ? currentOffer.preApprovedAmount * 2 : 1000000;

            if (amount > maxLimit) {
                return {
                    botMessage: `I appreciate your ambition! Currently, the maximum personal loan eligibility for your profile is ₹${maxLimit}. Would you like to proceed with this maximum amount to meet your needs?`,
                    extracted: { intent: 'NEGOTIATION' }
                };
            }

            return {
                botMessage: `Got it, ₹${amount}. Excellent. \n\nTo give you the best repayment flexibility, for how many months would you like to take this loan? (Popular options: 12, 24, 36)`,
                extracted: { amount, intent: 'LOAN_INQUIRY' }
            };
        }

        // 3. Handle hesitation/doubt keywords (fallback when API fails)
        const hesitationKeywords = ['not sure', 'think', 'later', 'maybe', 'don\'t know', 'confused', 'doubt', 'worried', 'scared', 'afraid', 'risky', 'high interest', 'expensive', 'can\'t afford', 'family', 'spouse', 'wife', 'husband', 'discuss'];
        const lowerMessage = latestUserMessage.toLowerCase();
        const isHesitant = hesitationKeywords.some(keyword => lowerMessage.includes(keyword));

        if (isHesitant) {
            const preApproved = currentOffer?.preApprovedAmount || 100000;
            const rate = currentOffer ? (currentOffer.baseInterestRate * 100).toFixed(1) : '12.5';
            
            // Different responses based on type of hesitation
            if (lowerMessage.includes('interest') || lowerMessage.includes('expensive') || lowerMessage.includes('high')) {
                return {
                    botMessage: `I completely understand your concern about rates! 🤝\n\nHere's the thing - at just **${rate}% p.a.**, we're offering one of the **lowest rates in the industry**. Most banks charge 14-18%!\n\nPlus, here's what makes us special:\n✅ **Zero prepayment charges** - pay off early, save on interest\n✅ **No hidden fees** - what you see is what you pay\n✅ **Flexible tenure** - choose longer tenure for lower EMI\n\nWould you like me to show you how a longer tenure could make your EMI super affordable?`,
                    extracted: { intent: 'NEGOTIATION', sentiment: 'HESITANT' }
                };
            }
            
            if (lowerMessage.includes('family') || lowerMessage.includes('spouse') || lowerMessage.includes('wife') || lowerMessage.includes('husband') || lowerMessage.includes('discuss')) {
                return {
                    botMessage: `Absolutely! Taking family into financial decisions shows great wisdom. 👨‍👩‍👧‍👦\n\nHere's what I can do for you:\n📌 I'll **reserve this special pre-approved rate** for the next **48 hours**\n📧 I can send you a **detailed breakdown** to share with your family\n\nThis way, you won't lose this exclusive offer while you discuss.\n\n**Quick fact:** This pre-approved offer is based on your excellent profile and may not be available if you apply later through regular channels.\n\nShall I lock in this rate for you?`,
                    extracted: { intent: 'NEGOTIATION', sentiment: 'HESITANT' }
                };
            }
            
            if (lowerMessage.includes('afford') || lowerMessage.includes('emi')) {
                return {
                    botMessage: `I hear you! Managing EMIs wisely is so important. 💡\n\nHere's the good news - with **flexible tenures up to 60 months**, we can make the EMI fit YOUR budget!\n\nFor example, on ₹${preApproved.toLocaleString('en-IN')}:\n• 12 months → Higher EMI, less interest\n• 36 months → Balanced EMI\n• 60 months → Lowest EMI, fits any budget!\n\nWhat monthly EMI would be comfortable for you? I'll work backwards to find the perfect plan!`,
                    extracted: { intent: 'NEGOTIATION', sentiment: 'HESITANT' }
                };
            }

            // Generic hesitation response
            return {
                botMessage: `I completely understand taking a moment to think! 🤔\n\nLet me share why **thousands of customers** chose us:\n\n✨ **Pre-approved for YOU**: ₹${preApproved.toLocaleString('en-IN')} ready to go\n⚡ **Instant disbursement**: Money in your account within 24 hours\n🔒 **100% secure**: RBI regulated, trusted by millions\n💰 **Zero hidden charges**: Complete transparency\n🎯 **Flexible usage**: Home renovation, wedding, travel, education - your choice!\n\nWhat's holding you back? I'm here to address any concerns you have!`,
                extracted: { intent: 'NEGOTIATION', sentiment: 'HESITANT' }
            };
        }

        return {
            botMessage: "I'm having trouble connecting to my AI brain, but I can still help! How much would you like to borrow?",
            extracted: {}
        };
    }
};
