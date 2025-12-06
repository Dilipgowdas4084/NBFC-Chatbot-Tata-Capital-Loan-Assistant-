import { ChatState, AgentResponse, Customer } from '../types';
import customersData from '../data/customers.json';

const customers = customersData as Customer[];

// Helper to format currency
const formatCurrency = (amount: number): string => `₹${amount.toLocaleString('en-IN')}`;

// Helper to mask PAN (show first 2 and last 2 characters)
const maskPAN = (pan: string): string => {
    if (pan.length < 5) return pan;
    return pan.substring(0, 2) + '****' + pan.substring(pan.length - 2);
};

// Helper to mask phone (show last 4 digits)
const maskPhone = (phone: string): string => {
    if (phone.length < 5) return phone;
    return '******' + phone.substring(phone.length - 4);
};

export const verificationAgent = (state: ChatState): AgentResponse => {
    const customer = customers.find(c => c.id === state.customerId);

    if (!customer) {
        return {
            nextState: 'REJECTED',
            botMessage: `❌ **KYC Verification Failed**

We couldn't find your records in our system.

📋 **Verification Status:**
| Check | Status |
|-------|--------|
| Customer ID | ❌ Not Found |
| PAN Verification | ⏳ Skipped |
| Address Verification | ⏳ Skipped |

Please contact our support team for assistance.
📞 Call: 1800-XXX-XXXX`,
            actions: [],
            meta: { kycStatus: 'FAILED' }
        };
    }

    // Verify PAN format (Indian PAN: 5 letters, 4 digits, 1 letter)
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    const isPANValid = panRegex.test(customer.pan);

    // Verify address exists and is not empty
    const isAddressValid = customer.address && customer.address.length > 5;

    // Verify phone number (10 digits)
    const phoneRegex = /^[6-9]\d{9}$/;
    const isPhoneValid = phoneRegex.test(customer.phone);

    // All checks must pass
    const kycSuccess = isPANValid && isAddressValid && isPhoneValid;

    if (kycSuccess) {
        return {
            nextState: 'UNDERWRITING',
            botMessage: `✅ **KYC Verification Successful!**

We have verified your identity from our records.

📋 **Verification Details:**
| Document | Value | Status |
|----------|-------|--------|
| PAN Number | ${maskPAN(customer.pan)} | ✅ Verified |
| Full Name | ${customer.name} | ✅ Matched |
| Mobile Number | ${maskPhone(customer.phone)} | ✅ Verified |

📍 **Address Verification:**
| Field | Details |
|-------|---------|
| Address | ${customer.address} |
| City | ${customer.city} |
| Status | ✅ Verified |

👤 **Customer Profile:**
| Detail | Value |
|--------|-------|
| Age | ${customer.age} years |
| Monthly Salary | ${formatCurrency(customer.salary)} |
| Existing Loans | ${customer.currentLoans} |
| Pre-approved Limit | ${formatCurrency(customer.preApprovedLimit)} |

🔄 Now checking your credit eligibility...`,
            actions: [],
            meta: { 
                kycStatus: 'VERIFIED',
                verifiedPAN: customer.pan,
                verifiedAddress: customer.address,
                verifiedPhone: customer.phone
            }
        };
    } else {
        // Build failure reasons
        const failures: string[] = [];
        if (!isPANValid) failures.push('PAN format invalid');
        if (!isAddressValid) failures.push('Address incomplete');
        if (!isPhoneValid) failures.push('Phone number invalid');

        return {
            nextState: 'REJECTED',
            botMessage: `❌ **KYC Verification Failed**

We found issues with your records that prevent us from proceeding.

📋 **Verification Details:**
| Document | Value | Status |
|----------|-------|--------|
| PAN Number | ${maskPAN(customer.pan)} | ${isPANValid ? '✅ Valid' : '❌ Invalid Format'} |
| Mobile Number | ${maskPhone(customer.phone)} | ${isPhoneValid ? '✅ Valid' : '❌ Invalid'} |
| Address | ${customer.address || 'Not Found'} | ${isAddressValid ? '✅ Valid' : '❌ Incomplete'} |

❌ **Issues Found:**
${failures.map(f => `• ${f}`).join('\n')}

💡 **What to do:**
• Update your KYC documents with us
• Visit nearest branch with valid documents
• Call support: 1800-XXX-XXXX

Would you like me to connect you with our support team?`,
            actions: ['CONTACT_SUPPORT'],
            meta: { 
                kycStatus: 'FAILED',
                panValid: isPANValid,
                addressValid: isAddressValid,
                phoneValid: isPhoneValid,
                failures
            }
        };
    }
};
