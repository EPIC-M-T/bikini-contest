const SPREADSHEET_ID = '1zpRxGl9cBad2m5vJZmIM-gUaYUb-IB0aWYQPDbUmj6A';
const ADMIN_EMAIL = 'book@epicmodelsandtalent.com';
const SHEET_SUBMISSIONS = 'Submissions';
const SHEET_APPROVED = 'Approved Models';
const SHEET_VOTES = 'Votes';
const UPLOAD_FOLDER_NAME = 'EPIC Bikini Contest Uploads';

function doGet(e) {
  e = e || { parameter: {} };
  e.parameter = e.parameter || {};
  const action = String(e.parameter.action || 'approvedModels');
  if (action === 'approve') return approveSubmission(e);
  if (action === 'reject') return rejectSubmission(e);
  if (action === 'vote') return vote(e);
  if (action === 'status') return output({ ok: true, message: 'EPIC Apps Script is running', sheetId: SPREADSHEET_ID }, e);
  return approvedModels(e);
}

function doPost(e) {
  e = e || { parameter: {}, postData: { contents: '' } };
  return submitEntry(e);
}

function smokeTest() {
  Logger.log('EPIC Apps Script smoke test started.');
  Logger.log('Spreadsheet title: ' + ss().getName());
  Logger.log('Submissions sheet exists: ' + Boolean(sh(SHEET_SUBMISSIONS)));
  Logger.log('Approved Models sheet exists: ' + Boolean(sh(SHEET_APPROVED)));
  Logger.log('Votes sheet exists: ' + Boolean(sh(SHEET_VOTES)));
  Logger.log('Run complete. This test does not submit a model entry.');
}

function ss() { return SpreadsheetApp.openById(SPREADSHEET_ID); }
function sh(name) { return ss().getSheetByName(name); }

function output(data, e) {
  e = e || { parameter: {} };
  e.parameter = e.parameter || {};
  const cb = e.parameter.callback;
  const text = cb ? cb + '(' + JSON.stringify(data) + ')' : JSON.stringify(data);
  return ContentService.createTextOutput(text).setMimeType(cb ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function parsePayload(e) {
  e = e || { parameter: {}, postData: { contents: '' } };
  e.parameter = e.parameter || {};
  let data = {};
  if (e.postData && e.postData.contents) {
    try { data = JSON.parse(e.postData.contents); } catch (err) { data = e.parameter || {}; }
  } else {
    data = e.parameter || {};
  }
  ['idFile', 'headshotFile', 'compCardFile'].forEach(key => {
    if (typeof data[key] === 'string' && data[key]) {
      try { data[key] = JSON.parse(data[key]); } catch (err) {}
    }
  });
  if (typeof data.photoFiles === 'string' && data.photoFiles) {
    try { data.photoFiles = JSON.parse(data.photoFiles); } catch (err) { data.photoFiles = []; }
  }
  if (!Array.isArray(data.photoFiles)) data.photoFiles = [];
  return data;
}

function headers(sheet) { return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]; }

function rowObject(sheet, rowNum) {
  const h = headers(sheet);
  const r = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0];
  const o = {};
  h.forEach((x, i) => o[String(x)] = r[i]);
  return o;
}

function findRow(sheet, header, value) {
  const col = headers(sheet).indexOf(header) + 1;
  if (!col || sheet.getLastRow() < 2) return -1;
  const values = sheet.getRange(2, col, sheet.getLastRow() - 1, 1).getValues().flat();
  const idx = values.findIndex(v => String(v) === String(value));
  return idx === -1 ? -1 : idx + 2;
}

function uploadFolder() {
  const props = PropertiesService.getScriptProperties();
  const storedId = props.getProperty('UPLOAD_FOLDER_ID');
  if (storedId) return DriveApp.getFolderById(storedId);
  const folder = DriveApp.createFolder(UPLOAD_FOLDER_NAME);
  props.setProperty('UPLOAD_FOLDER_ID', folder.getId());
  return folder;
}

function savePackedFile(file, prefix) {
  if (!file || !file.dataUrl) return '';
  const match = String(file.dataUrl).match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return '';
  const mime = file.type || match[1] || 'application/octet-stream';
  const safeName = String(file.name || 'upload').replace(/[^a-zA-Z0-9._-]+/g, '-');
  const bytes = Utilities.base64Decode(match[2]);
  const blob = Utilities.newBlob(bytes, mime, prefix + '-' + Date.now() + '-' + safeName);
  const saved = uploadFolder().createFile(blob);
  saved.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return 'https://drive.google.com/thumbnail?id=' + saved.getId() + '&sz=w1200';
}

function saveAllFiles(data, id) {
  const photos = data.photoFiles || [];
  const photoUrls = photos.map((f, i) => savePackedFile(f, id + '-photo-' + (i + 1))).filter(Boolean);
  const headshot = savePackedFile(data.headshotFile, id + '-headshot') || photoUrls[0] || '';
  return {
    idUrl: savePackedFile(data.idFile, id + '-id'),
    headshotUrl: headshot,
    image2Url: photoUrls[0] || headshot,
    image3Url: photoUrls[1] || photoUrls[0] || headshot,
    additionalImageUrls: photoUrls.join('\n'),
    compCardUrl: savePackedFile(data.compCardFile, id + '-comp-card')
  };
}

