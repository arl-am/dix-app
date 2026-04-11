import { jsPDF } from 'jspdf';
import portAuthorityLogo from '../assets/port-authority-nj-logo.png';
import { assetUrl } from '../utils/assetUrl';
import { stateAbbr, formatDatePdf } from './utils';

export interface SeaLinkEntryData {
  firstName: string;
  lastName: string;
  licenseNumber: string;
  licenseState: string;
  licenseExpDate: string;
  phoneNumber: string;
  email: string;
  division: string;
  scac: string;
  startDate: string;
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

export async function generateSeaLinkEntry(data: SeaLinkEntryData): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = 215.9;
  const margin = 18;
  const rightEdge = pageWidth - margin;
  const contentWidth = pageWidth - margin * 2;

  let logoBase64: string | null = null;
  try { logoBase64 = await loadImage(assetUrl(portAuthorityLogo)); } catch { /* skip */ }

  function ul(x: number, yy: number, len: number, w = 0.3) {
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(w);
    doc.line(x, yy, x + len, yy);
  }

  function drawHeader(startY: number): number {
    let y = startY;

    const logoW = 42;
    const logoH = 21.5;
    if (logoBase64) {
      doc.addImage(logoBase64, 'PNG', (pageWidth - logoW) / 2, y, logoW, logoH);
    }

    y += logoH + 14;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SEA LINK\u00AE', margin, y);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('OFFICE HOURS:', rightEdge, y - 8, { align: 'right' });
    doc.text('Monday - Friday', rightEdge, y - 4, { align: 'right' });
    doc.text('6:30am \u2013 5:00pm', rightEdge, y, { align: 'right' });

    y += 4;
    doc.setFontSize(10);
    doc.text('ExpressPort Plaza', margin, y);
    y += 4;
    doc.text('1160 McLester St., Unit 3', margin, y);
    y += 4;
    doc.text('Elizabeth, NJ 07201', margin, y);

    doc.text('Office: 908-354-4044', rightEdge, y - 3, { align: 'right' });
    doc.text('Fax:    908-355-0108', rightEdge, y + 2, { align: 'right' });

    y += 7;
    doc.text('Email: TSCSUPPORT@PANYNJ.GOV', margin, y);

    y += 5;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(1.5);
    doc.line(margin - 3, y, rightEdge + 3, y);

    return y;
  }

  // ========== PAGE 1 ==========
  let y = drawHeader(10);
  y += 5;

  const boxX = margin;
  const boxW = contentWidth;
  const boxH = 34;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(boxX, y, boxW, boxH);

  const bx1 = boxX + 5;
  const bx2 = boxX + 50;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('NEW', bx1, y + 7);
  doc.text('ADD ON', bx1, y + 12);
  doc.text('REMAKE', bx1, y + 17);

  doc.text('SPECIAL', bx2, y + 7);
  doc.text('REACTIVE', bx2, y + 12);
  doc.text('NO CHARGE', bx2, y + 17);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SEA LINK\u00AE Use Only', rightEdge - 5, y + 7, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const ry = y + 24;
  doc.text('Received:', bx1, ry);
  ul(bx1 + 20, ry + 0.5, 25);
  doc.text('By:', bx1 + 50, ry);
  ul(bx1 + 58, ry + 0.5, 30);
  doc.text('App:', bx1 + 93, ry);
  ul(bx1 + 103, ry + 0.5, 20);
  doc.text('Of:', bx1 + 128, ry);
  ul(bx1 + 135, ry + 0.5, 20);

  const cy = y + 30;
  doc.text('Check #:', bx1, cy);
  ul(bx1 + 16, cy + 0.5, 72);
  doc.text('$', bx1 + 93, cy);
  ul(bx1 + 97, cy + 0.5, 26);
  doc.text('Pick/Mail (circle One)', bx1 + 128, cy);

  y += boxH + 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('DRIVER ID APPLICATION', margin, y);

  y += 10;

  const fieldLabelSize = 10;
  const fieldValueSize = 10;
  const subLabelSize = 8;
  const fieldGap = 9;

