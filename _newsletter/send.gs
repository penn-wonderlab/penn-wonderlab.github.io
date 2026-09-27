/**
 * WonderBits newsletter — Gmail mail-merge via Google Apps Script.
 *
 * Sends ONE personalised message per teacher from your own Gmail address. Not BCC: a BCC blast
 * cannot say "Hi Sarah", lands in Promotions more often, and shows every recipient that they are
 * one of a list.
 *
 * SETUP (once)
 *  1. Make a Google Sheet with a header row: email | first_name | sent_at
 *  2. Extensions > Apps Script, paste this file, Save.
 *  3. Upload the issue's .html to Drive, open it, copy the file id out of the URL, and put it in
 *     HTML_FILE_ID below.
 *  4. Run `sendNewsletter` once — Google will ask for Gmail + Drive + Sheets permission.
 *
 * EVERY ISSUE
 *  - Point HTML_FILE_ID at the new file, set SUBJECT, clear the sent_at column, run in test mode,
 *    check the message in your own inbox, then flip TEST_MODE to false.
 *
 * SENDING AS hello@wonderbits.org
 *  - FROM_ALIAS must be a verified "Send mail as" address in the Gmail running this script
 *    (Settings > Accounts). That alias relays through Resend's SMTP, which refuses more than 10
 *    requests a second — a Bcc blast from the compose window hit exactly that on 2026-09-27
 *    ("550 Too many requests"). One message per teacher with the pause below stays far under it.
 *  - The same Resend account sends sign-up confirmation emails, so a burst here can also delay a
 *    student's confirmation email. Another reason to stay unhurried.
 *
 * SAFETY
 *  - TEST_MODE sends ONE message, to TEST_RECIPIENT, using the first unsent row's first_name, with
 *    "[TEST]" in the subject. It does not touch sent_at, so the real run still reaches everyone.
 *  - It refuses to run while any you@upenn.edu placeholder is still set: issue 1 went out with an
 *    unsubscribe link to that placeholder.
 *  - A row with anything in sent_at is skipped, so re-running after a failure resumes rather than
 *    double-sending. This is the whole reason the column exists — do not remove it.
 *  - Consumer Gmail allows ~500 recipients/day; Workspace ~1,500–2,000. Past that, use an ESP.
 */

const HTML_FILE_ID  = 'PUT_THE_DRIVE_FILE_ID_HERE';
const SUBJECT       = "WonderBits teacher newsletter - Sep 27, 2026";
const FROM_NAME     = 'WonderBits';
const FROM_ALIAS    = 'hello@wonderbits.org';   // a verified "Send mail as" alias — see header
const REPLY_TO      = 'hello@wonderbits.org';
const SENDER_EMAIL  = 'hello@wonderbits.org';   // used by the unsubscribe mailto in the footer
const LAB_ADDRESS   = '3700 Walnut St, Philadelphia, PA 19104';
// The archive copy of THIS issue. Push the .html to the site and confirm it loads BEFORE sending:
// a "View in browser" link that 404s is worse than no link at all.
// Use the https custom domain: the github.io address redirects to plain http.
const WEB_URL       = 'https://wonderlab.gse.upenn.edu/projects/wonderbits/newsletters/2026-10-idea-structures.html';

const TEST_MODE      = true;
const TEST_RECIPIENT = 'bodong.chen@gmail.com';          // your own inbox

function sendNewsletter() {
  checkSettings();
  const html  = DriveApp.getFileById(HTML_FILE_ID).getBlob().getDataAsString();
  const sheet = SpreadsheetApp.getActiveSheet();
  const rows  = sheet.getDataRange().getValues();
  const head  = rows.shift().map(String);

  const iEmail = head.indexOf('email');
  const iName  = head.indexOf('first_name');
  const iSent  = head.indexOf('sent_at');
  if (iEmail < 0 || iName < 0 || iSent < 0) {
    throw new Error('Sheet needs columns: email, first_name, sent_at');
  }

  let sent = 0;
  rows.forEach(function (row, i) {
    const email = String(row[iEmail]).trim();
    if (!email || row[iSent]) return;                       // blank row, or already sent
    if (TEST_MODE && sent >= 1) return;                     // one test copy, not one per row

    // A missing first name must not produce "Hi ,". Falling back to "there" is the one place a
    // merge field is allowed to be wrong, so it has to read like a sentence either way.
    const name = String(row[iName]).trim() || 'there';
    const body = fill(html, name);

    GmailApp.sendEmail(TEST_MODE ? TEST_RECIPIENT : email, (TEST_MODE ? '[TEST] ' : '') + SUBJECT, plainTextOf(body), {
      htmlBody: body,
      name: FROM_NAME,
      from: FROM_ALIAS,
      replyTo: REPLY_TO,
    });

    if (!TEST_MODE) sheet.getRange(i + 2, iSent + 1).setValue(new Date());
    sent++;
    Utilities.sleep(1200);   // under 1/s: Gmail throttles bursts, and the alias's SMTP caps at 10/s
  });

  SpreadsheetApp.getActiveSpreadsheet().toast(
    (TEST_MODE ? 'TEST — ' : '') + sent + ' message(s) sent.');
}

/** Stop before sending anything if a setting is still a placeholder or the alias is missing. */
function checkSettings() {
  const unset = [];
  if (/^PUT_/.test(HTML_FILE_ID)) unset.push('HTML_FILE_ID');
  [['REPLY_TO', REPLY_TO], ['SENDER_EMAIL', SENDER_EMAIL], ['TEST_RECIPIENT', TEST_RECIPIENT]]
    .forEach(function (pair) { if (/you@upenn\.edu/.test(pair[1])) unset.push(pair[0]); });
  if (unset.length) throw new Error('Set these first: ' + unset.join(', '));
  const aliases = GmailApp.getAliases().map(function (a) { return a.toLowerCase(); });
  if (aliases.indexOf(FROM_ALIAS.toLowerCase()) < 0) {
    throw new Error(FROM_ALIAS + ' is not a "Send mail as" address in this Gmail account ' +
      '(found: ' + (aliases.join(', ') || 'none') + '). Add it under Settings > Accounts, or run ' +
      'the script from the account that has it.');
  }
}

function fill(html, firstName) {
  return html
    .replace(/\{\{first_name\}\}/g, firstName)
    .replace(/\{\{web_url\}\}/g, WEB_URL)
    .replace(/\{\{sender_email\}\}/g, SENDER_EMAIL)
    .replace(/\{\{lab_address\}\}/g, LAB_ADDRESS);
}

/**
 * The plain-text alternative. Some clients show it, spam filters read it, and a message with no
 * text part scores worse. Crude on purpose — it only has to be readable, not pretty.
 */
function plainTextOf(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&rarr;/g, '->').replace(/&mdash;/g, '—')
    .replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘').replace(/&middot;/g, '·')
    .replace(/&#(\d+);/g, function (_, code) { return String.fromCharCode(Number(code)); })
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
