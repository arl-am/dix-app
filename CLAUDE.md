# DIX — Driver Integration App

## What This App Does
DIX is an enterprise fleet management system for ARL Network. It handles
driver onboarding (6-step wizard), cancellations, document generation,
deduction tracking, terminal moves, and searchable records across 50+
terminals. All connected to Dataverse.

## Environment
- Platform: Power Apps Code App (React + TypeScript + Vite)
- Dataverse Org: https://org71748d11.crm.dynamics.com/
- Environment ID: 1196a916-9d8e-e019-9091-81689db18808
- Solution: DIXApp (Publisher: AndersonMarquez, Prefix: amarquez / cr6cd_)
- Deployment: npx power-apps push

## Tech Stack
- React 19 + TypeScript (Vite)
- Tailwind CSS
- shadcn/ui components
- lucide-react icons
- react-router-dom (BrowserRouter)
- @tanstack/react-query
- sonner (toast notifications)
- date-fns
- @microsoft/power-apps (Dataverse SDK — REQUIRED for production)

## Pages & Routes
| Page             | Route          | File                          |
|------------------|----------------|-------------------------------|
| Dashboard        | /              | src/pages/Dashboard.tsx       |
| Search Records   | /drivers       | src/pages/SearchRecords.tsx   |
| New Entry        | /new-driver    | src/pages/NewEntry.tsx        |
| New Cancellation | /cancellations | src/pages/NewCancellation.tsx |
| Quick Forms      | /documents     | src/pages/QuickForms.tsx      |
| Settings         | /settings      | src/pages/Settings.tsx        |

## Design System

### Fonts (CRITICAL)
Power Apps CSP blocks external fonts AND base64-inlined fonts.
Use ONLY this system font stack everywhere:
```
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  "Helvetica Neue", Arial, sans-serif;
```
Do NOT import Google Fonts. Do NOT use @font-face with external URLs.

### Colors
- Primary blue: #2563EB, hover: #1D4ED8
- Green (success/add/completed step): #10B981
- Amber (warning): #F59E0B
- Purple (contract end): #8B5CF6
- Blue stat/badge: #3B82F6
- Sidebar bg: #1E293B

