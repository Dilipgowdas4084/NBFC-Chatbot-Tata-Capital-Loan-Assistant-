import { ChatState, AgentResponse, Customer } from '../types';
import customersData from '../data/customers.json';
import creditScoresData from '../data/creditScores.json';
import offersData from '../data/offers.json';
import { calculateEMI } from '../utils/emiCalculator';

const customers = customersData as Customer[];
const creditScores = creditScoresData as Record<string, number>;
const offers = offersData as any;

// Helper function to format currency
const formatCurrency = (amount: number): string => {
    return `₹${amount.toLocaleString('en-IN')}`;
};

// Helper function to generate loan details table
const generateLoanDetailsTable = (
    loanAmount: number,
    tenure: number,
    interestRate: number,
    emi: number
): string => {
    const totalPayment = emi * tenure;
    const totalInterest = totalPayment - loanAmount;
    const processingFee = Math.round(loanAmount * 0.02); // 2% processing fee
    const totalCost = totalPayment + processingFee;

    return `
┌─────────────────────────────────────┐
│       💰 LOAN DETAILS TABLE         │
├─────────────────────────────────────┤
│ Principal Amount    │ ${formatCurrency(loanAmount).padStart(14)} │
│ Interest Rate       │ ${(interestRate * 100).toFixed(1).padStart(12)}% p.a. │
│ Tenure              │ ${String(tenure).padStart(11)} months │
├─────────────────────────────────────┤
│ Monthly EMI         │ ${formatCurrency(emi).padStart(14)} │
├─────────────────────────────────────┤
│ Total Interest      │ ${formatCurrency(totalInterest).padStart(14)} │
│ Processing Fee (2%) │ ${formatCurrency(processingFee).padStart(14)} │
├─────────────────────────────────────┤
│ TOTAL REPAYMENT     │ ${formatCurrency(totalPayment).padStart(14)} │
│ TOTAL COST          │ ${formatCurrency(totalCost).padStart(14)} │
└─────────────────────────────────────┘`;
};

// Simpler table format that renders better
const generateSimpleLoanTable = (
    loanAmount: number,
    tenure: number,
    interestRate: number,
    emi: number
): string => {
    const totalPayment = emi * tenure;
    const totalInterest = totalPayment - loanAmount;
    const processingFee = Math.round(loanAmount * 0.02); // 2% processing fee
    const totalCost = totalPayment + processingFee;

    return `
📊 **LOAN BREAKDOWN**

| Description | Amount |
|-------------|--------|
| Principal Amount | ${formatCurrency(loanAmount)} |
| Interest Rate | ${(interestRate * 100).toFixed(1)}% p.a. |
| Tenure | ${tenure} months |
| **Monthly EMI** | **${formatCurrency(emi)}** |
| Total Interest Payable | ${formatCurrency(totalInterest)} |
| Processing Fee (2%) | ${formatCurrency(processingFee)} |
| **Total Repayment** | **${formatCurrency(totalPayment)}** |
| **Total Cost (incl. fees)** | **${formatCurrency(totalCost)}** |

💡 *EMI = Principal + Interest spread over ${tenure} months*`;
};

