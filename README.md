# NBFC Agentic Chatbot MVP

This is a prototype of an Agentic AI Chatbot for loan sales and origination.

## Project Structure
- `backend/`: Node.js + Express + TypeScript + PDFKit
- `frontend/`: React + Vite + TypeScript + TailwindCSS

## Prerequisites
- Node.js (v14+)
- npm

## Setup & Run

### 1. Backend
Open a terminal:
```bash
cd backend
npm install
# Create .env file and add your GEMINI_API_KEY
cp .env.example .env
npm run dev
```
Server runs on `http://localhost:3000`

### 2. Frontend
Open another terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

## Demo Flow
1. **Greeting**: Bot offers loan.
2. **Details**: Enter Amount (e.g., `200000`) and Tenure (e.g., `24`).
3. **KYC**: Bot asks to proceed. Type `Yes`.
4. **Underwriting**: 
    - Case A (Instant): Amount <= 300,000 (pre-approved for ID 101).
    - Case B (Salary Slip): Amount > 300,000 (e.g. `400000`). Bot asks for upload. Upload any PDF/Image.
5. **Sanction**: Button appears to download PDF.

## Mock Data
- **Customer ID**: 101 (Used by default)
- **Pre-approved Limit**: 300,000
- **Credit Score**: 750
