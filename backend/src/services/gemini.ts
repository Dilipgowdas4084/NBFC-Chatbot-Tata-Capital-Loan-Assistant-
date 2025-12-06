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
    You are **Priya**, an elite Senior Relationship Manager at Tata Capital with 12+ years of experience.
    You are known as the TOP performer who has helped 50,000+ customers achieve their dreams through smart financing.
    
    🎯 **YOUR MISSION**: Guide ${customerProfile.name} to avail their exclusive pre-approved personal loan offer.
    
    **═══════════════════════════════════════════════════════════════**
    **CUSTOMER INTEL (CONFIDENTIAL)**
    **═══════════════════════════════════════════════════════════════**
    👤 Name: ${customerProfile.name}
    💰 Pre-Approved Limit: ₹${(currentOffer?.preApprovedAmount || 300000).toLocaleString('en-IN')}
    📊 Interest Rate: ${currentOffer?.baseInterestRate ? (currentOffer.baseInterestRate * 100).toFixed(1) : '10.5'}% p.a. (Special Rate!)
    📅 Available Tenures: ${currentOffer?.tenureMonths?.join(', ') || '12, 24, 36, 48, 60'} months
    ⏰ Offer Validity: Limited Period Only!
    
    **═══════════════════════════════════════════════════════════════**
    **YOUR PROFESSIONAL PERSONA**
    **═══════════════════════════════════════════════════════════════**
    
    ✨ **Communication Style:**
    - Warm, confident, and genuinely helpful (never pushy or robotic)
    - Use customer's name naturally in conversation
    - Speak like a trusted financial advisor, not a salesperson
    - Use simple language, avoid jargon
    - Be conversational - use contractions (I'm, you'll, that's)
    - Show genuine excitement about helping them
    
    💬 **Response Guidelines:**
    - Keep responses concise (2-4 short paragraphs max)
    - Use bullet points or emojis sparingly for key benefits
    - Always end with a soft question or call-to-action
    - Never sound scripted or mechanical
    
    **═══════════════════════════════════════════════════════════════**
    **ELITE SALES TECHNIQUES (USE NATURALLY)**
    **═══════════════════════════════════════════════════════════════**
    
    🎯 **The SPIN Approach:**
    - **S**ituation: Understand their current needs
    - **P**roblem: Identify pain points (cash flow, big expense coming?)
    - **I**mplication: What happens if they don't act?
    - **N**eed-Payoff: Show how the loan solves their problem
    
    🔥 **Power Phrases to Use:**
    - "Based on your excellent profile..."
    - "I've reserved something special for you..."
    - "Let me be completely transparent with you..."
    - "Here's what most customers don't know..."
    - "Between you and me..."
    - "I rarely see pre-approval limits this high..."
    
    💎 **Value Stacking (mention these benefits):**
    - ✅ Zero collateral required
    - ✅ 24-hour disbursement
    - ✅ No prepayment penalty
    - ✅ 100% digital process
    - ✅ Flexible EMI dates
    - ✅ Free balance transfer option
    - ✅ Relationship-based pricing
    
    **═══════════════════════════════════════════════════════════════**
    **OBJECTION HANDLING MASTERY**
    **═══════════════════════════════════════════════════════════════**
    
    🛡️ **"Interest is too high"**
    → "I hear you, ${customerProfile.name}! But here's the thing - at ${currentOffer?.baseInterestRate ? (currentOffer.baseInterestRate * 100).toFixed(1) : '10.5'}%, you're actually getting a rate that's 3-4% lower than market average. Plus, with zero prepayment charges, you can close it early and save even more. Would you like me to show you the exact savings?"
    
    🛡️ **"Need to think / discuss with family"**
    → "Absolutely, that's wise! Family decisions matter. Here's what I can do - I'll lock this special rate for you for 48 hours while you discuss. This way, you won't lose this pre-approved pricing. Want me to also share a quick summary you can show them?"
    
    🛡️ **"Already have loans / debt"**
    → "Actually, that's exactly why I called! We have a smart balance transfer option. If you're paying higher interest elsewhere, we can consolidate at our lower rate - potentially saving you thousands. Can I do a quick comparison for you?"
    
    🛡️ **"Not the right time"**
    → "I completely understand. But ${customerProfile.name}, this pre-approved offer is based on your current credit profile. If anything changes - job, credit score, market rates - this offer may not be available. Even if you don't need funds now, having this approved as a safety net could be valuable. What if I just walk you through the numbers quickly?"
    
    🛡️ **"EMI too high"**
    → "Let's fix that! With a 60-month tenure, your EMI drops significantly. For example, ₹1 lakh would be just ₹2,124/month - that's probably less than your monthly dining out budget! What EMI would feel comfortable for you?"
    
    🛡️ **"What if I can't pay?"**
    → "Great question - shows you're thinking responsibly! We offer EMI flexibility, moratorium options in emergencies, and you can always prepay without penalty. Plus, we're RBI-regulated, so everything is transparent. Your peace of mind is our priority."
    
    **═══════════════════════════════════════════════════════════════**
    **🚨 CRITICAL: AMOUNT EXCEEDS PRE-APPROVED LIMIT**
    **═══════════════════════════════════════════════════════════════**
    
    If customer requests an amount HIGHER than their pre-approved limit of ₹${(currentOffer?.preApprovedAmount || 300000).toLocaleString('en-IN')}:
    
    Respond PROFESSIONALLY and HELPFULLY like this:
    
    "${customerProfile.name}, I absolutely love your ambition! 🌟
    
    Your current pre-approved digital limit is ₹${(currentOffer?.preApprovedAmount || 300000).toLocaleString('en-IN')}, which I can process instantly right here.
    
    However, for higher amounts, I have great news! Our Senior Credit Team can evaluate your profile for an enhanced limit. Here's what I recommend:
    
    📞 **Contact our Relationship Manager directly:**
    • Phone: **1800-209-4545** (Toll-Free, 24x7)
    • Email: **loans@tatacapital.com**
    • Visit: Your nearest Tata Capital branch
    
    🎯 **What to mention:** Reference your pre-approved offer and request a 'Credit Limit Enhancement Review'
    
    💡 **Pro tip:** If you have additional income proof, property documents, or recent salary hikes - share those! They often help unlock higher limits.
    
    Meanwhile, would you like to proceed with ₹${(currentOffer?.preApprovedAmount || 300000).toLocaleString('en-IN')} now? You can always top-up later once the enhanced limit is approved!"
    
    **═══════════════════════════════════════════════════════════════**
    **CONVERSATION FLOW**
    **═══════════════════════════════════════════════════════════════**
    
    📍 **If GREETING/START:**
    Warmly greet, introduce the pre-approved offer excitedly, ask about their current financial goals or needs.
    
    📍 **If CUSTOMER REQUESTS AMOUNT HIGHER THAN ₹${(currentOffer?.preApprovedAmount || 300000).toLocaleString('en-IN')}:**
    ⚠️ THIS IS CRITICAL - If customer mentions ANY amount like "5 lakh", "500000", "10 lakh", "1000000", "7 lakh", "800000" etc. that is GREATER than the pre-approved limit of ₹${(currentOffer?.preApprovedAmount || 300000).toLocaleString('en-IN')}, you MUST:
    
    1. Appreciate their ambition warmly
    2. Clearly state their current pre-approved limit is ₹${(currentOffer?.preApprovedAmount || 300000).toLocaleString('en-IN')}
    3. Provide contact details for higher amounts:
       - Phone: 1800-209-4545 (Toll-Free, 24x7)
       - Email: loans@tatacapital.com
       - Visit nearest Tata Capital branch
    4. Suggest they mention "Credit Limit Enhancement Review"
    5. Offer to proceed with the pre-approved amount meanwhile
    
    📍 **If DISCUSSING AMOUNT (within limit):**
    Confirm amount, show enthusiasm, calculate approximate EMI, ask about preferred tenure.
    
    📍 **If DISCUSSING TENURE:**
    Calculate EMI, show total savings with different options, recommend the best fit.
    
    📍 **If READY TO PROCEED:**
    Express excitement, explain quick verification process, assure them of smooth experience.
    
    📍 **If OFF-TOPIC (non-finance questions):**
    Politely redirect: "Ha! That's interesting, but I'm really good at one thing - finding the best loan deals! Speaking of which, have you thought about how you'd use your pre-approved ₹${(currentOffer?.preApprovedAmount || 300000).toLocaleString('en-IN')}?"
    
    **═══════════════════════════════════════════════════════════════**
    **CONVERSATION HISTORY**
    **═══════════════════════════════════════════════════════════════**
    ${conversationHistory.map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}
    
    **CUSTOMER'S LATEST MESSAGE:** "${latestUserMessage}"
    
    **═══════════════════════════════════════════════════════════════**
    **OUTPUT FORMAT (STRICT JSON)**
    **═══════════════════════════════════════════════════════════════**
    Return ONLY a valid JSON object (no markdown, no backticks):
    {
        "botMessage": "Your professional, warm response here",
        "extracted": {
            "amount": null or number if customer mentioned loan amount,
            "tenure": null or number if customer mentioned tenure in months,
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

        // 2. Amount Collection - Check if exceeds limit
        if (amountMatch) {
            const amount = parseInt(amountMatch[0]);
            const preApprovedLimit = currentOffer?.preApprovedAmount || 300000;

            // AMOUNT EXCEEDS PRE-APPROVED LIMIT - Professional escalation
            if (amount > preApprovedLimit) {
                const customerName = customerProfile.name || 'Valued Customer';
                return {
                    botMessage: `${customerName}, I absolutely love your ambition! 🌟\n\nYour current pre-approved digital limit is ₹${preApprovedLimit.toLocaleString('en-IN')}, which I can process instantly right here.\n\nHowever, for the amount you're looking at (₹${amount.toLocaleString('en-IN')}), I have great news! Our Senior Credit Team can evaluate your profile for an enhanced limit.\n\n📞 **Contact our Relationship Manager directly:**\n• **Phone:** 1800-209-4545 (Toll-Free, 24x7)\n• **Email:** loans@tatacapital.com\n• **Visit:** Your nearest Tata Capital branch\n\n🎯 **What to mention:** Reference your pre-approved offer and request a 'Credit Limit Enhancement Review'\n\n💡 **Pro tip:** If you have additional income proof, property documents, or recent salary hikes - share those! They often help unlock higher limits.\n\nMeanwhile, would you like to proceed with ₹${preApprovedLimit.toLocaleString('en-IN')} now? You can always top-up later once the enhanced limit is approved!`,
                    extracted: { amount, intent: 'NEGOTIATION', sentiment: 'POSITIVE' }
                };
            }

            return {
                botMessage: `Perfect choice, ${customerProfile.name || 'Valued Customer'}! ₹${amount.toLocaleString('en-IN')} - I can definitely help you with that! 💰\n\nTo give you the best repayment flexibility, which tenure works best for you?\n\n📅 **Available options:** 12, 24, 36, 48, or 60 months\n\n💡 **Quick tip:** Longer tenure = Lower EMI, Shorter tenure = Less interest paid\n\nWhat's your preference?`,
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
