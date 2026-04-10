import { jsPDF } from 'jspdf';
import indianaSeal from '../assets/indiana-seal.png';
import { assetUrl } from '../utils/assetUrl';

export interface IrpLeaseModalData {
  vendorName: string;
  vendorStreet: string;
  vendorCity: string;
  vendorState: string;
  vendorZip: string;
  truckOwnerName: string;
  year: string;
  make: string;
  vin: string;
  lesseeName: string;
}

export interface IrpLeaseInput {
  data: IrpLeaseModalData;
}

async function loadImage(url: string): Promise<string> {
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

export async function generateIrpLease({ data: d }: IrpLeaseInput): Promise<void> {
  const vendorAddress = d.vendorStreet || '';
  const vendorCityState = `${d.vendorCity || ''} ${d.vendorState || ''}`.trim();
  const vendorZipCode = d.vendorZip || '';
  const vin = d.vin || '';
  const make = d.make || '';
  const year = d.year || '';
  const truckOwnerName = d.truckOwnerName || '';
  const irpLeaseLessee = d.lesseeName || '';
  const driverName = truckOwnerName;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 15;

  const sealSize = 28;
  let sealBase64: string | null = null;
  try { sealBase64 = await loadImage(assetUrl(indianaSeal)); } catch { /* skip */ }
  if (sealBase64) doc.addImage(sealBase64, 'PNG', margin, y, sealSize, sealSize);

  const titleX = pageWidth - margin;
  doc.setFontSize(12); doc.setFont('helvetica', 'bold');
  doc.text('STATEMENT OF EXISTING LEASE AGREEMENT', titleX, y + 10, { align: 'right' });
  doc.setFontSize(10); doc.text('State Form 12787 (R / 3-96)', titleX, y + 16, { align: 'right' });
  y += sealSize + 10;

  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  const instr = 'The following statement must be properly signed by both Lessor and Lessee, and presented to the Bureau of Motor Vehicles for title / registration of all leased motor vehicles.';
  const si = doc.splitTextToSize(instr, contentWidth);
  doc.text(si, margin, y); y += si.length * 5 + 1;

  const tableX = margin;
  const tableWidth = contentWidth;
  const rowHeight = 10;
  const padding = 3;
  const halfWidth = tableWidth / 2;
  const ulY = 1.5;

  function uline(x1: number, x2: number, baseY: number) {
    doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.2);
    doc.line(x1, baseY + ulY, x2, baseY + ulY);
  }

  doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3);

  const row6Line1 = 'THE PLATE FEE AND COUNTY EXCISE TAX ARE TO PAID BY THE: (Check one)  [ ] LESSEE  [ ] LESSOR, and will remain the property of the same.';
  const row6Line2 = '(If plate / excise ownership is different than indicated, an attached affidavit stating ownership is required.)';
  doc.setFontSize(9);
  const r6w1 = doc.splitTextToSize(row6Line1, tableWidth - padding * 2);
  const r6w2 = doc.splitTextToSize(row6Line2, tableWidth - padding * 2);
  const lh = 4;
  const row6Height = (r6w1.length + r6w2.length) * lh + 6;
  const row7Text = 'THIS AFFIDAVIT HAS BEEN REVIEWED, AND IS BEING SIGNED UNDER PENALTY OF PERJURY.';
  const row7Height = 10;
  const sigRowHeight = 12;
  const sigBlockHeight = sigRowHeight * 3;
  const totalHeight = rowHeight * 5 + rowHeight + row6Height + row7Height + sigBlockHeight;

  doc.setFontSize(10);
  doc.rect(tableX, y, tableWidth, totalHeight);

  const fullAddress = `${vendorAddress} ${vendorCityState}, ${vendorZipCode}`;
  const tR = tableX + tableWidth;
  let ry = y;

  // Row 1: We ___ Address ___
  doc.setFont('helvetica', 'normal'); doc.text('We', tableX + padding, ry + 7);
  doc.setFont('helvetica', 'bold'); doc.text(d.vendorName, tableX + 12, ry + 7);
  uline(tableX + 12, tableX + 67, ry + 7);
  doc.setFont('helvetica', 'normal'); doc.text('Address', tableX + 70, ry + 7);
  doc.setFont('helvetica', 'bold'); doc.text(fullAddress, tableX + 88, ry + 7);
  uline(tableX + 88, tR - padding, ry + 7);
  ry += rowHeight;

  // Row 2: are the owners of: Year ___ Make ___ Identification # ___
  doc.setFont('helvetica', 'normal'); doc.text('are the owners of: Year', tableX + padding, ry + 7);
  doc.setFont('helvetica', 'bold'); doc.text(year, tableX + 48, ry + 7);
  uline(tableX + 48, tableX + 59, ry + 7);
  doc.setFont('helvetica', 'normal'); doc.text('Make', tableX + 62, ry + 7);
  doc.setFont('helvetica', 'bold'); doc.text(make, tableX + 75, ry + 7);
  uline(tableX + 75, tableX + 102, ry + 7);
  doc.setFont('helvetica', 'normal'); doc.text('Identification #', tableX + 105, ry + 7);
  doc.setFont('helvetica', 'bold'); doc.text(vin, tableX + 130, ry + 7);
  uline(tableX + 130, tR - padding, ry + 7);
  ry += rowHeight;

  // Row 3: italic text
  doc.setFont('helvetica', 'italic'); doc.text('and have entered into a lease agreement with the following lessee:', tableX + padding, ry + 7);
  ry += rowHeight;

  // Row 4: Lessee ___ Address ___
  doc.setFont('helvetica', 'normal'); doc.text('Lessee', tableX + padding, ry + 7);
  doc.setFont('helvetica', 'bold'); doc.text(irpLeaseLessee, tableX + 22, ry + 7);
  uline(tableX + 22, tableX + 67, ry + 7);
  doc.setFont('helvetica', 'normal'); doc.text('Address', tableX + 70, ry + 7);
  doc.setFont('helvetica', 'bold'); doc.text(fullAddress, tableX + 88, ry + 7);
  uline(tableX + 88, tR - padding, ry + 7);
  ry += rowHeight; doc.line(tableX, ry, tR, ry);

  // Row 5: County ___
  doc.setFont('helvetica', 'normal'); doc.text('County', tableX + padding, ry + 7);
  uline(tableX + 20, tR - padding, ry + 7);
  ry += rowHeight; doc.line(tableX, ry, tR, ry);

  // Row 6: Plate fee text
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text(r6w1, tableX + padding, ry + 5);
  doc.text(r6w2, tableX + padding, ry + 5 + r6w1.length * lh);
  ry += row6Height; doc.line(tableX, ry, tR, ry);

  // Row 7: Perjury
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text(row7Text, tableX + padding, ry + 7);
  ry += row7Height; doc.line(tableX, ry, tR, ry);

  // Signature block
  doc.line(tableX + halfWidth, ry, tableX + halfWidth, ry + sigBlockHeight);
  doc.setFont('helvetica', 'normal');
  doc.text('Signature of Owner / Lessor', tableX + padding, ry + 8);
  uline(tableX + padding, tableX + halfWidth - padding, ry + 8);
  doc.text('Date (month, day, year)', tableX + halfWidth + padding, ry + 8);
  uline(tableX + halfWidth + padding, tR - padding, ry + 8);
  ry += sigRowHeight; doc.line(tableX, ry, tR, ry);

  doc.text('By (Name)', tableX + padding, ry + 8);
  doc.setFont('helvetica', 'bold'); doc.text(driverName, tableX + 30, ry + 8);
  uline(tableX + 30, tableX + halfWidth - padding, ry + 8);
  doc.setFont('helvetica', 'normal'); doc.text('Position', tableX + halfWidth + padding, ry + 8);
  doc.text('Owner Operator', tableX + halfWidth + 25, ry + 8);
  uline(tableX + halfWidth + 25, tR - padding, ry + 8);
  ry += sigRowHeight; doc.line(tableX, ry, tR, ry);

  doc.text('Signature of Lessee', tableX + padding, ry + 8);
  uline(tableX + padding, tableX + halfWidth - padding, ry + 8);
  doc.text('Date (month, day, year)', tableX + halfWidth + padding, ry + 8);
  uline(tableX + halfWidth + padding, tR - padding, ry + 8);

  // ===== Page 2: Blank template =====
  doc.addPage();
  let y2 = 15;
  if (sealBase64) doc.addImage(sealBase64, 'PNG', margin, y2, sealSize, sealSize);
  doc.setFontSize(12); doc.setFont('helvetica', 'bold');
  doc.text('STATEMENT OF EXISTING LEASE AGREEMENT', pageWidth - margin, y2 + 10, { align: 'right' });
  doc.setFontSize(10); doc.text('State Form 12787 (R / 3-96)', pageWidth - margin, y2 + 16, { align: 'right' });
  y2 += sealSize + 10;
  doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(instr, contentWidth), margin, y2);
  y2 += si.length * 5 + 1;
  doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.3); doc.rect(tableX, y2, tableWidth, totalHeight);
  let ry2 = y2;

  // Row 1
  doc.text('We', tableX + padding, ry2 + 7); uline(tableX + 12, tableX + 67, ry2 + 7);
  doc.text('Address', tableX + 70, ry2 + 7); uline(tableX + 88, tR - padding, ry2 + 7);
  ry2 += rowHeight;
  // Row 2
  doc.text('are the owners of: Year', tableX + padding, ry2 + 7); uline(tableX + 48, tableX + 59, ry2 + 7);
  doc.text('Make', tableX + 62, ry2 + 7); uline(tableX + 75, tableX + 102, ry2 + 7);
  doc.text('Identification #', tableX + 105, ry2 + 7); uline(tableX + 130, tR - padding, ry2 + 7);
  ry2 += rowHeight;
  // Row 3
  doc.setFont('helvetica', 'italic'); doc.text('and have entered into a lease agreement with the following lessee:', tableX + padding, ry2 + 7);
  ry2 += rowHeight;
  // Row 4
  doc.setFont('helvetica', 'normal'); doc.text('Lessee', tableX + padding, ry2 + 7); uline(tableX + 22, tableX + 67, ry2 + 7);
  doc.text('Address', tableX + 70, ry2 + 7); uline(tableX + 88, tR - padding, ry2 + 7);
  ry2 += rowHeight; doc.line(tableX, ry2, tR, ry2);
  // Row 5
  doc.text('County', tableX + padding, ry2 + 7); uline(tableX + 20, tR - padding, ry2 + 7);
  ry2 += rowHeight; doc.line(tableX, ry2, tR, ry2);
  // Row 6
  doc.setFontSize(9); doc.text(r6w1, tableX + padding, ry2 + 5); doc.text(r6w2, tableX + padding, ry2 + 5 + r6w1.length * lh);
  ry2 += row6Height; doc.line(tableX, ry2, tR, ry2);
  // Row 7
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text(row7Text, tableX + padding, ry2 + 7);
  ry2 += row7Height; doc.line(tableX, ry2, tR, ry2);
  // Sig block
  doc.line(tableX + halfWidth, ry2, tableX + halfWidth, ry2 + sigBlockHeight);
  doc.setFont('helvetica', 'normal');
  doc.text('Signature of Owner / Lessor', tableX + padding, ry2 + 8); uline(tableX + padding, tableX + halfWidth - padding, ry2 + 8);
  doc.text('Date (month, day, year)', tableX + halfWidth + padding, ry2 + 8); uline(tableX + halfWidth + padding, tR - padding, ry2 + 8);
  ry2 += sigRowHeight; doc.line(tableX, ry2, tR, ry2);
  doc.text('By (Name)', tableX + padding, ry2 + 8); uline(tableX + 30, tableX + halfWidth - padding, ry2 + 8);
  doc.text('Position', tableX + halfWidth + padding, ry2 + 8); uline(tableX + halfWidth + 25, tR - padding, ry2 + 8);
  ry2 += sigRowHeight; doc.line(tableX, ry2, tR, ry2);
  doc.text('Signature of Lessee', tableX + padding, ry2 + 8); uline(tableX + padding, tableX + halfWidth - padding, ry2 + 8);
  doc.text('Date (month, day, year)', tableX + halfWidth + padding, ry2 + 8); uline(tableX + halfWidth + padding, tR - padding, ry2 + 8);

  doc.save(`${driverName || 'Driver'}_IRP_Lease.pdf`.replace(/\s+/g, '_'));
}
