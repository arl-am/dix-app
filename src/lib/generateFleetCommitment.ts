import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import type { Agent } from './mockData';

const navyColor = '#1E293B';

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

function formatDateMMDDYYYY(dateStr: string | undefined): string {
  if (!dateStr) return '_______________';
  try {
    return format(new Date(dateStr), 'MM-dd-yyyy');
  } catch {
    return '_______________';
  }
}

export interface FleetCommitmentData {
  form: Record<string, string>;
  agent: Agent | null;
}

export function generateFleetCommitment(data: FleetCommitmentData): void {
  const { form, agent } = data;

  const startDate = formatDateMMDDYYYY(form.purchaseDate);
  const driverName = `${form.firstName || ''} ${form.lastName || ''}`.trim() || '_______________';
  const motorCarrierName = agent?.cr6cd_motorcarrier || 'American Carrier Transport, LLC';

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12.7;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  const lineHeight = 4.5;
  const paragraphSpacing = 3;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...hexToRgb(navyColor));
  doc.text('FLEET OWNER/DRIVER INFORMATION/COMMITMENT SHEET', pageWidth / 2, yPos, { align: 'center' });
  yPos += 14;

  // === PART I ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...hexToRgb(navyColor));
  const partITitle = 'PART I. FLEET OWNER INFORMATION/COMMITMENT';
  doc.text(partITitle, margin, yPos);
  doc.setDrawColor(...hexToRgb(navyColor));
  doc.setLineWidth(0.3);
  doc.line(margin, yPos + 1, margin + doc.getTextWidth(partITitle), yPos + 1);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...hexToRgb(navyColor));

  function writeParagraph(text: string): void {
    const lines = doc.splitTextToSize(text, contentWidth);
    doc.text(lines, margin, yPos);
    yPos += lines.length * lineHeight + paragraphSpacing;
  }

  writeParagraph(`1. I am a party to Independent Business Associate Contract(s) ("Contract") with ${motorCarrierName} (referred to as "ACT") ${startDate}.`);
  writeParagraph(`2. My Fleet Number within the ACT System is ${form.vendorCode || '_______________'}.`);
  writeParagraph('3. I am the owner of the power units set forth on the attached list ("Tractor(s)") which I operate under my Contract(s) with ACT.');
  writeParagraph(`4. I will assign ${driverName} ("Driver") to operate various Tractor(s) on my behalf from time to time pursuant to my Contract(s).`);

  // Paragraph 5 with checkboxes
  const para5Text = '5. I have read and understand my duty and obligations under Section 11 of my Contract(s) as a Fleet Owner with respect to arranging to have a U.S. DOT qualified driver other than myself operate any Tractor on my behalf and I am prepared to comply with all such obligations including the responsibility to pay the Driver for all services rendered by the Driver via';
  const para5Lines = doc.splitTextToSize(para5Text, contentWidth);
  doc.text(para5Lines, margin, yPos);
  yPos += para5Lines.length * lineHeight + 2;

  const checkboxSize = 3;
  doc.setDrawColor(...hexToRgb(navyColor));
  doc.setLineWidth(0.3);
  doc.rect(margin, yPos - 2.5, checkboxSize, checkboxSize);
  doc.text('1099', margin + checkboxSize + 1.5, yPos);
  const orX = margin + checkboxSize + 1.5 + doc.getTextWidth('1099') + 3;
  doc.text('OR', orX, yPos);
  const w2X = orX + doc.getTextWidth('OR') + 3;
  doc.rect(w2X, yPos - 2.5, checkboxSize, checkboxSize);
  doc.text('W2', w2X + checkboxSize + 1.5, yPos);
  const pleaseX = w2X + checkboxSize + 1.5 + doc.getTextWidth('W2') + 3;
  doc.text('(please check one).', pleaseX, yPos);
  yPos += 4 + paragraphSpacing;

  writeParagraph('6. I have obtained workers compensation insurance coverage for the Driver to the extent that I have obligated myself to do so under Section 21 of my Contract(s) and will continue to maintain such coverage for as long as my Contract(s) are in effect.');
  writeParagraph('7. Owner acknowledges and agrees that in the event a Driver provided by Owner ceases providing services to the ACT on a continuing basis within six (6) months after such Driver being Qualified by ACT, OWNER authorizes ACT to deduct $200.00 from Owner\'s compensation or Escrow Account to reimburse the ACT for qualification and orientation expenses incurred by ACT. Owner shall also be responsible to reimburse ACT for any drug testing expenses and permitting fees in such event.');
  yPos += 4;

  // === PART II ===
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const partIITitle = 'PART II. DRIVER INFORMATION/COMMITMENT';
  doc.text(partIITitle, margin, yPos);
  doc.setDrawColor(...hexToRgb(navyColor));
  doc.setLineWidth(0.3);
  doc.line(margin, yPos + 1, margin + doc.getTextWidth(partIITitle), yPos + 1);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  writeParagraph(`1. My Commercial Motor Vehicle License No. is ${form.licenseNumber || '_______________'} issued by the State of ${form.licenseState || '_______________'}. It is the only CDL I hold. The information is current and correct.`);
  writeParagraph(`2. I have been asked by ${form.businessName || '_______________'} ("Fleet Owner") to operate one or more of the Tractor(s), on Fleet Owner's behalf under ACT's U.S. DOT operating authority.`);
  writeParagraph('3. I understand that I work for Fleet Owner and Fleet Owner is responsible for paying me for all services rendered by me while operating any Tractor on Fleet Owner\'s behalf and I agree to seek payment for such services only from Fleet Owner. I recognize that I am not an employee of ACT.');
  writeParagraph('4. In the event I were to incur a work related injury while operating any Tractor on Fleet Owner\'s behalf, I agree that I will seek medical coverage through Fleet Owner or any potential responsible party that is not related to ACT only and I will make no claim against ACT for such work related accident. Again, I recognize that I am not an employee of ACT.');

  // === SIGNATURE BLOCK ===
  yPos += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...hexToRgb(navyColor));
  const sigIntro = 'IN WITNESS WHEREOF, Fleet Owner and Driver acknowledge the foregoing information is true and accurate and the commitments set forth above are freely and voluntarily provided by Fleet Owner and Driver respectively.';
  const sigIntroLines = doc.splitTextToSize(sigIntro, contentWidth);
  doc.text(sigIntroLines, margin, yPos);
  yPos += sigIntroLines.length * lineHeight + 15;

  const colWidth = contentWidth / 2 - 5;
  const leftX = margin;
  const rightX = margin + colWidth + 10;
  const sigLineWidth = colWidth - 10;

  // Headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('FLEET OWNER', leftX, yPos);
  doc.text('DRIVER', rightX, yPos);
  yPos += 6;

  // Names
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(form.businessName || '_______________', leftX, yPos);
  doc.text(driverName, rightX, yPos);
  yPos += 15;

  // Signature lines
  doc.setDrawColor(...hexToRgb(navyColor));
  doc.setLineWidth(0.3);
  doc.line(leftX, yPos, leftX + sigLineWidth, yPos);
  doc.line(rightX, yPos, rightX + sigLineWidth, yPos);
  doc.setFontSize(8);
  doc.text('Signature', leftX, yPos + 4);
  doc.text('Signature', rightX, yPos + 4);
  yPos += 15;

  // Dates
  doc.setFontSize(9);
  doc.text(`DATE: ${startDate}`, leftX, yPos);
  doc.text(`DATE: ${startDate}`, rightX, yPos);

  const fileName = `Fleet_Commitment_${form.firstName || 'Driver'}_${form.lastName || ''}.pdf`.replace(/\s+/g, '_');
  doc.save(fileName);
}
