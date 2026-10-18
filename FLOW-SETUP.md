# Public registration form — Power Automate flow setup

This lets **anyone** (patients via QR code, GlobeMed staff) submit the form **without signing in**.
The web page sends each registration to a Power Automate flow; the flow checks it and saves it to SharePoint.
The IT dashboard still requires Microsoft sign-in.

```
Patient phone ──(QR)──> Portal form ──POST──> Power Automate flow ──> SharePoint list + CardPhotos library
                                                                 └──> confirmation email
```

## 0. Licence check

The trigger **"When an HTTP request is received"** is a **Premium** connector.
The account that owns the flow needs **Power Automate Premium** (or Power Automate per user).
Check: Microsoft 365 admin center → **Billing → Licenses**. A free trial can be started from Power Automate to test.

Use a service account (for example `alnukhba.flow@…`) as the flow owner, with **Contribute** on the list and the CardPhotos library, so the flow does not depend on one person.

## 1. Create the flow

Power Automate → **Create → Instant cloud flow → Skip** → add trigger **Request → When an HTTP request is received**.

- **Who can trigger the flow:** Anyone
- **Method:** POST
- Leave the schema empty (the page sends the data as plain text; step 2 reads it).

## 2. Parse JSON

Action **Data Operation → Parse JSON**
- **Content:** expression `triggerBody()`
- **Schema:**

```json
{
  "type": "object",
  "properties": {
    "reference": {"type": "string"},
    "firstName": {"type": "string"},
    "middleInitial": {"type": "string"},
    "lastName": {"type": "string"},
    "civilId": {"type": "string"},
    "cardNumber": {"type": "string"},
    "mobile": {"type": "string"},
    "company": {"type": "string"},
    "visited": {"type": "string"},
    "email": {"type": "string"},
    "expiry": {"type": "string"},
    "consent": {"type": "boolean"},
    "hp": {"type": "string"},
    "source": {"type": "string"},
    "photoName": {"type": "string"},
    "photoType": {"type": "string"},
    "photoBase64": {"type": "string"}
  },
  "required": ["reference", "firstName", "lastName", "civilId", "cardNumber", "mobile", "email", "expiry", "consent"]
}
```

## 3. Basic checks (stop spam)

Action **Condition** — all must be true:
- `hp` **is equal to** *(empty)*  (hidden field; bots fill it)
- `consent` **is equal to** `true`
- expression `length(body('Parse_JSON')?['civilId'])` **is equal to** `12`
- expression `length(body('Parse_JSON')?['cardNumber'])` **is equal to** `15`  (G + 14 digits)

**If no:** action **Response** — Status `400`, Headers `Access-Control-Allow-Origin` = `*`, Body `{"ok":false,"message":"Invalid submission."}` → then **Terminate** (Cancelled).

## 4. Duplicate check (inside "If yes")

Action **SharePoint → Get items** — Site `AlNukhba`, List `AlNukhba Registrations`
- **Filter Query:** `CivilID eq '@{body('Parse_JSON')?['civilId']}' or CardNumber eq '@{body('Parse_JSON')?['cardNumber']}'`
- **Top Count:** 1

**Condition:** expression `length(body('Get_items')?['value'])` **is greater than** `0`
- **If yes:** **Response** — Status `409`, Header `Access-Control-Allow-Origin` = `*`, Body `{"ok":false,"duplicate":true}` → **Terminate**.

## 5. Save the card photo (in "If no")

Action **SharePoint → Create file**
- Site `AlNukhba`, Folder path `/CardPhotos`
- File name: `photoName`
- File content: expression `base64ToBinary(body('Parse_JSON')?['photoBase64'])`

## 6. Create the registration

Action **SharePoint → Create item** — List `AlNukhba Registrations`

| Column | Value |
|---|---|
| Title | `reference` |
| CivilID | `civilId` |
| CardNumber | `cardNumber` |
| FirstName / MiddleInitial / LastName | the matching fields |
| Mobile / Company / Email | the matching fields |
| PreviouslyVisited | `visited` |
| CardExpiry | `expiry` |
| Status | `New` |
| SubmittedBy | `source` |
| CardPhoto | expression `concat('https://kwh.sharepoint.com/sites/AlNukhba/CardPhotos/', body('Parse_JSON')?['photoName'])` |

## 7. Confirmation email (optional, recommended)

**Office 365 Outlook → Send an email from a shared mailbox (V2)**
- To: `email` · Subject: `Al-Nukhba Card registration received – @{body('Parse_JSON')?['reference']}`
- Body: *Dear @{firstName}, your Al-Nukhba Card registration (reference @{reference}) has been received. Your digital card will be emailed after your details are verified. — Kuwait Hospital*

## 8. Reply to the page

**Response** — Status `200`, Header `Access-Control-Allow-Origin` = `*`, Body `{"ok":true,"photoOk":true}`

Add one more **Response** after step 6 with **Configure run after → has failed**: Status `500`, same header, Body `{"ok":false,"message":"The registration could not be saved. Please try again later."}`.

## 9. Switch the portal on

**Save** the flow, open the trigger and copy the **HTTP POST URL**. In `config.js`:

```js
publicForm: true,
submitUrl: "<paste the HTTP POST URL here>",
```

Commit on GitHub, wait ~10 minutes, open the site: the form opens directly, without sign-in.
IT signs in through the link under the form ("Kuwait Hospital IT? Sign in to the dashboard") or `…/#start`.

## Notes

- **The flow URL is visible in the page source.** Anyone could post to it; steps 3–4 reject bad and duplicate data, and IT verifies every record (with the card photo) before Apex.
- To stop accepting registrations, turn the flow **Off**, or set `publicForm: false`.
- Flow run history (Power Automate → the flow → 28-day run history) shows every submission and any failures.
