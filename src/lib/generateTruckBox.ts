import { jsPDF } from 'jspdf';
import fedexLogo from '../assets/fedex-logo.png';
import miaLogo from '../assets/mia-logo.png';
import { assetUrl } from '../utils/assetUrl';

export interface BoxItems {
  bols: boolean; logBook: boolean; insuranceCard: boolean; greenRegulationBook: boolean;
  zipTies: boolean; doorStrap: boolean; doorSigns: boolean; iftaStickers: boolean;
  fuelCard: boolean; rfidTag: boolean; prePass: boolean; hazmatBooks: boolean;
  eld: boolean; dashCam: boolean; mdLiquor: boolean;
}

export interface TruckBoxFormData {
  terminal: string; date: string; sendingTo: string; receiverName: string;
  street: string; city: string; state: string; zipCode: string;
  receiverPhone: string; sentBy: string; deliveryType: string; billingInfo: string;
  unitNumber: string; boxItems: BoxItems; truckColor: string;
  motorCarrierName: string; cableType: string; recruiterName: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [0, 0, 0];
}

function drawChecked(doc: jsPDF, cx: number, cy: number, s = 5) {
  doc.setFillColor(...hexToRgb('#2563EB')); doc.setDrawColor(...hexToRgb('#2563EB')); doc.setLineWidth(0.4);
  doc.roundedRect(cx, cy, s, s, 0.8, 0.8, 'FD');
  doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.85);
  doc.line(cx + s * 0.18 + 0.2, cy + s * 0.50, cx + s * 0.38, cy + s * 0.72);
  doc.line(cx + s * 0.38, cy + s * 0.72, cx + s - s * 0.18, cy + s * 0.18 + 0.1);
}

function drawUnchecked(doc: jsPDF, cx: number, cy: number, s = 5) {
  doc.setFillColor(255, 255, 255); doc.setDrawColor(...hexToRgb('#D1D5DB')); doc.setLineWidth(0.4);
  doc.roundedRect(cx, cy, s, s, 0.8, 0.8, 'FD');
}

async function loadImage(url: string): Promise<string> {
  if (url.startsWith('data:')) return url;
  try {
    const resp = await fetch(url);
    const blob = await resp.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const ctx = c.getContext('2d');
        if (ctx) { ctx.drawImage(img, 0, 0); resolve(c.toDataURL('image/png')); } else reject(new Error('no ctx'));
      };
      img.onerror = () => reject(new Error('load failed'));
      img.src = url;
    });
  }
}

