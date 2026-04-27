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
  cr6cd_inventoryterminal?: boolean;
  cr6cd_inventoryreturnaddress?: string;
  cr6cd_noninventoryreturnaddress?: string;
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
  cr6cd_elptestrequested: boolean;
  cr6cd_elptestsenderemail: string;
  cr6cd_elpteststatus: number | null;
  cr6cd_elptestscore: number | null;
  cr6cd_elptestdatecompleted: string | null;
  cr6cd_hazmattestrequested: boolean;
  cr6cd_hazmattestsenderemail: string;
  cr6cd_hazmattestscore: number | null;
  cr6cd_hazmatteststatus: number | null;
  cr6cd_hazmattestdatecompleted: string | null;
  cr6cd_homelandtestscore: number | null;
  cr6cd_homelandteststatus: number | null;
  cr6cd_homelandtestdatecompleted: string | null;
  _cr6cd_dix_agent_value: string;
  _cr6cd_dix_vendor_value: string;
  _cr6cd_dix_unit_value: string;
  createdon: string;
  cr6cd_dix_actiontypename?: string;
  cr6cd_dix_contracttypename?: string;
  cr6cd_dix_agentname?: string;
  cr6cd_dix_unitname?: string;
  unitNumber?: string;
  vin?: string;
}

export interface Cancellation {
  cr6cd_dix_cancellationid: string;
  cr6cd_dix_name: string;
  cr6cd_dix_cancellationreason?: string;
  cr6cd_dix_requestdate?: string;
  cr6cd_dix_notes?: string;
  cr6cd_dix_approved?: boolean;
  cr6cd_dix_amount?: number;
  cr6cd_dix_deductiondate?: string;
  cr6cd_dix_reason?: string;
  _cr6cd_dix_cancdriver_value?: string;

  cr6cd_dix_canceltype?: number | null;
  cr6cd_dix_status?: number | null;
  cr6cd_dix_cancelreason?: number | null;
  cr6cd_dix_reasondetails?: string;
  cr6cd_dix_unitnumber?: string;
  cr6cd_dix_vendorcode?: string;
  cr6cd_dix_vendorname?: string;
  cr6cd_dix_drivercode?: string;
  cr6cd_dix_drivername?: string;
  cr6cd_dix_driverphone?: string;
  cr6cd_dix_trailercode?: string;
  cr6cd_dix_startdate?: string;
  cr6cd_dix_canceldate?: string;
  cr6cd_dix_duedate?: string;
  cr6cd_dix_allitemsrcvddate?: string;
  cr6cd_dix_lastitemreceived?: string;
  cr6cd_dix_submittedby?: string;
  cr6cd_dix_assignee?: string;
  cr6cd_dix_requestreturnlabel?: boolean;
  cr6cd_dix_returnlabelurl?: string;
  cr6cd_dix_rltrackingnumber?: string;
  cr6cd_dix_forfeit?: boolean;
  cr6cd_dix_elddeposit?: number;
  cr6cd_dix_dashcamdeposit?: number;
  cr6cd_dix_pdideposit?: number;
  cr6cd_dix_transferredtounit?: string;
  cr6cd_dix_prepassnumber?: string;
  cr6cd_dix_rfidnumber?: string;
  cr6cd_dix_platenumber?: string;
  cr6cd_dix_fleetnumber?: string;
  cr6cd_dix_logsfromdate?: string;
  cr6cd_dix_logstodate?: string;
  cr6cd_dix_bypassagentaddress?: boolean;
  _cr6cd_dix_cancagent_value?: string;

  createdon?: string;
  modifiedon?: string;

  driverName?: string;
  terminal?: string;
  driverCode?: string;
  unitNumber?: string;
}

export interface CxlEquipment {
  cr6cd_dixcxlequipmentid: string;
  cr6cd_name: string;
  cr6cd_equipmentkey: string;
  cr6cd_displayname: string;
  cr6cd_lifecyclestate: number;
  cr6cd_returneddate?: string | null;
  cr6cd_notes?: string;
  cr6cd_istransferred?: boolean;
  cr6cd_isreactivated?: boolean;
  _cr6cd_equipmentcancellation_value: string;
  createdon?: string;
}

export interface NoteLike { userId: string; userName: string; likedAt: string }

