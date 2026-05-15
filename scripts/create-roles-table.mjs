#!/usr/bin/env node
// DIX App — Settings/Role table provisioner (Node port of create-roles-table.ps1)
// Run from the repo root: node scripts/create-roles-table.mjs

const TENANT_ID = process.env.TENANT_ID || '1ab993e6-5837-45e4-a231-6466807ddb34';
const CLIENT_ID = process.env.CLIENT_ID || '51f81489-12ee-4a9e-aaae-a2591f45987d'; // Microsoft Azure CLI (public client)
const ORG_URL   = process.env.ORG_URL   || 'https://org71748d11.crm.dynamics.com';
const PREFIX    = process.env.PREFIX    || 'cr6cd';
const SOLUTION  = process.env.SOLUTION_NAME || 'DIXApp';

const TABLE_LOGICAL = `${PREFIX}_scprole`;
const TABLE_SCHEMA  = `${PREFIX}_SCPRole`;
const TABLE_SET     = `${PREFIX}_scproles`;

function bail(msg, e) {
  console.error('ERROR:', msg);
  if (e) console.error(e.body || e.message || e);
  process.exit(1);
}

async function form(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { ok: res.ok, status: res.status, json };
}

async function dvPost(url, token, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
      Accept: 'application/json',
      'OData-Version': '4.0',
      'OData-MaxVersion': '4.0',
      'MSCRM.SolutionName': SOLUTION,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.body = text;
    err.status = res.status;
    throw err;
  }
  return text ? JSON.parse(text) : null;
}