### Layout
- Sidebar: fixed left, 240px wide, bg-[#1E293B]
- Sidebar logo: https://i.imgur.com/MfhzQvl.png, height 48px
- Sidebar collapse toggle: small circle button at -right-3 top-20
- Active nav: bg-primary text-white + white 4px left border pill
- Inactive nav: text-white/70 hover:text-white hover:bg-white/5
- Header: sticky top, h-12, bg-background border-b shadow-sm
- Header logo centered: https://i.imgur.com/TryYXEw.png, h-7
- Header right: dark mode toggle (moon icon) + blue avatar bg-[#3B82F6]
  "AM" + "Anderson Marquez"
- Main content: p-6, scrollable

### Cards
- rounded-xl shadow-sm border border-border bg-card
- Stat cards: 4px colored left accent strip
  (absolute left-0 top-0 bottom-0 w-1)
- hover:shadow-md transition-shadow

### Tables
- Header: bg-muted/50 backdrop-blur-sm sticky top-0
- Alternating rows: white / #F8FAFC
- Row hover: hover:bg-[#EFF6FF]
- Sortable columns with ChevronUp/Down icons

### Badges
- Add: bg-[#10B981] text-white border-transparent
- Equipment Return: bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/20
- Contract End: bg-[#8B5CF6]/10 text-[#8B5CF6] border-[#8B5CF6]/20
- Medical: bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20

## Coding Rules
- Tailwind classes throughout (no inline styles)
- shadcn/ui for Card, Badge, Table, Input, Select, Button, Switch
- lucide-react for all icons
- react-router-dom Link (not raw <a> tags)
- No JSX comments
- Dark mode via dark: variants
- sonner for toast notifications
- @tanstack/react-query for all data fetching
- System font stack only (see Fonts section above)

## Dataverse API Integration (CRITICAL)

### Production (Power Apps)
Code Apps run on powerplatformusercontent.com, NOT on the org domain.
Direct fetch() to Dataverse is BLOCKED by CSP (connect-src).

You MUST use the @microsoft/power-apps SDK:
```typescript
import { getClient } from '@microsoft/power-apps/data';
const client = getClient();
// client.retrieveMultipleRecordsAsync(table, options)
// client.retrieveRecordAsync(table, id)
// client.createRecordAsync(table, body)
// client.updateRecordAsync(table, id, body)
// client.deleteRecordAsync(table, id)
```

The SDK does NOT support $expand. To resolve lookups:
- Select GUID fields (_cr6cd_dix_agent_value, etc.)
- Use formatted values or do separate retrieveRecordAsync calls

### Localhost (Development)
Use mock data for localhost development:
```typescript
const isLocal = window.location.hostname === 'localhost';
```
When isLocal is true, return hardcoded mock data.
When isLocal is false, use the @microsoft/power-apps SDK.

### Data Hook Pattern
All hooks go in src/hooks/. Wrap all calls in @tanstack/react-query.
Handle loading, error, and empty states on every query.

```typescript
// Example pattern for src/hooks/useDrivers.ts
import { useQuery } from '@tanstack/react-query';

const isLocal = window.location.hostname === 'localhost';

async function fetchDrivers() {
  if (isLocal) {
    return MOCK_DRIVERS; // hardcoded mock data
  }
  const { getClient } = await import('@microsoft/power-apps/data');
  const client = getClient();
  const result = await client.retrieveMultipleRecordsAsync(
    'cr6cd_dix_driver',
    '?$select=cr6cd_name,cr6cd_dix_drivercode,cr6cd_dix_email&$orderby=createdon desc'
  );
  return result.entities;
}

export function useDrivers() {
  return useQuery({ queryKey: ['drivers'], queryFn: fetchDrivers });
}
```

## Dataverse Tables

### EXISTING TABLE (do not create — read only)
| Table             | API Collection    | Purpose                                |
|-------------------|-------------------|----------------------------------------|
| cr6cd_agents      | cr6cd_agentses    | Terminal config with deduction values   |

### NEW DIX TABLES
| Table                   | API Collection              | Purpose                          |
|-------------------------|-----------------------------|----------------------------------|
| cr6cd_dix_driver        | cr6cd_dix_drivers           | Main driver onboarding record    |
| cr6cd_dix_driverdeduction | cr6cd_dix_driverdeductions | Driver deduction selections      |
| cr6cd_dix_cancellation  | cr6cd_dix_cancellations     | Cancellation records             |
| cr6cd_dix_deduction     | cr6cd_dix_deductions        | Standalone ad-hoc deductions     |
| cr6cd_dix_terminalmove  | cr6cd_dix_terminalmoves     | Terminal move records            |
| cr6cd_dix_vendor        | cr6cd_dix_vendors           | Vendor / owner-operator info     |
| cr6cd_dix_unit          | cr6cd_dix_units             | Truck / unit data                |
| cr6cd_dix_appsetting    | cr6cd_dix_appsettings       | App configuration                |

## cr6cd_dix_driver — Main Driver Record
Lookups: cr6cd_dix_agent → cr6cd_agents, cr6cd_dix_vendor → cr6cd_dix_vendor, cr6cd_dix_unit → cr6cd_dix_unit

Fields:
- cr6cd_name (driver name), cr6cd_dix_drivercode, cr6cd_dix_contracttype (Choice),
  cr6cd_dix_actiontype (Choice), cr6cd_dix_createdbyname, cr6cd_dix_email,
  cr6cd_dix_phonenumber, cr6cd_dix_ssn
- cr6cd_dix_licensenumber, cr6cd_dix_licensestate, cr6cd_dix_licenseexpdate
- cr6cd_dix_streetaddress, cr6cd_dix_city, cr6cd_dix_state, cr6cd_dix_zipcode
- cr6cd_dix_onboardingdate, cr6cd_dix_isactive, cr6cd_dix_fuelcardnumber
- cr6cd_dix_elprequired, cr6cd_dix_hazmat, cr6cd_dix_homelandsecurity,
  cr6cd_dix_reactivateequipment, cr6cd_dix_transferequipment, cr6cd_dix_transferoccacc
- cr6cd_dix_pdimonthly (Currency), cr6cd_dix_pdipercentage (Decimal)

Choice values:
- contracttype: 1=Owner Operator, 2=Company Driver, 3=Lease
- actiontype: 1=Add, 2=Equipment Return, 3=Contract End, 4=Medical

## cr6cd_agents — Terminal Config (EXISTING TABLE)
This table has 50+ rows, one per terminal. Each row contains that
terminal's deduction rates, company info, and contact emails.

Key fields used by DIX:
- cr6cd_terminal (terminal code/number), cr6cd_title (display name)
- cr6cd_division, cr6cd_divisionformal, cr6cd_company
- cr6cd_motorcarrier, cr6cd_motorcarriercode, cr6cd_scac

Deduction value fields (per terminal):
- cr6cd_occaccmonthly, cr6cd_occaccbiweekly
- cr6cd_bobtailvalue
- cr6cd_securitydepositweeklyvalue, cr6cd_securitydepositfullvalue
- cr6cd_elddepositvalue, cr6cd_elddepositfullvalue
- cr6cd_elddatafeerequired, cr6cd_elddatafeevalue
- cr6cd_dashcamdepositvalue
- cr6cd_buydownvalue
- cr6cd_iftavalue
- cr6cd_platedepositvalue, cr6cd_platedepositfullvalue
- cr6cd_plateweeklyvalue, cr6cd_plateadminfee, cr6cd_platemandatory
- cr6cd_prepassbypass
- cr6cd_prepasstollsbypass, cr6cd_prepassrequiredifarlplate
- cr6cd_rfidvalue, cr6cd_rfidmandatory
- cr6cd_trailerusagevalue, cr6cd_trailerusagerequired, cr6cd_trailerusageadminfee
- cr6cd_hazmatrequired, cr6cd_workerscomprequired

Contact fields:
- cr6cd_complianceagentemails, cr6cd_compliancecsr
- cr6cd_logsagentemails, cr6cd_logscsr
- cr6cd_addmoveagentemail, cr6cd_safetyfieldcsr

Inventory return:
- cr6cd_inventoryreturnaddress, cr6cd_inventoryreturncompany, cr6cd_inventoryterminal
- cr6cd_noninventoryreturnaddress, cr6cd_noninventoryreturncompany

## DEDUCTIONS — How They Work (CRITICAL)

### Overview
Deduction VALUES are stored in cr6cd_agents (one row per terminal).
Deduction SELECTIONS (yes/no) are stored in cr6cd_dix_driverdeduction.
The app always fetches live values from agents — never stores dollar amounts
on the driver record.

### Flow
1. User selects a terminal in Step 1 (Setup) of the New Entry wizard
2. App fetches the cr6cd_agents record for that terminal
3. Step 5 (Deductions) displays all deduction toggles with values from agents
4. User toggles on/off, enters custom values for Maintenance Fund and IFTA number
5. On save: one row per deduction written to cr6cd_dix_driverdeduction
6. When viewing a driver record later: query driverdeduction for selections,
   query agents for current values, combine in the UI

### cr6cd_dix_driverdeduction Fields
- cr6cd_dix_deductionkey (Text, required) — identifies the deduction type
- cr6cd_dix_selected (Yes/No) — did the driver opt in
- cr6cd_dix_customvalue (Currency, nullable) — only for Maintenance Fund
- cr6cd_dix_iftanumber (Text, nullable) — only for IFTA
- Lookup: cr6cd_dix_deductiondriver → cr6cd_dix_driver

### Deduction Keys and Agent Field Mapping
| Deduction Key          | Display Name              | Agent Value Field              | Category    |
|------------------------|---------------------------|--------------------------------|-------------|
| occacc                 | Occ/Acc Insurance         | cr6cd_occaccmonthly            | Monthly     |
| bobtail                | Bobtail Insurance         | cr6cd_bobtailvalue             | Monthly     |
| pdi                    | Physical Damage Ins (PDI) | (calculated from agent data)   | Monthly     |
| security_deposit       | Security Deposit          | cr6cd_securitydepositweeklyvalue | Weekly    |
| eld_deposit            | ELD Deposit               | cr6cd_elddepositvalue          | Weekly      |
| dashcam_deposit        | DashCam Deposit           | cr6cd_dashcamdepositvalue      | Weekly      |
| buydown                | Buy-Down Program          | cr6cd_buydownvalue             | Weekly      |
| ifta                   | IFTA                      | cr6cd_iftavalue                | Weekly      |
| irp_plate_prepaid      | IRP Plate: PrePaid        | (no value — toggle only)       | Weekly      |
| irp_plate_settlements  | IRP Plate: Settlements    | cr6cd_plateweeklyvalue         | Weekly      |
| prepass_tolls_bypass    | PrePass: Tolls & Bypass  | cr6cd_prepasstollsbypass       | Weekly      |
| prepass_bypass         | PrePass: Bypass           | cr6cd_prepassbypass            | Weekly      |
| maintenance_fund       | Maintenance Fund          | (user enters custom amount)    | Weekly      |
| chassis_usage          | Chassis Usage             | cr6cd_trailerusagevalue        | Weekly      |
| rfid                   | RFID Tag                  | cr6cd_rfidvalue                | One-Time    |

### Conditional UI Behavior
- IFTA: when toggled ON, show text input below for "IFTA Number"
- Maintenance Fund: when toggled ON, show currency input below for custom amount
- IRP Plate: PrePaid and IRP Plate: Settlements are MUTUALLY EXCLUSIVE
  (enabling one disables the other)
- PrePass: Bypass and PrePass: Tolls & Bypass are MUTUALLY EXCLUSIVE
  (enabling Tolls & Bypass disables Bypass)
- Chassis Usage: disabled when cr6cd_trailerusagerequired = false on the agent

### Auto-Included Items in Cost Summary
When certain deductions are enabled, additional line items appear in the
Cost Summary card on the right side. These are NOT separate toggles — they
are derived from agent fields:
- ELD Deposit ON → also shows "ELD Data Fee" (cr6cd_elddatafeevalue) in weekly
- IRP Plate Settlements ON → also shows "IRP Plate Deposit" (cr6cd_platedepositvalue)
  in weekly AND "IRP Plate Admin Fee" (cr6cd_plateadminfee) in one-time
- Security Deposit → shows "Full value $X" subtitle (cr6cd_securitydepositfullvalue)
- ELD Deposit → shows "Full value $X" subtitle (cr6cd_elddepositfullvalue)
- DashCam Deposit → shows "Full value $100" subtitle
- IRP Plate Deposit → shows "Full value $X" subtitle (cr6cd_platedepositfullvalue)
- PDI → shows in weekly as deposit "Collected in 4 payments" AND in monthly
- Occ/Acc → shows "(Billed bi-weekly at $X)" subtitle (cr6cd_occaccbiweekly)

### Cost Summary Card Structure
The right-side Cost Summary card has 3 sections + a total footer:

1. **Weekly Settlement Deductions** — Security Deposit, ELD Deposit,
   ELD Data Fee, DashCam Deposit, Buy-Down, IFTA, IRP Plate Usage,
   IRP Plate Deposit, PrePass Tolls & Bypass, PDI Deposit (weekly portion),
   Maintenance Fund
2. **Monthly Charges** — Occ/Acc Insurance, Bobtail Insurance, PDI (monthly)
3. **One-Time Charges** — IRP Plate Admin Fee, RFID Tag

Footer shows:
- Estimated Monthly Total (weekly × 4 + monthly + one-time)
- Weekly settlements: $X/week
- After deposits end: $X/month
- One-time charges: $X (charged once at start)

## New Entry Wizard — 6 Steps
The New Entry page is a multi-step wizard inside a single card.
Steps are shown as a horizontal progress bar with numbered circles.
Completed steps show green checkmarks. Current step is blue and scaled up.

| Step | Name                      | What It Does                                    |
|------|---------------------------|-------------------------------------------------|
| 1    | Setup                     | Select terminal (agent), action type, contract  |
| 2    | Record Details            | Driver info, license, address                   |
| 3    | Testing & Compliance      | ELP, hazmat, homeland security flags            |
| 4    | Transfers & Reactivation  | Transfer equipment, occ/acc, reactivation flags |
| 5    | Deductions                | Toggle deductions, see live cost summary        |
| 6    | Review & Actions          | Review all data, submit to Dataverse            |

## Other Tables

### cr6cd_dix_cancellation
Lookup: cr6cd_dix_cancdriver → cr6cd_dix_driver
Fields: cr6cd_dix_cancellationreason (Memo), cr6cd_dix_requestdate (Date),
cr6cd_dix_notes (Memo 4000), cr6cd_dix_approved (Bool),
cr6cd_dix_amount (Currency), cr6cd_dix_deductiondate (Date),
cr6cd_dix_reason (String)

### cr6cd_dix_deduction (Standalone)
Lookup: cr6cd_dix_deddriver → cr6cd_dix_driver
Fields: cr6cd_dix_deductiondescription (String), cr6cd_dix_amount (Currency),
cr6cd_dix_deductiondate (Date), cr6cd_dix_reason (String)

### cr6cd_dix_terminalmove
Lookups: cr6cd_dix_movedriver → cr6cd_dix_driver,
cr6cd_dix_originterminal → cr6cd_agents,
cr6cd_dix_destinationterminal → cr6cd_agents
Fields: cr6cd_dix_movedate (Date), cr6cd_dix_movereference (String),
cr6cd_dix_documenturl (String)

### cr6cd_dix_vendor
Fields: cr6cd_dix_vendorcode, cr6cd_dix_businessname, cr6cd_dix_einnumber,
cr6cd_dix_phonenumber, cr6cd_dix_streetaddress, cr6cd_dix_city,
cr6cd_dix_state, cr6cd_dix_zipcode

### cr6cd_dix_unit
Fields: cr6cd_dix_unitnumber, cr6cd_dix_make, cr6cd_dix_model,
cr6cd_dix_year (Int), cr6cd_dix_color, cr6cd_dix_vin,
cr6cd_dix_truckvalue (Currency), cr6cd_dix_unladenweight (Decimal),
cr6cd_dix_purchasedate (Date),
cr6cd_dix_lienholdername (String 200), cr6cd_dix_lienholderaddress (String 500)

### cr6cd_dix_appsetting
Fields: cr6cd_dix_value (String 2000), cr6cd_dix_description (String 500),
cr6cd_dix_isactive (Bool)

## Vite Configuration
In vite.config.ts, base MUST be './':
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  base: './',
})
```

## Postbuild Script (REQUIRED FOR DEPLOYMENT)
Create scripts/postbuild.cjs that rewrites dist/index.html to dynamically
append SAS token query strings to asset URLs. Without this, Power Apps CDN
cannot serve your JS/CSS assets.

The build command in package.json should be:
"build": "tsc -b && vite build && node scripts/postbuild.cjs"

## Reference Files
All Vibe HTML reference files are in the project root (dix-*.html).
Read the corresponding HTML file before building each page.

Main pages:
- dix-dashboard.html
- dix-searchrecords.html
- dix-newentry.html (or individual step files below)
- dix-newcancellation.html
- dix-quickforms.html
- dix-settings.html

New Entry sub-pages (steps inside the wizard):
- dix-newentry-recorddetails.html
- dix-newentry-deductions.html
- dix-newentry-drivertesting.html
- dix-newentry-transfer.html
- dix-newentry-actions.html

## Deployment
```bash
npm run build
npx power-apps push
```
The app will appear in make.powerapps.com → Apps.