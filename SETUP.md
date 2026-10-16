# Al-Nukhba Card Portal — Setup Guide

This portal runs on **GitHub Pages** (free hosting), signs people in with **Microsoft Entra ID** (your Microsoft 365 accounts), and stores registrations in a **SharePoint list**. No Azure subscription and no servers are needed.

```
GlobeMed staff ─┐                         ┌─> SharePoint list "AlNukhba Registrations"
                ├─> GitHub Pages (portal) ─┤      (only data store; GitHub holds no data)
Kuwait Hosp. IT ┘   Microsoft sign-in      └─> Power Automate: confirmation email
```

**Who sees what is enforced by SharePoint permissions, not by the web page.** GlobeMed guests can add registrations and read only their own. Only the IT group can read and update everything.

Do the steps in this order. You need **Global Administrator** (or Application Administrator + SharePoint Administrator).

---

## Step 0 — Try it first (demo mode)

Open `index.html` from a local web server, or publish to GitHub (Step 3) with `config.js` left empty. The portal runs in **demo mode**: simulated sign-in, sample data, data kept in the browser. A yellow bar at the bottom shows this. Use it to review the screens.

---

## Step 1 — SharePoint site and list

1.1 **Create a site.** SharePoint admin center → Sites → Active sites → **Create** → **Team site**
   - Name: `Al-Nukhba` → address `/sites/AlNukhba`
   - Privacy: **Private**
   - Owners: Kuwait Hospital IT only.

1.2 **Create the list.** In the site → **New → List → Blank list** → name **`AlNukhba Registrations`**.

1.3 **Add columns.** Type each name **exactly as shown, no spaces** (the portal uses these names):

| Column | Type | Settings |
|---|---|---|
| Title *(exists)* | Single line of text | Rename display name to "Reference" if you like; keep internal name `Title` |
| `CivilID` | Single line of text | Required · **Enforce unique values: Yes** |
| `FirstName` | Single line of text | |
| `MiddleInitial` | Single line of text | |
| `LastName` | Single line of text | |
| `CardNumber` | Single line of text | **Enforce unique values: Yes** |
| `Mobile` | Single line of text | |
| `Company` | Single line of text | |
| `PreviouslyVisited` | Single line of text | |
| `Email` | Single line of text | |
| `CardExpiry` | Date and time | Date only |
| `Status` | Choice | Choices: `New`, `Missing data`, `Verified`, `Uploaded to Apex` · Default `New` |
| `Notes` | Multiple lines of text | Plain text |
| `SubmittedBy` | Single line of text | |

   > Create the column with the no-space name first; you can change the *display* name afterwards. "Enforce unique values" makes SharePoint itself reject a second registration with the same Civil ID or card number.

1.4 **Item-level privacy.** List → ⚙ **List settings → Advanced settings**:
   - Read access: **Read items that were created by the user**
   - Create and Edit access: **Create items and edit items that were created by the user**

1.5 **Versioning.** List settings → **Versioning settings** → Create a version each time you edit an item: **Yes**. (Keeps a history of every change, including who changed Status.)

1.6 **Permissions.** List settings → **Permissions for this list** → Stop inheriting permissions:
   - **IT security group** (e.g. `SG-AlNukhba-IT`): **Full Control** (Full Control/Design lets IT see all items despite 1.4).
   - **GlobeMed guests** (or a group `SG-AlNukhba-GlobeMed`): **Contribute**.
   - Remove other groups you don't need (e.g. site Members/Visitors).