function submitEntry(e) {
  const p = parsePayload(e);
  const id = Utilities.getUuid();
  const token = Utilities.getUuid();
  const files = saveAllFiles(p, id);
  const sheet = sh(SHEET_SUBMISSIONS);
  sheet.appendRow([id, new Date(), 'Pending Review', token, p.name || '', p.age || '', p.email || '', p.phone || '', p.instagram || '', p.city || '', p.state || '', p.height || '', p.measurements || '', p.naturalHairColor || '', p.naturalEyeColor || '', p.shoeSize || '', p.dressSize || '', p.agency || '', p.portfolio || '', files.headshotUrl, files.image2Url, files.image3Url, files.additionalImageUrls, files.compCardUrl, files.idUrl, p.notes || '', '', '', '', p.sourcePage || '', p.userAgent || '', '', approveUrl(id, token), rejectUrl(id, token), new Date(), true, true]);
  sendEmails(p, files, id, token);
  return output({ ok: true, submissionId: id }, e);
}

function approveUrl(id, token) { return ScriptApp.getService().getUrl() + '?action=approve&id=' + encodeURIComponent(id) + '&token=' + encodeURIComponent(token); }
function rejectUrl(id, token) { return ScriptApp.getService().getUrl() + '?action=reject&id=' + encodeURIComponent(id) + '&token=' + encodeURIComponent(token); }

function detailRows(p) {
  const rows = [['Name', p.name], ['Age', p.age], ['Email', p.email], ['Phone', p.phone], ['IG Handle', p.instagram], ['City', p.city], ['State', p.state], ['Height', p.height], ['Measurements', p.measurements], ['Natural Hair Color', p.naturalHairColor], ['Natural Eye Color', p.naturalEyeColor], ['Shoe Size', p.shoeSize], ['Dress Size', p.dressSize], ['Agency / Booking Contact', p.agency], ['Portfolio', p.portfolio], ['Notes', p.notes]];
  return '<table style="border-collapse:collapse;width:100%;max-width:760px">' + rows.map(r => '<tr><td style="padding:7px 10px;border:1px solid #ddd;background:#f6f1e4;font-weight:bold">' + escHtml(r[0]) + '</td><td style="padding:7px 10px;border:1px solid #ddd">' + escHtml(r[1] || '') + '</td></tr>').join('') + '</table>';
}

function imageBlock(files) {
  const images = [files.headshotUrl, files.image2Url, files.image3Url].filter(Boolean);
  return '<h3>Submission Images</h3><div style="display:flex;gap:12px;flex-wrap:wrap">' + images.map(url => '<a href="' + url + '" target="_blank"><img src="' + url + '" style="width:180px;max-height:240px;object-fit:cover;border-radius:12px;border:1px solid #d4af37"></a>').join('') + '</div>' + (files.additionalImageUrls ? '<p><b>All image links:</b><br>' + escHtml(files.additionalImageUrls).replace(/\n/g, '<br>') + '</p>' : '') + (files.idUrl ? '<p><b>ID upload:</b> <a href="' + files.idUrl + '">View</a></p>' : '') + (files.compCardUrl ? '<p><b>Comp card:</b> <a href="' + files.compCardUrl + '">View</a></p>' : '');
}

function sendEmails(p, files, id, token) {
  if (p.email) {
    MailApp.sendEmail({ to: p.email, subject: 'EPIC Bikini Contest submission received', htmlBody: '<p>Hi ' + escHtml(p.name || 'there') + ',</p><p>We received your EPIC Bikini Contest submission. Our team will review your materials and contact selected contestants by email.</p><p>Thank you,<br>EPIC Models & Talent</p>' });
  }
  const approve = approveUrl(id, token);
  const reject = rejectUrl(id, token);
  const html = '<h2>New EPIC Bikini Contest Submission</h2>' + detailRows(p) + imageBlock(files) + '<p style="margin-top:22px"><a href="' + approve + '" style="background:#16a34a;color:white;padding:13px 20px;border-radius:8px;text-decoration:none;font-weight:bold">APPROVE & PUBLISH MODEL CARD</a> &nbsp; <a href="' + reject + '" style="background:#b91c1c;color:white;padding:13px 20px;border-radius:8px;text-decoration:none;font-weight:bold">REJECT</a></p>';
  MailApp.sendEmail({ to: ADMIN_EMAIL, subject: 'New EPIC Bikini Contest submission: ' + (p.name || 'Model Entry'), htmlBody: html });
}

function approveSubmission(e) {
  e = e || { parameter: {} };
  e.parameter = e.parameter || {};
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
  e = e || { parameter: {} };
  e.parameter = e.parameter || {};
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
  const models = data.filter(r => String(r[15]).toLowerCase() === 'approved' && String(r[2] || '').trim()).map(r => {
    const o = {};
    h.forEach((x, i) => o[String(x)] = r[i]);
    return { id: o['Model ID'], number: o.Number, name: o.Name, age: o.Age, instagram: o['IG Handle'], city: o.City, state: o.State, height: o.Height, measurements: o.Measurements, naturalHairColor: o['Natural Hair Color'], naturalEyeColor: o['Natural Eye Color'], headshotUrl: o['Headshot URL'], image2Url: o['Image 2 URL'], image3Url: o['Image 3 URL'], voteCount: o['Vote Count'] || 0 };
  });
  return output({ ok: true, models: models }, e);
}

function vote(e) {
  e = e || { parameter: {} };
  e.parameter = e.parameter || {};
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

function escHtml(value) { return String(value || '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }
function slug(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