export interface CxlNote {
  cr6cd_dixcxlnoteid: string;
  cr6cd_name: string;
  cr6cd_body: string;
  cr6cd_likedby?: string; // JSON array of NoteLike
  _cr6cd_notecancellation_value: string;
  _cr6cd_parentnote_value?: string | null;
  createdon: string;
  createdByName?: string;
  createdById?: string;
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
    cr6cd_inventoryterminal: true,
    cr6cd_inventoryreturnaddress: '4500 Dawn Ave, Suite 200\nMiami, FL 33101\nAttn: ARL Inventory Receiving',
    cr6cd_noninventoryreturnaddress: '1234 Driver Way\nMiami, FL 33102\nAttn: Driver Returns Desk',
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
    cr6cd_dix_contracttype: 1,
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
    cr6cd_elptestrequested: false,
    cr6cd_elptestsenderemail: '',
    cr6cd_elpteststatus: null,
    cr6cd_elptestscore: null,
    cr6cd_elptestdatecompleted: null,
    cr6cd_hazmattestrequested: false,
    cr6cd_hazmattestsenderemail: '',
    cr6cd_hazmattestscore: null,
    cr6cd_hazmatteststatus: null,
    cr6cd_hazmattestdatecompleted: null,
    cr6cd_homelandtestscore: null,
    cr6cd_homelandteststatus: null,
    cr6cd_homelandtestdatecompleted: null,
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
    cr6cd_dix_cancellationid: 'cx-pending-0001',
    cr6cd_dix_name: 'PA-STUB-12047',
    cr6cd_dix_drivername: 'Pending Power Automate Driver',
    cr6cd_dix_unitnumber: '12047',
    cr6cd_dix_submittedby: 'Power Automate',
    cr6cd_dix_requestdate: '2026-04-27',
    _cr6cd_dix_cancagent_value: 'a1b2c3d4-0001-0001-0001-000000000001',
    terminal: '1683',
    unitNumber: '12047',
    driverName: 'Pending Power Automate Driver',
    createdon: '2026-04-27T08:00:00Z',
  },
  {
    cr6cd_dix_cancellationid: 'cx-0001',
    cr6cd_dix_name: 'AT806T02',
    cr6cd_dix_canceltype: 100000003,
    cr6cd_dix_status: 100000002,
    cr6cd_dix_cancelreason: 100000000,
    cr6cd_dix_reasondetails: 'Please block fuel card and cancel vendor and unit. Driver parking truck due to fuel prices.',
    cr6cd_dix_requestdate: '2026-04-24',
    cr6cd_dix_canceldate: '2026-04-24',
    cr6cd_dix_duedate: '2026-05-01',
    cr6cd_dix_startdate: '2023-11-29',
    cr6cd_dix_unitnumber: 'AT806T02',
    cr6cd_dix_vendorcode: 'VISBOILC02',
    cr6cd_dix_vendorname: 'VISHKA CORPORATION INC',
    cr6cd_dix_drivercode: 'ANDVISBOILD03',
    cr6cd_dix_drivername: 'ANDRIY VISHKA',
    cr6cd_dix_driverphone: '773-418-4398',
    cr6cd_dix_submittedby: 'Cristal Vargas',
    cr6cd_dix_assignee: 'Daniela Ramirez',
    cr6cd_dix_forfeit: false,
    _cr6cd_dix_cancagent_value: 'a1b2c3d4-0001-0001-0001-000000000001',
    terminal: '1683',
    unitNumber: 'AT806T02',
    driverName: 'ANDRIY VISHKA',
    driverCode: 'ANDVISBOILD03',
    createdon: '2026-04-24T13:14:21Z',
  },
  {
    cr6cd_dix_cancellationid: 'cx-0002',
    cr6cd_dix_name: '464009L',
    cr6cd_dix_canceltype: 100000009,
    cr6cd_dix_status: 100000000,
    cr6cd_dix_cancelreason: 100000006,
    cr6cd_dix_reasondetails: 'Rental unit returned. Jaime Mike',
    cr6cd_dix_requestdate: '2026-04-21',
    cr6cd_dix_canceldate: '2026-04-21',
    cr6cd_dix_duedate: '2026-04-28',
    cr6cd_dix_startdate: '2026-04-17',
    cr6cd_dix_unitnumber: '464009L',
    cr6cd_dix_submittedby: 'Jaime Mike',
    cr6cd_dix_assignee: 'Maria Melgarejo',
    cr6cd_dix_forfeit: false,
    _cr6cd_dix_cancagent_value: 'a1b2c3d4-0002-0002-0002-000000000002',
    terminal: '5058',
    unitNumber: '464009L',
    createdon: '2026-04-21T13:37:22Z',
  },
  {
    cr6cd_dix_cancellationid: 'cx-0003',
    cr6cd_dix_name: 'CXL-N/A-0003',
    cr6cd_dix_canceltype: 100000001,
    cr6cd_dix_status: 100000001,
    cr6cd_dix_cancelreason: 100000004,
    cr6cd_dix_reasondetails: 'Driver advised dispatcher he quit. All items returned. Not eligible for rehire without management approval.',
    cr6cd_dix_requestdate: '2026-04-22',
    cr6cd_dix_canceldate: '2026-04-22',
    cr6cd_dix_duedate: '2026-04-29',
    cr6cd_dix_startdate: '2025-10-12',
    cr6cd_dix_vendorcode: 'VETPOGA',
    cr6cd_dix_vendorname: 'VETERAN CARRIERS INC.',
    cr6cd_dix_drivercode: 'CHASEASWGA',
    cr6cd_dix_drivername: 'Charles Seabrough',
    cr6cd_dix_driverphone: '478-494-4932',
    cr6cd_dix_submittedby: 'Kiko Nieves',
    cr6cd_dix_assignee: 'Daniela Ramirez',
    cr6cd_dix_forfeit: false,
    _cr6cd_dix_cancagent_value: 'a1b2c3d4-0003-0003-0003-000000000003',
    terminal: '1716',
    driverName: 'Charles Seabrough',
    driverCode: 'CHASEASWGA',
    createdon: '2026-04-22T17:14:27Z',
  },
  {
    cr6cd_dix_cancellationid: 'cx-0004',
    cr6cd_dix_name: '799',
    cr6cd_dix_canceltype: 100000003,
    cr6cd_dix_status: 100000003,
    cr6cd_dix_cancelreason: 100000004,
    cr6cd_dix_reasondetails: 'Driver quit and no replacement available.',
    cr6cd_dix_requestdate: '2026-04-03',
    cr6cd_dix_canceldate: '2026-04-03',
    cr6cd_dix_duedate: '2026-04-10',
    cr6cd_dix_allitemsrcvddate: '2026-04-15',
    cr6cd_dix_lastitemreceived: '2026-04-15',
    cr6cd_dix_startdate: '2026-03-16',
    cr6cd_dix_unitnumber: '799',
    cr6cd_dix_vendorcode: 'ROWEAGA',
    cr6cd_dix_drivercode: 'LORBOLWAGA',
    cr6cd_dix_drivername: 'Lorenzo Bolden',
    cr6cd_dix_driverphone: '478-538-3024',
    cr6cd_dix_rltrackingnumber: '870305414716',
    cr6cd_dix_submittedby: 'Daniela Ramirez',
    cr6cd_dix_assignee: 'Alberto Florez',
    cr6cd_dix_forfeit: false,
    cr6cd_dix_elddeposit: 100,
    cr6cd_dix_dashcamdeposit: 100,
    _cr6cd_dix_cancagent_value: 'a1b2c3d4-0004-0004-0004-000000000004',
    terminal: '5046',
    unitNumber: '799',
    driverName: 'Lorenzo Bolden',
    driverCode: 'LORBOLWAGA',
    createdon: '2026-04-03T13:31:16Z',
  },
  {
    cr6cd_dix_cancellationid: 'cx-0005',
    cr6cd_dix_name: '658',
    cr6cd_dix_canceltype: 100000003,
    cr6cd_dix_status: 100000008,
    cr6cd_dix_cancelreason: 100000002,
    cr6cd_dix_reasondetails: 'Truck had mechanical issues.',
    cr6cd_dix_requestdate: '2026-04-06',
    cr6cd_dix_canceldate: '2026-04-06',
    cr6cd_dix_duedate: '2026-04-13',
    cr6cd_dix_allitemsrcvddate: '2026-04-12',
    cr6cd_dix_lastitemreceived: '2026-04-12',
    cr6cd_dix_startdate: '2025-05-20',
    cr6cd_dix_unitnumber: '658',
    cr6cd_dix_vendorcode: 'YAEREGA',
    cr6cd_dix_vendorname: 'YA EXPRESS LLC',
    cr6cd_dix_drivercode: 'SOMMAMREGA',
    cr6cd_dix_drivername: 'Somathya Mam',
    cr6cd_dix_driverphone: '678-557-4053',
    cr6cd_dix_submittedby: 'Chris Cordova',
    cr6cd_dix_assignee: 'Alberto Florez',
    cr6cd_dix_forfeit: false,
    cr6cd_dix_elddeposit: 100,
    cr6cd_dix_dashcamdeposit: 100,
    cr6cd_dix_pdideposit: 250,
    _cr6cd_dix_cancagent_value: 'a1b2c3d4-0005-0005-0005-000000000005',
    terminal: '1000',
    unitNumber: '658',
    driverName: 'Somathya Mam',
    driverCode: 'SOMMAMREGA',
    createdon: '2026-04-06T14:43:44Z',
  },
];

