/**
 * Dananjaya & Piyumi — Wedding RSVP + Wishes backend (Google Apps Script)
 *
 * Paste this whole file into Extensions > Apps Script (Code.gs) of the sheet:
 * https://docs.google.com/spreadsheets/d/1LRhD2IS1fR4EFExsZVbLh58Btq-9aj5hoUTSFwsdXsE/edit
 *
 * The "RSVP" and "Wishes" sheets (with styled headers) are created automatically
 * on the first submission, or right away by running setup() once from the editor.
 *
 * Endpoints (deploy as Web app, Execute as: Me, Who has access: Anyone):
 *   POST  sheet=RSVP   name, attendance, guests, dietary
 *   POST  sheet=Wishes name, message
 *   GET   ?action=wishes   -> latest wishes as JSON (shown on the invitation)
 */

var SPREADSHEET_ID = '1LRhD2IS1fR4EFExsZVbLh58Btq-9aj5hoUTSFwsdXsE';

var SHEETS = {
  RSVP: {
    headers: ['Timestamp', 'Full Name', 'Attendance', 'Guests', 'Dietary Notes'],
    fields: ['name', 'attendance', 'guests', 'dietary'],
    widths: [170, 220, 120, 80, 320],
  },
  Wishes: {
    headers: ['Timestamp', 'Guest Name', 'Message'],
    fields: ['name', 'message'],
    widths: [170, 220, 480],
  },
};

var HEADER_BG = '#722F37';
var HEADER_FG = '#FFFFFF';
var MAX_FIELD_LENGTH = 2000;
var WISHES_LIMIT = 50;

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/** Returns the sheet, creating it (and its header row) if missing or empty. */
function getOrCreateSheet_(name) {
  var config = SHEETS[name];
  if (!config) throw new Error('Unknown sheet: ' + name);

  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);

  if (sheet.getLastRow() === 0) {
    var header = sheet.getRange(1, 1, 1, config.headers.length);
    header.setValues([config.headers])
      .setFontWeight('bold')
      .setFontColor(HEADER_FG)
      .setBackground(HEADER_BG)
      .setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    config.widths.forEach(function (w, i) { sheet.setColumnWidth(i + 1, w); });
    sheet.getRange(2, 1, sheet.getMaxRows() - 1, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  }
  return sheet;
}

/** Run once from the Apps Script editor to create both sheets immediately. */
function setup() {
  Object.keys(SHEETS).forEach(getOrCreateSheet_);
}

function clean_(value) {
  var text = String(value == null ? '' : value).trim().slice(0, MAX_FIELD_LENGTH);
  // Stop values like "=HYPERLINK(...)" from being run as spreadsheet formulas
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function readParams_(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  // Also accept a JSON body
  if (e && e.postData && e.postData.type === 'application/json') {
    try {
      var body = JSON.parse(e.postData.contents);
      for (var k in body) params[k] = body[k];
    } catch (err) { /* ignore malformed JSON */ }
  }
  return params;
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    var params = readParams_(e);
    var name = params.sheet === 'Wishes' ? 'Wishes' : (params.sheet === 'RSVP' ? 'RSVP' : null);
    if (!name) return json_({ result: 'error', error: 'Missing or unknown "sheet" parameter' });
    if (!clean_(params.name)) return json_({ result: 'error', error: 'Name is required' });

    var sheet = getOrCreateSheet_(name);
    var row = [new Date()].concat(SHEETS[name].fields.map(function (f) { return clean_(params[f]); }));
    sheet.appendRow(row);

    return json_({ result: 'success', sheet: name, row: sheet.getLastRow() });
  } catch (error) {
    return json_({ result: 'error', error: String(error) });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  try {
    var action = e && e.parameter ? e.parameter.action : '';
    if (action !== 'wishes') return json_({ result: 'ok', message: 'Dananjaya & Piyumi wedding API' });

    var sheet = getOrCreateSheet_('Wishes');
    var last = sheet.getLastRow();
    if (last < 2) return json_({ result: 'success', wishes: [] });

    var count = Math.min(WISHES_LIMIT, last - 1);
    var rows = sheet.getRange(last - count + 1, 1, count, 3).getValues();
    var wishes = rows
      .filter(function (r) { return r[1] && r[2]; })
      .map(function (r) {
        return {
          name: String(r[1]).replace(/^'/, ''),
          message: String(r[2]).replace(/^'/, ''),
          createdAt: r[0] instanceof Date ? r[0].toISOString() : String(r[0]),
        };
      })
      .reverse(); // newest first

    return json_({ result: 'success', wishes: wishes });
  } catch (error) {
    return json_({ result: 'error', error: String(error) });
  }
}
