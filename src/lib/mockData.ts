export interface Agent {
  cr6cd_agentsid: string;
  cr6cd_terminal: string;
  cr6cd_title: string;
  cr6cd_division: string;
  cr6cd_divisionformal: string;
  cr6cd_company: string;
  cr6cd_motorcarrier: string;
  cr6cd_motorcarriercode: string;
  cr6cd_scac: string;
  cr6cd_occaccmonthly: number;
  cr6cd_occaccbiweekly: number;
  cr6cd_bobtailvalue: number;
  cr6cd_securitydepositweeklyvalue: number;
  cr6cd_securitydepositfullvalue: number;
  cr6cd_elddepositvalue: number;
  cr6cd_elddepositfullvalue: number;
  cr6cd_elddatafeerequired: boolean;
  cr6cd_elddatafeevalue: number;
  cr6cd_dashcamdepositvalue: number;
  cr6cd_buydownvalue: number;
  cr6cd_iftavalue: number;
  cr6cd_platedepositvalue: number;
  cr6cd_platedepositfullvalue: number;
  cr6cd_plateweeklyvalue: number;
  cr6cd_plateadminfee: number;
  cr6cd_platemandatory: boolean;
  cr6cd_prepassbypass: number;
  cr6cd_prepasstollsbypass: number;
  cr6cd_prepassrequiredifarlplate: boolean;
  cr6cd_rfidvalue: number;
  cr6cd_rfidmandatory: boolean;
  cr6cd_trailerusagevalue: number;
  cr6cd_trailerusagerequired: boolean;
  cr6cd_trailerusageadminfee: number;
  cr6cd_hazmatrequired: boolean;
  cr6cd_workerscomprequired: string;
  cr6cd_complianceagentemails: string;
  cr6cd_addmoveagentemail: string;
}

export interface Driver {
  cr6cd_dix_driverid: string;
  cr6cd_dix_name: string;
  cr6cd_dix_drivercode: string;
  cr6cd_dix_contracttype: number;
  cr6cd_dix_actiontype: number;
  cr6cd_dix_createdbyname: string;
  cr6cd_dix_email: string;
  cr6cd_dix_phonenumber: string;
  cr6cd_dix_ssn: string;
  cr6cd_dix_licensenumber: string;
  cr6cd_dix_licensestate: string;
  cr6cd_dix_licenseexpdate: string;
  cr6cd_dix_streetaddress: string;
  cr6cd_dix_city: string;
  cr6cd_dix_state: string;
  cr6cd_dix_zipcode: string;
  cr6cd_dix_onboardingdate: string;
  cr6cd_dix_isactive: boolean;
  cr6cd_dix_fuelcardnumber: string;
  cr6cd_dix_elprequired: boolean;
  cr6cd_dix_hazmat: boolean;
  cr6cd_dix_homelandsecurity: boolean;
  cr6cd_dix_reactivateequipment: boolean;
  cr6cd_dix_transferequipment: boolean;
  cr6cd_dix_transferoccacc: boolean;
  _cr6cd_dix_agent_value: string;
  _cr6cd_dix_vendor_value: string;
  _cr6cd_dix_unit_value: string;
  createdon: string;
  cr6cd_dix_actiontypename?: string;
  cr6cd_dix_contracttypename?: string;
  cr6cd_dix_agentname?: string;
  cr6cd_dix_unitname?: string;
}

export interface Cancellation {
  cr6cd_dix_cancellationid: string;
  cr6cd_dix_name: string;
  cr6cd_dix_cancellationreason: string;
  cr6cd_dix_requestdate: string;
  cr6cd_dix_notes: string;
  cr6cd_dix_approved: boolean;
  cr6cd_dix_amount: number;
  cr6cd_dix_deductiondate: string;
  cr6cd_dix_reason: string;
  _cr6cd_dix_cancdriver_value: string;
  driverName?: string;
  terminal?: string;
  driverCode?: string;
  unitNumber?: string;
}

