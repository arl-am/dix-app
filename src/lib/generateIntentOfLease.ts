import { jsPDF } from 'jspdf';
import type { Agent } from './mockData';

export interface IntentOfLeaseData {
  form: Record<string, string>;
  agent: Agent | null;
  processingSpecialistName: string;
}

function carrierIccDot(code: string): string {
  if (code === 'ARL') return 'ICC # 152672 \u2013 DOT # 186375';
  if (code === 'ACT') return 'ICC # 463184 - DOT # 1143006';
  return 'ICC # 1450732 - DOT # 3921657';
}

function carrierDotMc(code: string): string {
  if (code === 'ARL') return 'ARL DOT 186375 \u2013 MC 152672';
  if (code === 'ACT') return 'ACT DOT 1143006 - MC 463184';
  return `${code || ''} DOT 3921657 - MC 1450732`.trim();
}

function monthName(d: Date): string {
  return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()];
}

export function generateIntentOfLease(data: IntentOfLeaseData): void {
  const { form, agent, processingSpecialistName } = data;

  const mcCode = agent?.cr6cd_motorcarriercode || '';
  const division = agent?.cr6cd_divisionformal || agent?.cr6cd_division || mcCode || '';
  const iccDot = carrierIccDot(mcCode);
  const carrierLine = carrierDotMc(mcCode);
  const driverName = (form.driverName || '').trim();
  const businessName = (form.businessName || '').trim();
  const contractorLine = [businessName, driverName].filter(Boolean).join(' - ');

  const today = new Date();
  const mName = monthName(today);
  const mDay = String(today.getDate()).padStart(2, '0');
  const mYear = String(today.getFullYear());
  const longDate = `${mName} ${mDay}, ${mYear}`;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 19;
  const contentW = pageW - margin * 2;
  let y = margin;

  const BLACK: [number, number, number] = [0, 0, 0];
  doc.setTextColor(...BLACK);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('APPENDIX \u201CA\u201D', margin, y);
  y += 6.5;
  doc.text('EQUIPMENT SCHEDULE INTENT TO LEASE', margin, y);
  y += 6;

  const drawMdyBlock = (labelText: string, labelX: number, startX: number, baselineY: number) => {
    const segW = 30;
    const gap = 3;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(labelText, labelX, baselineY);
    const mx = startX;
    const dx = mx + segW + gap;
    const yx = dx + segW + gap;
    doc.setFont('helvetica', 'normal');
    doc.text(mName, mx + segW / 2, baselineY, { align: 'center' });
    doc.text(mDay, dx + segW / 2, baselineY, { align: 'center' });
    doc.text(mYear, yx + segW / 2, baselineY, { align: 'center' });
    doc.setLineWidth(0.3);
    doc.line(mx, baselineY + 0.8, mx + segW, baselineY + 0.8);
    doc.line(dx, baselineY + 0.8, dx + segW, baselineY + 0.8);
    doc.line(yx, baselineY + 0.8, yx + segW, baselineY + 0.8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Month', mx + segW / 2, baselineY + 4, { align: 'center' });
    doc.text('Day', dx + segW / 2, baselineY + 4, { align: 'center' });
    doc.text('Year', yx + segW / 2, baselineY + 4, { align: 'center' });
  };

  drawMdyBlock('To CONTRACT Date:', margin, margin + 34, y);
  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const preamble = 'CARRIER hereby receipts for the equipment hereinafter described, this receipt being executed pursuant to FMCSA Regulation 376.12 (b), and to the extent as therein specified, and directed, CARRIER shall, during the duration of this receipt, have the exclusive possession, control, and use of the equipment, to the extent required by FMCSA Regulation 376.12(c).  CARRIER shall be deemed to have assumed complete responsibility for the operation of the equipment in the transportation of the commodities, provided, however, that this receipt shall not affect the legal relations between CARRIER, and the CONTRACTOR, his agents, or employees as set forth in this INDEPENDENT BUSINESS ASSOCIATE CONTRACT. The parties acknowledge that the consideration for this receipt is stated in the CONTRACT, and below thereto, and shall remain in effect until it is terminated.  The CONTRACTOR warrants that the following described equipment conforms to, and meets the requirements of all-applicable federal and state laws, and the rules and regulations of the FMCSA, the U.S. Department of Transportation, and state authorities.';
  const preambleLines = doc.splitTextToSize(preamble, contentW);
  doc.text(preambleLines, margin, y, { align: 'justify', maxWidth: contentW } as any);
  y += preambleLines.length * 4.2 + 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('IDENTIFICATION OF EQUIPMENT', pageW / 2, y, { align: 'center' });
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const lockLine = `This lease is in effect for a minimum of 180 days, and then will become permanent until cancelled.  ${iccDot}`;
  const lockLines = doc.splitTextToSize(lockLine, contentW);
  doc.text(lockLines, margin, y);
  y += lockLines.length * 4.5 + 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TRACTOR:', margin, y);
  y += 6;

  const labelCol = (label: string, value: string, x: number, baselineY: number, valueOffset: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(label, x, baselineY);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '', x + valueOffset, baselineY);
  };

  labelCol('Make:', form.make || '', margin + 4, y, 14);
  labelCol('Model:', form.model || '', margin + 70, y, 16);
  labelCol('Year:', form.year || '', margin + 130, y, 14);
  y += 7;

  labelCol('Serial Number:', form.vin || '', margin + 4, y, 28);
  y += 8;

  drawMdyBlock('Dated this day:', margin + 4, margin + 36, y);
  y += 8.5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('At:', margin + 4, y);
  doc.setFont('helvetica', 'normal');
  doc.text(mcCode || '', margin + 36, y);
  doc.text('on or about,', margin + 72, y);
  doc.text('12:00 PM', margin + 100, y);
  y += 8;

  const colLeftX = margin + 4;
  const colRightX = margin + contentW / 2 + 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CARRIER:', colLeftX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(carrierLine, colLeftX + 20, y);
  doc.setFont('helvetica', 'bold');
  doc.text('CONTRACTOR:', colRightX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(contractorLine, colRightX + 28, y);
  y += 9;

  doc.setFont('helvetica', 'bold');
  doc.text('BY:', colLeftX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(processingSpecialistName, colLeftX + 20, y);
  doc.setFont('helvetica', 'bold');
  doc.text('BY:', colRightX, y);
  doc.setFont('helvetica', 'normal');
  doc.text(driverName, colRightX + 20, y);
  y += 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Print Name', colLeftX + 30, y);
  doc.text('Print Name', colRightX + 30, y);
  y += 10;

  doc.setLineWidth(0.3);
  doc.line(colLeftX, y, colLeftX + 70, y);
  doc.line(colRightX, y, colRightX + 70, y);
  y += 4;
  doc.text('Signature', colLeftX + 30, y);
  doc.text('Signature', colRightX + 30, y);
  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PROCESSING SPECIALIST', colLeftX + 8, y);
  doc.setFont('helvetica', 'normal');
  doc.text(longDate, colRightX + 20, y);
  y += 3;
  doc.setFontSize(8);
  doc.text('Title', colLeftX + 30, y);
  doc.text('Date Signed', colRightX + 28, y);
  y += 8;

  doc.setFillColor(0, 0, 0);
  doc.rect(margin, y, contentW, 1.4, 'F');
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Only complete this section of the lease agreement when CANCELING.', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const cancelP1 = 'Contact the Safety Department IMMEDIATELY to advise of cancellation of this tractor. This signed and dated lease must be returned to the corporate office at 1155 Stoops Ferry Rd, Moon Twp., PA 15108 upon termination/cancellation:';
  const cancelP1Lines = doc.splitTextToSize(cancelP1, contentW);
  doc.text(cancelP1Lines, margin, y);
  y += cancelP1Lines.length * 4 + 3;

  const cancelP2 = `The failure of said CONTRACTOR to notify CARRIER\u2019S Safety Department of any cancellation or other change in CONTRACTOR\u2019S available status can result in the charge for PDI insurance coverage purchased by said CONTRACTOR through CARRIER should the first of the month pass when this insurance coverage. Refund for such charge will not be given by the CARRIER if the Safety Department is not notified in a timely manner by said CONTRACTOR of the cancellation of the Agreement by said CONTRACTOR.  The notification should be in writing and faxed to the Safety Department at (800) 513-7078.`;
  const cancelP2Lines = doc.splitTextToSize(cancelP2, contentW);
  doc.text(cancelP2Lines, margin, y);
  y += cancelP2Lines.length * 4 + 3;

  const cancelP3 = `I have read and understand the above section, and by signing below I am canceling my tractor lease with ${division || '{{Division}}'}. as of date below.`;
  const cancelP3Lines = doc.splitTextToSize(cancelP3, contentW);
  doc.text(cancelP3Lines, margin, y);
  y += cancelP3Lines.length * 4 + 10;

  doc.setLineWidth(0.3);
  const sigLineW = 85;
  const dateLineW = 45;
  doc.line(margin, y, margin + sigLineW, y);
  doc.line(margin + sigLineW + 10, y, margin + sigLineW + 10 + dateLineW, y);
  y += 4;
  doc.setFontSize(8);
  doc.text('Signature', margin + sigLineW / 2, y, { align: 'center' });
  doc.text('Date', margin + sigLineW + 10 + dateLineW / 2, y, { align: 'center' });

  const safeName = (driverName || 'Driver').replace(/\s+/g, '_');
  doc.save(`${safeName}_Intent_of_Lease.pdf`);

  void pageH;
}
