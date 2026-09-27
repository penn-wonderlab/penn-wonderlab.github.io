# Teacher newsletter

Plain HTML, no build step, no vendor. One file per issue, and **that same file is the web
archive** — so "View in browser" can never drift from what landed in the inbox.

```
_newsletter/                          tooling. Leading underscore = Jekyll never publishes it.
  template.html                       the reusable shell. Copy it per issue.
  send.gs                             Google Apps Script: Gmail mail-merge from a Sheet.
  README.md                           this file

_projects/wonderbits/newsletters/     the public archive → /projects/wonderbits/newsletters/
  index.md                            the issue list. One bullet per issue, newest first.
  2026-09-checkin.html                a sent issue, verbatim
```

## Why issues sit in a collection folder but are not documents

`_projects` is a Jekyll collection with `output: true`. A file in there **with** front matter
becomes a page and gets the site layout wrapped around it. A file **without** front matter is a
static file, copied byte for byte. Issues must stay in the second category — site chrome wrapped
around an email is neither a good page nor a faithful archive. Verified: the built copy of
`2026-09-checkin.html` diffs clean against its source.

Two consequences:

- **Never put front matter on an issue.** The moment you do, Jekyll renders it inside
  `layout: default` and the archive stops matching the email.
- **Never put an authoring comment in an issue or in `index.md`.** They ship as page source at a
  public URL. Notes go here instead. The archive copy is generated with HTML comments stripped for
  exactly this reason — but `<!--[if mso]>` is kept, because that is markup, not commentary.

`index.md` carries **no `nav_order` and no `parent`**: `_includes/tutorial-nav.html` walks
`site.projects` by `nav_order`, and a newsletter must not appear in the tutorial navigation.

## Sending an issue

1. `cp _newsletter/template.html _projects/wonderbits/newsletters/<yyyy-mm>-<slug>.html` and
   rewrite everything between `BODY START` and `BODY END`. Update the preheader near the top.
2. Make the archive copy from that same file: strip HTML comments, resolve `{{first_name}}` to
   `there`, fill `{{sender_email}}` and `{{lab_address}}`, and swap the "View in browser" anchor
   for the send date — a page needs no link to itself.
3. Add a bullet to `index.md`. **Push the site first** and load the URL: a "View in browser" link
   that 404s is worse than no link.
4. Upload the issue to Drive; set `HTML_FILE_ID`, `SUBJECT` and `WEB_URL` in `send.gs`.
5. Run with `TEST_MODE = true`. Read it in **Gmail on a phone** as well as on desktop. Then set
   `TEST_MODE = false` and run again.

## Rules the template already follows

Break any of these and it renders somewhere but not everywhere.

- **Tables for layout.** No flexbox, no grid, no `position`. Outlook renders HTML with Word.
- **Every style inline.** No `<style>` block and no classes — Gmail strips embedded CSS in some
  paths, and a message that depends on it degrades to unstyled text.
- **`width="100%"` + `max-width:600px`, never `width="600"`.** A table with a 600 width
  *attribute* refuses to shrink under `max-width`, and the message scrolls sideways on a phone.
  A real bug, caught only by rendering at 390px. Outlook gets a fixed 600px cage via an
  `[if mso]` conditional because it ignores `max-width`.
- **No webfonts.** Space Grotesk is named first for the clients that have it locally; the system
  stack catches everyone else. Never let the fallback be a serif.
- **No background images, no gradients on text.** The app's gradient wordmark cannot survive
  email; the template uses flat brand colours instead.
- **Text masthead, not a logo image.** Gmail blocks images by default for senders not already in
  the contact list. Anything that must be read cannot be an image.
- **Under 102KB.** Past that Gmail clips the message and shows "View entire message", cutting the
  footer.
- **Always a plain-text part.** `send.gs` generates one; a message without one scores worse with
  spam filters.

## Brand values

Taken from the app, so the two look related.

| | |
|---|---|
| Page background | `#f8f9fa` |
| Card background | `#ffffff` |
| Border / rule | `#e9ecef` |
| Heading text | `#1a1a1a` |
| Body text | `#333333` |
| Muted / footer | `#6b7280` |
| Link | `#6366f1` |
| Wordmark `✧` | `#4ecca3` (Evidence green) |
| Wordmark `:` | `#e94560` (Question red) |

Card-type palette, if an issue ever needs to colour-code them: Question `#e94560`,
Claim `#fbbf24`, Evidence `#4ecca3`, Synthesis `#a855f7`, Bit `#94a3b8`.

## Don't advertise a hidden feature

WonderBits keeps shipped-but-hidden surfaces behind `src/config/uiFlags.ts`. Before naming a
feature in an issue, check it is not flagged off — as of September 2026 that list included the AI
Helpers panel, "View as Document", Thinking Lab, Ant and the Perusall field. Verify tutorial links
resolve too; they live at
`https://penn-wonderlab.github.io/projects/wonderbits/tutorials/<slug>/`.

## When to stop doing it this way

Right for a list in the tens sent from a team address. Move to an email service (Buttondown,
Loops, Mailchimp) when any of these becomes true:

- more than ~300 recipients, or you hit Gmail's daily cap (~500 consumer, ~1,500–2,000 Workspace)
- you want opens, clicks, or bounce handling
- one-click unsubscribe has to be a header rather than a mailto link
- somebody other than the sender needs to be able to send

`template.html` still works then — every one of those takes pasted HTML.
