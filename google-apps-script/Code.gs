const SPREADSHEET_ID = '1zpRxGl9cBad2m5vJZmIM-gUaYUb-IB0aWYQPDbUmj6A';
const ADMIN_EMAIL = 'book@epicmodelsandtalent.com';
const SHEET_SUBMISSIONS = 'Submissions';
const SHEET_APPROVED = 'Approved Models';
const SHEET_VOTES = 'Votes';
const SHEET_DIAGNOSTICS = 'Diagnostics';
const UPLOAD_FOLDER_NAME = 'EPIC Bikini Contest Uploads';

function doGet(e) {
  e = normalizeEvent(e);
  const action = String(e.parameter.action || 'approvedModels');
  try {
    if (action === 'approve') return approveSubmission(e);
    if (action === 'reject') return rejectSubmission(e);
    if (action === 'vote') return vote(e);
    if (action === 'status') return output({ ok: true, message: 'EPIC Apps Script is running', sheetId: SPREADSHEET_ID }, e);
    return approvedModels(e);
  } catch (err) {
    logDiag('doGet:' + action, false, 'GET failed', {}, err);
    return output({ ok: false, error: String(err) }, e);
  }
}

function doPost(e) {
  e = normalizeEvent(e);
  const p = parsePayload(e);
  const action = String(p.action || 'submitEntry');
  try {
    if (action === 'submitText') return submitTextEntry(p, e);
    if (action === 'uploadImage') return uploadImage(p, e);
    if (action === 'finalizeSubmission') return finalizeSubmission(p, e);
    return submitEntryLegacy(p, e);
  } catch (err) {
    logDiag('doPost:' + action, false, 'POST failed', p, err);
    return output({ ok: false, error: String(err) }, e);
  }
}

function smokeTest() {
  logDiag('smokeTest', true, 'Manual smoke test ran', { name: 'Manual Test', email: ADMIN_EMAIL }, null);
  Logger.log('Spreadsheet title: ' + ss().getName());
  Logger.log('Submissions: ' + Boolean(sh(SHEET_SUBMISSIONS)));
  Logger.log('Approved Models: ' + Boolean(sh(SHEET_APPROVED)));
  Logger.log('Votes: ' + Boolean(sh(SHEET_VOTES)));
  Logger.log('Diagnostics: ' + Boolean(sh(SHEET_DIAGNOSTICS)));
}

function normalizeEvent(e) {
  e = e || {};
  e.parameter = e.parameter || {};
  e.postData = e.postData || { contents: '' };
  return e;
}

function ss() { return SpreadsheetApp.openById(SPREADSHEET_ID); }
function sh(name) { return ss().getSheetByName(name); }

