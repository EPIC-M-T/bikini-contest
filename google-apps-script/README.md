# EPIC Bikini Contest Model Card Automation

This folder documents the Google Apps Script phase for the approved model card workflow.

## Current Drive account

The connected Google Drive account available during setup was `wsopamatt@gmail.com`, not `book@epicmodelsandtalent.com`.

A starter Google Sheet was created here:

https://docs.google.com/spreadsheets/d/1syQ4uq5rlAoe_fCtq71GpwSHAeO7lpCeV34Rb51vrmE/edit

Tabs included:

- Submissions
- Approved Models
- Votes
- Settings

## Required final setup

To run this under `book@epicmodelsandtalent.com`, open that Google account and either:

1. Create or copy the starter Google Sheet into that Drive.
2. Create an Apps Script project attached to the Sheet.
3. Paste the Code.gs implementation from this folder when added.
4. Deploy as a Web App:
   - Execute as: Me
   - Who has access: Anyone
5. Copy the Web App URL.
6. Paste that URL into the site config inside `og/model-cards.js`:
   - `API_URL`
7. Use the same URL for the submission form endpoint when ready.

## Workflow design

1. User submits the entry form.
2. Apps Script saves the data and image/file URLs to the Submissions tab.
3. Apps Script sends a confirmation email to the applicant.
4. Apps Script sends an admin email to `book@epicmodelsandtalent.com`.
5. Admin email contains Approve and Reject links.
6. Approve link copies the submission into Approved Models.
7. The OG homepage and OG apply page load approved models from Apps Script using JSONP.
8. Visitors can vote for model cards.
9. Votes are recorded in the Votes tab and reflected in the scoreboard.

## Public disclaimer

Visitor voting is for fun and entertainment. Final contestant selection is made by EPIC Models & Talent staff, but fan votes may sway the judges.
