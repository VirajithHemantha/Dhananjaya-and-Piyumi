1. Open the wedding Google Sheet:
   https://docs.google.com/spreadsheets/d/1LRhD2IS1fR4EFExsZVbLh58Btq-9aj5hoUTSFwsdXsE/edit
2. Extensions > Apps Script. Replace the contents of Code.gs with google-apps-script/code.gs
   (same as code.ts in the project root, minus the first `// @ts-nocheck` line).
3. Save, choose the `setup` function and click Run once. Approve the permissions.
   This creates the "RSVP" and "Wishes" sheets with header rows.
   (They are also created automatically on the first submission.)
4. Deploy > New deployment > type: Web app. Execute as: Me. Who has access: Anyone.
5. Copy the Web App URL (ends with /exec) and set SCRIPT_URL in src/config.ts.
   Current URL:
   https://script.google.com/macros/s/AKfycbzSdtjL2wKztguVXIK8z4ZrZYzQztaTdbRRSoB6c8UUbqwZqKt2DmvFk7Bo2iBLuBJ8BA/exec

Notes:
- If you change the Apps Script later, use Deploy > Manage deployments > Edit > New version
  so the URL stays the same.
- RSVP columns: Timestamp, Full Name, Attendance, Guests, Dietary Notes
- Wishes columns: Timestamp, Guest Name, Message
