import { jsPDF } from 'jspdf';

export type IrpPlateOption = 'option1' | 'option2';

export interface IrpPlateFormData {
  businessName: string;
  driverName: string;
  option: IrpPlateOption;
}

function drawCheckbox(doc: jsPDF, x: number, y: number, size: number, checked: boolean): void {
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.rect(x, y, size, size);
  if (checked) {
    doc.setLineWidth(0.6);
    doc.line(x + size * 0.18, y + size * 0.55, x + size * 0.4, y + size * 0.8);
    doc.line(x + size * 0.4, y + size * 0.8, x + size * 0.88, y + size * 0.18);
    doc.setLineWidth(0.3);
  }
}

function wrapWordsHanging(doc: jsPDF, text: string, firstLineWidth: number, restWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  let available = firstLineWidth;
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (doc.getTextWidth(candidate) <= available) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      available = restWidth;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function generateIrpPlateForm(data: IrpPlateFormData): void {
  const { businessName, driverName, option } = data;
  const option1Checked = option === 'option1';
  const option2Checked = option === 'option2';

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 19;
  const contentW = pageW - margin * 2;
  const lineH = 4.4;
  let y = margin + 4;

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('IRP LICENSE PLATE PROGRAM', pageW / 2, y, { align: 'center' });
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);

  const paragraph = (text: string, opts: { bold?: boolean; spaceAfter?: number } = {}) => {
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, contentW);
    doc.text(lines, margin, y);
    y += lines.length * lineH + (opts.spaceAfter ?? 3.5);
    doc.setFont('helvetica', 'normal');
  };

  paragraph(
    'The motor carrier has established an International Registration Program (IRP License Plate) account with the state of Indiana. The license plates are apportioned for 48 states and Ontario at 80,000 lbs. no exceptions.',
    { spaceAfter: 3.5 },
  );
  paragraph(
    'If an Independent Business Entity (IBE) should require Motor Carrier to license his/her unit, the following items will be required prior to ordering the plate:',
    { spaceAfter: 3 },
  );

  const numberedItem = (n: number, text: string) => {
    const bulletX = margin + 6;
    const textX = margin + 12;
    doc.text(`${n}.`, bulletX, y);
    const lines = doc.splitTextToSize(text, contentW - (textX - margin));
    doc.text(lines, textX, y);
    y += lines.length * lineH + 1.2;
  };
  numberedItem(1, 'Copy of the title, front and back in owner\u2019s name.');
  numberedItem(2, 'Copy of current 2290 (Federal Highway Use Tax) receipt stamped paid');
  y += 3;

  paragraph(
    '***Should lease be cancelled by either the IBE or Carrier, or the IBE elects to not renew or \u201Copt out\u201D or the carrier disqualifies the IBE to participate in the IRP program, regardless of the option chosen below, the license plate and registration card MUST BE returned within SEVEN (7) days of cancellation per the lease agreement to ARL Transport LLC, 1155 Stoops Ferry Rd. Moon Twp., PA 15108. The IBE\u2019s will be charged the weekly usage fee, in which the deposit will be used to cover these fees, until the plate is resold/reassigned. If the license plate and registration card are not returned within 7 days, the plate will be reported stolen to Indiana IRP and the local authorities. The IBE\u2019s plate deposit will be forfeited and the plate will no longer be valid.',
    { spaceAfter: 4 },
  );

  paragraph(
    'CARRIER WILL ONLY ACCEPT THE FOLLOWING METHODS OF PAYMENT: CERTIFIED CHECK, MONEY ORDER, OR CREDIT CARD',
    { bold: true, spaceAfter: 4.5 },
  );

  const boxSize = 3.8;
  const drawCheckLine = (checked: boolean, text: string) => {
    drawCheckbox(doc, margin, y - 3.2, boxSize, checked);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.text(text, margin + boxSize + 2.5, y);
    y += 5.2;
  };
  drawCheckLine(true, 'I would like to request a license. (Please select an option below)');
  drawCheckLine(false, 'I do not require a license plate.');
  y += 6;

  const col1X = margin;
  const col2X = margin + contentW * 0.38;
  const col3X = margin + contentW * 0.76;
  const line1W = contentW * 0.35;
  const line2W = contentW * 0.35;
  const line3W = contentW * 0.24;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.text(businessName || '', col1X, y);
  doc.text(driverName || '', col2X, y);
  y += 1.8;
  doc.setLineWidth(0.35);
  doc.line(col1X, y, col1X + line1W, y);
  doc.line(col2X, y, col2X + line2W, y);
  doc.line(col3X, y, col3X + line3W, y);
  y += 4.2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Independent Business Entity', col1X, y);
  doc.text('Print Name', col2X, y);
  doc.text('Date', col3X, y);
  y += 8;

  const drawOptionBlock = (label: string, checked: boolean, body: string) => {
    const indent = boxSize + 2.5;
    const leftX = margin + indent;
    drawCheckbox(doc, margin, y - 3.2, boxSize, checked);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(label, leftX, y);
    const labelW = doc.getTextWidth(label + ' ');
    doc.setFont('helvetica', 'normal');

    const firstLineWidth = contentW - indent - labelW;
    const restWidth = contentW - indent;
    const lines = wrapWordsHanging(doc, body, firstLineWidth, restWidth);

    if (lines.length > 0) {
      doc.text(lines[0], leftX + labelW, y);
      for (let i = 1; i < lines.length; i++) {
        doc.text(lines[i], leftX, y + lineH * i);
      }
      y += lineH * lines.length + 5;
    } else {
      y += lineH + 5;
    }
  };

  drawOptionBlock(
    'Option 1:',
    option1Checked,
    'IBE will pay for the full cost of the plate up front plus a $75.00 administration fee. The plate will be discounted $200 if a 12-month plate is purchased. Pro-rated plates bought mid-term, are not sold at a discounted rate. The plate cost and administration fee may only be paid for by Certified Check, Money Order or by Credit Card. The plate will remain the property of the carrier. Should the IBE cancel please follow the above *** instructions. The IBE will be reimbursed the pro-rated value (less any discounted rate given at the time of purchase) after it is resold/reassigned.',
  );

  drawOptionBlock(
    'Option 2:',
    option2Checked,
    'The IBE will be required to submit a certified check, money order or credit card in the amount of $575.00 of which $75 will be an administration fee and a $500.00 deposit. There will be a weekly plate charge of $50.00 starting the first week the plate is issued and for the duration of the enrollment in the IRP license plate program. The plate will remain the property of the carrier, should the IBE cancel please follow the above *** instructions.',
  );

  y += 8;
  const sigLineW = 85;
  const dateLineW = 40;
  const sigX = margin;
  const dateX = margin + sigLineW + 14;
  doc.setLineWidth(0.45);
  doc.line(sigX, y, sigX + sigLineW, y);
  doc.line(dateX, y, dateX + dateLineW, y);
  y += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Signature', sigX, y);
  doc.text('Date', dateX, y);

  const safeName = (driverName || 'Driver').replace(/\s+/g, '_');
  doc.save(`${safeName}_IRP_Plate_Form.pdf`);
}