  doc.setFontSize(fieldLabelSize);
  doc.setFont('helvetica', 'normal');
  doc.text('DRIVER NAME:', margin, y);
  const dnW = doc.getTextWidth('DRIVER NAME:');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fieldValueSize);
  doc.text(data.lastName, margin + dnW + 3, y);

  const firstNameX = pageWidth / 2 + 5;
  doc.text(data.firstName, firstNameX, y);

  ul(margin + dnW + 1, y + 1, rightEdge - margin - dnW - 1);

  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(subLabelSize);
  doc.text('Last', margin + dnW + 20, y);
  doc.text('First', firstNameX + 20, y);
  doc.text('MI', rightEdge - 8, y);

  y += fieldGap;

  doc.setFontSize(fieldLabelSize);
  doc.setFont('helvetica', 'normal');
  doc.text('DRIVER LICENSE #:', margin, y);
  const dlW = doc.getTextWidth('DRIVER LICENSE #:');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fieldValueSize);
  doc.text(data.licenseNumber, margin + dlW + 3, y);
  ul(margin + dlW + 1, y + 1, 88 - dlW);

  const stX = margin + 92;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fieldLabelSize);
  doc.text('STATE:', stX, y);
  const stW = doc.getTextWidth('STATE:');
  doc.setFont('helvetica', 'bold');
  doc.text(stateAbbr(data.licenseState), stX + stW + 2, y);
  ul(stX + stW + 1, y + 1, 18);

  const exX = stX + stW + 22;
  doc.setFont('helvetica', 'normal');
  doc.text('EXP DATE:', exX, y);
  const exW = doc.getTextWidth('EXP DATE:');
  doc.setFont('helvetica', 'bold');
  doc.text(formatDatePdf(data.licenseExpDate), exX + exW + 2, y);
  ul(exX + exW + 1, y + 1, rightEdge - exX - exW - 1);

  y += fieldGap;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fieldLabelSize);
  doc.text('SEALINK#:', margin, y);
  ul(margin + doc.getTextWidth('SEALINK#:') + 2, y + 1, rightEdge - margin - doc.getTextWidth('SEALINK#:') - 2);

  y += fieldGap;

  doc.text('DRIVER PHONE #:', margin, y);
  const phW = doc.getTextWidth('DRIVER PHONE #:');
  doc.setFont('helvetica', 'bold');
  doc.text(data.phoneNumber, margin + phW + 3, y);
  ul(margin + phW + 1, y + 1, rightEdge - margin - phW - 1);

  y += fieldGap;

  doc.setFont('helvetica', 'normal');
  doc.text('DRIVER EMAIL ADDRESS:', margin, y);
  const emW = doc.getTextWidth('DRIVER EMAIL ADDRESS:');
  doc.setFont('helvetica', 'bold');
  doc.text(data.email, margin + emW + 3, y);
  ul(margin + emW + 1, y + 1, rightEdge - margin - emW - 1);

  y += fieldGap;

  doc.setFont('helvetica', 'normal');
  doc.text('DRIVER SIGNATURE:', margin, y);
  ul(margin + doc.getTextWidth('DRIVER SIGNATURE:') + 1, y + 1, rightEdge - margin - doc.getTextWidth('DRIVER SIGNATURE:') - 1);

  y += 4;
  doc.setFontSize(subLabelSize);
  doc.setFont('helvetica', 'normal');
  doc.text('(Signature required.  Please print form, sign then fax or email)', margin + 35, y);

  y += fieldGap;

  doc.setFontSize(fieldLabelSize);
  doc.setFont('helvetica', 'normal');
  doc.text('COMPANY NAME:', margin, y);
  const coW = doc.getTextWidth('COMPANY NAME:');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(data.division, margin + coW + 3, y);
  doc.setFontSize(fieldLabelSize);
  ul(margin + coW + 1, y + 1, 95 - coW);

  const scX = margin + 100;
  doc.setFont('helvetica', 'normal');
  doc.text('SCAC:', scX, y);
  const scW = doc.getTextWidth('SCAC:');
  doc.setFont('helvetica', 'bold');
  doc.text(data.scac, scX + scW + 3, y);
  ul(scX + scW + 1, y + 1, rightEdge - scX - scW - 1);

  y += fieldGap;

  doc.setFont('helvetica', 'normal');
  doc.text('SIGNATURE:', margin, y);
  ul(margin + doc.getTextWidth('SIGNATURE:') + 1, y + 1, 93 - doc.getTextWidth('SIGNATURE:'));

  const dtX = margin + 95;
  doc.text('DATE:', dtX, y);
  const dtW = doc.getTextWidth('DATE:');
  doc.setFont('helvetica', 'bold');
  doc.text(formatDatePdf(data.startDate), dtX + dtW + 3, y);
  ul(dtX + dtW + 1, y + 1, rightEdge - dtX - dtW - 1);

  y += 10;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1);
  doc.line(margin - 3, y, rightEdge + 3, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('(PAGE 1 OF 2)', margin, y);

  // ========== PAGE 2 ==========
  doc.addPage();
  y = drawHeader(10);
  y += 10;

  doc.setFillColor(30, 30, 30);
  doc.rect(margin, y, contentWidth, 3.5, 'F');

  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('DRIVER ID APPLICATION', margin, y);

  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('IF USING AGENT: (Must be Pre-Registered in SEA LINK)', margin, y);

  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.text('AGENCY:', margin, y);
  ul(margin + doc.getTextWidth('AGENCY:') + 3, y + 1, rightEdge - margin - doc.getTextWidth('AGENCY:') - 3);

  y += 12;

  doc.text('REPRESENTATIVE:', margin, y);
  ul(margin + doc.getTextWidth('REPRESENTATIVE:') + 2, y + 1, rightEdge - margin - doc.getTextWidth('REPRESENTATIVE:') - 2);

  y += 5;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.text('ID mailed to Representative (Please print name)', margin + 30, y);
  doc.text('TITLE', rightEdge - 20, y);

  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('SIGNATURE:', margin, y);
  ul(margin + doc.getTextWidth('SIGNATURE:') + 1, y + 1, 93 - doc.getTextWidth('SIGNATURE:'));

  doc.text('DATE:', margin + 95, y);
  ul(margin + 95 + doc.getTextWidth('DATE:') + 1, y + 1, rightEdge - margin - 95 - doc.getTextWidth('DATE:') - 1);

  y += 10;

  doc.text('TELEPHONE:', margin, y);
  ul(margin + doc.getTextWidth('TELEPHONE:') + 1, y + 1, 80 - doc.getTextWidth('TELEPHONE:'));

  doc.text('FAX:', margin + 85, y);
  ul(margin + 85 + doc.getTextWidth('FAX:') + 1, y + 1, rightEdge - margin - 85 - doc.getTextWidth('FAX:') - 1);

  y += 10;

  doc.text('COMPANY EMAIL:', margin, y);
  ul(margin + doc.getTextWidth('COMPANY EMAIL:') + 1, y + 1, rightEdge - margin - doc.getTextWidth('COMPANY EMAIL:') - 1);

  y += 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('PLEASE READ THE LISTING OF RESPOSIBILITIES WHICH FOLLOWS:', margin, y);

  y += 8;
  doc.setFont('helvetica', 'normal');

  const p1 = doc.splitTextToSize(
    'This card is the property of SEA LINK\u00AE who reserves the right of retrieval at any time for any reason.',
    contentWidth
  );
  doc.text(p1, margin, y);
  y += p1.length * 4.5 + 4;

  const p2 = doc.splitTextToSize(
    'It is the trucking company\u2019s responsibility to notify SEA LINK\u00AE when a driver is terminated, or an ID card is to be voided.',
    contentWidth
  );
  doc.text(p2, margin, y);
  y += p2.length * 4.5 + 4;

  doc.text('The card is the driver\u2019s responsibility.', margin, y);
  y += 8;

  const p4 = doc.splitTextToSize(
    'SEA LINK\u00AE IS NOT RESPONSIBLE FOR: Errors in the information furnished to the trucking company; failure to furnish or update information by the trucking company; forgeries or misuse of the SEA LINK\u00AE ID card; failure of terminal operator\u2019s equipment or personnel.',
    contentWidth
  );
  doc.text(p4, margin, y);
  y += p4.length * 4.5 + 6;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(1);
  doc.line(margin - 3, y, rightEdge + 3, y);

  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('(PAGE 2 OF 2)', margin, y);

  const safeFileName = `${data.firstName} ${data.lastName}`.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
  doc.save(`${safeFileName} - SeaLink Entry Form.pdf`);
}