export const MOCK_AGENTS: Agent[] = [
  {
    cr6cd_agentsid: 'a1b2c3d4-0001-0001-0001-000000000001',
    cr6cd_terminal: '1683',
    cr6cd_title: 'ARL Transport - Miami',
    cr6cd_division: 'Southeast',
    cr6cd_divisionformal: 'Southeast Division',
    cr6cd_company: 'ARL Transport LLC',
    cr6cd_motorcarrier: 'ARL Transport LLC',
    cr6cd_motorcarriercode: 'ARL',
    cr6cd_scac: 'ARLT',
    cr6cd_occaccmonthly: 171.50,
    cr6cd_occaccbiweekly: 85.75,
    cr6cd_bobtailvalue: 45.00,
    cr6cd_securitydepositweeklyvalue: 50.00,
    cr6cd_securitydepositfullvalue: 1000.00,
    cr6cd_elddepositvalue: 5.00,
    cr6cd_elddepositfullvalue: 100.00,
    cr6cd_elddatafeerequired: true,
    cr6cd_elddatafeevalue: 15.00,
    cr6cd_dashcamdepositvalue: 10.00,
    cr6cd_buydownvalue: 10.00,
    cr6cd_iftavalue: 5.00,
    cr6cd_platedepositvalue: 25.00,
    cr6cd_platedepositfullvalue: 500.00,
    cr6cd_plateweeklyvalue: 20.00,
    cr6cd_plateadminfee: 50.00,
    cr6cd_platemandatory: false,
    cr6cd_prepassbypass: 12.00,
    cr6cd_prepasstollsbypass: 25.00,
    cr6cd_prepassrequiredifarlplate: true,
    cr6cd_rfidvalue: 35.00,
    cr6cd_rfidmandatory: false,
    cr6cd_trailerusagevalue: 75.00,
    cr6cd_trailerusagerequired: false,
    cr6cd_trailerusageadminfee: 25.00,
    cr6cd_hazmatrequired: true,
    cr6cd_workerscomprequired: 'Yes',
    cr6cd_complianceagentemails: 'compliance@arlnetwork.com',
    cr6cd_addmoveagentemail: 'addmove@arlnetwork.com',
  },
  {
    cr6cd_agentsid: 'a1b2c3d4-0002-0002-0002-000000000002',
    cr6cd_terminal: '5058',
    cr6cd_title: 'Partners Transport - Dallas',
    cr6cd_division: 'Central',
    cr6cd_divisionformal: 'Central Division',
    cr6cd_company: 'Partners Transport',
    cr6cd_motorcarrier: 'Partners Transport',
    cr6cd_motorcarriercode: 'PTR',
    cr6cd_scac: 'PTRS',
    cr6cd_occaccmonthly: 155.00,
    cr6cd_occaccbiweekly: 77.50,
    cr6cd_bobtailvalue: 40.00,
    cr6cd_securitydepositweeklyvalue: 45.00,
    cr6cd_securitydepositfullvalue: 900.00,
    cr6cd_elddepositvalue: 5.00,
    cr6cd_elddepositfullvalue: 100.00,
    cr6cd_elddatafeerequired: true,
    cr6cd_elddatafeevalue: 15.00,
    cr6cd_dashcamdepositvalue: 10.00,
    cr6cd_buydownvalue: 10.00,
    cr6cd_iftavalue: 5.00,
    cr6cd_platedepositvalue: 20.00,
    cr6cd_platedepositfullvalue: 400.00,
    cr6cd_plateweeklyvalue: 18.00,
    cr6cd_plateadminfee: 45.00,
    cr6cd_platemandatory: false,
    cr6cd_prepassbypass: 10.00,
    cr6cd_prepasstollsbypass: 22.00,
    cr6cd_prepassrequiredifarlplate: false,
    cr6cd_rfidvalue: 30.00,
    cr6cd_rfidmandatory: false,
    cr6cd_trailerusagevalue: 70.00,
    cr6cd_trailerusagerequired: true,
    cr6cd_trailerusageadminfee: 20.00,
    cr6cd_hazmatrequired: false,
    cr6cd_workerscomprequired: 'No',
    cr6cd_complianceagentemails: 'compliance@partners.com',
    cr6cd_addmoveagentemail: 'addmove@partners.com',
  },
  {
    cr6cd_agentsid: 'a1b2c3d4-0003-0003-0003-000000000003',
    cr6cd_terminal: '5042',
    cr6cd_title: 'Shamrock Express - Atlanta',
    cr6cd_division: 'Southeast',
    cr6cd_divisionformal: 'Southeast Division',
    cr6cd_company: 'Shamrock Express',
    cr6cd_motorcarrier: 'Shamrock Express',
    cr6cd_motorcarriercode: 'SHM',
    cr6cd_scac: 'SHEX',
    cr6cd_occaccmonthly: 165.00,
    cr6cd_occaccbiweekly: 82.50,
    cr6cd_bobtailvalue: 42.00,
    cr6cd_securitydepositweeklyvalue: 48.00,
    cr6cd_securitydepositfullvalue: 960.00,
    cr6cd_elddepositvalue: 5.00,
    cr6cd_elddepositfullvalue: 100.00,
    cr6cd_elddatafeerequired: true,
    cr6cd_elddatafeevalue: 15.00,
    cr6cd_dashcamdepositvalue: 10.00,
    cr6cd_buydownvalue: 10.00,
    cr6cd_iftavalue: 5.00,
    cr6cd_platedepositvalue: 22.00,
    cr6cd_platedepositfullvalue: 440.00,
    cr6cd_plateweeklyvalue: 19.00,
    cr6cd_plateadminfee: 48.00,
    cr6cd_platemandatory: false,
    cr6cd_prepassbypass: 11.00,
    cr6cd_prepasstollsbypass: 24.00,
    cr6cd_prepassrequiredifarlplate: true,
    cr6cd_rfidvalue: 32.00,
    cr6cd_rfidmandatory: false,
    cr6cd_trailerusagevalue: 72.00,
    cr6cd_trailerusagerequired: false,
    cr6cd_trailerusageadminfee: 22.00,
    cr6cd_hazmatrequired: false,
    cr6cd_workerscomprequired: 'Yes',
    cr6cd_complianceagentemails: 'compliance@shamrock.com',
    cr6cd_addmoveagentemail: 'addmove@shamrock.com',
  },
  {
    cr6cd_agentsid: 'a1b2c3d4-0004-0004-0004-000000000004',
    cr6cd_terminal: '5046',
    cr6cd_title: 'General Express - Houston',
    cr6cd_division: 'Central',
    cr6cd_divisionformal: 'Central Division',
    cr6cd_company: 'General Express',
    cr6cd_motorcarrier: 'General Express',
    cr6cd_motorcarriercode: 'GEX',
    cr6cd_scac: 'GEEX',
    cr6cd_occaccmonthly: 160.00,
    cr6cd_occaccbiweekly: 80.00,
    cr6cd_bobtailvalue: 43.00,
    cr6cd_securitydepositweeklyvalue: 47.00,
    cr6cd_securitydepositfullvalue: 940.00,
    cr6cd_elddepositvalue: 5.00,
    cr6cd_elddepositfullvalue: 100.00,
    cr6cd_elddatafeerequired: true,
    cr6cd_elddatafeevalue: 15.00,
    cr6cd_dashcamdepositvalue: 10.00,
    cr6cd_buydownvalue: 10.00,
    cr6cd_iftavalue: 5.00,
    cr6cd_platedepositvalue: 23.00,
    cr6cd_platedepositfullvalue: 460.00,
    cr6cd_plateweeklyvalue: 19.50,
    cr6cd_plateadminfee: 47.00,
    cr6cd_platemandatory: false,
    cr6cd_prepassbypass: 11.50,
    cr6cd_prepasstollsbypass: 23.50,
    cr6cd_prepassrequiredifarlplate: false,
    cr6cd_rfidvalue: 33.00,
    cr6cd_rfidmandatory: false,
    cr6cd_trailerusagevalue: 73.00,
    cr6cd_trailerusagerequired: false,
    cr6cd_trailerusageadminfee: 23.00,
    cr6cd_hazmatrequired: false,
    cr6cd_workerscomprequired: 'No',
    cr6cd_complianceagentemails: 'compliance@genex.com',
    cr6cd_addmoveagentemail: 'addmove@genex.com',
  },
  {
    cr6cd_agentsid: 'a1b2c3d4-0005-0005-0005-000000000005',
    cr6cd_terminal: '1000',
    cr6cd_title: 'ARL Network - Corporate',
    cr6cd_division: 'Corporate',
    cr6cd_divisionformal: 'Corporate Division',
    cr6cd_company: 'ARL Network',
    cr6cd_motorcarrier: 'ARL Network',
    cr6cd_motorcarriercode: 'ARN',
    cr6cd_scac: 'ARLN',
    cr6cd_occaccmonthly: 170.00,
    cr6cd_occaccbiweekly: 85.00,
    cr6cd_bobtailvalue: 44.00,
    cr6cd_securitydepositweeklyvalue: 50.00,
    cr6cd_securitydepositfullvalue: 1000.00,
    cr6cd_elddepositvalue: 5.00,
    cr6cd_elddepositfullvalue: 100.00,
    cr6cd_elddatafeerequired: true,
    cr6cd_elddatafeevalue: 15.00,
    cr6cd_dashcamdepositvalue: 10.00,
    cr6cd_buydownvalue: 10.00,
    cr6cd_iftavalue: 5.00,
    cr6cd_platedepositvalue: 24.00,
    cr6cd_platedepositfullvalue: 480.00,
    cr6cd_plateweeklyvalue: 20.00,
    cr6cd_plateadminfee: 49.00,
    cr6cd_platemandatory: false,
    cr6cd_prepassbypass: 12.00,
    cr6cd_prepasstollsbypass: 25.00,
    cr6cd_prepassrequiredifarlplate: true,
    cr6cd_rfidvalue: 34.00,
    cr6cd_rfidmandatory: false,
    cr6cd_trailerusagevalue: 74.00,
    cr6cd_trailerusagerequired: false,
    cr6cd_trailerusageadminfee: 24.00,
    cr6cd_hazmatrequired: false,
    cr6cd_workerscomprequired: 'Yes',
    cr6cd_complianceagentemails: 'compliance@arlnetwork.com',
    cr6cd_addmoveagentemail: 'addmove@arlnetwork.com',
  },
];

