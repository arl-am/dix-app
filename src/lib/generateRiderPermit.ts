import { jsPDF } from 'jspdf';
import arlLogoPng from '../assets/arl-logo.png';
import { assetUrl } from '../utils/assetUrl';

export interface RiderPermitData {
  driverName: string;
  businessName: string;
  unitNumber: string;
  proNumber: string;
  passengerName: string;
  permitStartDate: string;
  permitEndDate: string;
}

function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      const ctx = c.getContext('2d');
      if (ctx) { ctx.drawImage(img, 0, 0); resolve(c.toDataURL('image/png')); }
      else reject(new Error('no ctx'));
    };
    img.onerror = () => reject(new Error('load failed'));
    img.src = url;
  });
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function parseLocalDate(iso: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function formatMdy(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function formatMMDDYYYYdash(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}-${dd}-${d.getFullYear()}`;
}

function formatMonthRange(start: Date, end: Date): string {
  return `${MONTHS[start.getMonth()]} ${start.getDate()} to ${MONTHS[end.getMonth()]} ${end.getDate()}`;
}

export async function generateRiderPermit(data: RiderPermitData): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 19;
  const contentW = pageW - margin * 2;

  let arlLogoBase64: string | null = null;
  try { arlLogoBase64 = await loadImage(assetUrl(arlLogoPng)); } catch { /* skip */ }

  const today = new Date();
  const todayStr = formatMdy(today);
  const startDate = parseLocalDate(data.permitStartDate);
  const endDate = parseLocalDate(data.permitEndDate);
  const permitDateStr = startDate ? formatMMDDYYYYdash(startDate) : '';
  const permitMonthStr = (startDate && endDate) ? formatMonthRange(startDate, endDate) : '';
  const todayMonth = MONTHS[today.getMonth()];
  const todayDay = String(today.getDate()).padStart(2, '0');
  const todayYear = String(today.getFullYear());

  const BLACK: [number, number, number] = [0, 0, 0];

  const drawLogo = (y: number) => {
    if (!arlLogoBase64) return;
    const logoW = 36;
    const logoH = 18;
    doc.addImage(arlLogoBase64, 'PNG', (pageW - logoW) / 2, y, logoW, logoH);
  };

  // ========== PAGE 1: Policy Memo ==========
  let y = 14;
  drawLogo(y);
  y += 26;

  doc.setTextColor(...BLACK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);

  const metaLabelW = 18;
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(todayStr, margin + metaLabelW, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('To:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text('Independent Business Associates (IBA)', margin + metaLabelW, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('From:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text('William Seyler, Safety Director', margin + metaLabelW, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Re:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text('Passenger Permission to Ride', margin + metaLabelW, y);
  y += 10;

  const paragraphs: string[] = [
    `ARL Transport LLC dba ARL has acquired insurance for the protection of passengers. This policy is an accident death & dismemberment policy. The principal sum is $50,000.00 with $5,000.00 accident medical express, this passenger insurance will be effective ${permitDateStr} and will be mandatory for all persons wishing to take a passenger in a permanent leased ARL Transport LLC unit. The cost is $38.00 a month and can be pro-rated on a weekly basis.`,
    'ARL Transport LLC passenger policy has been changed to read that no person under the age of 18 is permitted in equipment leased to ARL and that NO passengers between the ages of 18 & 21 are permitted in equipment leased to ARL Transport LLC dba ARL unless they are family members.',
    'The permission to ride is only good for 30 days at a time and must be renewed every 30 days in writing and a copy of a Photo ID is required with a request form.',
    'I certify that I have and understand this change in this policy for the permission to ride program. I authorize ARL Transport LLC to deduct the premium for the passenger insurance from my settlements.',
  ];

  const indentPrefix = '        ';
  for (const p of paragraphs) {
    const lines = doc.splitTextToSize(indentPrefix + p, contentW);
    doc.text(lines, margin, y, { align: 'justify', maxWidth: contentW } as any);
    y += lines.length * 4.6 + 4.5;
  }

  y += 16;
  doc.setLineWidth(0.3);

  const sigLabelW = 28;
  const sigLineStart = margin + sigLabelW;
  const sigLineEnd = margin + 110;
  doc.setFont('helvetica', 'normal');
  doc.text('Signature IBA:', margin, y);
  doc.line(sigLineStart, y + 1, sigLineEnd, y + 1);

  const dateLabelX = margin + 120;
  const dateValueX = dateLabelX + 15;
  const dateLineEnd = pageW - margin;
  doc.text('Date:', dateLabelX, y);
  doc.text(todayStr, dateValueX, y);
  doc.line(dateValueX, y + 1, dateLineEnd, y + 1);

  // ========== PAGE 2: Permission to Ride Form ==========
  doc.addPage();
  y = 14;
  drawLogo(y);
  y += 26;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.text('PERMISSION TO RIDE', margin, y);
  doc.setLineWidth(0.3);
  doc.line(margin, y + 0.8, margin + doc.getTextWidth('PERMISSION TO RIDE'), y + 0.8);
  y += 8;

  const labelLine = (label: string, value: string, labelX: number, valueX: number, lineEnd: number, baselineY: number) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, labelX, baselineY);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '', valueX + 1, baselineY);
    doc.line(valueX, baselineY + 1, lineEnd, baselineY + 1);
  };

  const colW = (contentW - 4) / 3;
  const col1X = margin;
  const col2X = margin + colW + 2;
  const col3X = margin + (colW + 2) * 2;

  labelLine('DATE:', todayStr, col1X, col1X + 16, col1X + colW, y);
  labelLine('PRO NO:', data.proNumber, col2X, col2X + 20, col2X + colW, y);
  labelLine('MONTH:', permitMonthStr, col3X, col3X + 20, col3X + colW, y);
  y += 9;

  labelLine('RELEASE NO:', data.proNumber, col1X, col1X + 30, col1X + colW, y);
  labelLine('UNIT NO:', data.unitNumber, col2X, col2X + 20, col2X + colW, y);
  y += 10;

  const intro = 'Call Corporate Office, Safety Department a 1-800-245-4722, for your release number. Without a release number you are in violation of Federal Regulation for not obtaining a rider permit.';
  const introLines = doc.splitTextToSize(intro, contentW);
  doc.text(introLines, margin, y);
  y += introLines.length * 4.6 + 6;

  const subjectLine = (value: string, suffixLabel: string, baselineY: number) => {
    const valStart = margin;
    const valEnd = margin + 70;
    doc.text(value || '', valStart + 1, baselineY);
    doc.line(valStart, baselineY + 1, valEnd, baselineY + 1);
    doc.text(suffixLabel, valEnd + 3, baselineY);
  };

  subjectLine(data.passengerName, '(Passenger name)', y); y += 7;
  subjectLine(data.businessName, '(IBE) leased under ARL Transport LLC', y); y += 9;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  const ridePermit = 'RIDE PERMIT';
  const rpW = doc.getTextWidth(ridePermit);
  doc.text(ridePermit, pageW / 2, y, { align: 'center' });
  doc.line(pageW / 2 - rpW / 2, y + 0.8, pageW / 2 + rpW / 2, y + 0.8);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const ridePermitBody = 'This will authorize the above named passenger to ride without charge as a guest on the above unit number until the dates listed above. Issued in consideration for the Release Agreement below.';
  const ridePermitLines = doc.splitTextToSize(ridePermitBody, contentW);
  doc.text(ridePermitLines, margin, y);
  y += ridePermitLines.length * 4.5 + 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  const releaseAgr = 'RELEASE AGREEMENT';
  const raW = doc.getTextWidth(releaseAgr);
  doc.text(releaseAgr, pageW / 2, y, { align: 'center' });
  doc.line(pageW / 2 - raW / 2, y + 0.8, pageW / 2 + raW / 2, y + 0.8);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const releaseParas: string[] = [
    'In consideration for the granting of the above permit and in consideration for the sum of one dollar and valuable considerations the receipt whereof is hereby acknowledged, and in consideration for the exercise by the undersigned of the privilege of so riding, the undersigned does hereby covenant and agree that he waives and releases on behalf of himself, his heirs, and assigns all claims of every kind and description for injuries, damages, or death sustained by while riding in said equipment as a guest, which claim or claims may arise at any time in the future, as against ARL Transport LLC, its Independent Business Entity (IBE) or the IBE\u2019s driver, agents, successors, or assigns, and whether or not caused or claimed to be caused by the negligence of said parties so released from liability. Under no circumstances is a rider permitted to participate in the operation of the leased equipment while under a rider permit. This includes but is not limited to; Operating (Driving), Loading or Unloading. Repairing, Servicing or Cleaning.',
    'The undersigned further agrees not to bring any action either at law or in equity as against any such released parties upon any such claim and this agreement shall be a complete defense to any such action.',
    'The undersigned on behalf of himself, his heirs, personal representatives and assigns, further agrees to indemnify, pay and save harmless said released parties as against any and all such claims whether brought or filed by the undersigned, his personal representatives, his estate, heirs or dependents.',
    'The undersigned further agrees that he will, subsequent to the sustaining of any such injury or damage, execute and deliver upon demand such further specific releases, as in the judgment of said corporation may be requisite, incidental or proper to implement, carry out, ratify, or confirm the foregoing.',
    'It is further agreed that said corporation may cancel the above permit at any time, with or without notice, further; passenger is 18 years of age. Minors, under the age of 18 cannot be passengers in a permanent unit.',
  ];

  for (const p of releaseParas) {
    const lines = doc.splitTextToSize(p, contentW);
    doc.text(lines, margin, y);
    y += lines.length * 4.2 + 3;
  }

  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Executed and delivered', margin, y);
  const mdyStartX = margin + 42;
  const segW = 22;
  const gap = 3;
  const mx = mdyStartX;
  const dx = mx + segW + gap;
  const yx = dx + segW + gap;
  doc.text(todayMonth, mx + segW / 2, y, { align: 'center' });
  doc.text(todayDay, dx + segW / 2, y, { align: 'center' });
  doc.text(todayYear, yx + segW / 2, y, { align: 'center' });
  doc.line(mx, y + 1, mx + segW, y + 1);
  doc.line(dx, y + 1, dx + segW, y + 1);
  doc.line(yx, y + 1, yx + segW, y + 1);

  const passengerSigX = yx + segW + 8;
  const passengerSigEnd = pageW - margin;
  doc.line(passengerSigX, y + 1, passengerSigEnd, y + 1);

  doc.setFontSize(8);
  doc.text('Month', mx + segW / 2, y + 4.5, { align: 'center' });
  doc.text('Day', dx + segW / 2, y + 4.5, { align: 'center' });
  doc.text('Yr.', yx + segW / 2, y + 4.5, { align: 'center' });
  doc.text('Passenger Signature', (passengerSigX + passengerSigEnd) / 2, y + 4.5, { align: 'center' });
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const bottomNote = 'PLEASE SEND A COPY OF THE PASSENGER\u2019S DRIVER LICENSE WITH THIS PAGE. FAX TO 1-800-513-7078 OR 412-507-3031 OR EMAIL TO SAFETY@MIASAFETY.COM INCLUDE A RETURN FAX NUMBER';
  const bottomLines = doc.splitTextToSize(bottomNote, contentW);
  doc.text(bottomLines, margin, y);
  y += bottomLines.length * 4 + 4;
  doc.line(margin, y, margin + 55, y);

  const safeName = (data.driverName || 'Driver').replace(/\s+/g, '_');
  doc.save(`${safeName}_Rider_Permit.pdf`);
}
