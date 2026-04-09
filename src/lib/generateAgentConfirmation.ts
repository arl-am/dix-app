import { jsPDF } from 'jspdf';
import autoTable, { type CellDef } from 'jspdf-autotable';
import { format } from 'date-fns';
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

function fmtCurrency(value: number): string {
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export interface AgentConfirmationData {
  form: Record<string, string>;
  agent: Agent | null;
  selections: Record<string, boolean>;
  transferItems: Record<string, boolean>;
  reactivateItems: Record<string, boolean>;
  pdiMonthly: number;
  iftaNumber: string;
}

export function generateAgentConfirmation(data: AgentConfirmationData): void {
  const { form, agent, selections, transferItems, reactivateItems, pdiMonthly, iftaNumber } = data;

  const bobtailValue = agent?.cr6cd_bobtailvalue ?? 0;
  const occAccMonthly = agent?.cr6cd_occaccmonthly ?? 0;
  const occAccBiWeekly = occAccMonthly / 2;
  const iftaValue = agent?.cr6cd_iftavalue ?? 0;
  const plateWeekly = agent?.cr6cd_plateweeklyvalue ?? 0;
  const plateDeposit = agent?.cr6cd_platedepositvalue ?? 500;
  const plateAdminFee = agent?.cr6cd_plateadminfee ?? 75;
  const chassisUsageWeekly = agent?.cr6cd_trailerusagevalue ?? 0;
  const chassisAdminFee = agent?.cr6cd_trailerusageadminfee ?? 0;
  const securityDepositFull = agent?.cr6cd_securitydepositfullvalue ?? 2000;
  const securityDepositWeekly = agent?.cr6cd_securitydepositweeklyvalue ?? 50;
  const eldDeposit = agent?.cr6cd_elddepositfullvalue ?? 500;
  const eldWeekly = agent?.cr6cd_elddepositvalue ?? 0;
  const eldDataFee = agent?.cr6cd_elddatafeevalue ?? 0;
  const dashcamDeposit = agent?.cr6cd_dashcamdepositvalue ?? 100;
  const dashcamWeekly = 10;
  const buyDownValue = agent?.cr6cd_buydownvalue ?? 10;
  const prePassTollsBypass = agent?.cr6cd_prepasstollsbypass ?? 12;
  const prePassBypassOnly = agent?.cr6cd_prepassbypass ?? 10;

  const truckValue = parseFloat(form.truckValue || '0') || 0;
  const terminalName = agent?.cr6cd_title || agent?.cr6cd_terminal || '—';
  const terminalNumber = agent?.cr6cd_terminal || '—';

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12.7;
  let yPos = margin;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...hexToRgb(navyColor));
  doc.text('Agent Confirmation IBE Activation', pageWidth / 2, yPos, { align: 'center' });
  yPos += 6;

  // Warning
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...hexToRgb(redColor));
  const warningText = '** Agent and Vendor must confirm by signing and returning to the Safety Admin. Vendor, Driver, and truck will not be activated in any system and Fuel card will not be activated until this confirmation is returned**';
  const warningLines = doc.splitTextToSize(warningText, pageWidth - margin * 2);
  doc.text(warningLines, pageWidth / 2, yPos, { align: 'center' });
  yPos += warningLines.length * 3.5 + 4;

  // Info table
  const driverName = `${form.firstName || ''} ${form.lastName || ''}`.trim();
  const vendorCityState = [form.vendorCity, form.vendorState].filter(Boolean).join(', ');
  const driverCityState = [form.city, form.state].filter(Boolean).join(', ');
  const tableWidth = pageWidth - margin * 2;
  const thirdWidth = tableWidth / 3;

  const headerCell = (content: string): CellDef => ({
    content,
    styles: { halign: 'center' as const, fillColor: hexToRgb(grayBg), textColor: hexToRgb(navyColor), fontStyle: 'bold', fontSize: 9, cellPadding: 1 },
  });
  const valueCell = (content: string, opts?: Partial<CellDef>): CellDef => ({
    content,
    ...opts,
    styles: { halign: 'center' as const, fillColor: [255, 255, 255] as [number, number, number], textColor: hexToRgb(navyColor), fontStyle: 'bold', fontSize: 9, cellPadding: 2, ...((opts as Record<string, unknown>)?.styles as Record<string, unknown> ?? {}) },
  });
  const labelCell = (content: string): CellDef => ({
    content,
    styles: { halign: 'left' as const, fillColor: hexToRgb(grayBg), textColor: hexToRgb(navyColor), fontStyle: 'bold', fontSize: 9, cellPadding: 2 },
  });
  const infoCell = (content: string): CellDef => ({
    content,
    colSpan: 2,
    styles: { halign: 'left' as const, fillColor: [255, 255, 255] as [number, number, number], textColor: hexToRgb(navyColor), fontSize: 9, cellPadding: 2 },
  });

  autoTable(doc, {
    startY: yPos,
    body: [
      [headerCell('Vendor code'), headerCell('Truck/Trailer'), headerCell('Driver code')],
      [valueCell(form.vendorCode || '—'), valueCell(form.unitNumber || '—'), valueCell(form.driverCode || '—')],
      [labelCell('Agent'), infoCell(`${terminalName}, Of Terminal ${terminalNumber}, is confirming that`)],
      [labelCell('Vendor'), infoCell(`${form.businessName || '—'}, of ${vendorCityState || '—'}`)],
      [labelCell('Driver'), infoCell(`${driverName || '—'}, of ${driverCityState || '—'}`)],
    ],
    theme: 'grid',
    styles: { lineColor: hexToRgb(borderColor), lineWidth: 0.2, fontSize: 9 },
    columnStyles: { 0: { cellWidth: thirdWidth }, 1: { cellWidth: thirdWidth }, 2: { cellWidth: thirdWidth } },
  });

  yPos = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? yPos + 30;
  yPos += 14;

  // Deductions header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...hexToRgb(navyColor));
  doc.text('Deductions:', margin, yPos);
  yPos += 7;

  const checkboxSize = 3;
  const textOffsetX = 5;
  const lineSpacing = 7;
  const subLineIndent = 10;

  function drawDeductionLine(text: string, checked: boolean, indentText?: string[]): void {
    const checkboxY = yPos - checkboxSize + 0.5;
    doc.setDrawColor(...hexToRgb(navyColor));
    doc.setLineWidth(0.3);
    if (checked) {
      doc.setFillColor(...hexToRgb(navyColor));
      doc.rect(margin, checkboxY, checkboxSize, checkboxSize, 'F');
    } else {
      doc.rect(margin, checkboxY, checkboxSize, checkboxSize);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb(navyColor));
    doc.text(text, margin + textOffsetX, yPos);
    yPos += lineSpacing;
    if (indentText?.length) {
      for (const line of indentText) {
        doc.text(line, margin + textOffsetX + subLineIndent, yPos);
        yPos += 5;
      }
    }
  }

  // Bobtail
  drawDeductionLine(`Bobtail/Deadhead ${fmtCurrency(bobtailValue)} Per Month (deducted the 1st of every month)`, !!selections.bobtail);

  // PDI
  const pdiPercent = truckValue > 0 ? (pdiMonthly / truckValue * 12 * 100).toFixed(2) : '0.00';
  drawDeductionLine(
    `Physical Damage ${fmtCurrency(pdiMonthly)} PDI Deposit ${fmtCurrency(0)} Settlements Value ${fmtCurrency(truckValue)} - ${pdiPercent}%`,
    !!selections.pdi,
    [
      `Tractor/Trailer info: Year: ${form.year || '—'} Make: ${form.make || '—'} Model: ${form.model || '—'} Serial #: ${form.vin || '—'}`,
      `Lienholder Name: ${form.lienholderName || '—'}`,
      `Address, City, State: ${form.lienholderAddress || '—'}`,
    ],
  );

  // Occ/Acc
  drawDeductionLine(`Occupational Accident Insurance ${fmtCurrency(occAccMonthly)} Per Month (Deduct at ${fmtCurrency(occAccBiWeekly)} on 10th and 20th of each month)`, !!selections.occacc);

  // IFTA
  drawDeductionLine(`Road and Fuel ${fmtCurrency(iftaValue)} Per Week (Using Motor Carriers IFTA)`, !!selections.ifta);

  // License Plates
  const irpSelected = !!selections.irp_plate_prepaid || !!selections.irp_plate_settlements;
  const fleetNumber = selections.irp_plate_prepaid ? '1' : selections.irp_plate_settlements ? '2' : '1 or 2';
  drawDeductionLine(`License Plates Fleet ${fleetNumber} Deduction at ${fmtCurrency(plateWeekly)} Per Week or Paid in Full ____`, irpSelected);

  // Plate Deposit
  const plateDepositWeekly = 100;
  drawDeductionLine(`Plate Deposit ${fmtCurrency(plateDeposit)} Deduction of ${fmtCurrency(plateDepositWeekly)} Per Week and IRP Admin Fee ${fmtCurrency(plateAdminFee)} One-time deduction`, irpSelected);

  // Security Deposit
  const securitySelected = !!selections.security_deposit && !transferItems.security_deposit && !reactivateItems.security_deposit;
  drawDeductionLine(`Security Deposit ${fmtCurrency(securityDepositFull)} Deducted at ${fmtCurrency(securityDepositWeekly)} Per Week (Deduction starts 3 week from hire date)`, securitySelected);

  // ELD
  const eldSelected = !!selections.eld_deposit && !transferItems.eld && !reactivateItems.eld;
  drawDeductionLine(`ELD Deposit ${fmtCurrency(eldDeposit)} paid ${fmtCurrency(eldWeekly)} Per week until paid in full and Weekly`, eldSelected);

  // ELD Data Fee
  drawDeductionLine(`ELD Data Fee ${fmtCurrency(eldDataFee)} Per week`, eldDataFee > 0);

  // Dashcam
  const dashcamSelected = !!selections.dashcam_deposit && !transferItems.dashcam && !reactivateItems.dashcam;
  drawDeductionLine(`Dashcam deposit ${fmtCurrency(dashcamDeposit)} paid ${fmtCurrency(dashcamWeekly)} Per week until paid in full`, dashcamSelected);

  // Buy-Down
  drawDeductionLine(`Insurance Deductible limiter Buy-Down ${fmtCurrency(buyDownValue)} Per week`, !!selections.buydown);

  // Chassis Usage
  drawDeductionLine(`Chassis Usage: ${fmtCurrency(chassisUsageWeekly)} Per Week plus ${fmtCurrency(chassisAdminFee)} Admin Fee Per Week`, !!selections.chassis_usage);

  // PrePass
  let prePassText = 'Pre Pass: —';
  let prePassSelected = false;
  if (selections.prepass_tolls_bypass) {
    prePassText = `Pre Pass: Tolls & Bypass (${fmtCurrency(prePassTollsBypass)}/week)`;
    prePassSelected = true;
  } else if (selections.prepass_bypass) {
    prePassText = `Pre Pass: Bypass Only (${fmtCurrency(prePassBypassOnly)}/week)`;
    prePassSelected = true;
  }
  drawDeductionLine(prePassText, prePassSelected);
  yPos += 4;

  // Start date note
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const startDateNote = 'Start Date as agreed by the Agent and Vendor will be the date of the first dispatch or the date that the Equipment is placed on the Agent\'s Insurance after all safety requirements have been verified. All deductions will begin from this date.';
  const noteLines = doc.splitTextToSize(startDateNote, pageWidth - margin * 2);
  doc.text(noteLines, margin, yPos);
  yPos += noteLines.length * 3.5 + 8;

  // Date line
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(navyColor));
  doc.setFont('helvetica', 'normal');
  const today = new Date();
  doc.text(`${format(today, 'd')} DAY OF ${format(today, 'MMMM').toUpperCase()}, ${format(today, 'yyyy')}`, margin, yPos);
  yPos += 22;

  // Signatures
  doc.setTextColor(...hexToRgb(navyColor));
  doc.setFontSize(9);
  doc.setDrawColor(...hexToRgb(navyColor));
  doc.setLineWidth(0.3);

  const sigWidth = 70;

  const agentSigY = yPos - 5;
  doc.line(margin, agentSigY, margin + sigWidth, agentSigY);
  doc.line(margin + 80, agentSigY, margin + 80 + 40, agentSigY);
  doc.text('Agent Signature:', margin, yPos);
  doc.text('Date Signed:', margin + 80, yPos);
  yPos += 18;

  const vendorSigY = yPos - 5;
  doc.line(margin, vendorSigY, margin + sigWidth, vendorSigY);
  doc.line(margin + 80, vendorSigY, margin + 80 + 40, vendorSigY);
  doc.text('Vendor Signature:', margin, yPos);
  doc.text('Date Signed:', margin + 80, yPos);
  yPos += 12;

  // Footer
  doc.setFontSize(9);
  doc.text(`Fuel Card#: ${form.fuelCardNumber || '_______________'}`, margin, yPos);
  doc.text(`IFTA#: ${iftaNumber || '_______________'}`, margin + 80, yPos);

  const fileName = `Agent_Confirmation_${form.firstName || 'Driver'}_${form.lastName || ''}.pdf`.replace(/\s+/g, '_');
  doc.save(fileName);
}
