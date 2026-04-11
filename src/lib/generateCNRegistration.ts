import { jsPDF } from 'jspdf';
import cnLogoPng from '../assets/cn-logo.png';
import { assetUrl } from '../utils/assetUrl';

export interface CNRegistrationData {
  date: string;
  driverName: string;
  division: string;
  scac: string;
  cnDivision: string;
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

export async function generateCNRegistration(data: CNRegistrationData): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

  const marginLeft = 25;
  const marginRight = 25;
  const pageWidth = 215.9;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const centerX = pageWidth / 2;

  let y = 15;

  // ========== HEADER ==========
  let cnLogoBase64: string | null = null;
  try { cnLogoBase64 = await loadImage(assetUrl(cnLogoPng)); } catch { /* skip */ }
  if (cnLogoBase64) doc.addImage(cnLogoBase64, 'PNG', marginLeft, y, 40, 15);

  // Terminal name top-right
  doc.setFont('Times', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  const terminalName = data.cnDivision === 'MEM' ? 'MEMPHIS INTERMODAL TERMINAL' : 'CHICAGO INTERMODAL TERMINAL';
  doc.text(terminalName, pageWidth - marginRight, y + 8, { align: 'right' });

  y += 26;

  // Centered bold title with underline
  doc.setFont('Times', 'bold');
  doc.setFontSize(15);
  doc.text('DRIVER REGISTRATION & UPDATE FORM', centerX, y, { align: 'center' });
  const titleWidth = doc.getTextWidth('DRIVER REGISTRATION & UPDATE FORM');
  doc.setLineWidth(0.3);
  doc.setDrawColor(0, 0, 0);
  doc.line(centerX - titleWidth / 2, y + 1, centerX + titleWidth / 2, y + 1);

  y += 10;

  // Date row
  doc.setFont('Times', 'bold');
  doc.setFontSize(12);
  doc.text('Date:', marginLeft, y);
  const dateLabelWidth = doc.getTextWidth('Date:');
  doc.setFont('Times', 'normal');
  doc.text(' ' + data.date, marginLeft + dateLabelWidth, y);

  y += 7;

  // Driver's Name row
  doc.setFont('Times', 'bold');
  doc.text("Driver's Name:", marginLeft, y);
  const driverLabelWidth = doc.getTextWidth("Driver's Name:");
  doc.setFont('Times', 'normal');
  doc.text(' ' + data.driverName, marginLeft + driverLabelWidth, y);

  y += 7;

  // "Please print!" indented
  doc.setFont('Times', 'bold');
  doc.text('Please print!', marginLeft + 15, y);

  y += 10;

  // 3-column info row with underlined headers
  const col1X = marginLeft;
  const col2X = marginLeft + 80;
  const col3X = marginLeft + 105;

  doc.setFont('Times', 'bold');
  doc.setFontSize(11);

  const header1 = "Name of Driver's Cartage Company";
  const header2 = 'SCAC';
  const header3 = 'Company Phone # & Email';

  doc.text(header1, col1X, y);
  const header1Width = doc.getTextWidth(header1);
  doc.setLineWidth(0.25);
  doc.line(col1X, y + 0.8, col1X + header1Width, y + 0.8);

  doc.text(header2, col2X, y);
  const header2Width = doc.getTextWidth(header2);
  doc.line(col2X, y + 0.8, col2X + header2Width, y + 0.8);

  doc.text(header3, col3X, y);
  const header3Width = doc.getTextWidth(header3);
  doc.line(col3X, y + 0.8, col3X + header3Width, y + 0.8);

  y += 6;

  // Data row — smaller font to avoid overlap with long company names
  doc.setFont('Times', 'normal');
  doc.setFontSize(9);
  doc.text(data.division, col1X, y);
  doc.text(data.scac, col2X, y);
  doc.text('800-245-4722 processing@miasafety.com', col3X, y);

  y += 10;

  // Yellow warning bar
  const warningText = "ANY TIME YOU SWITCH CARTAGE COMPANIES DRIVERS' ARE EXPECTED TO UPDATE THEIR CARTAGE COMPANIES SCAC.";
  doc.setFontSize(11);
  const warningLines = doc.splitTextToSize(warningText, contentWidth);
  const warningHeight = warningLines.length * 4 + 3;

  doc.setFillColor(255, 255, 0);
  doc.rect(marginLeft, y - 3, contentWidth, warningHeight, 'F');

  doc.setFont('Times', 'bolditalic');
  doc.setTextColor(0, 0, 0);
  warningLines.forEach((line: string, i: number) => {
    doc.text(line, marginLeft + 2, y + i * 4);
  });

  y += warningHeight + 6;

  // Consent heading
  doc.setFont('Times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  const consentHeading = 'Please read this Notice and Consent to Collection and Use of Biometric Information (\u201CConsent\u201D) carefully.';
  const consentLines = doc.splitTextToSize(consentHeading, contentWidth);
  consentLines.forEach((line: string) => {
    doc.text(line, marginLeft, y);
    y += 5;
  });

  y += 4;

  // ========== PARAGRAPH PRINTING FUNCTION ==========
  const pageHeight = 279.4;
  const bottomMargin = 20;

  function pp(
    text: string,
    config?: {
      bold?: boolean;
      italic?: boolean;
      center?: boolean;
      underline?: boolean;
      fontSize?: number;
      lineHeight?: number;
    }
  ): void {
    const fontSize = config?.fontSize ?? 11;
    const lineHeight = config?.lineHeight ?? 4.5;
    const afterSpacing = 3.5;

    let fontStyle = 'normal';
    if (config?.bold && config?.italic) {
      fontStyle = 'bolditalic';
    } else if (config?.bold) {
      fontStyle = 'bold';
    } else if (config?.italic) {
      fontStyle = 'italic';
    }

    doc.setFont('Times', fontStyle);
    doc.setFontSize(fontSize);
    doc.setTextColor(0, 0, 0);

    const lines = doc.splitTextToSize(text, contentWidth);

    lines.forEach((line: string) => {
      if (y + lineHeight > pageHeight - bottomMargin) {
        doc.addPage();
        y = 20;
      }

      if (config?.center) {
        doc.text(line, centerX, y, { align: 'center' });
      } else {
        doc.text(line, marginLeft, y);
      }

      if (config?.underline) {
        const textWidth = doc.getTextWidth(line);
        const startX = config?.center ? centerX - textWidth / 2 : marginLeft;
        doc.setLineWidth(0.25);
        doc.line(startX, y + 0.5, startX + textWidth, y + 0.5);
      }

      y += lineHeight;
    });

    y += afterSpacing;
  }

  pp(`The term "CN" includes Illinois Central Railroad Company, Grand Trunk Western Railroad Company, Chicago Central & Pacific Railroad Company, Wisconsin Central, Ltd., Bessemer and Lake Erie Railroad Company, and Canadian National Railway Company. CN uses an Automated Gate System ("AGS") to facilitate safe, accurate, and efficient access to its terminals. As part of the AGS, CN collects finger scans that constitute Biometric Data as defined in CN's Biometric Data Collection and Retention Policy ("the Policy"). CN also collects a copy of your driver's license as well as your driver's license number. This information, your finger scan, and your driver's license number, will be used to log your entry and exit from CN's intermodal terminals.`);

  pp(`The finger scans and other personal information CN collects are shared with those inside CN with a need to know for a specific business purpose. CN will use a biometric access system provided by Nascent Technology, LLC and maintained by Remprex Terminal Services, Ltd. and Remprex, LLC (collectively, "Remprex"). Remprex will have access to employee finger scan information to perform the functions of its services agreement with CN. The information pertaining to drivers' finger scans will not be disclosed to any third party, except for Remprex, unless (1) CN obtains appropriate written consent from the driver(s); (2) disclosure completes a financial transaction requested or authorized by the driver(s); (3) disclosure is required by federal, state, or local law; or (4) disclosure is required by a valid subpoena or warrant issued by a court. CN may also disclose information about the driver's entry to or exit from Illinois terminals based on the driver's use of the AGS, including the fact that the driver provided a finger scan, in response to a request from the motor carrier that a driver works for or contracts with, or under the circumstances listed above or otherwise as required by law.`);

  pp(`When a driver or a motor carrier employing or contracting a driver who uses CN's AGS informs CN that the driver no longer will use the AGS, CN will within a reasonable period of time destroy data pertaining to the finger scan collected from the driver. If a driver or a motor carrier that a driver works for or contracts with does not inform CN that the driver will no longer access CN's AGS, CN will destroy the data pertaining to the finger scan collected from the driver within 3 years of the date the driver last accessed CN's AGS.`);

  pp(`CN is providing a copy of this Consent and the Policy in a way that you can retain it for your records. Please scan the QR code at the end of this form to access a copy of this Consent and the Policy. If you are unable to scan the QR code, please see the clerk for a paper copy.`);

  pp(`By clicking "Accept", I acknowledge receipt of an electronic copy of this Consent and the Policy, and I consent to the collection, storage, use, and disclosure of the scan of my finger and other personal information under the terms described above. I voluntarily consent to CN's and Remprex's collection, storage and use of data pertaining to my finger scan as described in the Policy. I voluntarily consent to CN providing such data to Remprex for purposes of its services agreement with CN. I understand that CN is providing the Policy and Consent in a way that I can retain it for my records, and that I can scan the QR code below to access a copy of the Policy and this Consent. I understand that I may also see the clerk at this intermodal facility for a copy of the Policy and Consent.`);

  pp(`I understand the Terminal Safety Rules and Guidelines and will comply with them at all times while on CN Property. I acknowledge that drivers failing to comply with Safety Rules and Guidelines of the terminal are subject to bans.`);

  // === ARBITRATION SECTION ===
  y += 2;

  pp('AGREEMENT TO ARBITRATE', {
    center: true,
    bold: true,
    underline: true,
    fontSize: 13,
    lineHeight: 6,
  });

  pp(`You and CN agree that any and all controversies, claims, or disputes, whether arising before or after this Arbitration Agreement is signed ("Claims"), arising out of or relating to any acts, omissions, conditions, or events related to Your access to or entry on CN-operated property, or the collection, capture, use, storage, and deletion by CN or its vendors of Your personal or Biometric Data, including under the Illinois Biometric Information Privacy Act, shall be resolved by final and binding arbitration by the American Arbitration Association ("AAA"). The arbitration must be conducted in accordance with the AAA Commercial Arbitration Rules, copies of which are available at www.adr.org. This Arbitration Agreement shall be governed by the Federal Arbitration Act (9 U.S.C. \u00A7 1 et seq.) ("FAA"). If the FAA is held not to apply, this Arbitration Agreement will be governed by the arbitration laws of the State of Illinois.`);

  pp(`Each party shall pay its own arbitration filing fees and an equal share of the fees and expenses of the arbitrator and the cost of the arbitration site. Except to the extent as otherwise determined by law, the parties shall each pay their own attorneys' fees.`);

  pp(`You and CN agree that no class, collective, consolidated, or representative arbitration of claims shall be allowed and that the arbitrator is not empowered to certify, conduct, or award relief in any such arbitration.`);

  pp(`If a court or arbitrator allows or requires a class, collective, consolidated, or representative arbitration, the parties agree that such a determination is immediately appealable to the United States District Court for the Northern District of Illinois or, if jurisdiction does not exist in that court, in the Circuit Court of Will County, Illinois, as contrary to the intent of the parties in entering into this Arbitration Agreement. All arbitral proceedings, including discovery, shall be stayed pending that appeal. In the event the determination is not reversed on appeal, the parties agree that this arbitration agreement in its entirety, and any prior or subsequent arbitration award under it, shall be null and void, and any claims between the parties shall be resolved by court action, not arbitration, in the foregoing state or federal courts. If at any point this provision is determined to be unenforceable, the parties agree that this provision shall not be severable, unless it is determined that the arbitration will still proceed on an individual basis only.`);

  pp(`CN is providing a copy of this Arbitration Agreement in a way that you can retain it for your records. Please scan the QR code at the end of this form to access a copy of this Arbitration Agreement. If you are unable to scan the QR code, please see the clerk for a paper copy.`);

  pp(`By signing below, I agree to this Arbitration Agreement and waive my right to a jury trial.`);

  // Signature block
  y += 4;

  const signatureHeight = 10;
  if (y + signatureHeight > pageHeight - bottomMargin) {
    doc.addPage();
    y = 20;
  }

  const signatureLabelWidth = doc.getTextWidth("Driver's Signature:");
  const dateLabelWidth2 = doc.getTextWidth('Date:');
  const signatureLineWidth = 50;
  const gapBetween = 15;

  const signatureLabelX = marginLeft;
  const signatureLineX = signatureLabelX + signatureLabelWidth + 2;
  const dateLabelX = signatureLineX + signatureLineWidth + gapBetween;
  const dateLineX = dateLabelX + dateLabelWidth2 + 2;
  const dateLineEnd = pageWidth - marginRight;

  doc.setFont('Times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);

  doc.text("Driver's Signature:", signatureLabelX, y);
  doc.setLineWidth(0.4);
  doc.line(signatureLineX, y, signatureLineX + signatureLineWidth, y);

  doc.text('Date:', dateLabelX, y);
  doc.line(dateLineX, y, dateLineEnd, y);

  const safeFileName = data.driverName.replace(/[^a-zA-Z0-9\s-]/g, '');
  doc.save(`${safeFileName} - CN Registration.pdf`);
}
