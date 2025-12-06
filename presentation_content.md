# Challenge II: BFSI Tata Capital - Agentic AI Chatbot

## Slide 1: Problem Statement & Goal
**Business Need**: Tata Capital wants to boost personal loan sales via a web-based chatbot.
**Key Challenges**:
- Converting passive website visitors into loan applicants.
- Automating complex backend checks (KYC, Underwriting) in real-time.
- Reducing turnaround time for sanction letters.
**Solution Goal**:
- Develop an **Agentic AI System** where a Master Agent orchestrates specialized Worker Agents.
- Deliver a human-like, persuasive sales experience that handles the end-to-end journey from "Hi" to "Sanction Letter".

---

## Slide 2: Agentic AI Architecture
**Master Agent (Orchestrator)**
- Brain of the system.
- Manages conversation state (`START` -> `KYC` -> `DECISION`).
- Routes tasks to specialized agents based on user intent.

**Worker Agents**
1. **Sales Agent**: Persuasive dialogue, negotiation, amount/tenure collection.
2. **Verification Agent**: Validates KYC against CRM.
3. **Underwriting Agent**: Enforces credit policy (Score > 700, EMI ratios).
4. **Sanction Agent**: Deterministic PDF generation.

---

## Slide 3: The User Journey
1. **Acquisition**: User lands on chat. Sales Agent pitches pre-approved offer.
2. **Consultation**: User negotiates Amount & Tenure. Agent optimizes for monthly budget.
3. **Verification**: Instant KYC check via mocked CRM.
4. **Underwriting (Branching Logic)**:
    - *Path A (Instant)*: Amount ≤ Limit → **Approved**.
    - *Path B (Check)*: Amount > Limit → Request Salary Slip → **Analyze** → Approve/Reject.
    - *Path C (Reject)*: Poor Credit / High Risk → **Polite Rejection**.
5. **Closure**: Instant download of digitally signed Sanction Letter.

---

## Slide 4: Tech Stack & Implementation
**Frontend**:
- React + Vite + TailwindCSS for a responsive, modern chat UI.
- Real-time message streaming simulation.

**Backend**:
- **Node.js + Express**: Scalable server environment.
- **Micro-Agent Services**: Modular functions for each agent role.
- **PDFKit**: dynamic PDF generation.
- **Mock Data**: In-memory JSON stores for CRM/Bureau simulations.

**Key Features**:
- State Machine Architecture.
- Rule-based Underwriting Engine.
- File Upload capability for income verification.

---

## Slide 5: Business Impact & Future Scope
**Impact**:
- **24/7 Availability**: Instant loan processing anytime.
- **Cost Reduction**: Automates initial sales filter & documentation.
- **Consistency**: Standardized policy enforcement.

**Future Scope**:
- **LLM Integration**: Replace regex/rule-based dialogue with GPT-4 for natural NLP.
- **Vision AI**: Automated OCR for Salary Slips and Pan Cards.
- **Multi-Product**: Expand to Home & Auto Loans.
- **Live CRM Sync**: Real-time integration with Salesforce/LMS.
