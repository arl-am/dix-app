import { jsPDF } from 'jspdf';

export interface CNRegistrationData {
  date: string;
  driverName: string;
  division: string;
  scac: string;
  cnDivision: string;
}

const CN_LOGO_B64 = 'data:image/png;base64,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';

export function generateCNRegistration(data: CNRegistrationData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

  const marginLeft = 25;
  const marginRight = 25;
  const pageWidth = 215.9;
  const contentWidth = pageWidth - marginLeft - marginRight;
  const centerX = pageWidth / 2;

  let y = 15;

  // ========== HEADER ==========
  doc.addImage(CN_LOGO_B64, 'PNG', marginLeft, y, 30, 18);

  // Terminal name top-right
  doc.setFont('Times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  const terminalName = data.cnDivision === 'MEM' ? 'MEMPHIS INTERMODAL TERMINAL' : 'CHICAGO INTERMODAL TERMINAL';
  doc.text(terminalName, pageWidth - marginRight, y + 8, { align: 'right' });

  y += 26;

  // Centered bold title with underline
  doc.setFont('Times', 'bold');
  doc.setFontSize(14);
  doc.text('DRIVER REGISTRATION & UPDATE FORM', centerX, y, { align: 'center' });
  const titleWidth = doc.getTextWidth('DRIVER REGISTRATION & UPDATE FORM');
  doc.setLineWidth(0.3);
  doc.setDrawColor(0, 0, 0);
  doc.line(centerX - titleWidth / 2, y + 1, centerX + titleWidth / 2, y + 1);

  y += 10;

  // Date row
  doc.setFont('Times', 'bold');
  doc.setFontSize(11);
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
  const col2X = marginLeft + 70;
  const col3X = marginLeft + 100;

  doc.setFont('Times', 'bold');
  doc.setFontSize(10);

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

  // Data row
  doc.setFont('Times', 'normal');
  doc.text(data.division, col1X, y);
  doc.text(data.scac, col2X, y);
  doc.text('800-245-4722 processing@miasafety.com', col3X, y);

  y += 10;

  // Yellow warning bar
  const warningText = "ANY TIME YOU SWITCH CARTAGE COMPANIES DRIVERS' ARE EXPECTED TO UPDATE THEIR CARTAGE COMPANIES SCAC.";
  doc.setFontSize(10);
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
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('Please read this Notice and Consent to Collection and Use of Biometric Information ("Consent") carefully.', marginLeft, y);

  y += 8;

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
    const fontSize = config?.fontSize ?? 10.5;
    const lineHeight = config?.lineHeight ?? 4.5;
    const afterSpacing = 4.5;

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
  y += 10;

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
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  doc.text("Driver's Signature:", signatureLabelX, y);
  doc.setLineWidth(0.4);
  doc.line(signatureLineX, y, signatureLineX + signatureLineWidth, y);

  doc.text('Date:', dateLabelX, y);
  doc.line(dateLineX, y, dateLineEnd, y);

  const safeFileName = data.driverName.replace(/[^a-zA-Z0-9\s-]/g, '');
  doc.save(`${safeFileName} - CN Registration.pdf`);
}
