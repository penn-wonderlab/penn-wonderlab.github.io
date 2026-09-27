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
 * SAFETY
 *  - TEST_MODE sends only to TEST_RECIPIENT.
 *  - A row with anything in sent_at is skipped, so re-running after a failure resumes rather than
 *    double-sending. This is the whole reason the column exists — do not remove it.
 *  - Consumer Gmail allows ~500 recipients/day; Workspace ~1,500–2,000. Past that, use an ESP.
 */

const HTML_FILE_ID  = 'PUT_THE_DRIVE_FILE_ID_HERE';
const SUBJECT       = "How's it going with WonderBits?";
const FROM_NAME     = 'WonderBits';
const REPLY_TO      = 'you@upenn.edu';
const SENDER_EMAIL  = 'you@upenn.edu';          // used by the unsubscribe mailto in the footer
const LAB_ADDRESS   = '3700 Walnut St, Philadelphia, PA 19104';
// The archive copy of THIS issue. Push the .html to the site and confirm it loads BEFORE sending:
// a "View in browser" link that 404s is worse than no link at all.
const WEB_URL       = 'https://penn-wonderlab.github.io/projects/wonderbits/newsletters/2026-09-checkin.html';

const TEST_MODE      = true;
const TEST_RECIPIENT = 'you@upenn.edu';

function sendNewsletter() {
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

    // A missing first name must not produce "Hi ,". Falling back to "there" is the one place a
    // merge field is allowed to be wrong, so it has to read like a sentence either way.
    const name = String(row[iName]).trim() || 'there';
    const body = fill(html, name);

    GmailApp.sendEmail(TEST_MODE ? TEST_RECIPIENT : email, SUBJECT, plainTextOf(body), {
      htmlBody: body,
      name: FROM_NAME,
      replyTo: REPLY_TO,
    });

    if (!TEST_MODE) sheet.getRange(i + 2, iSent + 1).setValue(new Date());
    sent++;
    Utilities.sleep(1200);                                  // be unhurried; Gmail throttles bursts
  });

  SpreadsheetApp.getActiveSpreadsheet().toast(
    (TEST_MODE ? 'TEST — ' : '') + sent + ' message(s) sent.');
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
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&rarr;/g, '->')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