async function getDeviceCodeToken() {
  console.log('Requesting device code…');
  const dc = await form(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/devicecode`, {
    client_id: CLIENT_ID,
    scope: `${ORG_URL}/.default offline_access`,
  });
  if (!dc.ok) bail('Failed to start device code flow', dc.json);

  console.log('');
  console.log('========================================================');
  console.log(`  Open: ${dc.json.verification_uri}`);
  console.log(`  Code: ${dc.json.user_code}`);
  console.log('========================================================');
  console.log('');

  const expiresAt = Date.now() + dc.json.expires_in * 1000;
  const interval = (dc.json.interval || 5) * 1000;
  while (Date.now() < expiresAt) {
    await new Promise((r) => setTimeout(r, interval));
    const tk = await form(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
      client_id: CLIENT_ID,
      device_code: dc.json.device_code,
    });
    if (tk.ok && tk.json.access_token) return tk.json.access_token;
    const err = tk.json.error;
    if (err === 'authorization_pending' || err === 'slow_down') continue;
    if (err) bail('Auth failed', tk.json);
  }
  bail('Device code timed out.');
}

async function createTable(token) {
  console.log(`Creating table ${TABLE_LOGICAL} in solution "${SOLUTION}"…`);
  try {
    await dvPost(`${ORG_URL}/api/data/v9.2/EntityDefinitions`, token, {
      '@odata.type': 'Microsoft.Dynamics.CRM.EntityMetadata',
      SchemaName: TABLE_SCHEMA,
      LogicalName: TABLE_LOGICAL,
      EntitySetName: TABLE_SET,
      DisplayName:           { LocalizedLabels: [{ Label: 'SCP Role',  LanguageCode: 1033 }] },
      DisplayCollectionName: { LocalizedLabels: [{ Label: 'SCP Roles', LanguageCode: 1033 }] },
      Description:           { LocalizedLabels: [{ Label: 'Per-user screen access role', LanguageCode: 1033 }] },
      OwnershipType: 'UserOwned',
      HasActivities: false, HasNotes: false, IsActivity: false,
      Attributes: [
        {
          '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata',
          SchemaName: `${PREFIX}_Label`,
          LogicalName: `${PREFIX}_label`,
          DisplayName: { LocalizedLabels: [{ Label: 'Label', LanguageCode: 1033 }] },
          RequiredLevel: { Value: 'ApplicationRequired' },
          MaxLength: 200,
          IsPrimaryName: true,
        },
      ],
    });
    console.log('  ✓ table created');
  } catch (e) {
    if (String(e.body || '').includes('already exists') || e.status === 409) {
      console.log('  ✓ table already exists, continuing');
    } else {
      throw e;
    }
  }
}

async function createColumns(token) {
  const cols = [
    {
      '@odata.type': 'Microsoft.Dynamics.CRM.BooleanAttributeMetadata',
      SchemaName: `${PREFIX}_IsAdmin`,
      LogicalName: `${PREFIX}_isadmin`,
      DisplayName: { LocalizedLabels: [{ Label: 'Is Admin', LanguageCode: 1033 }] },
      RequiredLevel: { Value: 'None' },
      DefaultValue: false,
      OptionSet: {
        TrueOption:  { Value: 1, Label: { LocalizedLabels: [{ Label: 'Yes', LanguageCode: 1033 }] } },
        FalseOption: { Value: 0, Label: { LocalizedLabels: [{ Label: 'No',  LanguageCode: 1033 }] } },
      },
    },
    {
      '@odata.type': 'Microsoft.Dynamics.CRM.StringAttributeMetadata',
      SchemaName: `${PREFIX}_AllowedScreens`,
      LogicalName: `${PREFIX}_allowedscreens`,
      DisplayName: { LocalizedLabels: [{ Label: 'Allowed Screens', LanguageCode: 1033 }] },
      RequiredLevel: { Value: 'None' },
      MaxLength: 2000,
      Description: { LocalizedLabels: [{ Label: 'CSV of screen ids', LanguageCode: 1033 }] },
    },
  ];
  for (const c of cols) {
    try {
      await dvPost(
        `${ORG_URL}/api/data/v9.2/EntityDefinitions(LogicalName='${TABLE_LOGICAL}')/Attributes`,
        token, c,
      );
      console.log(`  ✓ ${c.LogicalName}`);
    } catch (e) {
      if (String(e.body || '').includes('already exists') || e.status === 409) {
        console.log(`  ✓ ${c.LogicalName} already exists`);
      } else { throw e; }
    }
  }
}

async function createLookup(token) {
  console.log('Creating lookup user → systemuser…');
  try {
    await dvPost(`${ORG_URL}/api/data/v9.2/RelationshipDefinitions`, token, {
      '@odata.type': 'Microsoft.Dynamics.CRM.OneToManyRelationshipMetadata',
      SchemaName: `${PREFIX}_SCPRole_User_SystemUser`,
      ReferencedEntity: 'systemuser',
      ReferencingEntity: TABLE_LOGICAL,
      ReferencedAttribute: 'systemuserid',
      Lookup: {
        '@odata.type': 'Microsoft.Dynamics.CRM.LookupAttributeMetadata',
        SchemaName: `${PREFIX}_User`,
        LogicalName: `${PREFIX}_user`,
        DisplayName: { LocalizedLabels: [{ Label: 'User', LanguageCode: 1033 }] },
        RequiredLevel: { Value: 'ApplicationRequired' },
      },
      AssociatedMenuConfiguration: {
        Behavior: 'UseLabel', Group: 'Details', Order: 10000,
        Label: { LocalizedLabels: [{ Label: 'SCP Roles', LanguageCode: 1033 }] },
      },
      CascadeConfiguration: {
        Assign: 'NoCascade', Delete: 'RemoveLink', Merge: 'NoCascade',
        Reparent: 'NoCascade', Share: 'NoCascade', Unshare: 'NoCascade',
      },
    });
    console.log('  ✓ lookup created');
  } catch (e) {
    if (String(e.body || '').includes('already exists') || e.status === 409) {
      console.log('  ✓ lookup already exists');
    } else { throw e; }
  }
}

(async () => {
  const token = await getDeviceCodeToken();
  await createTable(token);
  await createColumns(token);
  await createLookup(token);
  console.log('\nDone.');
})().catch((e) => bail('Provisioning failed', e));
