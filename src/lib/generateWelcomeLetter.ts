import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Agent } from './mockData';

const navyColor = '#1E293B';
const grayBg = '#F1F5F9';
const borderColor = '#E2E8F0';
const redColor = '#DC2626';

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

export interface WelcomeLetterData {
  uiiaPinCode: string;
  enteredInEModal: boolean;
  dualScac: boolean;
  scacCode: string;
  scacPin: string;
}

export interface WelcomeLetterInput {
  form: Record<string, string>;
  agent: Agent | null;
  welcomeLetterData: WelcomeLetterData;
}

async function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = url;
  });
}

function getLogoUrl(motorCarrierCode: string | undefined): string | null {
  switch (motorCarrierCode) {
    case 'ARL':
      return 'https://i.imgur.com/0Epg823.png';
    case 'ACT':
      return 'https://i.imgur.com/BW5Zd6L.png';
    case 'Partners':
      return 'https://i.imgur.com/WEUT9Kr.png';
    default:
      return null;
  }
}

export async function generateWelcomeLetter({ form, agent, welcomeLetterData }: WelcomeLetterInput): Promise<void> {
  const motorCarrierName = agent?.cr6cd_motorcarrier || 'American Carrier Transport, LLC';
  const terminalNumber = agent?.cr6cd_terminal || '—';
  const division = agent?.cr6cd_division || '—';
  const scac = agent?.cr6cd_scac || '—';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 0.5;
  let yPos = margin;

  const logoUrl = getLogoUrl(agent?.cr6cd_motorcarriercode);

  if (logoUrl) {
    try {
      const logoBase64 = await loadImage(logoUrl);
      const logoWidth = 1.5;
      const logoHeight = logoWidth * 0.4;
      const logoX = (pageWidth - logoWidth) / 2;
      doc.addImage(logoBase64, 'PNG', logoX, yPos, logoWidth, logoHeight);
      yPos += logoHeight + 0.515;
    } catch {
      // skip logo
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...hexToRgb(navyColor));
  doc.text(`WELCOME TO ${motorCarrierName.toUpperCase()}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 0.25;

  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(10);
  doc.text('Independent Business Entity (IBE) Number Information', pageWidth / 2, yPos, { align: 'center' });
  yPos += 0.3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(navyColor));

  const contentWidth = pageWidth - margin * 2;
  const lineHeight = 0.18;

  const para1 = 'We are pleased that you have joined our growing organization and hope that you will enjoy your association with us. We strive for the highest goals of quality service and are looking forward to working with you.';
  const para1Lines = doc.splitTextToSize(para1, contentWidth);
  doc.text(para1Lines, margin, yPos);
  yPos += para1Lines.length * lineHeight + 0.15;

  const para2 = 'Below are your Vendor/Driver numbers, please have these numbers available to access the set up on your pay card and fuel card with your Customer Service Representative (CSR). Also remember to use these numbers on your logs and any paper work that you send into the corporate office. This will help us to quickly identify you in our system and assist with any inquires you may have.';
  const para2Lines = doc.splitTextToSize(para2, contentWidth);
  doc.text(para2Lines, margin, yPos);
  yPos += para2Lines.length * lineHeight + 0.25;

  const tableStartY = yPos;

  const uiiaPinValue = welcomeLetterData.uiiaPinCode || '—';
  const dualScacCode = welcomeLetterData.dualScac ? welcomeLetterData.scacCode : '';
  const dualScacPin = welcomeLetterData.dualScac ? welcomeLetterData.scacPin : '';

  const dualScacRow = welcomeLetterData.dualScac
    ? [
        { content: 'IBE Pin # for Rail/Port Access', colSpan: 2, styles: { fontStyle: 'bold' as const, fillColor: hexToRgb(grayBg) } },
        { content: uiiaPinValue, colSpan: 1 },
        { content: 'Dual SCAC', styles: { fontStyle: 'bold' as const, fillColor: hexToRgb(grayBg) } },
        { content: `${dualScacCode}  /  ${dualScacPin}`, colSpan: 2 },
      ]
    : [
        { content: 'IBE Pin # for Rail/Port Access', colSpan: 2, styles: { fontStyle: 'bold' as const, fillColor: hexToRgb(grayBg) } },
        { content: uiiaPinValue, colSpan: 4 },
      ];

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: margin, right: margin },
    body: [
      [
        { content: 'Your Terminal #', styles: { fontStyle: 'bold' as const, fillColor: hexToRgb(grayBg) } },
        { content: terminalNumber },
        { content: 'Division', styles: { fontStyle: 'bold' as const, fillColor: hexToRgb(grayBg) } },
        { content: division },
        { content: 'SCAC', styles: { fontStyle: 'bold' as const, fillColor: hexToRgb(grayBg) } },
        { content: scac },
      ],
      [
        { content: 'Vendor #', colSpan: 2, styles: { fontStyle: 'bold' as const, fillColor: hexToRgb(grayBg) } },
        { content: form.vendorCode || '—', colSpan: 4 },
      ],
      [
        { content: 'IBE driver ID Number for Logs', colSpan: 2, styles: { fontStyle: 'bold' as const, fillColor: hexToRgb(grayBg) } },
        { content: form.driverCode || '—', colSpan: 4 },
      ],
      dualScacRow,
      [
        { content: 'Truck Unit #', colSpan: 2, styles: { fontStyle: 'bold' as const, fillColor: hexToRgb(grayBg) } },
        { content: form.unitNumber || '—', colSpan: 4 },
      ],
      [
        { content: 'Entered in the UIIA', colSpan: 2, styles: { fontStyle: 'bold' as const, fillColor: hexToRgb(grayBg) } },
        { content: 'Yes', styles: { fontStyle: 'bold' as const, halign: 'center' as const } },
        { content: 'Entered in Emodal', styles: { fontStyle: 'bold' as const, fillColor: hexToRgb(grayBg) } },
        { content: welcomeLetterData.enteredInEModal ? 'Yes' : 'No', colSpan: 2, styles: { fontStyle: 'bold' as const, halign: 'center' as const } },
      ],
    ],
    theme: 'grid',
    styles: {
      lineColor: hexToRgb(borderColor),
      lineWidth: 0.01,
      fontSize: 10,
      cellPadding: 0.08,
      textColor: hexToRgb(navyColor),
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 1.25 },
      1: { cellWidth: 1.25 },
      2: { cellWidth: 1.25 },
      3: { cellWidth: 1.25 },
      4: { cellWidth: 1.25 },
      5: { cellWidth: 1.25 },
    },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yPos + 2;

  yPos = finalY + 0.3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(redColor));
  const warningText = 'DO NOT HAVE YOUR AGENT/TERMINAL CALL IN TO ACTIVATE YOUR PAY AND FUEL CARD THIS IS YOUR RESPONSIBILITY.';
  const warningLines = doc.splitTextToSize(warningText, contentWidth);
  doc.text(warningLines, margin, yPos);
  yPos += warningLines.length * lineHeight + 0.3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(navyColor));
  doc.text('Phone numbers', margin, yPos);
  yPos += 0.2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  doc.setFont('helvetica', 'bold');
  doc.text('Corporate office:', margin, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('1-800-245-4722', margin + 1.5, yPos);
  yPos += lineHeight + 0.05;

  doc.setFont('helvetica', 'bold');
  doc.text('After hours - Accident lines only:', margin, yPos);
  yPos += lineHeight + 0.05;

  doc.setFont('helvetica', 'bold');
  doc.text('1st contact number', margin + 0.2, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('412-230-3824', margin + 1.7, yPos);
  yPos += lineHeight + 0.05;

  doc.setFont('helvetica', 'bold');
  doc.text('2nd contact number', margin + 0.2, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text('800-245-4722 Ext. 7214', margin + 1.7, yPos);

  const fileName = `Welcome_Letter_${form.firstName || 'Driver'}_${form.lastName || ''}.pdf`.replace(/\s+/g, '_');
  doc.save(fileName);
}
