const ADMIN_EMAIL = 'book@epicmodelsandtalent.com';
const SHEET_SUBMISSIONS = 'Submissions';
const SHEET_APPROVED = 'Approved Models';
const SHEET_VOTES = 'Votes';

function doGet(e) {
  const action = String(e.parameter.action || 'approvedModels');
  if (action === 'approve') return approveSubmission(e);
  if (action === 'reject') return rejectSubmission(e);
  if (action === 'vote') return vote(e);
  return approvedModels(e);
}

function doPost(e) {
  return submitEntry(e);
}

function output(data, e) {
  const cb = e && e.parameter && e.parameter.callback;
  const text = cb ? cb + '(' + JSON.stringify(data) + ')' : JSON.stringify(data);
  return ContentService.createTextOutput(text).setMimeType(cb ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function sh(name) {
  return SpreadsheetApp.getActive().getSheetByName(name);
}

function headers(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function rowObject(sheet, rowNum) {
  const h = headers(sheet);
  const r = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0];
  const o = {};
  h.forEach((x, i) => o[String(x)] = r[i]);
  return o;
}

function findRow(sheet, header, value) {
  const col = headers(sheet).indexOf(header) + 1;
  if (!col) return -1;
  const values = sheet.getRange(2, col, Math.max(0, sheet.getLastRow() - 1), 1).getValues().flat();
  const idx = values.findIndex(v => String(v) === String(value));
  return idx === -1 ? -1 : idx + 2;
}

function submitEntry(e) {
  const p = e.parameter || {};
  const id = Utilities.getUuid();
  const token = Utilities.getUuid();
  sh(SHEET_SUBMISSIONS).appendRow([id, new Date(), 'Pending Review', token, p.name || '', p.age || '', p.email || '', p.phone || '', p.instagram || '', p.city || '', p.state || '', p.height || '', p.measurements || '', p.naturalHairColor || '', p.naturalEyeColor || '', p.shoeSize || '', p.dressSize || '', p.agency || '', p.portfolio || '', p.headshotUrl || '', p.image2Url || '', p.image3Url || '', p.additionalImageUrls || '', p.compCardUrl || '', p.idUrl || '', p.notes || '', '', '', '', p.sourcePage || '', p.userAgent || '', '', approveUrl(id, token), rejectUrl(id, token), new Date(), true, true]);
  if (p.email) MailApp.sendEmail(p.email, 'EPIC Bikini Contest submission received', 'We received your EPIC Bikini Contest submission. Our team will review your materials and contact selected contestants by email.');
  MailApp.sendEmail(ADMIN_EMAIL, 'New EPIC Bikini Contest submission: ' + (p.name || ''), 'A new entry was submitted. Approve: ' + approveUrl(id, token) + '\nReject: ' + rejectUrl(id, token));
  return output({ ok: true, submissionId: id }, e);
}

function approveUrl(id, token) {
  return ScriptApp.getService().getUrl() + '?action=approve&id=' + encodeURIComponent(id) + '&token=' + encodeURIComponent(token);
}

function rejectUrl(id, token) {
  return ScriptApp.getService().getUrl() + '?action=reject&id=' + encodeURIComponent(id) + '&token=' + encodeURIComponent(token);
}

function approveSubmission(e) {
  const sheet = sh(SHEET_SUBMISSIONS);
  const rowNum = findRow(sheet, 'Submission ID', e.parameter.id);
  if (rowNum < 2) return output({ ok: false, error: 'Submission not found' }, e);
  const r = rowObject(sheet, rowNum);
  if (String(r['Approval Token']) !== String(e.parameter.token)) return output({ ok: false, error: 'Invalid token' }, e);
  const approved = sh(SHEET_APPROVED);
  const number = String(approved.getLastRow()).padStart(2, '0');
  const modelId = Utilities.getUuid();
  approved.appendRow([modelId, number, r.Name, r.Age, r['IG Handle'], r.City, r.State, r.Height, r.Measurements, r['Natural Hair Color'], r['Natural Eye Color'], r['Headshot URL'], r['Image 2 URL'], r['Image 3 URL'], 0, 'Approved', new Date(), r['Submission ID'], approved.getLastRow(), slug(r.Name), '', true, true]);
  sheet.getRange(rowNum, 3).setValue('Approved');
  sheet.getRange(rowNum, 27).setValue(number);
  sheet.getRange(rowNum, 28).setValue(new Date());
  return HtmlService.createHtmlOutput('<h2>Approved</h2><p>The model card is now live in the approved feed.</p>');
}

function rejectSubmission(e) {
  const sheet = sh(SHEET_SUBMISSIONS);
  const rowNum = findRow(sheet, 'Submission ID', e.parameter.id);
  if (rowNum < 2) return output({ ok: false, error: 'Submission not found' }, e);
  const r = rowObject(sheet, rowNum);
  if (String(r['Approval Token']) !== String(e.parameter.token)) return output({ ok: false, error: 'Invalid token' }, e);
  sheet.getRange(rowNum, 3).setValue('Rejected');
  return HtmlService.createHtmlOutput('<h2>Rejected</h2><p>This entry was marked rejected.</p>');
}

function approvedModels(e) {
  const data = sh(SHEET_APPROVED).getDataRange().getValues();
  const h = data.shift();
  const models = data.filter(r => String(r[15]).toLowerCase() === 'approved').map(r => {
    const o = {};
    h.forEach((x, i) => o[String(x)] = r[i]);
    return { id: o['Model ID'], number: o.Number, name: o.Name, age: o.Age, instagram: o['IG Handle'], city: o.City, state: o.State, height: o.Height, measurements: o.Measurements, naturalHairColor: o['Natural Hair Color'], naturalEyeColor: o['Natural Eye Color'], headshotUrl: o['Headshot URL'], image2Url: o['Image 2 URL'], image3Url: o['Image 3 URL'], voteCount: o['Vote Count'] || 0 };
  });
  return output({ ok: true, models: models }, e);
}

function vote(e) {
  const modelId = e.parameter.modelId;
  const approved = sh(SHEET_APPROVED);
  const rowNum = findRow(approved, 'Model ID', modelId);
  if (rowNum < 2) return output({ ok: false, error: 'Model not found' }, e);
  const r = rowObject(approved, rowNum);
  sh(SHEET_VOTES).appendRow([Utilities.getUuid(), new Date(), modelId, r.Number, r.Name, e.parameter.voter || '', e.parameter.source || '', '', '', false]);
  const count = Number(r['Vote Count'] || 0) + 1;
  approved.getRange(rowNum, 15).setValue(count);
  return output({ ok: true, modelId: modelId, voteCount: count }, e);
}

function slug(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
