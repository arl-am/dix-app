import { jsPDF } from 'jspdf';

export type CoverageChoice = 'add' | 'decline';

export interface InsuranceFormData {
  terminalNumber: string;
  driverName: string;
  businessName: string;
  address: string;
  cityStateZip: string;
  truckYear: string;
  truckModel: string;
  truckVin: string;
  statedValue: string;
  lienholderName: string;
  lienholderAddress: string;
  bobtail: CoverageChoice;
  physicalDamage: CoverageChoice;
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

export function generateInsuranceForm(data: InsuranceFormData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 22;
  const contentW = pageW - margin * 2;
  let y = margin + 4;

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('Request for Bobtail and/or Physical Damage Insurance', pageW / 2, y, { align: 'center', maxWidth: contentW });
  y += 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const warnText = 'This must be completed in full';
  const warnTextW = doc.getTextWidth(warnText);
  const warnStartX = (pageW - warnTextW) / 2;
  doc.text(warnText, warnStartX, y);
  const triX = warnStartX + warnTextW + 3;
  const triY = y;
  const triSize = 3.2;
  doc.setLineWidth(0.45);
  doc.line(triX, triY, triX + triSize, triY - triSize * 1.6);
  doc.line(triX + triSize, triY - triSize * 1.6, triX + triSize * 2, triY);
  doc.line(triX, triY, triX + triSize * 2, triY);
  doc.setFontSize(7);
  doc.text('!', triX + triSize, triY - 0.6, { align: 'center' });
  doc.setFontSize(11);
  y += 8;

  const boxSize = 3.8;
  const drawCoverageRow = (label: string, choice: CoverageChoice) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const dashedLabel = `${label} \u2013`;
    const labelW = doc.getTextWidth(dashedLabel);
    const addText = 'Add';
    const declineText = 'Decline';
    const addW = doc.getTextWidth(addText);
    const gap1 = 3;
    const gap2 = 12;
    const totalW = labelW + gap1 + boxSize + 2 + addW + gap2 + boxSize + 2 + doc.getTextWidth(declineText);
    const startX = (pageW - totalW) / 2;
    let x = startX;
    doc.text(dashedLabel, x, y);
    x += labelW + gap1;
    drawCheckbox(doc, x, y - 3.1, boxSize, choice === 'add');
    x += boxSize + 2;
    doc.text(addText, x, y);
    x += addW + gap2;
    drawCheckbox(doc, x, y - 3.1, boxSize, choice === 'decline');
    x += boxSize + 2;
    doc.text(declineText, x, y);
    y += 7;
  };
  drawCoverageRow('Bobtail', data.bobtail);
  drawCoverageRow('Physical Damage', data.physicalDamage);
  y += 6;

  const labelX = margin;
  const fieldValueX = margin + 50;
  const fieldLineEndX = margin + contentW - 50;
  const termLabelX = fieldLineEndX + 3;
  const termValueX = termLabelX + 30;
  const termLineEndX = margin + contentW;

  doc.setLineWidth(0.35);

  const labeledRow = (label: string, value: string, opts?: { rightLabel?: string; rightValue?: string }) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(label, labelX, y);
    doc.setFont('helvetica', 'normal');
    if (opts?.rightLabel) {
      doc.text(value || '', fieldValueX, y);
      doc.line(fieldValueX, y + 0.8, fieldLineEndX, y + 0.8);
      doc.setFont('helvetica', 'bold');
      doc.text(opts.rightLabel, termLabelX, y);
      doc.setFont('helvetica', 'normal');
      doc.text(opts.rightValue || '', termValueX, y);
      doc.line(termValueX, y + 0.8, termLineEndX, y + 0.8);
    } else {
      doc.text(value || '', fieldValueX, y);
      doc.line(fieldValueX, y + 0.8, termLineEndX, y + 0.8);
    }
    y += 7;
  };

  labeledRow('Effective Date:', '', { rightLabel: 'Terminal Number:', rightValue: data.terminalNumber });
  labeledRow('IBE Requesting Coverage:', data.driverName);
  labeledRow('IBE Name:', data.businessName);
  labeledRow('Address:', data.address);
  labeledRow('City, State and Zip:', data.cityStateZip);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Tractor:', margin, y);
  y += 7;

  const tractorValueX = margin + 30;
  const tractorLineEndX = margin + 95;

  const tractorRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.text(label, labelX, y);
    doc.text(value || '', tractorValueX, y);
    doc.line(tractorValueX, y + 0.8, tractorLineEndX, y + 0.8);
    y += 7;
  };
  tractorRow('Year:', data.truckYear);
  tractorRow('Model:', data.truckModel);
  tractorRow('VIN:', data.truckVin);
  tractorRow('Stated Value:', data.statedValue);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Tractor Lienholder:', margin, y);
  y += 7;

  const lienValueX = margin + 30;
  const lienLineEndX = margin + 130;
  const lienRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.text(label, labelX, y);
    doc.text(value || 'N/A', lienValueX, y);
    doc.line(lienValueX, y + 0.8, lienLineEndX, y + 0.8);
    y += 7;
  };
  lienRow('Name:', data.lienholderName);
  lienRow('Address:', data.lienholderAddress);
  y += 22;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('IBE Signature:', margin, y);
  const sigStart = margin + 34;
  const sigEnd = margin + 34 + 55;
  doc.setLineWidth(0.45);
  doc.line(sigStart, y + 0.8, sigEnd, y + 0.8);
  doc.text('Date:', sigEnd + 14, y);
  const dateStart = sigEnd + 14 + 13;
  const dateEnd = dateStart + 40;
  doc.line(dateStart, y + 0.8, dateEnd, y + 0.8);

  const safeName = (data.driverName || 'Driver').replace(/\s+/g, '_');
  doc.save(`${safeName}_Insurance_Form.pdf`);
}