export const MOCK_DRIVERS: Driver[] = [
  {
    cr6cd_dix_driverid: 'd1-0001',
    cr6cd_dix_name: 'David Bell',
    cr6cd_dix_drivercode: 'DB10001',
    cr6cd_dix_contracttype: 100000000,
    cr6cd_dix_actiontype: 100000000,
    cr6cd_dix_createdbyname: 'Anderson Marquez',
    cr6cd_dix_email: 'dbell@example.com',
    cr6cd_dix_phonenumber: '(555) 123-4567',
    cr6cd_dix_ssn: '***-**-1234',
    cr6cd_dix_licensenumber: 'FL28823772323',
    cr6cd_dix_licensestate: 'FL',
    cr6cd_dix_licenseexpdate: '2027-06-15',
    cr6cd_dix_streetaddress: '123 Main St',
    cr6cd_dix_city: 'Miami',
    cr6cd_dix_state: 'FL',
    cr6cd_dix_zipcode: '33101',
    cr6cd_dix_onboardingdate: '2026-04-03',
    cr6cd_dix_isactive: true,
    cr6cd_dix_fuelcardnumber: 'FC-90001',
    cr6cd_dix_elprequired: false,
    cr6cd_dix_hazmat: false,
    cr6cd_dix_homelandsecurity: false,
    cr6cd_dix_reactivateequipment: false,
    cr6cd_dix_transferequipment: false,
    cr6cd_dix_transferoccacc: false,
    _cr6cd_dix_agent_value: 'a1b2c3d4-0001-0001-0001-000000000001',
    _cr6cd_dix_vendor_value: '',
    _cr6cd_dix_unit_value: '',
    createdon: '2026-04-03T12:00:00Z',
    cr6cd_dix_actiontypename: 'Add',
    cr6cd_dix_contracttypename: 'Owner Operator',
    cr6cd_dix_agentname: '1683',
    cr6cd_dix_unitname: '15102',
  },
];

