import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, subDays } from 'date-fns';
import type { Agent } from './mockData';

const navyColor = '#1E293B';
const grayBg = '#F1F5F9';
const borderColor = '#E2E8F0';

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

export interface RoadTestData {
  form: Record<string, string>;
  agent: Agent | null;
}

export function generateRoadTest({ form, agent }: RoadTestData): void {
  const driverName = `${form.firstName || ''} ${form.lastName || ''}`.trim();
  const startDate = form.purchaseDate ? new Date(form.purchaseDate) : new Date();
  const motorCarrierName = agent?.cr6cd_motorcarrier || 'American Carrier Transport, LLC';

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 12.7;
  const yPos = margin;

  const tableMaxWidth = 180;
  const tableX = (pageWidth - tableMaxWidth) / 2;

  const roadTestTitle = 'ROAD TEST EQUIVALENT SECTION 391.33 FMCSR';
  const roadTestText1 = `In place of, and as equivalent to, the road test required by 391.31, a person who seeks to drive a commercial motor vehicle may present, and a motor carrier may accept - 1) A valid operator's license which has been issued to him/her by a State that licenses drivers to operate specific categories of commercial motor vehicles and which, under the laws of the State, licenses him/her after successful completion of a road test in a commercial motor vehicle of the type the motor carrier intends to assign to him/her; or 2) A copy of a valid certificate of driver's road test issued to him/her pursuant to 391.31 within the preceding 3 years.`;
  const roadTestCertification = `IBE driver certifies that I successfully completed a road test under the laws of the state with whom I have been issued a commercial operator's license as described in Section (1) above.`;

  const dayDates: string[] = [];
  for (let i = 7; i >= 1; i--) {
    const date = subDays(startDate, i);
    dayDates.push(format(date, 'MM/dd'));
  }

  const currentTime = new Date();
  const certTime = format(currentTime, 'h:mm a');
  const certDay = format(startDate, 'd');
  const certMonth = format(startDate, 'MMMM');
  const certYear = format(startDate, 'yyyy');

  const hoursInstruction = 'Instruction: The regulations of the Department of Transportation (Rule 395.8(j)(2), require you to furnish a statement of the amount of time worked during the last period of seven (7) consecutive days.';

  const certificationContent = `I hereby certify that the information given above is correct to the best of my knowledge and belief and that I was last relieved from work at:\n\n                              ${certTime}                              ${certDay}                              ${certMonth}                              ${certYear}\n                              (Time)                              (Day)                              (Month)                              (Year)`;

  const doorStrapTitle = `${motorCarrierName} DOOR STRAP POLICY`;
  const doorStrapPolicy = `Over the last several years we have seen an increase in damages to Trailer and Containers. Most of these damages have been door related damages due to broken or insufficient door holdback latches. These damages have cost our Independent Business Entities (IBEs) and their drivers thousands of dollars in deductibles for equipment damage as well as property damage to buildings and other vehicles. Some IBEs have also incurred injuries from the doors coming loose and hitting them, especially in high-wind situations. Due to these issues, ${motorCarrierName} has adopted a Door Strap Policy. Each IBE will be supplied with a set of two (2) straps to hold trailer and container doors open. The door straps are of a Cam-Buckle design and are very easy and quick to use, they are rated at 183 pounds. The straps will be supplied at no cost to the IBE; replacements will be looked at on a case by case basis. Any IBE or their driver who incurs damages caused by an unsecure door and the supplied straps were not used or not used properly, the IBE will be held responsible for the full amount of any and all damages and/or losses incurred. These damages include but are not limited to, any damages to the Trailer/Container (including chassis), property or persons. It is the IBE or IBE's driver sole responsibility to insure the Door Straps are used properly during the loading and/or unloading process. They should make sure there is no slack or play in the strap and the door is held tight against the trailer. Securement should be made by using two (2) non-slip securement points, one on the door the other to the frame of the equipment.`;

  autoTable(doc, {
    startY: yPos,
    margin: { left: tableX, right: tableX },
    body: [
      [{ content: roadTestTitle, colSpan: 9, styles: { fontStyle: 'bold', fontSize: 11, fillColor: hexToRgb(grayBg), halign: 'center', cellPadding: 4 } }],
      [{ content: `${roadTestText1}\n\n${roadTestCertification}`, colSpan: 9, styles: { fontSize: 8, cellPadding: 4 } }],
      [{ content: 'IBE Data Sheet', colSpan: 9, styles: { fontStyle: 'bold', fontSize: 11, fillColor: hexToRgb(grayBg), halign: 'center', cellPadding: 4 } }],
      [{ content: 'Name (print):', colSpan: 2, styles: { fontStyle: 'bold', fillColor: hexToRgb(grayBg) } }, { content: driverName || '_______________', colSpan: 7 }],
      [{ content: 'Social Security Number:', colSpan: 2, styles: { fontStyle: 'bold', fillColor: hexToRgb(grayBg) } }, { content: form.ssn || '_______________', colSpan: 7 }],
      [{ content: "Motor Vehicle Operator's License Number:", colSpan: 2, styles: { fontStyle: 'bold', fillColor: hexToRgb(grayBg) } }, { content: form.licenseNumber || '_______________', colSpan: 7 }],
      [{ content: 'Type of License:', colSpan: 2, styles: { fontStyle: 'bold', fillColor: hexToRgb(grayBg) } }, { content: 'A', colSpan: 7 }],
      [{ content: 'Issuing State:', colSpan: 2, styles: { fontStyle: 'bold', fillColor: hexToRgb(grayBg) } }, { content: form.licenseState || '_______________', colSpan: 7 }],
      [{ content: hoursInstruction, colSpan: 9, styles: { fontStyle: 'italic', fontSize: 7, cellPadding: 4 } }],
      [
        { content: '', styles: { fontStyle: 'bold', fillColor: hexToRgb(grayBg) } },
        { content: 'Day 1', styles: { fontStyle: 'bold', fillColor: hexToRgb(grayBg), halign: 'center' } },
        { content: 'Day 2', styles: { fontStyle: 'bold', fillColor: hexToRgb(grayBg), halign: 'center' } },
        { content: 'Day 3', styles: { fontStyle: 'bold', fillColor: hexToRgb(grayBg), halign: 'center' } },
        { content: 'Day 4', styles: { fontStyle: 'bold', fillColor: hexToRgb(grayBg), halign: 'center' } },
        { content: 'Day 5', styles: { fontStyle: 'bold', fillColor: hexToRgb(grayBg), halign: 'center' } },
        { content: 'Day 6', styles: { fontStyle: 'bold', fillColor: hexToRgb(grayBg), halign: 'center' } },
        { content: 'Day 7', styles: { fontStyle: 'bold', fillColor: hexToRgb(grayBg), halign: 'center' } },
        { content: 'TOTAL', styles: { fontStyle: 'bold', fillColor: hexToRgb(grayBg), halign: 'center' } },
      ],
      [
        { content: 'Date', styles: { fontStyle: 'bold', fillColor: hexToRgb(grayBg) } },
        { content: dayDates[0], styles: { halign: 'center' } },
        { content: dayDates[1], styles: { halign: 'center' } },
        { content: dayDates[2], styles: { halign: 'center' } },
        { content: dayDates[3], styles: { halign: 'center' } },
        { content: dayDates[4], styles: { halign: 'center' } },
        { content: dayDates[5], styles: { halign: 'center' } },
        { content: dayDates[6], styles: { halign: 'center' } },
        { content: '7', styles: { halign: 'center' } },
      ],
      [
        { content: 'Hours Worked', styles: { fontStyle: 'bold', fillColor: hexToRgb(grayBg) } },
        { content: '_____', styles: { halign: 'center' } },
        { content: '_____', styles: { halign: 'center' } },
        { content: '_____', styles: { halign: 'center' } },
        { content: '_____', styles: { halign: 'center' } },
        { content: '_____', styles: { halign: 'center' } },
        { content: '_____', styles: { halign: 'center' } },
        { content: '_____', styles: { halign: 'center' } },
        { content: '_____', styles: { halign: 'center' } },
      ],
      [{ content: certificationContent, colSpan: 9, styles: { fontSize: 8, cellPadding: 5 } }],
      [{ content: doorStrapTitle, colSpan: 9, styles: { fontStyle: 'bold', fontSize: 11, fillColor: hexToRgb(grayBg), cellPadding: 4 } }],
      [{ content: doorStrapPolicy, colSpan: 9, styles: { fontSize: 8, cellPadding: 4 } }],
    ],
    theme: 'grid',
    styles: {
      lineColor: hexToRgb(borderColor),
      lineWidth: 0.2,
      fontSize: 9,
      cellPadding: 3,
      textColor: hexToRgb(navyColor),
    },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 16.875 },
      2: { cellWidth: 16.875 },
      3: { cellWidth: 16.875 },
      4: { cellWidth: 16.875 },
      5: { cellWidth: 16.875 },
      6: { cellWidth: 16.875 },
      7: { cellWidth: 16.875 },
      8: { cellWidth: 16.875 },
    },
  });

  const fileName = `Road_Test_${form.firstName || 'Driver'}_${form.lastName || ''}.pdf`.replace(/\s+/g, '_');
  doc.save(fileName);
}