export const MOCK_CXL_NOTES: CxlNote[] = [
  {
    cr6cd_dixcxlnoteid: 'note-0001',
    cr6cd_name: 'Note',
    cr6cd_body: 'Driver reached out — confirmed truck box will be shipped Monday.',
    cr6cd_likedby: JSON.stringify([
      { userId: 'u-2', userName: 'Sarah Reisker', likedAt: '2026-04-25T11:00:00Z' },
    ]),
    _cr6cd_notecancellation_value: 'cx-0001',
    createdon: '2026-04-24T18:30:00Z',
    createdByName: 'Daniela Ramirez',
    createdById: 'u-1',
  },
  {
    cr6cd_dixcxlnoteid: 'note-0002',
    cr6cd_name: 'Note',
    cr6cd_body: 'Thanks. Will keep an eye out for the FedEx tracking.',
    _cr6cd_notecancellation_value: 'cx-0001',
    _cr6cd_parentnote_value: 'note-0001',
    createdon: '2026-04-25T10:55:00Z',
    createdByName: 'Sarah Reisker',
    createdById: 'u-2',
  },
];

export const MOCK_CXL_EQUIPMENT: CxlEquipment[] = [
  // Cancellation cx-0001 (Vendor/Driver/Unit) — early stage, all needed
  ...['eld','dashcam','dashcam_cover','door_signs','ifta','license_plate'].map((k, i) => ({
    cr6cd_dixcxlequipmentid: `eq-0001-${i}`,
    cr6cd_name: `${k} - AT806T02`,
    cr6cd_equipmentkey: k,
    cr6cd_displayname: ({
      eld: 'ELD', dashcam: 'DashCam', dashcam_cover: 'DashCam Cover',
      door_signs: 'Door Signs', ifta: 'IFTA', license_plate: 'License Plate',
    } as Record<string, string>)[k],
    cr6cd_lifecyclestate: 100000000,
    _cr6cd_equipmentcancellation_value: 'cx-0001',
  })),
  // Cancellation cx-0004 (Vendor/Driver/Unit) — completed
  ...['eld','dashcam','dashcam_cover','door_signs','ifta'].map((k, i) => ({
    cr6cd_dixcxlequipmentid: `eq-0004-${i}`,
    cr6cd_name: `${k} - 799`,
    cr6cd_equipmentkey: k,
    cr6cd_displayname: ({
      eld: 'ELD', dashcam: 'DashCam', dashcam_cover: 'DashCam Cover',
      door_signs: 'Door Signs', ifta: 'IFTA',
    } as Record<string, string>)[k],
    cr6cd_lifecyclestate: 100000001,
    cr6cd_returneddate: '2026-04-15',
    _cr6cd_equipmentcancellation_value: 'cx-0004',
  })),
  // Cancellation cx-0005 (Released) — all returned, status flagged Released
  ...['eld','dashcam','dashcam_cover','door_signs','ifta','license_plate'].map((k, i) => ({
    cr6cd_dixcxlequipmentid: `eq-0005-${i}`,
    cr6cd_name: `${k} - 658`,
    cr6cd_equipmentkey: k,
    cr6cd_displayname: ({
      eld: 'ELD', dashcam: 'DashCam', dashcam_cover: 'DashCam Cover',
      door_signs: 'Door Signs', ifta: 'IFTA', license_plate: 'License Plate',
    } as Record<string, string>)[k],
    cr6cd_lifecyclestate: 100000001,
    cr6cd_returneddate: '2026-04-12',
    _cr6cd_equipmentcancellation_value: 'cx-0005',
  })),
];

export const ACTION_TYPE_LABELS: Record<number, string> = {
  100000000: 'Add',
  100000001: 'Move',
  100000002: 'Contract End',
  100000003: 'Medical',
};

export const CONTRACT_TYPE_LABELS: Record<number, string> = {
  1: 'Owner Operator',
  2: 'Driver Only',
  3: 'Driver for IBE',
  4: 'Driver & Unit',
  5: 'Truck Only',
  6: 'Rental Only',
  7: 'Trailer Only',
};

export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
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
