import { jsPDF } from 'jspdf';
import cpLogoLeft from '../assets/cp-logo-left.png';
import cpLogoRight from '../assets/cp-logo-right.png';
import { assetUrl } from '../utils/assetUrl';
import { stateAbbr, formatDatePdf } from './utils';

export interface CPLetterData {
  date: string;
  driverName: string;
  licenseNumber: string;
  cdlState: string;
  startDate: string;
  division: string;
  scac: string;
  sentBy: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [0, 0, 0];
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

export async function generateCPLetter(data: CPLetterData): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

  let leftLogo: string | null = null;
  let rightLogo: string | null = null;
  try { leftLogo = await loadImage(assetUrl(cpLogoLeft)); } catch { /* skip */ }
  try { rightLogo = await loadImage(assetUrl(cpLogoRight)); } catch { /* skip */ }

  if (leftLogo) doc.addImage(leftLogo, 'PNG', 10, 6, 40, 32);
  if (rightLogo) doc.addImage(rightLogo, 'PNG', 158, 6, 48, 30);

  const cx = 105;
  let hy = 13;
  const lh = 3.8;

  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('MANAGING TRANSPORTATION NEEDS', cx, hy, { align: 'center' });
  const tw = doc.getTextWidth('MANAGING TRANSPORTATION NEEDS');
  doc.setLineWidth(0.35);
  doc.setDrawColor(0, 0, 0);
  doc.line(cx - tw / 2, hy + 0.8, cx + tw / 2, hy + 0.8);
  hy += lh + 1.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  [
    'Carrier MC # 152672          Broker MC # 674169-B',
    'SCAC Codes:',
    'AIPA \u2013 ARL Transport     GEXD \u2013 General Express',
    'ACYG \u2013 American Carrier Group',
    'AFIC \u2013 AFT Transport',
    "PVAL \u2013 Partner's Transport Express",
    'TYFR \u2013 Twenty-Four Seven',
    'C-TPAT Certified',
    'SVI # ca93a1fe-f1e2-410c-8058-9b6c8fecad33',
    'Ph: 800-245-4722          F: 412-507-3082',
    'www.arlnetwork.com   email: arl@arlnetwork.com',
  ].forEach((line: string) => {
    doc.text(line, cx, hy, { align: 'center' });
    hy += lh;
  });

  doc.setDrawColor(...hexToRgb('#AAAAAA'));
  doc.setLineWidth(0.4);
  doc.line(15, 65, 201, 65);

  const lx = 20;
  let y = 80;
  const bl = 7;

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  doc.setFont('helvetica', 'bold');
  doc.text('Date ', lx, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDatePdf(data.date), lx + doc.getTextWidth('Date '), y);

  y += bl * 1.5;
  doc.setFont('helvetica', 'bold');
  doc.text('C P RAIL', lx, y);

  y += bl * 1.5;
  doc.text('RE: New Authorization for ' + data.division + ' Driver \u2013 SCAC ' + data.scac, lx, y);

  y += bl;
  doc.text('The following driver is certified as working for ' + data.division, lx, y);

  y += bl;
  doc.text(data.driverName + ' Lic #' + data.licenseNumber + ' ' + stateAbbr(data.cdlState), lx, y);

  y += bl * 0.75;
  doc.text('Start Date: ', lx, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDatePdf(data.startDate), lx + doc.getTextWidth('Start Date: '), y);

  y += bl * 4;
  doc.text('Sincerely,', lx, y);

  y += bl * 2;
  doc.text(data.sentBy, lx, y);
  const sw = doc.getTextWidth(data.sentBy);
  doc.setDrawColor(...hexToRgb('#374151'));
  doc.setLineWidth(0.4);
  doc.line(lx, y + 1, lx + sw, y + 1);

  y += bl * 0.85;
  doc.text(data.division, lx, y);

  const safeFileName = data.driverName.replace(/[^a-zA-Z0-9\s-]/g, '');
  doc.save(`${safeFileName} - CP Letter.pdf`);
}