export async function generateTruckBoxForms(data: TruckBoxFormData): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 15;
  let yPos = 0;

  doc.setFillColor(...hexToRgb('#0F172A')); doc.rect(0, 0, 210, 22, 'F');
  try { const fedex = await loadImage(assetUrl(fedexLogo)); doc.addImage(fedex, 'PNG', 14, 4, 42, 14); } catch { /* skip */ }
  try { const mia = await loadImage(assetUrl(miaLogo)); doc.addImage(mia, 'PNG', 62, 5, 20, 12); } catch { /* skip */ }
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('SHIPPING FORM', 195, 11, { align: 'right' });
  doc.setTextColor(...hexToRgb('#94A3B8')); doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  doc.text('TRUCK BOX CONTENT', 195, 17, { align: 'right' });
  yPos = 28;

  doc.setFillColor(...hexToRgb('#F8FAFC')); doc.setDrawColor(...hexToRgb('#E2E8F0')); doc.setLineWidth(0.3);
  doc.roundedRect(margin, yPos, 180, 56, 3, 3, 'FD');
  const rs = 8; const c1 = margin + 4; const c2 = 108; let ry = yPos + 7;
  doc.setFontSize(10);

  const lv = (lbl: string, val: string, x: number, y: number) => {
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...hexToRgb('#0F172A')); doc.text(lbl, x, y);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...hexToRgb('#374151')); doc.text(val, x + doc.getTextWidth(lbl) + 2, y);
  };

  const now = new Date();
  const todayStr = `${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}/${now.getFullYear()}`;
  lv('Terminal:', data.terminal, c1, ry); lv('Date:', todayStr, c2, ry); ry += rs;
  lv('Sending To:', data.sendingTo, c1, ry); ry += rs;
  lv('Name:', data.receiverName, c1, ry); ry += rs;
  lv('Address:', data.street, c1, ry); ry += rs;
  lv('City:', [data.city, data.state].filter(Boolean).join(', '), c1, ry); lv('Zip:', data.zipCode, c2, ry); ry += rs;
  lv('Phone:', data.receiverPhone, c1, ry); lv('Sent By:', data.sentBy, c2, ry);
  yPos += 62;

  doc.setFillColor(...hexToRgb('#F8FAFC')); doc.setDrawColor(...hexToRgb('#E2E8F0')); doc.setLineWidth(0.3);
  doc.roundedRect(15, yPos, 86, 28, 3, 3, 'FD');
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...hexToRgb('#1E3A5F')); doc.setFontSize(10);
  doc.text('Delivery Type', 20, yPos + 12);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...hexToRgb('#374151')); doc.setFontSize(9);
  doc.text(data.deliveryType || '', 20, yPos + 21, { maxWidth: 76 });

  doc.setFillColor(...hexToRgb('#F8FAFC')); doc.setDrawColor(...hexToRgb('#E2E8F0'));
  doc.roundedRect(109, yPos, 86, 28, 3, 3, 'FD');
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...hexToRgb('#1E3A5F')); doc.setFontSize(10);
  doc.text('Billing', 114, yPos + 12);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...hexToRgb('#374151')); doc.setFontSize(9);
  doc.text(data.billingInfo || '', 114, yPos + 21, { maxWidth: 76 });
  yPos += 36;

  doc.setDrawColor(...hexToRgb('#E2E8F0')); doc.setLineWidth(0.5); doc.line(15, yPos, 195, yPos); yPos += 8;

  doc.setFont('helvetica', 'bold'); doc.setTextColor(...hexToRgb('#1E3A5F')); doc.setFontSize(11);
  doc.text('Box Contents', 15, yPos);
  doc.setDrawColor(...hexToRgb('#2563EB')); doc.setLineWidth(0.4); doc.line(15, yPos + 1.5, 58, yPos + 1.5);
  yPos += 10;

  const items: [keyof BoxItems, string][] = [
    ['bols', 'BOLs'], ['logBook', 'Log Book'], ['insuranceCard', 'Insurance Card'],
    ['greenRegulationBook', 'Green Regulation Pocket Book'], ['zipTies', 'Zip Ties'],
    ['doorStrap', 'Door Strap (1)'], ['doorSigns', 'Door Signs (2)'], ['iftaStickers', 'IFTA Stickers'],
    ['fuelCard', 'Fuel Card'], ['rfidTag', 'RFID Tag'], ['prePass', 'Pre-Pass'],
    ['hazmatBooks', 'Hazmat Books (red & orange) & Certificate'], ['eld', 'ELD'],
    ['dashCam', 'Dash Cam'], ['mdLiquor', 'MD Liquor Permit'],
  ];
  const rH = 9; let lbY = yPos; let rbY = yPos;
  items.slice(0, 8).forEach(([key, label], i) => {
    const cy = yPos + i * rH; const on = data.boxItems[key];
    if (on) drawChecked(doc, 15, cy); else drawUnchecked(doc, 15, cy);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...hexToRgb('#374151')); doc.setFontSize(9);
    doc.text(label, 23, cy + 4);
    if (key === 'doorSigns' && on) { const w = doc.getTextWidth(label); doc.setFont('helvetica', 'bold'); doc.setTextColor(...hexToRgb('#2563EB')); doc.text(' - ' + data.motorCarrierName, 23 + w, cy + 4); }
    lbY = cy + 5;
  });
  items.slice(8).forEach(([key, label], i) => {
    const cy = yPos + i * rH; const on = data.boxItems[key];
    if (on) drawChecked(doc, 108, cy); else drawUnchecked(doc, 108, cy);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...hexToRgb('#374151')); doc.setFontSize(9);
    doc.text(label, 116, cy + 4);
    rbY = cy + 5;
  });
  yPos = Math.max(lbY, rbY) + 8;

  doc.setFillColor(...hexToRgb('#EFF6FF')); doc.setDrawColor(...hexToRgb('#BFDBFE')); doc.setLineWidth(0.3);
  doc.roundedRect(15, yPos, 44, 8, 2, 2, 'FD'); doc.roundedRect(63, yPos, 44, 8, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...hexToRgb('#1E3A5F')); doc.setFontSize(9);
  doc.text('Unit: ' + data.unitNumber, 37, yPos + 5.5, { align: 'center' });
  doc.text('Color: ' + data.truckColor, 85, yPos + 5.5, { align: 'center' });
  yPos += 14;

  doc.setFont('helvetica', 'bold'); doc.setTextColor(...hexToRgb('#0F172A')); doc.setFontSize(9);
  doc.text('Cable Type:', 15, yPos + 4);
  let ox = 55;
  ['6 Pin', '9 Pin', 'Volvo 13', 'Mack 13', 'OBD2'].forEach((opt) => {
    if (data.cableType === opt) drawChecked(doc, ox, yPos); else drawUnchecked(doc, ox, yPos);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...hexToRgb('#374151')); doc.setFontSize(9);
    doc.text(opt, ox + 8, yPos + 4); ox += 32;
  });
  yPos += 14;

  doc.setFont('helvetica', 'bold'); doc.setTextColor(...hexToRgb('#0F172A')); doc.setFontSize(9);
  doc.text('Recruiter:', 15, yPos + 4);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(...hexToRgb('#374151'));
  doc.text(data.recruiterName, 38, yPos + 4);
  const rw = doc.getTextWidth(data.recruiterName); doc.setDrawColor(...hexToRgb('#374151')); doc.setLineWidth(0.4); doc.line(38, yPos + 5, 38 + rw, yPos + 5);
  doc.setFont('helvetica', 'bold'); doc.setTextColor(...hexToRgb('#0F172A'));
  doc.text('Inventory Check:', 108, yPos + 4);
  doc.setDrawColor(...hexToRgb('#374151')); doc.line(155, yPos + 5, 193, yPos + 5);

  doc.save((data.receiverName || 'Truck Box') + ' - Truck Box Forms.pdf');
}
