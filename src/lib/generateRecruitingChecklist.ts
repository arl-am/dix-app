import { jsPDF } from 'jspdf';
import autoTable, { type RowInput, type CellDef } from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Agent } from './mockData';

const navyColor = '#1E293B';
const blueAccent = '#3B82F6';
const greenAccent = '#22C55E';
const orangeAccent = '#F97316';
const amberAccent = '#F59E0B';
const purpleAccent = '#8B5CF6';
const grayBg = '#F1F5F9';
const borderColor = '#E2E8F0';
const lightGrayBg = '#F8FAFC';

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)] : [0, 0, 0];
}

function fmtCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function drawCheckbox(doc: jsPDF, x: number, y: number, checked: boolean, color: string = blueAccent): void {
  const size = 4;
  if (checked) {
    const [r, g, b] = hexToRgb(color);
    doc.setFillColor(r, g, b);
    doc.roundedRect(x, y, size, size, 0.5, 0.5, 'F');
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.4);
    doc.line(x + 0.8, y + 2.2, x + 1.6, y + 3);
    doc.line(x + 1.6, y + 3, x + 3.2, y + 1.2);
  } else {
    doc.setDrawColor(148, 163, 184);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, size, size, 0.5, 0.5, 'S');
  }
}

export interface RecruitingChecklistInput {
  form: Record<string, string>;
  agent: Agent | null;
  selections: Record<string, boolean>;
  transferItems: Record<string, boolean>;
  reactivateItems: Record<string, boolean>;
  pdiMonthly: number;
  iftaNumber: string;
  maintenanceAmount: string;
}