1.7 **Get the IDs** (recommended). Open **Graph Explorer** (https://developer.microsoft.com/graph/graph-explorer), sign in as admin, and run:
   - `GET https://graph.microsoft.com/v1.0/sites/kuwaithospital.sharepoint.com:/sites/AlNukhba` → copy `id` → this is **siteId**
   - `GET https://graph.microsoft.com/v1.0/sites/{siteId}/lists?$select=id,displayName` → copy the `id` of "AlNukhba Registrations" → this is **listId**

   (Replace `kuwaithospital.sharepoint.com` with your real SharePoint host name.)

---

## Step 2 — App registration (Microsoft sign-in)

2.1 Entra admin center → **Applications → App registrations → New registration**
   - Name: `Al-Nukhba Portal`
   - Supported account types: **Accounts in this organizational directory only (single tenant)**
   - Redirect URI: platform **Single-page application (SPA)** → your GitHub Pages address from Step 3, **with the trailing slash**, e.g. `https://kuwaithospital.github.io/alnukhba-portal/`
     (You can add or change it later under **Authentication**.)

2.2 Copy from the **Overview** page:
   - **Application (client) ID** → `clientId`
   - **Directory (tenant) ID** → `tenantId`

2.3 **API permissions → Add a permission → Microsoft Graph → Delegated**:
   - `User.Read`
   - `Sites.ReadWrite.All`

   Then click **Grant admin consent for Kuwait Hospital**.
   *Delegated* means the portal acts as the signed-in person and can never do more than that person's own SharePoint permissions allow.

2.4 **App roles → Create app role** (twice):

| Display name | Allowed member types | Value |
|---|---|---|
| GlobeMed Staff | Users/Groups | `Portal.GlobeMed` |
| Kuwait Hospital IT | Users/Groups | `Portal.IT` |

2.5 **Enterprise applications → Al-Nukhba Portal**:
   - **Properties → Assignment required? → Yes** → Save. (Only assigned people can sign in.)
   - **Users and groups → Add user/group** → assign each person (or group) the right role.
     *Assigning groups to roles needs Entra ID P1/P2; without it, assign people individually.*

---

## Step 3 — Publish on GitHub Pages

3.1 Create a GitHub account or organization for the hospital (e.g. `kuwaithospital`) and a **new repository** `alnukhba-portal`.
   - **Public** is fine on the free plan: the repository contains only the web page code and these IDs, which are not secrets. **No patient data is ever stored on GitHub.**

3.2 **Add file → Upload files** → drag in **everything** from this folder (`index.html`, `config.js`, `SETUP.md`, `.nojekyll`, `assets/`, `vendor/`) → **Commit changes**.
   - `.nojekyll` is a hidden file; if your computer hides it, create it on GitHub: **Add file → Create new file** → name `.nojekyll` → commit (empty).

3.3 Repository **Settings → Pages** → Source: **Deploy from a branch** → Branch **main**, folder **/ (root)** → **Save**.
   After ~1 minute the address appears, e.g. `https://kuwaithospital.github.io/alnukhba-portal/`.

3.4 **Custom address (optional, looks more official)**: Settings → Pages → Custom domain → e.g. `nukhba.kuwaithospital.com.kw`, then create a **CNAME** DNS record pointing to `kuwaithospital.github.io`. Tick **Enforce HTTPS**. If you do this, use the custom address in Steps 2.1 and 4.

---

## Step 4 — Fill in `config.js`

Edit `config.js` on GitHub (pencil icon) and fill in:

```js
tenantId:    "<Directory (tenant) ID>",
clientId:    "<Application (client) ID>",
redirectUri: "https://kuwaithospital.github.io/alnukhba-portal/",
siteId:      "<siteId from 1.7>",
listId:      "<listId from 1.7>",
supportText: "Need help? Contact Kuwait Hospital IT.",
```

Commit. The yellow demo bar disappears and the portal now uses Microsoft sign-in and SharePoint.

---

## Step 5 — Invite GlobeMed staff (guests)

5.1 Check guest access is allowed:
   - Entra admin center → **External Identities → External collaboration settings** (guest invite settings).
   - SharePoint admin center → **Policies → Sharing** and the **Al-Nukhba site's** sharing setting: at least **Existing guests** (or **New and existing guests**).

5.2 Entra admin center → **Users → New user → Invite external user** → each GlobeMed staff member's work email. They accept the email invitation once.

5.3 For each guest: add to the GlobeMed group from 1.6 (or give Contribute on the list), and assign the **GlobeMed Staff** role in 2.5.

GlobeMed staff then open the portal → **GlobeMed Staff** → sign in with their **GlobeMed work email**.

---

## Step 6 — Confirmation email (workflow step 2)

Power Automate → **Create → Automated cloud flow** → trigger **SharePoint – When an item is created** (site Al-Nukhba, list AlNukhba Registrations) → action **Office 365 Outlook – Send an email (V2)**:
- To: `Email` (dynamic content)
- Subject: `Al-Nukhba Card registration received – @{Title}`
- Body: *Dear @{FirstName}, your Al-Nukhba Card registration (reference @{Title}) has been received. Your digital card will be emailed within 2–3 business days after your details are verified. — Kuwait Hospital*

Send from a shared mailbox if you prefer (action: *Send an email from a shared mailbox (V2)*).

---

## Step 7 — Test before announcing

1. IT account → **Kuwait Hospital IT** → dashboard opens, list is empty.
2. Guest test account → **GlobeMed Staff** → submit a test registration → success screen + confirmation email.
3. Submit the same Civil ID again → "already registered".
4. Guest account → try `…/#it` → "No access to this area".
5. IT → the test appears → change Status to *Verified* → **Download all (.xlsx)**.
6. Delete the test item in SharePoint.

---

## Notes for IT

- **Daily work** happens in the portal's IT dashboard, but the SharePoint list is the real record: IT can also open it directly, filter it, or **Export to Excel** from SharePoint.
- **Removing access**: remove the person's role assignment (Enterprise app) and list permission; for guests, delete the guest user.
- **Known limitation**: a GlobeMed guest can technically edit fields of an item *they created* (SharePoint "edit own items"), including Status, using tools outside the portal. Version history (Step 1.5) shows who changed what; IT verifies every record before upload to Apex.
- **Updating the portal**: edit files on GitHub and commit; GitHub Pages republishes automatically within a minute or two.
- **Libraries**: `vendor/msal-browser.min.js` (Microsoft Authentication Library v4.30.0) and `vendor/xlsx.full.min.js` (SheetJS 0.18.5) are included so the portal does not depend on outside script sites.
- **Data location / privacy**: Civil IDs and card numbers are stored only in your Microsoft 365 tenant (SharePoint). Confirm with your compliance team that this meets hospital policy.
