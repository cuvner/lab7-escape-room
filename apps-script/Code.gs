/**
 * Lab 7 Lockdown: progress logger and teacher dashboard.
 * Paste this into Extensions > Apps Script in a new Google Sheet.
 */

const DASHBOARD_KEY = 'change-me';   // change this, then open the dashboard with ?key=your-word
const SHEET_NAME = 'Log';
const TZ = 'Europe/London';
const STAGE_NAMES = ['Key online','Lock 1: Keypad','Lock 2: Bugs','Lock 3: Tilt','Lock 4: Lights out','Lock 5: Reactor','Final door'];
const HEADERS = ['Timestamp','Date','Class','Initials','Event','Stage','Stage name','Elapsed (s)','Teacher override'];

/** Run this once from the editor to create the Log sheet. */
function setup() {
  getSheet_();
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange('B:B').setNumberFormat('@');   // keep dates as plain text
  }
  return sh;
}

/** Receives a message from the escape room each time something happens. */
function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    const cls = String(d.cls || '').replace(/[^\w ]/g, '').slice(0, 10);
    const initials = String(d.initials || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
    const event = String(d.event || '').replace(/[^\w]/g, '').slice(0, 20);
    if (!cls || !initials || !event) return text_('missing fields');

    const stage = Number(d.stage);
    const now = new Date();
    const row = [
      now,
      Utilities.formatDate(now, TZ, 'yyyy-MM-dd'),
      cls,
      initials,
      event,
      isFinite(stage) ? stage : '',
      STAGE_NAMES[stage] || '',
      Number(d.elapsed) || 0,
      d.override ? 'YES' : ''
    ];

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try { getSheet_().appendRow(row); } finally { lock.releaseLock(); }
    return text_('ok');
  } catch (err) {
    return text_('error');
  }
}

/** Serves the dashboard page. */
function doGet(e) {
  if ((e.parameter.key || '') !== DASHBOARD_KEY) {
    return HtmlService.createHtmlOutput('<p style="font-family:sans-serif">Dashboard locked. Add <b>?key=</b> and your dashboard key to the end of the link.</p>');
  }
  const t = HtmlService.createTemplateFromFile('Dashboard');
  t.key = DASHBOARD_KEY;
  t.stageNames = JSON.stringify(STAGE_NAMES);
  return t.evaluate()
    .setTitle('Lab 7 Lockdown: dashboard')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Called by the dashboard page every 30 seconds. */
function getData(key, day) {
  if (key !== DASHBOARD_KEY) throw new Error('Locked');
  const values = getSheet_().getDataRange().getValues().slice(1);
  const students = {};
  const classes = {};

  values.forEach(r => {
    const rowDay = r[1] instanceof Date ? Utilities.formatDate(r[1], TZ, 'yyyy-MM-dd') : String(r[1]);
    if (rowDay !== day) return;
    const cls = String(r[2]), initials = String(r[3]), event = String(r[4]);
    const stage = r[5] === '' ? -1 : Number(r[5]);
    const ts = r[0] instanceof Date ? r[0].getTime() : 0;
    const id = cls + '|' + initials;
    classes[cls] = true;

    const s = students[id] || (students[id] = {cls, initials, best: -1, lastSeen: 0, escaped: false, escapeTime: null, overrides: 0, attempts: 0});
    if (event === 'start') s.attempts++;
    if (event === 'complete' && stage > s.best) s.best = stage;
    if (event === 'complete' && stage === STAGE_NAMES.length - 1) {
      if (!s.escaped || Number(r[7]) < s.escapeTime) s.escapeTime = Number(r[7]);
      s.escaped = true;
    }
    if (r[8] === 'YES') s.overrides++;
    if (ts > s.lastSeen) s.lastSeen = ts;
  });

  return {
    classes: Object.keys(classes).sort(),
    students: Object.values(students),
    now: Date.now()
  };
}

function text_(s) {
  return ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.TEXT);
}