export const MOCK_CANCELLATIONS: Cancellation[] = [
  {
    cr6cd_dix_cancellationid: 'cx-0001',
    cr6cd_dix_name: 'CXL-0001',
    cr6cd_dix_cancellationreason: 'Driver resigned',
    cr6cd_dix_requestdate: '2026-03-29',
    cr6cd_dix_notes: 'Driver chose to leave the company',
    cr6cd_dix_approved: true,
    cr6cd_dix_amount: 500.00,
    cr6cd_dix_deductiondate: '2026-03-29',
    cr6cd_dix_reason: 'Voluntary',
    _cr6cd_dix_cancdriver_value: 'd1-0001',
    driverName: 'Driver 1',
    terminal: '5058',
    driverCode: 'CX01000',
    unitNumber: 'U30000',
  },
  {
    cr6cd_dix_cancellationid: 'cx-0002',
    cr6cd_dix_name: 'CXL-0002',
    cr6cd_dix_cancellationreason: 'Contract expired',
    cr6cd_dix_requestdate: '2026-03-27',
    cr6cd_dix_notes: '',
    cr6cd_dix_approved: true,
    cr6cd_dix_amount: 300.00,
    cr6cd_dix_deductiondate: '2026-03-27',
    cr6cd_dix_reason: 'Contract End',
    _cr6cd_dix_cancdriver_value: 'd1-0002',
    driverName: 'Driver 2',
    terminal: '5042',
    driverCode: 'CX01001',
    unitNumber: 'U30013',
  },
  {
    cr6cd_dix_cancellationid: 'cx-0003',
    cr6cd_dix_name: 'CXL-0003',
    cr6cd_dix_cancellationreason: 'Medical leave',
    cr6cd_dix_requestdate: '2026-03-24',
    cr6cd_dix_notes: 'Extended medical leave',
    cr6cd_dix_approved: false,
    cr6cd_dix_amount: 0,
    cr6cd_dix_deductiondate: '2026-03-24',
    cr6cd_dix_reason: 'Medical',
    _cr6cd_dix_cancdriver_value: 'd1-0003',
    driverName: 'Driver 3',
    terminal: '5046',
    driverCode: 'CX01002',
    unitNumber: 'U30026',
  },
  {
    cr6cd_dix_cancellationid: 'cx-0004',
    cr6cd_dix_name: 'CXL-0004',
    cr6cd_dix_cancellationreason: 'Equipment return',
    cr6cd_dix_requestdate: '2026-03-21',
    cr6cd_dix_notes: '',
    cr6cd_dix_approved: true,
    cr6cd_dix_amount: 250.00,
    cr6cd_dix_deductiondate: '2026-03-21',
    cr6cd_dix_reason: 'Equipment Return',
    _cr6cd_dix_cancdriver_value: 'd1-0004',
    driverName: 'Driver 4',
    terminal: '1000',
    driverCode: 'CX01003',
    unitNumber: 'U30039',
  },
  {
    cr6cd_dix_cancellationid: 'cx-0005',
    cr6cd_dix_name: 'CXL-0005',
    cr6cd_dix_cancellationreason: 'Voluntary resignation',
    cr6cd_dix_requestdate: '2026-03-19',
    cr6cd_dix_notes: 'Driver found another carrier',
    cr6cd_dix_approved: true,
    cr6cd_dix_amount: 450.00,
    cr6cd_dix_deductiondate: '2026-03-19',
    cr6cd_dix_reason: 'Voluntary',
    _cr6cd_dix_cancdriver_value: 'd1-0005',
    driverName: 'Driver 5',
    terminal: '5046',
    driverCode: 'CX01004',
    unitNumber: 'U30052',
  },
];

export const ACTION_TYPE_LABELS: Record<number, string> = {
  100000000: 'Add',
  100000001: 'Equipment Return',
  100000002: 'Contract End',
  100000003: 'Medical',
};

export const CONTRACT_TYPE_LABELS: Record<number, string> = {
  100000000: 'Owner Operator',
  100000001: 'Company Driver',
  100000002: 'Lease',
  100000003: 'Driver & Unit',
  100000004: 'Truck Only',
  100000005: 'Rental Only',
  100000006: 'Trailer Only',
};

export const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia',
  'Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland',
  'Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey',
  'New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina',
  'South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming',
];

export function getActionBadgeClasses(actionType: number): string {
  switch (actionType) {
    case 100000000: return 'bg-[#10B981] text-white border-transparent';
    case 100000001: return 'bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20';
    case 100000002: return 'bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20';
    case 100000003: return 'bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20';
    default: return 'bg-muted text-muted-foreground';
  }
}
