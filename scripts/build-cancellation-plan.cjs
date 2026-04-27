/* Builds cancellation-plan.pdf — a review deliverable explaining the
   Monday "Cancellation Returns Tracking" → DIX app migration plan.
   Run: node scripts/build-cancellation-plan.cjs
*/
const path = require('path');
const fs = require('fs');
const { jsPDF } = require(path.join(__dirname, '..', 'node_modules', 'jspdf', 'dist', 'jspdf.node.min.js'));

const COLORS = {
  primary: [37, 99, 235],
  primaryDark: [29, 78, 216],
  navy: [30, 41, 59],
  green: [16, 185, 129],
  amber: [245, 158, 11],
  red: [220, 38, 38],
  purple: [139, 92, 246],
  blue: [59, 130, 246],
  text: [17, 24, 39],
  muted: [100, 116, 139],
  border: [226, 232, 240],
  cardBg: [248, 250, 252],
  pageBg: [255, 255, 255],
  rowAlt: [248, 250, 252],
};

const PAGE = { w: 612, h: 792, margin: 54 };
const CONTENT_W = PAGE.w - PAGE.margin * 2;

const doc = new jsPDF({ unit: 'pt', format: 'letter' });
let y = 0;
let pageNum = 0;

function setFill(c) { doc.setFillColor(c[0], c[1], c[2]); }
function setDraw(c) { doc.setDrawColor(c[0], c[1], c[2]); }
function setText(c) { doc.setTextColor(c[0], c[1], c[2]); }

