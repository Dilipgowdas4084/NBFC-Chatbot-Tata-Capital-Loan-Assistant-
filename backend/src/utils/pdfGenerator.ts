import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface LoanDetails {
    applicationId: string;
    customerName: string;
    sanctionedAmount: number;
    tenure: number;
    interestRate: number;
    emi: number;
    disbursementDate?: string;
    processingFee?: number;
}

export const generateSanctionLetter = (data: LoanDetails): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const fileName = `sanction_${data.applicationId}.pdf`;
            const filePath = path.join(__dirname, '../../uploads', fileName);

            // Ensure uploads directory exists
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Colors
            const primaryColor = '#1e40af';
            const secondaryColor = '#3b82f6';

            // Header with logo placeholder
            doc.rect(0, 0, 612, 100).fill(primaryColor);
            doc.fillColor('white').fontSize(28).font('Helvetica-Bold')
               .text('TATA CAPITAL', 50, 35, { align: 'center' });
            doc.fontSize(12).font('Helvetica')
               .text('Personal Loan Division', 50, 65, { align: 'center' });

            // Document Title
            doc.fillColor(primaryColor).fontSize(20).font('Helvetica-Bold')
               .text('LOAN SANCTION LETTER', 50, 130, { align: 'center' });
            
            doc.moveTo(50, 160).lineTo(545, 160).stroke(secondaryColor);

            // Reference & Date
            doc.fillColor('#374151').fontSize(10).font('Helvetica');
            doc.text(`Reference No: ${data.applicationId}`, 50, 180);
            doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 400, 180);

            // Greeting
            doc.fontSize(11).font('Helvetica').fillColor('#1f2937');
            doc.text(`Dear ${data.customerName},`, 50, 220);
            doc.moveDown(0.5);
            doc.text('We are pleased to inform you that your Personal Loan application has been approved. Please find below the details of your sanctioned loan:', 50, 245, { width: 500 });

            // Loan Details Box
            const boxY = 300;
            doc.rect(50, boxY, 495, 180).fill('#f0f9ff').stroke(secondaryColor);
            
            doc.fillColor(primaryColor).fontSize(14).font('Helvetica-Bold')
               .text('LOAN DETAILS', 70, boxY + 15);

            doc.moveTo(70, boxY + 35).lineTo(525, boxY + 35).stroke(secondaryColor);

            const detailsY = boxY + 50;
            const col1 = 70;
            const col2 = 300;
            
            doc.fillColor('#374151').fontSize(11).font('Helvetica');
            
            // Row 1
            doc.text('Sanctioned Amount:', col1, detailsY);
            doc.font('Helvetica-Bold').text(`₹ ${data.sanctionedAmount.toLocaleString('en-IN')}`, col2, detailsY);
            
            // Row 2
            doc.font('Helvetica').text('Loan Tenure:', col1, detailsY + 25);
            doc.font('Helvetica-Bold').text(`${data.tenure} Months`, col2, detailsY + 25);
            
            // Row 3
            doc.font('Helvetica').text('Interest Rate:', col1, detailsY + 50);
            doc.font('Helvetica-Bold').text(`${(data.interestRate * 100).toFixed(2)}% per annum`, col2, detailsY + 50);
            
            // Row 4
            doc.font('Helvetica').text('Monthly EMI:', col1, detailsY + 75);
            doc.font('Helvetica-Bold').fillColor('#059669').text(`₹ ${data.emi.toLocaleString('en-IN')}`, col2, detailsY + 75);
            
            // Row 5
            const processingFee = data.processingFee || Math.round(data.sanctionedAmount * 0.01);
            doc.fillColor('#374151').font('Helvetica').text('Processing Fee:', col1, detailsY + 100);
            doc.font('Helvetica-Bold').text(`₹ ${processingFee.toLocaleString('en-IN')}`, col2, detailsY + 100);

            // Total Payable
            const totalPayable = data.emi * data.tenure;
            doc.rect(50, boxY + 155, 495, 25).fill(primaryColor);
            doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
               .text('Total Payable Amount:', col1, boxY + 162);
            doc.text(`₹ ${totalPayable.toLocaleString('en-IN')}`, col2, boxY + 162);

            // Terms & Conditions
            doc.fillColor('#374151').fontSize(10).font('Helvetica-Bold')
               .text('Terms & Conditions:', 50, 510);
            doc.fontSize(9).font('Helvetica').fillColor('#6b7280');
            doc.text('1. The loan amount will be disbursed to your registered bank account within 24-48 hours.', 50, 530, { width: 500 });
            doc.text('2. EMI will be auto-debited from your bank account on the 5th of every month.', 50, 545, { width: 500 });
            doc.text('3. Prepayment is allowed after 6 EMIs with nominal charges.', 50, 560, { width: 500 });
            doc.text('4. This sanction is valid for 30 days from the date of issue.', 50, 575, { width: 500 });

            // Footer
            doc.moveTo(50, 620).lineTo(545, 620).stroke('#e5e7eb');
            
            doc.fillColor('#374151').fontSize(10).font('Helvetica');
            doc.text('For any queries, contact us at: loans@tatacapital.com | 1800-XXX-XXXX', 50, 640, { align: 'center' });
            
            doc.fillColor('#9ca3af').fontSize(8)
               .text('This is a system-generated document and does not require a physical signature.', 50, 670, { align: 'center' });
            doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 50, 685, { align: 'center' });

            doc.end();

            stream.on('finish', () => {
                console.log(`Sanction letter generated: ${filePath}`);
                resolve(filePath);
            });
            stream.on('error', (err) => {
                reject(err);
            });
        } catch (error) {
            reject(error);
        }
    });
};
