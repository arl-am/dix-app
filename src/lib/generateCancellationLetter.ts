import { jsPDF } from 'jspdf';
import { stateAbbr, formatDatePdf } from './utils';
import type { Agent, Cancellation, CxlEquipment } from './mockData';
import {
  CXL_TYPE_LABELS,
  CXL_REASON_LABELS,
  EQUIPMENT_LIFECYCLE_LABELS,
  tentativeReleaseDate,
} from './cancellationConstants';

export interface CancellationLetterData {
  cancellation: Cancellation;
  agent: Agent | null;
  equipment: CxlEquipment[];
  sentBy: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [0, 0, 0];
}

const NAVY: [number, number, number] = [30, 41, 59];
const PRIMARY: [number, number, number] = [37, 99, 235];
const MUTED: [number, number, number] = [100, 116, 139];

export function generateCancellationLetter(data: CancellationLetterData): void {
  const { cancellation: c, agent, equipment, sentBy } = data;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const lx = 20;
  const rx = pageW - 20;

  // Header band
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageW, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text((agent?.cr6cd_motorcarrier || 'ARL Network').toUpperCase(), lx, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(agent?.cr6cd_company || 'Managing Transportation Needs', lx, 18);
  doc.text(agent?.cr6cd_complianceagentemails || 'compliance@arlnetwork.com', lx, 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('CANCELLATION NOTICE', rx, 16, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Ref: ${c.cr6cd_dix_name || c.cr6cd_dix_cancellationid?.slice(0, 8) || ''}`, rx, 22, { align: 'right' });

  let y = 42;

  // Date
  doc.setTextColor(...NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Date:', lx, y);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDatePdf(new Date().toISOString()), lx + 16, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('RE:', lx, y);
  doc.setFont('helvetica', 'normal');
  const typeLabel = c.cr6cd_dix_canceltype != null ? CXL_TYPE_LABELS[c.cr6cd_dix_canceltype] : 'Cancellation';
  doc.text(`${typeLabel} Cancellation`, lx + 16, y);
  y += 10;

  // Salutation + body
  doc.setFontSize(10);
  doc.text('To Whom It May Concern,', lx, y);
  y += 7;

  const intro = `This letter confirms the cancellation of the following ${typeLabel.toLowerCase()} record effective ${formatDatePdf(c.cr6cd_dix_canceldate || '')}. Please coordinate with the corresponding terminal for any pending equipment, deposits, or settlement items.`;
  const introLines = doc.splitTextToSize(intro, pageW - lx - 20);
  doc.text(introLines, lx, y);
  y += introLines.length * 5 + 4;

  // Details panel
  doc.setDrawColor(...hexToRgb('#E2E8F0'));
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(lx, y, pageW - lx - 20, 56, 2, 2, 'FD');
  doc.setFillColor(...PRIMARY);
  doc.rect(lx, y, 1.5, 56, 'F');

  const px = lx + 6;
  let py = y + 7;
  const labelW = 38;
  const rows: [string, string][] = [
    ['Cancellation Type', typeLabel],
    ['Reason', c.cr6cd_dix_cancelreason != null ? CXL_REASON_LABELS[c.cr6cd_dix_cancelreason] : '—'],
    ['Driver',  c.cr6cd_dix_drivername || '—'],
    ['Driver Code', c.cr6cd_dix_drivercode || '—'],
    ['Vendor', c.cr6cd_dix_vendorname || c.cr6cd_dix_vendorcode || '—'],
    ['Unit Number', c.cr6cd_dix_unitnumber || '—'],
    ['Terminal', `${agent?.cr6cd_terminal || '—'} ${agent?.cr6cd_title ? '· ' + agent.cr6cd_title : ''}`],
    ['Cancel Date', formatDatePdf(c.cr6cd_dix_canceldate || '')],
    ['Tentative Release', formatDatePdf(tentativeReleaseDate(c.cr6cd_dix_lastitemreceived) || '')],
  ];
  doc.setFontSize(9);
  rows.forEach(([k, v]) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...MUTED);
    doc.text(k.toUpperCase(), px, py);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...NAVY);
    doc.text(v, px + labelW, py);
    py += 5.6;
  });
  y += 64;

  // Equipment section
  if (equipment && equipment.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    doc.text('Equipment Status', lx, y);
    y += 6;

    doc.setDrawColor(...hexToRgb('#E2E8F0'));
    doc.setLineWidth(0.2);
    const colW = (pageW - lx - 20) / 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let row = 0;
    equipment.forEach((e) => {
      const col = row % 2;
      const cx = lx + col * colW;
      const cy = y + Math.floor(row / 2) * 6;
      doc.setTextColor(...NAVY);
      doc.text(e.cr6cd_displayname, cx, cy);
      doc.setTextColor(...MUTED);
      doc.text(EQUIPMENT_LIFECYCLE_LABELS[e.cr6cd_lifecyclestate] || '—', cx + 40, cy);
      row++;
    });
    y += Math.ceil(equipment.length / 2) * 6 + 8;
  }

  if (c.cr6cd_dix_reasondetails) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    doc.text('Notes', lx, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    const noteLines = doc.splitTextToSize(c.cr6cd_dix_reasondetails, pageW - lx - 20);
    doc.text(noteLines, lx, y);
    y += noteLines.length * 4.5 + 8;
  }

  // Sincerely block
  if (y > 230) y = 230;
  y += 8;
  doc.setFontSize(10);
  doc.setTextColor(...NAVY);
  doc.text('Sincerely,', lx, y);
  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.text(sentBy || 'Operations', lx, y);
  doc.setDrawColor(...hexToRgb('#374151'));
  doc.setLineWidth(0.4);
  doc.line(lx, y + 1, lx + doc.getTextWidth(sentBy || 'Operations'), y + 1);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(`${agent?.cr6cd_motorcarrier || 'ARL Network'} · ${stateAbbr(agent?.cr6cd_division || '')}`, lx, y);

  // Footer
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text('Generated by DIX · ARL Network', pageW / 2, 268, { align: 'center' });

  const safe = (c.cr6cd_dix_name || 'cancellation').replace(/[^a-zA-Z0-9-]/g, '_');
  doc.save(`${safe} - Cancellation Letter.pdf`);
}