function addFooter() {
  setText(COLORS.muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('DIX — Cancellation Process Redesign', PAGE.margin, PAGE.h - 28);
  doc.text(`Page ${pageNum}`, PAGE.w - PAGE.margin, PAGE.h - 28, { align: 'right' });
  doc.text('Anderson Marquez · 2026-04-27', PAGE.w / 2, PAGE.h - 28, { align: 'center' });
}

function newPage(opts = {}) {
  if (pageNum > 0) doc.addPage();
  pageNum++;
  if (opts.pageBg) {
    setFill(opts.pageBg);
    doc.rect(0, 0, PAGE.w, PAGE.h, 'F');
  }
  y = PAGE.margin;
  if (!opts.noFooter) addFooter();
}

function ensureSpace(needed) {
  if (y + needed > PAGE.h - PAGE.margin - 20) newPage();
}

function h1(text, opts = {}) {
  ensureSpace(40);
  setText(opts.color || COLORS.navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(text, PAGE.margin, y + 14);
  y += 22;
  setDraw(COLORS.primary);
  doc.setLineWidth(2);
  doc.line(PAGE.margin, y, PAGE.margin + 36, y);
  y += 14;
  doc.setLineWidth(0.5);
}

function h2(text, opts = {}) {
  ensureSpace(28);
  setText(opts.color || COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(text, PAGE.margin, y + 12);
  y += 22;
}

function p(text, opts = {}) {
  setText(opts.color || COLORS.text);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(opts.size || 10.5);
  const lines = doc.splitTextToSize(text, opts.w || CONTENT_W);
  for (const line of lines) {
    ensureSpace(14);
    doc.text(line, opts.x || PAGE.margin, y + 10);
    y += (opts.lh || 14);
  }
  y += (opts.gap === undefined ? 4 : opts.gap);
}

function bullet(text, opts = {}) {
  setText(COLORS.primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  ensureSpace(14);
  doc.text('•', PAGE.margin + (opts.indent || 6), y + 10);
  setText(COLORS.text);
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(text, CONTENT_W - (opts.indent || 6) - 14);
  lines.forEach((line, i) => {
    ensureSpace(14);
    doc.text(line, PAGE.margin + (opts.indent || 6) + 14, y + 10);
    y += 14;
  });
  y += 2;
}

function badge(text, color, x, yPos, opts = {}) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(opts.size || 8);
  const w = doc.getTextWidth(text) + 12;
  const h = opts.h || 14;
  setFill(color);
  doc.roundedRect(x, yPos - h + 3, w, h, 3, 3, 'F');
  setText([255, 255, 255]);
  doc.text(text, x + 6, yPos - 1);
  return w;
}

function card(opts) {
  const { title, subtitle, body, accentColor, h: cardH = 60 } = opts;
  ensureSpace(cardH + 10);
  setFill(COLORS.cardBg);
  setDraw(COLORS.border);
  doc.roundedRect(PAGE.margin, y, CONTENT_W, cardH, 6, 6, 'FD');
  if (accentColor) {
    setFill(accentColor);
    doc.rect(PAGE.margin, y, 4, cardH, 'F');
  }
  if (title) {
    setText(COLORS.navy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(title, PAGE.margin + 14, y + 16);
  }
  if (subtitle) {
    setText(COLORS.muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(subtitle, PAGE.margin + 14, y + 30);
  }
  if (body) {
    setText(COLORS.text);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(body, CONTENT_W - 28);
    lines.forEach((line, i) => {
      doc.text(line, PAGE.margin + 14, y + 44 + i * 12);
    });
  }
  y += cardH + 8;
}

function tableSimple(headers, rows, opts = {}) {
  const colWidths = opts.colWidths || headers.map(() => CONTENT_W / headers.length);
  const rowH = opts.rowH || 18;
  const headerH = opts.headerH || 22;
  ensureSpace(headerH + rowH * rows.length + 6);
  let x = PAGE.margin;
  setFill(COLORS.navy);
  doc.rect(PAGE.margin, y, CONTENT_W, headerH, 'F');
  setText([255, 255, 255]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  for (let i = 0; i < headers.length; i++) {
    doc.text(headers[i], x + 8, y + 14);
    x += colWidths[i];
  }
  y += headerH;
  rows.forEach((row, r) => {
    if (y + rowH > PAGE.h - PAGE.margin - 20) {
      newPage();
      let xh = PAGE.margin;
      setFill(COLORS.navy);
      doc.rect(PAGE.margin, y, CONTENT_W, headerH, 'F');
      setText([255, 255, 255]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      for (let i = 0; i < headers.length; i++) {
        doc.text(headers[i], xh + 8, y + 14);
        xh += colWidths[i];
      }
      y += headerH;
    }
    setFill(r % 2 === 0 ? COLORS.pageBg : COLORS.rowAlt);
    doc.rect(PAGE.margin, y, CONTENT_W, rowH, 'F');
    setDraw(COLORS.border);
    doc.line(PAGE.margin, y + rowH, PAGE.margin + CONTENT_W, y + rowH);
    setText(COLORS.text);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    let cx = PAGE.margin;
    for (let i = 0; i < row.length; i++) {
      const cellLines = doc.splitTextToSize(String(row[i] ?? ''), colWidths[i] - 16);
      doc.text(cellLines[0] || '', cx + 8, y + 12);
      cx += colWidths[i];
    }
    y += rowH;
  });
  y += 8;
}

function pipelineStep(label, color, x, yPos, w, isLast = false) {
  setFill(color);
  doc.roundedRect(x, yPos, w, 28, 4, 4, 'F');
  setText([255, 255, 255]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(label, w - 12);
  lines.forEach((line, i) => {
    doc.text(line, x + w / 2, yPos + 12 + i * 10, { align: 'center' });
  });
  if (!isLast) {
    setDraw(COLORS.muted);
    doc.setLineWidth(1.2);
    doc.line(x + w + 1, yPos + 14, x + w + 9, yPos + 14);
    doc.line(x + w + 6, yPos + 11, x + w + 9, yPos + 14);
    doc.line(x + w + 6, yPos + 17, x + w + 9, yPos + 14);
    doc.setLineWidth(0.5);
  }
}

// ============================================================
// PAGE 1 — COVER
// ============================================================
newPage({ noFooter: true });

setFill(COLORS.navy);
doc.rect(0, 0, PAGE.w, 280, 'F');

setFill(COLORS.primary);
doc.circle(PAGE.w - 80, 80, 60, 'F');
setFill(COLORS.purple);
doc.circle(PAGE.w - 60, 220, 30, 'F');
setFill(COLORS.green);
doc.circle(60, 240, 22, 'F');

setText([255, 255, 255]);
doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.text('DIX  ·  PROCESS REDESIGN', PAGE.margin, 80);

setText([255, 255, 255]);
doc.setFont('helvetica', 'bold');
doc.setFontSize(28);
doc.text('Cancellations:', PAGE.margin, 130);
doc.text('Migrating Monday.com', PAGE.margin, 165);
doc.text('into the App', PAGE.margin, 200);

setText([186, 230, 253]);
doc.setFont('helvetica', 'normal');
doc.setFontSize(12);
doc.text('Unifying intake + returns tracking + final release into one record.', PAGE.margin, 235);

y = 320;
setText(COLORS.text);
doc.setFont('helvetica', 'normal');
doc.setFontSize(10.5);
const intro = 'This document describes the current Monday.com cancellation process — split across three boards and ~1,100 active records — and proposes a unified replacement inside the DIX app. The plan is structured so you can read it once, redirect anything, and approve the parts you want before any code is written.';
const introLines = doc.splitTextToSize(intro, CONTENT_W - 40);
introLines.forEach((line, i) => doc.text(line, PAGE.margin + 20, y + i * 16));
y += introLines.length * 16 + 30;

const meta = [
  ['Author', 'Anderson Marquez'],
  ['Date', '2026-04-27'],
  ['Audience', 'Anderson + IBE Services / Ops stakeholders'],
  ['Status', 'Draft for review'],
  ['Source data', 'Monday board 9494905327 + 6983996664 + 6269744401'],
];
setFill(COLORS.cardBg);
setDraw(COLORS.border);
doc.roundedRect(PAGE.margin, y, CONTENT_W, meta.length * 22 + 16, 6, 6, 'FD');
meta.forEach((row, i) => {
  setText(COLORS.muted);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(row[0].toUpperCase(), PAGE.margin + 16, y + 22 + i * 22);
  setText(COLORS.text);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.text(row[1], PAGE.margin + 130, y + 22 + i * 22);
});

addFooter();

// ============================================================
// PAGE 2 — EXECUTIVE SUMMARY
// ============================================================
newPage();
h1('Executive Summary');

p('Cancellations today live in three Monday boards plus a stub in the DIX app. The boards cover the same conceptual lifecycle but in fragmented places — terminals submit a request in one board, ops processes returns in another, and a legacy department-by-department board hangs around from 2024. Most of the active work happens on "Cancellation Returns Tracking" (1,101 items), which is also the only board with a working agent submission form and equipment-tracking fields.', { gap: 8 });

h2('Recommendation');
bullet('Make the DIX app the single source of truth. Absorb the full schema of "Cancellation Returns Tracking" — that is the canonical board.');
bullet('Replace 10 hardcoded equipment status columns with one relational sub-table — easier to add new equipment types and clearer reporting.');
bullet('Collapse intake + ops processing into one record with a status pipeline. No more "split into two places."');
bullet('Retire "Cancel Process" (legacy 2024) and "Cancellation Requests" (1 active item, vestigial). Keep "Cancellation Returns Tracking" read-only for 30 days as a fallback, then archive.');
bullet('Migrate the existing 1,101 records via a one-shot script so we do not lose history.');

y += 8;
h2('Why this matters');
p('Right now an agent in a terminal must remember which board to use, ops staff must keep two systems in sync, and there is no single record per cancellation. The redesign collapses everything into one wizard plus one Kanban board inside DIX, and replaces Monday automations (notify owner on submit, due-date math, equipment % progress) with deterministic flows we control.', { gap: 12 });

setFill([220, 252, 231]);
setDraw([16, 185, 129]);
doc.roundedRect(PAGE.margin, y, CONTENT_W, 64, 6, 6, 'FD');
setFill(COLORS.green);
doc.rect(PAGE.margin, y, 4, 64, 'F');
setText([6, 78, 59]);
doc.setFont('helvetica', 'bold');
doc.setFontSize(10.5);
doc.text('Outcome', PAGE.margin + 16, y + 18);
doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
const outcome = 'One DIX page replaces three Monday boards. Agents submit cancellations through the same wizard pattern they already use for new entries. Ops gets a Kanban view, an Equipment % progress bar, automatic due-date math, and a generated cancellation letter PDF — no Monday license required.';
const outcomeLines = doc.splitTextToSize(outcome, CONTENT_W - 32);
outcomeLines.forEach((line, i) => doc.text(line, PAGE.margin + 16, y + 36 + i * 12));
y += 76;

// ============================================================
// PAGE 3 — CURRENT STATE: 3 MONDAY BOARDS
// ============================================================
newPage();
h1('Current state — three Monday boards');
p('What I found when I crawled the IBE Services workspace:', { gap: 8 });

card({
  title: 'Cancellation Returns Tracking',
  subtitle: 'Board 9494905327  ·  1,101 active items  ·  THE workhorse',
  body: '59 columns, 8 status groups, 10 equipment columns each with a 9-state lifecycle, 6 dates, 9 formula columns, 4 time-tracking columns, an Agent Form for intake, and a "Send / Integration with DIX" button hinting this was always meant to flow into our app. This is the board that matters.',
  accentColor: COLORS.primary,
  h: 86,
});

card({
  title: 'Cancellation Requests',
  subtitle: 'Board 6983996664  ·  1 active item  ·  vestigial intake',
  body: 'Older intake form (Sarah Reisker, 2024). Status pipeline: Requested → Processing → All Items RCVD → Moved to CXL or Forfeit. CXL CSR + Billing CSR people columns and a Pause Deductions board relation. Effectively superseded by the Returns Tracking form view.',
  accentColor: COLORS.amber,
  h: 78,
});

card({
  title: 'Cancel Process',
  subtitle: 'Board 6269744401  ·  1 active item  ·  legacy department workflow',
  body: 'Older still (Rachel Sladin, 2024). Per-department status + rep + done-date for Safety, Inventory, ELD/Logs, Billing, Deductions, Accounting. Final Done Date populates by automation when all departments are Done. Useful conceptual reference, not in active use.',
  accentColor: COLORS.muted,
  h: 78,
});

h2('What is in the DIX app today');
p('The Dataverse table cr6cd_dix_cancellation exists but is sparse: name, reason, request date, notes, approved bool, amount, deduction date, driver lookup. The 4-step wizard (Details / Equipment / Final Release / Review) is built but the "New Cancellation" button is currently disabled with a "Coming Soon" badge. None of the equipment lifecycle, terminal, or status pipeline from Monday is represented yet.', { gap: 0 });

// ============================================================
// PAGE 4 — PAIN POINTS
// ============================================================
newPage();
h1('Pain points the redesign solves');

const pains = [
  { c: COLORS.red, t: 'Two systems of record', b: 'Monday holds 1,101 records of truth; DIX holds a stub. Any field added to one drifts from the other. Cancellation status is invisible from the rest of the DIX driver record.' },
  { c: COLORS.amber, t: '10 equipment columns × 9 states = 90 cells per row', b: 'Each equipment type is a separate Monday status column. Adding a new piece of equipment means adding a column to the board, a column to a formula, and another "Needed" formula. A relational sub-table makes this O(1).' },
  { c: COLORS.purple, t: 'Status lives in groups, not in a column', b: 'Monday models the pipeline by moving items between groups. That works in Monday but does not survive export. We need an explicit Status field.' },
  { c: COLORS.blue, t: 'Notification logic is a kludge', b: 'Two columns ("Notify Trigger" + "Trigger Status") exist purely to fire automations. The column descriptions explicitly warn "do not remove this column." A real flow can do this without dummy state.' },
  { c: COLORS.green, t: 'No PDF letter, no email draft', b: 'Cancellation letters are written ad-hoc. The DIX app already generates 14 other PDFs via jsPDF — we extend that pattern.' },
];
pains.forEach((p) => {
  ensureSpace(70);
  setFill(COLORS.cardBg);
  setDraw(COLORS.border);
  doc.roundedRect(PAGE.margin, y, CONTENT_W, 60, 6, 6, 'FD');
  setFill(p.c);
  doc.rect(PAGE.margin, y, 4, 60, 'F');
  setText(COLORS.navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(p.t, PAGE.margin + 16, y + 18);
  setText(COLORS.text);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const lines = doc.splitTextToSize(p.b, CONTENT_W - 28);
  lines.forEach((ln, i) => doc.text(ln, PAGE.margin + 16, y + 34 + i * 12));
  y += 70;
});

// ============================================================
// PAGE 5 — PROPOSED ARCHITECTURE
// ============================================================
newPage();
h1('Proposed architecture');

p('One record per cancellation in the DIX app, backed by three Dataverse tables. Two new sub-tables capture the relational data Monday represented as columns.', { gap: 12 });

h2('Tables');
const tableRows = [
  ['cr6cd_dix_cancellation (existing, expanded)', 'Master record', 'One row per cancellation. Holds identity, status, dates, links, summary fields.'],
  ['cr6cd_dix_cxl_equipment (NEW)', 'Sub-table', 'One row per piece of equipment per cancellation. Replaces Monday\'s 10 hardcoded status columns with a flexible relation.'],
  ['cr6cd_dix_cxl_event (NEW, optional)', 'Audit log', 'One row per state transition. Replaces Monday\'s per-department status/date/rep columns with structured history.'],
];
tableSimple(['Table', 'Role', 'Notes'], tableRows, { colWidths: [180, 100, CONTENT_W - 280] });

h2('Wizard restructure');
p('Today: 4 steps, all "ops" oriented. Proposed: 5 steps, with a clean break between intake and processing — same pattern as the New Entry wizard.', { gap: 8 });

const stepsRows = [
  ['1. Submit Request', 'Terminal CSR', 'Type, terminal, driver/vendor/unit info, cancel date, reason. Conditional fields by Type — e.g., "Vendor/Unit" hides driver fields.'],
  ['2. Equipment Required', 'Auto + Ops', 'Auto-derives Need vs N/A from cancellation Type, ops can override. Same global choice set across all equipment.'],
  ['3. Returns Tracking', 'Ops (Inventory)', 'Lifecycle status of each piece (Need / Returned / Damaged / Forfeit / Transferred / N/A / etc.). Equipment % progress bar at top.'],
  ['4. Final Release', 'Ops', 'Last item received, deposits, forfeit, tentative release date = last-item + 45 days, notes.'],
  ['5. Review & Documents', 'Ops', 'Generate cancellation letter PDF, create email draft via Power Automate flag pattern, set final status.'],
];
tableSimple(['Step', 'Owner', 'Purpose'], stepsRows, { colWidths: [130, 90, CONTENT_W - 220] });

// ============================================================
// PAGE 6 — STATUS PIPELINE
// ============================================================
newPage();
h1('Status pipeline (single column, replaces 8 groups + 3 columns)');

p('Monday encodes lifecycle in groups + a Status column + Notify Trigger + Trigger Status. Replace all of that with one Choice column on the cancellation record:', { gap: 14 });

ensureSpace(80);
const stepW = 78;
const stepGap = 12;
const stepStartX = PAGE.margin;
const states = [
  ['Not Started', COLORS.muted],
  ['In Progress', COLORS.amber],
  ['Awaiting Returns', COLORS.blue],
  ['All Items RCVD', COLORS.green],
  ['Released', COLORS.primary],
];
let cx = stepStartX;
for (let i = 0; i < states.length; i++) {
  pipelineStep(states[i][0], states[i][1], cx, y, stepW, i === states.length - 1);
  cx += stepW + stepGap;
}
y += 50;

p('Plus three terminal/branch states reachable from any point in the pipeline:', { gap: 10 });

ensureSpace(50);
const branches = [
  ['Forfeit', COLORS.red, 'driver forfeits all deposits; record closes'],
  ['Transferred', COLORS.purple, 'driver moved to a new terminal; equipment goes with them'],
  ['Reactivated NTL', COLORS.green, 'driver came back before processing; no time lost'],
];
branches.forEach((b) => {
  ensureSpace(30);
  setFill(b[1]);
  doc.roundedRect(PAGE.margin, y, 90, 22, 4, 4, 'F');
  setText([255, 255, 255]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(b[0], PAGE.margin + 45, y + 14, { align: 'center' });
  setText(COLORS.muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(b[2], PAGE.margin + 100, y + 14);
  y += 28;
});
y += 8;

h2('Automation hooks');
bullet('On record create with Status = Not Started: Power Automate fires, emails the cancellation owner + terminal compliance contact (replaces Monday "Notify Trigger").');
bullet('On Status → All Items RCVD: app populates "All Items Received Date" automatically + computes "Tentative Release Date" = today + 45 days.');
bullet('On Equipment row update where all required rows = Returned: Status auto-advances to "All Items RCVD".');
bullet('On Status → Released: locks the wizard, generates the cancellation letter PDF, and sends final notification.');

// ============================================================
// PAGE 7 — FIELD MAPPING
// ============================================================
newPage();
h1('Field mapping  —  Monday "Cancellation Returns Tracking" → Dataverse');
p('Every Monday column has a destination, gets dropped, or is replaced by computed logic. The "Notes" column flags any non-trivial decision.', { gap: 8 });

const mapRows = [
  ['Name (Unit Number)', 'cr6cd_dix_unitnumber (text)', ''],
  ['Status group', 'cr6cd_dix_status (Choice)', 'merged with Status column'],
  ['Status (color_mksecehw)', 'cr6cd_dix_status (Choice)', 'see status pipeline page'],
  ['Type (status)', 'cr6cd_dix_type (Choice)', '10 values; drives conditional fields'],
  ['Terminal (dropdown)', 'cr6cd_dix_agent (lookup)', 'lookup to existing cr6cd_agents'],
  ['Motor Carrier (status)', '— derived from agent', 'remove duplication'],
  ['Division (status)', '— derived from agent', 'remove duplication'],
  ['Vendor Code/Name', 'cr6cd_dix_vendor (lookup)', 'or text fallback if no DIX vendor'],
  ['Driver Code/Name/Phone', 'cr6cd_dix_canceldriver (lookup)', 'or text fallback'],
  ['Trailer Code', 'cr6cd_dix_trailercode (text)', ''],
  ['Cancellation Reason', 'cr6cd_dix_cancelreason (Choice)', '10 values: Resigned-Other, Personal, Truck Down, etc.'],
  ['Reason for Leaving (text)', 'cr6cd_dix_reasondetails (Memo 2000)', ''],
  ['Submitter (people)', 'cr6cd_dix_submittedby (lookup systemuser)', ''],
  ['Owner (people)', 'cr6cd_dix_assignee (lookup systemuser)', 'replaces Monday Owner'],
  ['Start Date', 'cr6cd_dix_startdate (Date)', ''],
  ['Cancel Date', 'cr6cd_dix_canceldate (Date)', ''],
  ['Entry Date', 'createdon', 'use Dataverse system field'],
  ['CXL Due Date', 'cr6cd_dix_duedate (Date)', 'auto = canceldate + 7'],
  ['All Items RCVD Date', 'cr6cd_dix_allitemsrcvddate (Date)', 'auto-set on equipment 100%'],
  ['Tentative Release Date', '— derived', 'allitemsrcvddate + 45 days, computed in UI'],
  ['Days Past Due', '— derived', 'computed in UI: today - duedate if Status not closed'],
  ['Deadline Status', '— derived', 'On Time / Past Due, computed from due date'],
  ['Notify Trigger / Trigger Status', '— DROP', 'replaced by Power Automate on status change'],
  ['10× equipment status columns', 'cr6cd_dix_cxl_equipment rows', 'see equipment lifecycle page'],
  ['Equipment % battery', '— derived', 'returned / needed, computed in UI'],
  ['9× "Needed" formulas', '— derived from Type', 'equipment table seeded by Type at create time'],
  ['Request Return Label?', 'cr6cd_dix_requestreturnlabel (Bool)', ''],
  ['Return Label (file)', 'cr6cd_dix_returnlabelurl (text)', 'store SharePoint URL or attachment ref'],
  ['RL Tracking Number', 'cr6cd_dix_rltrackingnumber (text)', ''],
  ['Provider (formula)', '— derived', 'detect FedEx/UPS from tracking number prefix'],
  ['Final Release (file)', '— derived', 'generated PDF stored in SharePoint by flow'],
  ['Time tracking (4 columns)', 'cr6cd_dix_cxl_event rows', 'derive durations from event log timestamps'],
  ['Subitems', '— DROP', 'equipment table replaces task checklist'],
  ['Samsara link (board relation)', 'cr6cd_dix_samsaralink (text)', 'optional; URL only'],
];
tableSimple(['Monday column', 'New destination', 'Notes'], mapRows, {
  colWidths: [170, 200, CONTENT_W - 370],
  rowH: 16,
});

// ============================================================
// PAGE 8 — EQUIPMENT SUB-TABLE
// ============================================================
newPage();
h1('Equipment sub-table  —  why we replace 10 columns with 1 relation');

p('Monday has 10 separate status columns: ELD, DashCam, DashCam Cover, Door Signs, IFTA, License Plate, PrePass, Logs, RFID, Trailer Lock. Each shares the same 9-state lifecycle. Adding new equipment means another column, more formulas, more board surgery. The relational pattern fixes this:', { gap: 14 });

setFill(COLORS.cardBg);
setDraw(COLORS.border);
doc.roundedRect(PAGE.margin, y, CONTENT_W, 130, 6, 6, 'FD');
setText(COLORS.navy);
doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.text('cr6cd_dix_cxl_equipment', PAGE.margin + 14, y + 20);
setText(COLORS.muted);
doc.setFont('helvetica', 'normal');
doc.setFontSize(9);
doc.text('one row per piece of equipment per cancellation', PAGE.margin + 14, y + 33);
const fields = [
  'cr6cd_dix_equipmentkey  (text)        e.g., "eld", "dashcam", "ifta"',
  'cr6cd_dix_displayname   (text)        e.g., "ELD"',
  'cr6cd_dix_lifecyclestate (Choice)     Need / Returned / Not Received / Transferred / Damaged / Forfeit / Under Review / No Longer Needed / N/A',
  'cr6cd_dix_returneddate  (Date)        when this piece came back',
  'cr6cd_dix_notes         (Memo 1000)',
  'lookup: cr6cd_dix_equipmentcancellation → cr6cd_dix_cancellation',
];
setText(COLORS.text);
doc.setFont('courier', 'normal');
doc.setFontSize(8.5);
fields.forEach((f, i) => doc.text(f, PAGE.margin + 14, y + 52 + i * 12));
y += 142;

h2('Lifecycle states (shared global choice set)');
const states2 = [
  ['Need', COLORS.amber],
  ['Returned', COLORS.green],
  ['Not Received', COLORS.red],
  ['Transferred', COLORS.purple],
  ['Damaged', COLORS.red],
  ['Forfeit', COLORS.red],
  ['Under Review', COLORS.muted],
  ['No Longer Needed', COLORS.muted],
  ['N/A', COLORS.muted],
];
let bx = PAGE.margin;
states2.forEach((s) => {
  const w = doc.getTextWidth(s[0]) + 16;
  if (bx + w > PAGE.margin + CONTENT_W) { y += 22; bx = PAGE.margin; }
  setFill(s[1]);
  doc.roundedRect(bx, y, w, 16, 3, 3, 'F');
  setText([255, 255, 255]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(s[0], bx + w / 2, y + 11, { align: 'center' });
  bx += w + 4;
});
y += 28;

h2('Auto-seeding rule');
p('When a cancellation is created, the wizard inspects Type and seeds equipment rows with sensible defaults:', { gap: 6 });
bullet('Type = "Driver Only" → seed the personal-equipment items as Need; physical-truck items as N/A.');
bullet('Type = "Unit Only" → seed truck items as Need; driver-personal items as N/A.');
bullet('Type = "Vendor/Driver/Unit" → seed all items as Need.');
bullet('Type = "Trailer Only" → seed Trailer Lock + Door Signs as Need; everything else N/A.');
p('Ops can override any default. The Equipment % progress bar = (rows with Returned) / (rows with Need + Returned + Damaged + Forfeit + Not Received).', { gap: 0 });

// ============================================================
// PAGE 9 — UI SKETCH
// ============================================================
newPage();
h1('UI sketches (what ops will actually see)');

h2('Cancellations list page');
p('Replaces today\'s table with a Kanban-style toggle. Defaults to Kanban; users can switch to Table.', { gap: 10 });

ensureSpace(180);
const cols = ['Not Started', 'In Progress', 'Awaiting Returns', 'All Items RCVD', 'Released'];
const colColors = [COLORS.muted, COLORS.amber, COLORS.blue, COLORS.green, COLORS.primary];
const colW = (CONTENT_W - 16) / 5;
const kbHead = 24;
const kbBody = 130;
for (let i = 0; i < 5; i++) {
  const x = PAGE.margin + i * (colW + 4);
  setFill(colColors[i]);
  doc.roundedRect(x, y, colW, kbHead, 4, 4, 'F');
  setText([255, 255, 255]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(cols[i], x + colW / 2, y + 16, { align: 'center' });
  setFill(COLORS.cardBg);
  setDraw(COLORS.border);
  doc.rect(x, y + kbHead, colW, kbBody, 'FD');
  for (let r = 0; r < 3; r++) {
    setFill([255, 255, 255]);
    doc.roundedRect(x + 4, y + kbHead + 6 + r * 38, colW - 8, 32, 3, 3, 'F');
    setText(COLORS.navy);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('AT806T0' + (r + 1), x + 8, y + kbHead + 18 + r * 38);
    setText(COLORS.muted);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('Term ' + (1683 + r) + ' · ' + ['Driver Only', 'Vendor/Driver/Unit', 'Unit Only'][r], x + 8, y + kbHead + 30 + r * 38);
  }
}
y += kbHead + kbBody + 12;

h2('Cancellation detail — equipment progress');
p('Top-of-step progress bar shows returned vs needed at a glance. Each row is the sub-table.', { gap: 8 });

ensureSpace(80);
const eqItems = [
  ['ELD', 'Returned', COLORS.green],
  ['DashCam', 'Returned', COLORS.green],
  ['Door Signs', 'Need', COLORS.amber],
  ['IFTA', 'Need', COLORS.amber],
  ['Plate', 'Damaged', COLORS.red],
  ['PrePass', 'N/A', COLORS.muted],
];
setFill(COLORS.cardBg);
setDraw(COLORS.border);
doc.roundedRect(PAGE.margin, y, CONTENT_W, 14, 4, 4, 'FD');
const filled = (2 / 5) * (CONTENT_W - 4);
setFill(COLORS.green);
doc.roundedRect(PAGE.margin + 2, y + 2, filled, 10, 2, 2, 'F');
setText([255, 255, 255]);
doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.text('Equipment 40%  ·  2 of 5 returned', PAGE.margin + 8, y + 10);
y += 22;

eqItems.forEach((e) => {
  ensureSpace(22);
  setFill([255, 255, 255]);
  setDraw(COLORS.border);
  doc.rect(PAGE.margin, y, CONTENT_W, 20, 'FD');
  setText(COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(e[0], PAGE.margin + 12, y + 14);
  badge(e[1], e[2], PAGE.margin + 110, y + 14);
  setText(COLORS.muted);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('returned 2026-04-22', PAGE.margin + CONTENT_W - 100, y + 14);
  y += 22;
});

// ============================================================
// PAGE 10 — MIGRATION & ROLLOUT
// ============================================================
newPage();
h1('Migration & rollout');

h2('Phase 1  —  Schema and table provisioning');
bullet('Write scripts/create-cancellation-tables.ps1 (BOM-encoded, follows pulse-tables pattern). Adds new columns to cr6cd_dix_cancellation, creates cr6cd_dix_cxl_equipment + cr6cd_dix_cxl_event, defines the global choice set for equipment lifecycle.');
bullet('Run: powershell -File scripts/create-cancellation-tables.ps1.');
bullet('Register both new tables as data sources via npx power-apps add-data-source. Run pnpm power-apps schema sync.');

h2('Phase 2  —  App build');
bullet('Rebuild NewCancellation.tsx with 5-step wizard mirroring the New Entry pattern (progressive save, conditional fields, validation per step).');
bullet('Replace listing page with Kanban + Table toggle. Reuse existing Search Records UX patterns.');
bullet('Implement Cancellation Letter jsPDF generator under src/lib/generateCancellationLetter.ts. Same pattern as the other 14 generators.');
bullet('Wire Power Automate flag pattern for owner notification + email draft (proven from Add/Move Email and CP Registration flows).');

h2('Phase 3  —  Data migration');
bullet('Write scripts/migrate-monday-cancellations.cjs that pulls all 1,101 records from board 9494905327 via Monday GraphQL API, transforms columns to Dataverse fields, and POSTs via the same auth flow as the table-creation scripts.');
bullet('Map driver/vendor by code lookup; if no match, store the code as text. Manual reconciliation pass for orphans.');
bullet('Migrate equipment columns into per-cancellation cr6cd_dix_cxl_equipment rows. Drop sub-items entirely (they are noise).');

h2('Phase 4  —  Cutover');
bullet('Enable "New Cancellation" button (remove Coming Soon gate) in DIX prod.');
bullet('Set Monday board permissions to read-only and post a banner directing all submissions to DIX.');
bullet('Monitor 30 days. Archive Monday boards.');

h2('Time estimate');
p('Phase 1: ½ day. Phase 2: 3-4 days. Phase 3: 1 day for migration script + 1 day for reconciliation. Phase 4: ½ day. Total ~6-7 working days end to end.', { gap: 0 });

// ============================================================
// PAGE 11 — DECISIONS NEEDED FROM YOU
// ============================================================
newPage();
h1('Decisions I need from you before building');

const questions = [
  ['Q1', 'Drop "Cancel Process" board entirely?', 'I am proposing yes — it has 1 active item from 2024 and the per-department workflow is not happening anywhere in practice. Confirm.'],
  ['Q2', 'Drop "Cancellation Requests" board entirely?', 'Same — 1 active item, vestigial. The Returns Tracking form view already supersedes it. Confirm.'],
  ['Q3', 'Keep all 10 equipment types, or also add new ones now?', 'Current Monday set: ELD, DashCam, DashCam Cover, Door Signs, IFTA, License Plate, PrePass, Logs, RFID, Trailer Lock. Anything else worth adding while we are at it (e.g., Hazmat books, Fuel Card, Insurance Card)?'],
  ['Q4', 'Cancellation reason taxonomy', 'Monday has: Resigned (Other / Found Another Job / Truck Down / Sick / Personal / Retiring) + Termination (Other / No Contact / Medical / Safety). Same set, or trim/expand?'],
  ['Q5', 'Cancellation letter PDF design', 'Should I model after an existing template you already use, or create a new layout following our standard ARL/ACT/Partners letterhead pattern (like the CP Letter)?'],
  ['Q6', 'Migration timing', 'Run migration during business hours with the Monday board frozen for 1 hour, or do it overnight? Either works on the technical side.'],
  ['Q7', 'Owner notifications', 'Notify on every status change, or only on (a) record created, (b) all items received, (c) released? Notify by email, by Front draft, or both?'],
  ['Q8', 'Audit log table', 'Optional — do you actually want cr6cd_dix_cxl_event for "who changed status when," or skip it and rely on Dataverse audit logs?'],
];
questions.forEach((q) => {
  ensureSpace(70);
  setFill(COLORS.cardBg);
  setDraw(COLORS.border);
  doc.roundedRect(PAGE.margin, y, CONTENT_W, 60, 6, 6, 'FD');
  setFill(COLORS.primary);
  doc.roundedRect(PAGE.margin + 8, y + 8, 28, 20, 4, 4, 'F');
  setText([255, 255, 255]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(q[0], PAGE.margin + 22, y + 22, { align: 'center' });
  setText(COLORS.navy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(q[1], PAGE.margin + 44, y + 22);
  setText(COLORS.text);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const lns = doc.splitTextToSize(q[2], CONTENT_W - 56);
  lns.forEach((ln, i) => doc.text(ln, PAGE.margin + 44, y + 38 + i * 12));
  y += 70;
});

// ============================================================
// PAGE 12 — APPENDIX (BOARD STATS)
// ============================================================
newPage();
h1('Appendix  —  what is in Monday today');

h2('Cancellation Returns Tracking, by status group');
const groupRows = [
  ['Not Started Yet', 'topics'],
  ['In Progress', 'group_title'],
  ['Awaiting Returns', 'group_mksegg3y'],
  ['Exceptions - Awaiting Returns', 'group_mksfepg5'],
  ['All Items Received', 'group_mksec9a2'],
  ['Items Not Received', 'group_mkse95hd'],
  ['Transferred', 'group_mksfkz6f'],
  ['Reactivations - No Time Lost', 'group_mksfn2r6'],
];
tableSimple(['Status group', 'Monday group ID'], groupRows, { colWidths: [320, CONTENT_W - 320] });

h2('Cancellation Type label set');
const typeRows = [
  ['Vendor Only', 'vendor leaves; no driver, no unit'],
  ['Driver Only', 'driver leaves; vendor + unit stay'],
  ['Unit Only', 'unit retired; driver/vendor stay'],
  ['Vendor/Driver/Unit', 'full cancellation, all parties leave'],
  ['Vendor/Driver', 'driver and vendor leave; unit stays'],
  ['Vendor/Unit', 'vendor and unit leave; driver stays'],
  ['Driver/Unit', 'driver and unit leave; vendor stays'],
  ['Trailer Only', 'trailer cancellation only'],
  ['SUB Unit', 'substitute unit cancellation'],
  ['Rental Only', 'rental unit returned'],
];
tableSimple(['Type', 'Meaning (inferred)'], typeRows, { colWidths: [140, CONTENT_W - 140] });

h2('Active board owners');
p('Nicholas Valentino · Queen Tatiana · David Truong · Sarah Reisker · Alberto Florez · Anderson Marquez · Maria Melgarejo. These users will see the same Kanban view in DIX — auth roles need to be confirmed before launch.', { gap: 12 });

setFill([254, 243, 199]);
setDraw([245, 158, 11]);
doc.roundedRect(PAGE.margin, y, CONTENT_W, 60, 6, 6, 'FD');
setFill(COLORS.amber);
doc.rect(PAGE.margin, y, 4, 60, 'F');
setText([146, 64, 14]);
doc.setFont('helvetica', 'bold');
doc.setFontSize(11);
doc.text('Next step', PAGE.margin + 16, y + 18);
doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
const nextStep = 'Read this, mark up the decisions on page 11, and tell me which of the 4 phases I should start on. I will not write code or touch Dataverse tables until you give the go-ahead.';
const nsLines = doc.splitTextToSize(nextStep, CONTENT_W - 32);
nsLines.forEach((ln, i) => doc.text(ln, PAGE.margin + 16, y + 36 + i * 12));

// ============================================================
const outPath = path.join(__dirname, '..', 'cancellation-plan.pdf');
const buffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync(outPath, buffer);
console.log('Wrote', outPath, '(' + buffer.length + ' bytes,', pageNum, 'pages)');