export const underwritingAgent = (state: ChatState, hasSalarySlip: boolean = false): AgentResponse => {
    const customer = customers.find(c => c.id === state.customerId);
    if (!customer) return { nextState: 'REJECTED', botMessage: "Customer not found.", actions: [] };

    const creditScore = creditScores[customer.pan] || 650;
    const loanAmount = state.loanDetails?.amount || 0;
    const tenure = state.loanDetails?.tenure || 12;
    const preApprovedLimit = offers[state.customerId]?.preApprovedAmount || customer.preApprovedLimit || 0;
    const interestRate = offers[state.customerId]?.baseInterestRate || 0.15;

    console.log(`Underwriting: Score=${creditScore}, Amount=${loanAmount}, Limit=${preApprovedLimit}, Salary=${customer.salary}`);

    const emi = calculateEMI(loanAmount, interestRate, tenure);
    const totalPayment = emi * tenure;
    const totalInterest = totalPayment - loanAmount;

    // ============================================
    // APPLY RULES:
    // ============================================

    // RULE 3 (Check First): Amount > 2× pre-approved OR Credit Score < 700 → Reject
    if (creditScore < 700) {
        return {
            nextState: 'REJECTED',
            botMessage: `❌ **Loan Application Rejected**

**Reason:** Credit Score Below Minimum Requirement

� **Why was your loan rejected?**
| Criteria | Required | Yours | Status |
|----------|----------|-------|--------|
| Credit Score | ≥ 700 | ${creditScore} | ❌ Not Met |

Your credit score of **${creditScore}** is below our minimum requirement of **700**.

💡 **How to improve your credit score:**
• Pay all EMIs and credit card bills on time
• Keep credit utilization below 30%
• Don't apply for multiple loans simultaneously
• Check your CIBIL report for errors and dispute them
• Wait 3-6 months for score to improve

📞 Need help? Contact us at 1800-XXX-XXXX

Type **"try again"** when you're ready to apply again.`,
            actions: ['TRY_AGAIN', 'EXPLAIN_REJECTION'],
            meta: { decision: 'REJECTED', creditScore, reason: 'LOW_CREDIT_SCORE' }
        };
    }

    if (loanAmount > 2 * preApprovedLimit) {
        const maxAllowed = preApprovedLimit * 2;
        
        return {
            nextState: 'REJECTED',
            botMessage: `❌ **Loan Application Rejected**

**Reason:** Requested Amount Exceeds Maximum Limit

� **Why was your loan rejected?**
| Criteria | Limit | Requested | Status |
|----------|-------|-----------|--------|
| Maximum Amount | ${formatCurrency(maxAllowed)} | ${formatCurrency(loanAmount)} | ❌ Exceeded |

You requested **${formatCurrency(loanAmount)}** but your maximum eligible amount is **${formatCurrency(maxAllowed)}** (2× your pre-approved limit of ${formatCurrency(preApprovedLimit)}).

💡 **What you can do:**
• Apply for a lower amount (up to ${formatCurrency(maxAllowed)})
• Increase your pre-approved limit by improving credit history
• Add a co-applicant to increase eligibility

Type **"try again"** to apply with a lower amount.`,
            actions: ['TRY_AGAIN'],
            meta: { decision: 'REJECTED', loanAmount, maxAllowed, preApprovedLimit, reason: 'AMOUNT_EXCEEDED' }
        };
    }

    // RULE 1: Amount ≤ pre-approved → Instant approve
    if (loanAmount <= preApprovedLimit) {
        const loanTable = generateSimpleLoanTable(loanAmount, tenure, interestRate, emi);
        
        return {
            nextState: 'APPROVED',
            botMessage: `🎉 **Congratulations! Your loan is INSTANTLY APPROVED!**

${loanTable}

✅ **Next Steps:**
1. Download your sanction letter
2. Complete e-signature
3. Amount disbursed in 24-48 hours

💰 Funds will be credited to your registered bank account.`,
            actions: ['SHOW_SANCTION_LETTER_LINK'],
            meta: { 
                decision: 'APPROVED', 
                emi, 
                interestRate, 
                tenure, 
                loanAmount,
                totalInterest,
                totalPayment,
                sanctionedAmount: loanAmount
            }
        };
    }

    // RULE 2: Amount ≤ 2× pre-approved → Ask for salary slip → EMI ≤ 50% salary → Approve
    if (!hasSalarySlip) {
        const loanTable = generateSimpleLoanTable(loanAmount, tenure, interestRate, emi);
        const requiredSalary = Math.ceil(emi / 0.5); // Minimum salary needed for this EMI
        
        return {
            nextState: 'SALARY_SLIP_UPLOAD',
            botMessage: `⏳ **Application Pending - Salary Verification Required**

Your requested amount exceeds your instant approval limit. We need to verify your income.

${loanTable}

📋 **Application Status:**
| Check | Status |
|-------|--------|
| Credit Score (${creditScore}) | ✅ Passed |
| Amount within 2× Limit | ✅ Passed |
| Income Verification | ⏳ Pending |

💼 **Eligibility Requirement:**
| Criteria | Requirement |
|----------|-------------|
| Your Request | ${formatCurrency(loanAmount)} |
| Pre-approved Limit | ${formatCurrency(preApprovedLimit)} |
| Monthly EMI | ${formatCurrency(emi)} |
| Min. Salary Required | ${formatCurrency(requiredSalary)} |
| EMI should be | ≤ 50% of salary |

📤 **Next Step:** Upload your latest salary slip to proceed.

Once verified, your loan will be approved instantly!`,
            actions: ['REQUEST_SALARY_SLIP_UPLOAD'],
            meta: { decision: 'NEED_SALARY_SLIP', emi, interestRate, tenure, loanAmount, requiredSalary }
        };
    }

    // Salary slip uploaded - Check EMI ≤ 50% of salary
    const monthlySalary = customer.salary;
    const maxEmi = monthlySalary * 0.5;
    const emiPercentage = ((emi / monthlySalary) * 100).toFixed(1);

    console.log(`EMI Check: EMI=${emi}, Salary=${monthlySalary}, MaxEMI (50%)=${maxEmi}`);

    if (emi <= maxEmi) {
        const loanTable = generateSimpleLoanTable(loanAmount, tenure, interestRate, emi);
        
        return {
            nextState: 'APPROVED',
            botMessage: `✅ **Salary Verified Successfully!**

🎉 **Your loan is APPROVED!**

${loanTable}

� **Affordability Check:**
| Your Monthly Salary | ${formatCurrency(monthlySalary)} |
|---------------------|--------|
| EMI Amount | ${formatCurrency(emi)} |
| EMI as % of Salary | ${emiPercentage}% ✅ |
| Max Allowed (50%) | ${formatCurrency(maxEmi)} |

✅ **Next Steps:**
1. Download your sanction letter
2. Complete e-signature  
3. Amount disbursed in 24-48 hours`,
            actions: ['SHOW_SANCTION_LETTER_LINK'],
            meta: { 
                decision: 'APPROVED', 
                emi, 
                interestRate, 
                tenure, 
                loanAmount,
                totalInterest,
                totalPayment,
                sanctionedAmount: loanAmount
            }
        };
    } else {
        const emiPercentageOver = ((emi / monthlySalary) * 100).toFixed(1);
        
        return {
            nextState: 'REJECTED',
            botMessage: `❌ **Loan Not Approved - EMI Exceeds Limit**

📊 **Affordability Analysis:**
| Description | Amount |
|-------------|--------|
| Your Monthly Salary | ${formatCurrency(monthlySalary)} |
| Calculated EMI | ${formatCurrency(emi)} |
| EMI as % of Salary | ${emiPercentageOver}% ❌ |
| Max Allowed (50%) | ${formatCurrency(maxEmi)} |

The EMI exceeds 50% of your monthly salary, which doesn't meet our affordability criteria.

💡 **Suggestions:**
• Try a lower loan amount (max ${formatCurrency(Math.floor(maxEmi * tenure / (1 + interestRate * tenure / 12)))})
• Choose a longer tenure to reduce EMI
• Ask me "what's my limit?" for options`,
            actions: [],
            meta: { decision: 'REJECTED', emi, monthlySalary, maxEmi }
        };
    }
};