export async function generateRecruitingChecklist(data: RecruitingChecklistInput): Promise<void> {
  const { form: f, agent, selections: s, transferItems: ti, reactivateItems: ri, pdiMonthly } = data;

  const bobtailValue = agent?.cr6cd_bobtailvalue ?? 0;
  const occAccValue = agent?.cr6cd_occaccmonthly ?? 0;
  const buyDownValue = agent?.cr6cd_buydownvalue ?? 10;
  const iftaValue = agent?.cr6cd_iftavalue ?? 0;
  const prePassTolls = agent?.cr6cd_prepasstollsbypass ?? 12;
  const prePassBypass = agent?.cr6cd_prepassbypass ?? 10;
  const maintenanceFundValue = parseFloat(data.maintenanceAmount) || 0;
  const plateWeekly = agent?.cr6cd_plateweeklyvalue ?? 0;
  const plateDeposit = agent?.cr6cd_platedepositvalue ?? 500;
  const securityFull = agent?.cr6cd_securitydepositfullvalue ?? 2000;
  const securityWeekly = agent?.cr6cd_securitydepositweeklyvalue ?? 50;
  const eldWeekly = agent?.cr6cd_elddepositvalue ?? 0;
  const eldFull = agent?.cr6cd_elddepositfullvalue ?? 500;
  const dashcamDeposit = agent?.cr6cd_dashcamdepositvalue ?? 100;
  const dashcamWeekly = 10;
  const eldDataFee = agent?.cr6cd_elddatafeevalue ?? 0;
  const truckValue = parseFloat(f.truckValue || '0');
  const purchaseDate = f.purchaseDate ? format(new Date(f.purchaseDate), 'MM/dd/yyyy') : '—';
  const fullAddr = `${f.vendorAddress || ''}${f.vendorAddress ? ', ' : ''}${f.vendorCity || ''}${f.vendorCity && f.vendorState ? ', ' : ''}${f.vendorState || ''} ${f.vendorZipCode || ''}`.trim();

  const weeklyItems: { name: string; value: number; note?: string }[] = [];
  const monthlyItems: { name: string; value: number; note?: string; biweeklyValue?: number }[] = [];
  const oneTimeItems: { name: string; value: number; note?: string }[] = [];

  if (s.buydown) weeklyItems.push({ name: 'Insurance Buy-Down', value: buyDownValue });
  if (s.irp_plate_prepaid) weeklyItems.push({ name: 'IRP Plate (Prepay)', value: plateWeekly });
  if (s.irp_plate_settlements) weeklyItems.push({ name: 'IRP Plate (Settlements)', value: 150, note: '$50/week + deposit' });
  if (s.ifta) weeklyItems.push({ name: 'IFTA', value: iftaValue });
  if (s.prepass_tolls_bypass) weeklyItems.push({ name: 'Pre-Pass Tolls & Bypass', value: prePassTolls });
  if (s.prepass_bypass) weeklyItems.push({ name: 'Pre-Pass Bypass Only', value: prePassBypass });
  if (s.maintenance_fund) weeklyItems.push({ name: 'Maintenance Fund', value: maintenanceFundValue });
  if (s.security_deposit && !ti.security_deposit && !ri.security_deposit) weeklyItems.push({ name: 'Security Deposit', value: securityWeekly, note: `Full value ${fmtCurrency(securityFull)}` });
  if (s.eld_deposit && !ti.eld && !ri.eld) weeklyItems.push({ name: 'ELD', value: eldWeekly });
  if (s.dashcam_deposit && !ti.dashcam && !ri.dashcam) weeklyItems.push({ name: 'Dashcam', value: dashcamWeekly });
  if (eldDataFee > 0 && s.eld_deposit) weeklyItems.push({ name: 'ELD Data Fee', value: eldDataFee });

  if (s.occacc) monthlyItems.push({ name: 'Occ/Acc Insurance', value: occAccValue, biweeklyValue: occAccValue / 2 });
  if (s.bobtail) monthlyItems.push({ name: 'Bobtail Insurance', value: bobtailValue });
  if (s.pdi) monthlyItems.push({ name: 'Physical Damage Insurance', value: pdiMonthly });

  if (s.irp_plate_prepaid || s.irp_plate_settlements) oneTimeItems.push({ name: 'IRP Plate Admin Fee', value: agent?.cr6cd_plateadminfee ?? 75 });
  if (s.rfid) oneTimeItems.push({ name: 'RFID Tag', value: agent?.cr6cd_rfidvalue ?? 35 });

  const weeklyTotal = weeklyItems.reduce((s, i) => s + i.value, 0);
  const monthlyTotal = monthlyItems.reduce((s, i) => s + i.value, 0);
  const oneTimeTotal = oneTimeItems.reduce((s, i) => s + i.value, 0);
  const estMonthly = weeklyTotal * 4 + monthlyTotal;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12.7;
  let yPos = margin;

  // Logo
  try {
    const logoBase64 = await new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const ctx = c.getContext('2d'); if (ctx) { ctx.drawImage(img, 0, 0); resolve(c.toDataURL('image/png')); } else reject(new Error('no ctx')); };
      img.onerror = () => reject(new Error('load failed'));
      img.src = 'https://i.imgur.com/0Epg823.png';
    });
    const lw = 38.1, lh = lw * 0.4;
    doc.addImage(logoBase64, 'PNG', (pageWidth - lw) / 2, yPos, lw, lh);
    yPos += lh + 2;
  } catch { /* skip */ }

  // Info table
  const driverName = `${f.firstName || ''} ${f.lastName || ''}`.trim() || '—';
  const colWidth = (pageWidth - margin * 2) / 2;
  const truckRows: [string, string][] = [
    ['Year', f.year || '—'], ['Make', f.make || '—'], ['Model', f.model || '—'],
    ['Color', f.color || '—'], ['VIN', f.vin || '—'], ['Purchase Date', purchaseDate],
    ['Purchase Price', truckValue > 0 ? fmtCurrency(truckValue) : '—'], ['Unladen Weight', f.unladenWeight || '—'],
  ];
  const truckH = truckRows.length * 5.5 + 6;

  autoTable(doc, {
    startY: yPos,
    head: [[
      { content: 'IBE Information', styles: { halign: 'center', fillColor: hexToRgb(grayBg), textColor: hexToRgb(navyColor), fontStyle: 'bold', cellPadding: 2 } },
      { content: 'Truck Information', styles: { halign: 'center', fillColor: hexToRgb(grayBg), textColor: hexToRgb(navyColor), fontStyle: 'bold', cellPadding: 2 } },
    ]],
    body: [[
      { content: `IBE Name\n${f.businessName || '—'}\n\nDriver Name\n${driverName}\n\nIBE Address\n${fullAddr || '—'}`, styles: { halign: 'left', valign: 'top', cellPadding: 3, fontSize: 9 } } as CellDef,
      { content: '', styles: { cellPadding: 0, valign: 'top' } } as CellDef,
    ]],
    theme: 'grid',
    styles: { lineColor: hexToRgb(borderColor), lineWidth: 0.2, fontSize: 9, valign: 'top' },
    headStyles: { fillColor: hexToRgb(grayBg), textColor: hexToRgb(navyColor), fontStyle: 'bold', fontSize: 10, cellPadding: 2, minCellHeight: 0 },
    bodyStyles: { minCellHeight: truckH },
    columnStyles: { 0: { cellWidth: colWidth }, 1: { cellWidth: colWidth } },
    didDrawCell: (hd) => {
      if (hd.section === 'body' && hd.column.index === 1) {
        let cy = hd.cell.y + 3;
        doc.setFontSize(8);
        truckRows.forEach(([label, value], idx) => {
          doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'normal'); doc.text(label, hd.cell.x + 1, cy);
          doc.setTextColor(...hexToRgb(navyColor)); doc.setFont('helvetica', 'bold'); doc.text(value, hd.cell.x + hd.cell.width - 2, cy, { align: 'right' });
          if (idx < truckRows.length - 1) { doc.setDrawColor(...hexToRgb(borderColor)); doc.setLineWidth(0.1); doc.line(hd.cell.x + 1, cy + 1.5, hd.cell.x + hd.cell.width - 1, cy + 1.5); }
          cy += 5.5;
        });
      }
    },
  });

  yPos = (doc as any).lastAutoTable?.finalY ?? yPos + 50;
  yPos += 6;

  // Section header helper
  function drawHeader(title: string, color: string) {
    const [r, g, b] = hexToRgb(color);
    doc.setFillColor(r, g, b); doc.rect(margin, yPos, 1.5, 7, 'F');
    doc.setFillColor(239, 246, 255); doc.rect(margin + 1.5, yPos, pageWidth - margin * 2 - 1.5, 7, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...hexToRgb(navyColor));
    doc.text(title, margin + 5, yPos + 5);
    yPos += 10;
  }

  // Checklist item helper
  function drawItem(num: number, name: string, value: string, yes: boolean, no: boolean, color: string, opts?: { transfer?: boolean; reactivate?: boolean; tChecked?: boolean; rChecked?: boolean; note?: string }) {
    const hasNote = !!opts?.note;
    const rh = hasNote ? 10 : 7;
    autoTable(doc, {
      startY: yPos,
      body: [[{ content: '', styles: { cellPadding: { left: 3, right: 2, top: 2, bottom: 2 } } } as CellDef, { content: '', styles: { halign: 'right', cellPadding: { left: 2, right: 3, top: 2, bottom: 2 } } } as CellDef]],
      theme: 'plain',
      styles: { minCellHeight: rh, fontSize: 9 },
      columnStyles: { 0: { cellWidth: (pageWidth - margin * 2) * 0.55 }, 1: { cellWidth: (pageWidth - margin * 2) * 0.45 } },
      didDrawCell: (hd) => {
        if (hd.section !== 'body') return;
        const cy = hd.cell.y + hd.cell.height / 2;
        const nOff = hasNote ? 1 : 0;
        if (hd.column.index === 0) {
          const cx = hd.cell.x + 6;
          doc.setFillColor(...hexToRgb(color)); doc.circle(cx, cy - nOff, 3, 'F');
          doc.setTextColor(255, 255, 255); doc.setFontSize(num >= 10 ? 6 : 8); doc.setFont('helvetica', 'bold');
          doc.text(String(num), cx, cy + 1 - nOff, { align: 'center' });
          doc.setTextColor(...hexToRgb(navyColor)); doc.setFontSize(9); doc.setFont('helvetica', 'bold');
          doc.text(name, cx + 7, cy - nOff + 1);
          if (value) { doc.setTextColor(100, 116, 139); doc.setFont('helvetica', 'normal'); doc.text(value, cx + 7 + doc.getTextWidth(name) + 4, cy - nOff + 1); }
          if (hasNote) { doc.setFontSize(7); doc.setTextColor(148, 163, 184); doc.setFont('helvetica', 'italic'); doc.text(opts!.note!, cx + 7, cy + 4); }
        }
        if (hd.column.index === 1) {
          let cx = hd.cell.x + hd.cell.width - 8;
          const chy = cy - 2 - nOff;
          drawCheckbox(doc, cx, chy, no, color); doc.setFontSize(8); doc.setTextColor(...hexToRgb(navyColor)); doc.text('No', cx + 5, chy + 3); cx -= 14;
          drawCheckbox(doc, cx, chy, yes, color); doc.text('Yes', cx + 5, chy + 3);
          if (opts?.transfer) { cx -= 18; drawCheckbox(doc, cx, chy, opts.tChecked ?? false, color); doc.text('Transfer', cx + 5, chy + 3); }
          if (opts?.reactivate) { cx -= 22; drawCheckbox(doc, cx, chy, opts.rChecked ?? false, color); doc.text('Reactivate', cx + 5, chy + 3); }
        }
      },
    });
    doc.setDrawColor(...hexToRgb(lightGrayBg)); doc.setLineWidth(0.2); doc.line(margin, yPos + rh, pageWidth - margin, yPos + rh);
    yPos = (doc as any).lastAutoTable?.finalY ?? yPos + 8;
  }

  // Insurance
  drawHeader('Insurance Checklist', blueAccent);
  drawItem(1, 'Bobtail', bobtailValue > 0 ? `${fmtCurrency(bobtailValue)}/month` : '—', s.bobtail, !s.bobtail, blueAccent);
  drawItem(2, 'Physical Damage Ins', pdiMonthly > 0 ? `${fmtCurrency(pdiMonthly)}/month` : '—', s.pdi, !s.pdi, blueAccent);
  drawItem(3, 'Occ/Acc Insurance', occAccValue > 0 ? `${fmtCurrency(occAccValue)}/month` : '—', s.occacc, !s.occacc, blueAccent, { note: '(deducted on 10th and 20th)' });
  yPos += 4;

  // Company Programs
  drawHeader('Company Programs', greenAccent);
  drawItem(4, 'Insurance Buy-Down', `${fmtCurrency(buyDownValue)}/week`, s.buydown, !s.buydown, greenAccent);
  const irpYes = s.irp_plate_prepaid || s.irp_plate_settlements;
  drawItem(5, 'IRP Plate Program', '', irpYes, !irpYes, greenAccent, { transfer: true, reactivate: true, tChecked: ti.plate, rChecked: ri.plate });

  yPos -= 1;
  doc.setFillColor(...hexToRgb(lightGrayBg)); doc.roundedRect(margin + 10, yPos, pageWidth - margin * 2 - 10, 12, 1, 1, 'F');
  let subY = yPos + 4;
  drawCheckbox(doc, margin + 13, subY - 1.5, s.irp_plate_prepaid, greenAccent);
  doc.setFontSize(8); doc.setTextColor(...hexToRgb(navyColor)); doc.setFont('helvetica', 'normal');
  doc.text('Option 1 (Prepay)', margin + 19, subY + 1);
  subY += 5;
  drawCheckbox(doc, margin + 13, subY - 1.5, s.irp_plate_settlements, greenAccent);
  doc.text(`Option 2 (Settlements: $50/week + ${fmtCurrency(plateDeposit)} deposit)`, margin + 19, subY + 1);
  yPos += 14;

  drawItem(6, 'IFTA Program', iftaValue > 0 ? `${fmtCurrency(iftaValue)}/week` : '—', s.ifta, !s.ifta, greenAccent);
  const ppYes = s.prepass_tolls_bypass || s.prepass_bypass;
  drawItem(7, 'Pre-pass', '', ppYes, !ppYes, greenAccent);

  yPos -= 1;
  doc.setFillColor(...hexToRgb(lightGrayBg)); doc.roundedRect(margin + 10, yPos, pageWidth - margin * 2 - 10, 12, 1, 1, 'F');
  subY = yPos + 4;
  drawCheckbox(doc, margin + 13, subY - 1.5, s.prepass_tolls_bypass, greenAccent);
  doc.setFontSize(8); doc.setTextColor(...hexToRgb(navyColor)); doc.setFont('helvetica', 'normal');
  doc.text(`Tolls & Bypass (${fmtCurrency(prePassTolls)}/week)`, margin + 19, subY + 1);
  subY += 5;
  drawCheckbox(doc, margin + 13, subY - 1.5, s.prepass_bypass, greenAccent);
  doc.text(`Bypass Only (${fmtCurrency(prePassBypass)}/week)`, margin + 19, subY + 1);
  yPos += 14;

  drawItem(8, 'Maintenance Fund', maintenanceFundValue > 0 ? `${fmtCurrency(maintenanceFundValue)}/week` : '—', s.maintenance_fund, !s.maintenance_fund, greenAccent);
  yPos += 4;

  // Required Deductions
  drawHeader('Required Deductions', orangeAccent);
  drawItem(9, 'Escrow', `${fmtCurrency(securityFull)} at ${fmtCurrency(securityWeekly)}/week`, s.security_deposit, !s.security_deposit, orangeAccent, { transfer: true, reactivate: true, tChecked: ti.security_deposit, rChecked: ri.security_deposit });
  drawItem(10, 'ELD Deposit', `${fmtCurrency(eldFull)} at ${fmtCurrency(eldWeekly)}/week`, s.eld_deposit, !s.eld_deposit, orangeAccent, { transfer: true, reactivate: true, tChecked: ti.eld, rChecked: ri.eld });
  drawItem(11, 'Dashcam Deposit', `${fmtCurrency(dashcamDeposit)} at ${fmtCurrency(dashcamWeekly)}/week`, s.dashcam_deposit, !s.dashcam_deposit, orangeAccent, { transfer: true, reactivate: true, tChecked: ti.dashcam, rChecked: ri.dashcam });
  drawItem(12, 'ELD Data Fee', eldDataFee > 0 ? `${fmtCurrency(eldDataFee)}/week` : '—', s.eld_deposit || eldDataFee > 0, !(s.eld_deposit || eldDataFee > 0), orangeAccent);
  yPos += 6;

  // Cost Summary
  if (yPos > 200) { doc.addPage(); yPos = margin; }

  function drawCostSection(title: string, color: string, items: { name: string; value: number; note?: string; biweeklyValue?: number }[], label: string) {
    const [r, g, b] = hexToRgb(color);
    doc.setFillColor(r, g, b); doc.rect(margin, yPos, 1.5, 6, 'F');
    doc.setFillColor(239, 246, 255); doc.rect(margin + 1.5, yPos, pageWidth - margin * 2 - 1.5, 6, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...hexToRgb(navyColor));
    doc.text(title, margin + 5, yPos + 4); yPos += 8;
    if (items.length === 0) {
      doc.setFillColor(...hexToRgb(lightGrayBg)); doc.roundedRect(margin, yPos, pageWidth - margin * 2, 8, 1, 1, 'F');
      doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(148, 163, 184);
      doc.text(`No ${title.toLowerCase()} selected`, pageWidth / 2, yPos + 5, { align: 'center' }); yPos += 10; return;
    }
    const body: RowInput[] = items.map((it) => {
      let n = it.name; if (it.note) n += `\n${it.note}`; if (it.biweeklyValue !== undefined) n += `\nBilled bi-weekly at ${fmtCurrency(it.biweeklyValue)}`;
      return [{ content: n, styles: { fontSize: 8, cellPadding: 2 } } as CellDef, { content: fmtCurrency(it.value), styles: { halign: 'right', fontStyle: 'bold', fontSize: 8, cellPadding: 2 } } as CellDef];
    });
    const sub = items.reduce((a, b) => a + b.value, 0);
    body.push([{ content: label, styles: { halign: 'right', fillColor: hexToRgb(lightGrayBg), fontSize: 8, textColor: hexToRgb('#64748B'), cellPadding: 2 } } as CellDef, { content: fmtCurrency(sub), styles: { halign: 'right', fontStyle: 'bold', fillColor: hexToRgb(lightGrayBg), fontSize: 9, cellPadding: 2 } } as CellDef]);
    autoTable(doc, { startY: yPos, body, theme: 'grid', styles: { lineColor: hexToRgb(borderColor), lineWidth: 0.1, fontSize: 8 }, columnStyles: { 0: { cellWidth: (pageWidth - margin * 2) * 0.75 }, 1: { cellWidth: (pageWidth - margin * 2) * 0.25 } } });
    yPos = (doc as any).lastAutoTable?.finalY ?? yPos + 20; yPos += 4;
  }

  drawCostSection('Weekly Settlement Deductions', blueAccent, weeklyItems, 'Weekly Subtotal');
  drawCostSection('Monthly Charges', amberAccent, monthlyItems, 'Monthly Subtotal');
  if (oneTimeItems.length > 0) drawCostSection('One-Time Charges', purpleAccent, oneTimeItems, 'One-Time Subtotal');

  // Total footer
  if (yPos > 230) { doc.addPage(); yPos = margin; }
  const fh = oneTimeTotal > 0 ? 26 : 22;
  doc.setFillColor(...hexToRgb(navyColor)); doc.roundedRect(margin, yPos, pageWidth - margin * 2, fh, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
  doc.text('Estimated Monthly Total', margin + 5, yPos + 7);
  doc.setFontSize(16); doc.text(fmtCurrency(estMonthly), pageWidth - margin - 5, yPos + 7, { align: 'right' });
  doc.setDrawColor(71, 85, 105); doc.setLineWidth(0.2); doc.line(margin + 3, yPos + 10, pageWidth - margin - 3, yPos + 10);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184);
  doc.text('Weekly settlements:', margin + 5, yPos + 15); doc.setTextColor(226, 232, 240); doc.setFont('helvetica', 'bold');
  doc.text(`${fmtCurrency(weeklyTotal)}/week`, margin + 35, yPos + 15);
  if (oneTimeTotal > 0) { doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184); doc.text('One-time charges:', margin + 5, yPos + 19); doc.setTextColor(226, 232, 240); doc.setFont('helvetica', 'bold'); doc.text(`${fmtCurrency(oneTimeTotal)}`, margin + 35, yPos + 19); }
  yPos += fh + 8;

  // Signature
  if (yPos > 245) { doc.addPage(); yPos = margin; }
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(71, 85, 105);
  doc.text('By signing below, I agree to the above deduction amounts to be taken from my settlement.', margin, yPos);
  yPos += 12;
  doc.setDrawColor(...hexToRgb(navyColor)); doc.setLineWidth(0.3);
  doc.line(margin, yPos, margin + 80, yPos); doc.setFontSize(8); doc.setTextColor(100, 116, 139); doc.text('IBE Signature', margin, yPos + 4);
  yPos += 12;
  doc.line(margin, yPos, margin + 50, yPos); doc.text('Date', margin, yPos + 4);

  doc.save(`Deductions_Checklist_${f.firstName || 'Driver'}_${f.lastName || ''}.pdf`.replace(/\s+/g, '_'));
}