function output(data, e) {
  e = normalizeEvent(e);
  const cb = e.parameter.callback;
  const text = cb ? cb + '(' + JSON.stringify(data) + ')' : JSON.stringify(data);
  return ContentService.createTextOutput(text).setMimeType(cb ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function parsePayload(e) {
  e = normalizeEvent(e);
  let data = {};
  if (e.postData && e.postData.contents) {
    try { data = JSON.parse(e.postData.contents); } catch (err) { data = e.parameter || {}; }
  } else {
    data = e.parameter || {};
  }
  ['file', 'idFile', 'headshotFile', 'compCardFile'].forEach(key => {
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
function headerIndex(sheet, header) { return headers(sheet).indexOf(header) + 1; }

function rowObject(sheet, rowNum) {
  const h = headers(sheet);
  const r = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn()).getValues()[0];
  const o = {};
  h.forEach((x, i) => o[String(x)] = r[i]);
  return o;
}

function findRow(sheet, header, value) {
  const col = headerIndex(sheet, header);
  if (!col || sheet.getLastRow() < 2) return -1;
  const values = sheet.getRange(2, col, sheet.getLastRow() - 1, 1).getValues().flat();
  const idx = values.findIndex(v => String(v) === String(value));
  return idx === -1 ? -1 : idx + 2;
}

function setByHeader(sheet, rowNum, header, value) {
  const col = headerIndex(sheet, header);
  if (col) sheet.getRange(rowNum, col).setValue(value);
}

function logDiag(stage, ok, message, data, err) {
  try {
    const sheet = sh(SHEET_DIAGNOSTICS);
    if (!sheet) return;
    data = data || {};
    const keys = Object.keys(data).join(', ');
    const photoCount = Array.isArray(data.photoFiles) ? data.photoFiles.length : (data.file ? 1 : 0);
    const hasHeadshot = Boolean(data.headshotFile || data.role === 'headshot');
    sheet.appendRow([new Date(), stage, ok ? 'TRUE' : 'FALSE', message || '', data.name || '', data.email || '', keys, photoCount, hasHeadshot, err ? String(err.stack || err) : '', data.userAgent || '', data.sourcePage || '']);
  } catch (logErr) {
    Logger.log('Diagnostics logging failed: ' + logErr);
  }
}

function uploadFolder() {
  const props = PropertiesService.getScriptProperties();
  const storedId = props.getProperty('UPLOAD_FOLDER_ID');
  if (storedId) return DriveApp.getFolderById(storedId);
  const folder = DriveApp.createFolder(UPLOAD_FOLDER_NAME);
  props.setProperty('UPLOAD_FOLDER_ID', folder.getId());
  return folder;
}

function extensionForMime(mime) {
  mime = String(mime || '').toLowerCase();
  if (mime === 'image/jpeg' || mime === 'image/jpg') return '.jpg';
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  if (mime === 'application/pdf') return '.pdf';
  return '';
}

function normalizedFileName(name, mime) {
  const ext = extensionForMime(mime);
  const base = String(name || 'upload').replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'upload';
  return base + ext;
}

function savePackedFile(file, prefix, makePublic) {
  if (!file || !file.dataUrl) return '';
  const match = String(file.dataUrl).match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return '';
  const mime = match[1] || file.type || 'application/octet-stream';
  const safeName = normalizedFileName(file.name, mime);
  const bytes = Utilities.base64Decode(match[2]);
  const blob = Utilities.newBlob(bytes, mime, prefix + '-' + Date.now() + '-' + safeName);
  const saved = uploadFolder().createFile(blob);
  if (makePublic) saved.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const id = saved.getId();
  return makePublic ? 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1200' : saved.getUrl();
}

function submitTextEntry(p, e) {
  const id = p.submissionId || Utilities.getUuid();
  const token = Utilities.getUuid();
  const sheet = sh(SHEET_SUBMISSIONS);
  const existing = findRow(sheet, 'Submission ID', id);
  if (existing > 1) return output({ ok: true, submissionId: id, message: 'Already exists' }, e);
  sheet.appendRow([id, new Date(), 'Uploads Pending', token, p.name || '', p.age || '', p.email || '', p.phone || '', p.instagram || '', p.city || '', p.state || '', p.height || '', p.measurements || '', p.naturalHairColor || '', p.naturalEyeColor || '', p.shoeSize || '', p.dressSize || '', p.agency || '', p.portfolio || '', '', '', '', '', '', '', p.notes || '', '', '', '', p.sourcePage || '', p.userAgent || '', '', approveUrl(id, token), rejectUrl(id, token), new Date(), true, true]);
  logDiag('submitText', true, 'Text entry captured', p, null);
  return output({ ok: true, submissionId: id }, e);
}

function uploadImage(p, e) {
  const id = p.submissionId;
  const role = String(p.role || 'photo');
  const file = p.file;
  const sheet = sh(SHEET_SUBMISSIONS);
  const rowNum = findRow(sheet, 'Submission ID', id);
  if (rowNum < 2) throw new Error('Submission not found for upload: ' + id);
  const isPublic = ['headshot', 'reveal1', 'reveal2', 'photo'].indexOf(role) !== -1;
  const url = savePackedFile(file, id + '-' + role, isPublic);
  if (!url) throw new Error('File did not save for role: ' + role);
  if (role === 'headshot') setByHeader(sheet, rowNum, 'Headshot URL', url);
  if (role === 'reveal1') setByHeader(sheet, rowNum, 'Image 2 URL', url);
  if (role === 'reveal2') setByHeader(sheet, rowNum, 'Image 3 URL', url);
  if (role === 'id') setByHeader(sheet, rowNum, 'ID URL', url);
  if (role === 'comp') setByHeader(sheet, rowNum, 'Comp Card URL', url);
  if (role === 'photo' || role === 'reveal1' || role === 'reveal2') {
    const r = rowObject(sheet, rowNum);
    const current = r['Additional Image URLs'] ? String(r['Additional Image URLs']) + '\n' : '';
    setByHeader(sheet, rowNum, 'Additional Image URLs', current + url);
  }
  setByHeader(sheet, rowNum, 'Last Updated', new Date());
  logDiag('uploadImage:' + role, true, 'Image uploaded', { submissionId: id, role: role, file: file ? file.name : '' }, null);
  return output({ ok: true, submissionId: id, role: role, url: url }, e);
}

function finalizeSubmission(p, e) {
  const id = p.submissionId;
  const sheet = sh(SHEET_SUBMISSIONS);
  const rowNum = findRow(sheet, 'Submission ID', id);
  if (rowNum < 2) throw new Error('Submission not found for finalize: ' + id);
  const r = rowObject(sheet, rowNum);
  if (!r['Image 2 URL'] && r['Headshot URL']) setByHeader(sheet, rowNum, 'Image 2 URL', r['Headshot URL']);
  if (!r['Image 3 URL'] && (r['Image 2 URL'] || r['Headshot URL'])) setByHeader(sheet, rowNum, 'Image 3 URL', r['Image 2 URL'] || r['Headshot URL']);
  setByHeader(sheet, rowNum, 'Status', 'Pending Review');
  setByHeader(sheet, rowNum, 'Last Updated', new Date());
  sendEmailsFromRow(rowObject(sheet, rowNum));
  logDiag('finalizeSubmission', true, 'Submission finalized and email sent', { submissionId: id, name: r.Name, email: r.Email }, null);
  return output({ ok: true, submissionId: id }, e);
}

function submitEntryLegacy(p, e) {
  const id = p.submissionId || Utilities.getUuid();
  submitTextEntry(Object.assign({}, p, { submissionId: id }), e);
  if (p.headshotFile) uploadImage({ submissionId: id, role: 'headshot', file: p.headshotFile }, e);
  if (p.photoFiles && p.photoFiles[0]) uploadImage({ submissionId: id, role: 'reveal1', file: p.photoFiles[0] }, e);
  if (p.photoFiles && p.photoFiles[1]) uploadImage({ submissionId: id, role: 'reveal2', file: p.photoFiles[1] }, e);
  if (p.idFile) uploadImage({ submissionId: id, role: 'id', file: p.idFile }, e);
  if (p.compCardFile) uploadImage({ submissionId: id, role: 'comp', file: p.compCardFile }, e);
  return finalizeSubmission({ submissionId: id }, e);
}

function approveUrl(id, token) { return ScriptApp.getService().getUrl() + '?action=approve&id=' + encodeURIComponent(id) + '&token=' + encodeURIComponent(token); }
function rejectUrl(id, token) { return ScriptApp.getService().getUrl() + '?action=reject&id=' + encodeURIComponent(id) + '&token=' + encodeURIComponent(token); }

function detailRowsFromRow(r) {
  const rows = [['Name', r.Name], ['Age', r.Age], ['Email', r.Email], ['Phone', r.Phone], ['IG Handle', r['IG Handle']], ['City', r.City], ['State', r.State], ['Height', r.Height], ['Measurements', r.Measurements], ['Natural Hair Color', r['Natural Hair Color']], ['Natural Eye Color', r['Natural Eye Color']], ['Shoe Size', r['Shoe Size']], ['Agency / Booking Contact', r['Agency or Booking Contact']], ['Portfolio', r['Portfolio Link']], ['Notes', r.Notes]];
  return '<table style="border-collapse:collapse;width:100%;max-width:760px">' + rows.map(row => '<tr><td style="padding:7px 10px;border:1px solid #ddd;background:#f6f1e4;font-weight:bold">' + escHtml(row[0]) + '</td><td style="padding:7px 10px;border:1px solid #ddd">' + escHtml(row[1] || '') + '</td></tr>').join('') + '</table>';
}

function fileIdFromUrl(url) {
  const text = String(url || '');
  const thumb = text.match(/[?&]id=([^&]+)/);
  if (thumb) return thumb[1];
  const drive = text.match(/\/d\/([^/]+)/);
  return drive ? drive[1] : '';
}

function driveViewUrl(url) {
  const id = fileIdFromUrl(url);
  return id ? 'https://drive.google.com/file/d/' + id + '/view' : url;
}

function imageBlockFromRow(r) {
  const images = [['Headshot', r['Headshot URL']], ['Reveal Image 1', r['Image 2 URL']], ['Reveal Image 2', r['Image 3 URL']]].filter(item => item[1]);
  let html = '<h3>Card Images</h3>';
  if (images.length) {
    html += '<div style="display:flex;gap:14px;flex-wrap:wrap;margin:10px 0 16px">' + images.map(item => '<div style="width:190px"><p style="font-weight:bold;margin:0 0 6px">' + escHtml(item[0]) + '</p><a href="' + driveViewUrl(item[1]) + '" target="_blank"><img src="' + item[1] + '" style="width:180px;max-height:240px;object-fit:cover;border-radius:12px;border:1px solid #d4af37;background:#f7f7f7"></a><p style="font-size:12px;margin:6px 0 0"><a href="' + driveViewUrl(item[1]) + '" target="_blank">Open full image</a></p></div>').join('') + '</div>';
  } else {
    html += '<p>No card images were saved for this entry.</p>';
  }
  html += (r['Additional Image URLs'] ? '<p><b>Public card image links:</b><br>' + escHtml(r['Additional Image URLs']).replace(/\n/g, '<br>') + '</p>' : '');
  html += (r['ID URL'] ? '<p><b>ID upload:</b> <a href="' + r['ID URL'] + '">View</a></p>' : '');
  html += (r['Comp Card URL'] ? '<p><b>Comp card:</b> <a href="' + r['Comp Card URL'] + '">View</a></p>' : '');
  return html;
}

function applicantEmailHtml(r) {
  return '<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111"><h2 style="margin:0 0 12px">EPIC Bikini Contest Submission Received</h2><p>Hi ' + escHtml(r.Name || 'there') + ',</p><p>We received your EPIC Bikini Contest submission and our team will review your materials.</p><p>Selected contestants will be contacted by email with next steps.</p><p>Thank you,<br>EPIC Models &amp; Talent</p></div>';
}

function sendEmailsFromRow(r) {
  const shortId = String(r['Submission ID'] || '').slice(0, 8);
  if (r.Email) {
    MailApp.sendEmail({
      to: r.Email,
      subject: 'EPIC Bikini Contest submission received - ' + (r.Name || 'Model Entry') + (shortId ? ' #' + shortId : ''),
      body: 'Hi ' + (r.Name || 'there') + ',\n\nWe received your EPIC Bikini Contest submission and our team will review your materials. Selected contestants will be contacted by email with next steps.\n\nThank you,\nEPIC Models & Talent',
      htmlBody: applicantEmailHtml(r)
    });
  }
  const html = '<h2>New EPIC Bikini Contest Submission</h2>' + detailRowsFromRow(r) + imageBlockFromRow(r) + '<p style="margin-top:22px"><a href="' + r['Approval URL'] + '" style="background:#16a34a;color:white;padding:13px 20px;border-radius:8px;text-decoration:none;font-weight:bold">APPROVE & PUBLISH MODEL CARD</a> &nbsp; <a href="' + r['Reject URL'] + '" style="background:#b91c1c;color:white;padding:13px 20px;border-radius:8px;text-decoration:none;font-weight:bold">REJECT</a></p>';
  MailApp.sendEmail({ to: ADMIN_EMAIL, subject: 'New EPIC Bikini Contest submission: ' + (r.Name || 'Model Entry'), htmlBody: html });
}

function approveSubmission(e) {
  e = normalizeEvent(e);
  const sheet = sh(SHEET_SUBMISSIONS);
  const rowNum = findRow(sheet, 'Submission ID', e.parameter.id);
  if (rowNum < 2) return output({ ok: false, error: 'Submission not found' }, e);
  const r = rowObject(sheet, rowNum);
  if (String(r['Approval Token']) !== String(e.parameter.token)) return output({ ok: false, error: 'Invalid token' }, e);
  const approved = sh(SHEET_APPROVED);
  const number = String(approved.getLastRow()).padStart(2, '0');
  const modelId = Utilities.getUuid();
  approved.appendRow([modelId, number, r.Name, r.Age, r['IG Handle'], r.City, r.State, r.Height, r.Measurements, r['Natural Hair Color'], r['Natural Eye Color'], r['Headshot URL'], r['Image 2 URL'], r['Image 3 URL'], 0, 'Approved', new Date(), r['Submission ID'], approved.getLastRow(), slug(r.Name), '', true, true]);
  setByHeader(sheet, rowNum, 'Status', 'Approved');
  setByHeader(sheet, rowNum, 'Approved Model Number', number);
  setByHeader(sheet, rowNum, 'Approved At', new Date());
  return HtmlService.createHtmlOutput('<h2>Approved</h2><p>The model card is now live in the approved feed.</p>');
}

function rejectSubmission(e) {
  e = normalizeEvent(e);
  const sheet = sh(SHEET_SUBMISSIONS);
  const rowNum = findRow(sheet, 'Submission ID', e.parameter.id);
  if (rowNum < 2) return output({ ok: false, error: 'Submission not found' }, e);
  const r = rowObject(sheet, rowNum);
  if (String(r['Approval Token']) !== String(e.parameter.token)) return output({ ok: false, error: 'Invalid token' }, e);
  setByHeader(sheet, rowNum, 'Status', 'Rejected');
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
  e = normalizeEvent(e);
  const modelId = e.parameter.modelId;
  const approved = sh(SHEET_APPROVED);
  const rowNum = findRow(approved, 'Model ID', modelId);
  if (rowNum < 2) return output({ ok: false, error: 'Model not found' }, e);
  const r = rowObject(approved, rowNum);
  sh(SHEET_VOTES).appendRow([Utilities.getUuid(), new Date(), modelId, r.Number, r.Name, e.parameter.voter || '', e.parameter.source || '', '', '', false]);
  const count = Number(r['Vote Count'] || 0) + 1;
  setByHeader(approved, rowNum, 'Vote Count', count);
  return output({ ok: true, modelId: modelId, voteCount: count }, e);
}

function escHtml(value) { return String(value || '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c])); }
function slug(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

function testDeployedWebAppGetStatus() {
  const webAppUrl = 'https://script.google.com/macros/s/AKfycbxVwGX70-fL-QM1nfKqlSyNdrh0hq_CFwBsKvwYgZ_AEbJL6oLufGXzLLqP6zGEtlCN/exec?action=status';
  const response = UrlFetchApp.fetch(webAppUrl, { method: 'get', muteHttpExceptions: true, followRedirects: true });
  Logger.log('Status Code: ' + response.getResponseCode());
  Logger.log('Response Text: ' + response.getContentText().slice(0, 1000));
}

function testDeployedWebAppTextOnly() {
  const webAppUrl = 'https://script.google.com/macros/s/AKfycbxVwGX70-fL-QM1nfKqlSyNdrh0hq_CFwBsKvwYgZ_AEbJL6oLufGXzLLqP6zGEtlCN/exec';
  const payload = { action: 'submitText', submissionId: 'deployed-text-test-' + Date.now(), name: 'Deployed Text Test', age: '25', email: ADMIN_EMAIL, phone: '555-555-5555', instagram: '@deployedtexttest', city: 'Grand Rapids', state: 'MI', height: "5'8", measurements: '32/24/36', naturalHairColor: 'Brown', naturalEyeColor: 'Brown', shoeSize: '8', dressSize: '4', agency: 'Direct Test', portfolio: 'https://example.com', notes: 'Testing deployed Web App text-only submission.', sourcePage: 'Apps Script deployed text-only test', userAgent: 'Apps Script UrlFetchApp' };
  const response = UrlFetchApp.fetch(webAppUrl, { method: 'post', payload: payload, muteHttpExceptions: true, followRedirects: true });
  Logger.log('Status Code: ' + response.getResponseCode());
  Logger.log('Response Text: ' + response.getContentText().slice(0, 1000));
}
