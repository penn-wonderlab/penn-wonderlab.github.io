---
# Generated from docs/api/v1.md in the WonderBits repo by scripts/publish-api-docs.mjs.
# Edit the source there and publish again; changes made here are overwritten.
layout: default
project: false
title: "WonderBits integration API — v1"
description: "Read and change the cards and connections on a WonderBits canvas from a device, over HTTP."
---

`/api/v1` lets a device, such as an ESP32 or anything else that can make HTTP requests, read and
change the cards and connections on a space's canvas. Each device acts as the user it belongs to:

- Cards and connections it makes are authored by that user and carry the device in
  `source_device_id`.
- It can use only the endpoints below, and each request is checked against that user's
  permissions in the space.

**Contents**

* TOC
{:toc}

## Authentication

```
Authorization: Bearer wbd_…
```

Each device has its own token. A token is bound to one user and one space when it is minted.
Nothing in a request can change either.

**Permissions.** The server runs each request as the user, so the same permission rules apply as
in the browser:

- Users may change their own cards.
- An owner or manager of the space may also change the text of other members' cards.
- Any member may move any card.
- Only the user who drew a connection may remove it.

Every request is limited to the device's space.

## Conventions

- The API lives at `https://www.wonderbits.org/api/v1`. Paths below are written from the host, so
  `GET /api/v1/me` is `https://www.wonderbits.org/api/v1/me`.
- JSON in, JSON out. Field names are snake_case.
- Card text is **plain text**. Line breaks separate paragraphs. The server converts it to and from
  the editor's format.
- Coordinates are canvas units (the same as the browser's), from −1,000,000 to 1,000,000.
- Ids: cards are `node_…` and connections are `edge_…` (letters, digits, `-` and `_`, at most 64
  characters).
- **Mint ids on the device**, before the first attempt. Reuse the id on every retry. If a create
  arrives with an id this device already used for the same thing, the server returns that row
  with 200 instead of making a second one. An id that belongs to anything else gets 409. If you
  leave out `id`, the server mints one, and a retry after a lost response will then make a
  duplicate.

## Errors

Every error has the same shape:

```json
{ "error": { "code": "conflict", "message": "The card changed since you read it", "current": { … } } }
```

Branch on `code`, not on `message`. Messages may change.

| code | HTTP | meaning | retry? |
|---|---|---|---|
| `unauthorized` | 401 | no token, unknown token, or revoked device | no |
| `forbidden` | 403 | the user is not allowed to do this in the space (for example, rewording a shared copy or a card credited to someone else) | no |
| `not_found` | 404 | no such card or connection in this device's space, or no such route | no |
| `method_not_allowed` | 405 | wrong method for this path (see the `Allow` header) | no |
| `conflict` | 409 | the card changed since you read it (`current` holds it now), or an id is used elsewhere | after re-reading |
| `payload_too_large` | 413 | `text` over 10,000 characters | no |
| `validation_failed` | 400 / 422 | the request itself is wrong (the message names the field) | no |
| `unsupported_content` | 422 | the card has links, mentions, lists or formatting that plain text would erase (`rich: true`) | no |
| `rate_limited` | 429 | over 300 requests per minute for this device; wait `retry_after` seconds | yes |
| `unavailable` | 5xx | server-side trouble, including "could not check this device right now" | yes, with backoff |

## Card (node) shape

```json
{
  "id": "node_3f9a…",
  "type": "wonder",
  "text": "why do tides\nhappen twice a day?",
  "rich": false,
  "x": 120, "y": -40,
  "page_id": "page_…",
  "author_id": "…",
  "source_device_id": "dev_…",
  "created_at": "2026-10-07T14:03:11.204812+00:00",
  "updated_at": "2026-10-07T14:05:52.118300+00:00"
}
```

`text` has one line per paragraph or list item. Links read as their text and mentions as
`@Name`. `text` is empty for media cards (images, sketches, files).

`rich` is true when `text` is not the whole card: it has links, mentions, lists, headings or
formatting. A device can read such a card, but changing its text is refused (see below), because
writing plain text back would erase all of that.

Add `?include=content` to any read to also get `content`, the raw editor JSON.

## Endpoints

### `GET /api/v1/me`

Shows which device this is and where its cards land. Call it once after flashing to confirm the
token works.

```json
{ "device": { "id": "dev_…", "label": "CoreS3 #1" }, "owner_id": "…",
  "space": { "id": "space_…", "name": "Tide pools" }, "default_page_id": "page_…", "api_version": 1 }
```

### `GET /api/v1/nodes/:id` — read a card

Returns 200 with the card, or 404 `not_found`.

### `GET /api/v1/nodes` — list cards

Query: `limit` (1–100, default 50), `page_id`, `include=content`, and one of:

- `cursor`: the previous response's `next_cursor`, for the next page.
- `updated_since`: an ISO timestamp with a time zone (`2026-10-07T14:03:11Z`), for cards changed
  after it. Encode `+` as `%2B`.

Cards come oldest-changed first. `next_cursor` is `null` on the last page. Treat it as opaque and
pass it back unchanged.

```json
{ "nodes": [ … ], "next_cursor": "WyIyMDI2LTEwLTA3VDE0OjA1OjUy…" }
```

**Watching for changes.** `updated_at` changes only when a card's text changes. A card that was
only **moved** does not come back. Browsers stamp `updated_at` with their own clock, so an edit
from a laptop running a little slow can carry a time earlier than one you have already seen. To
poll, keep the newest `updated_at` you have seen, start each poll from `updated_since` about two
minutes before it, page through with `cursor`, and skip rows whose `id` and `updated_at` you
already have.

### `POST /api/v1/nodes` — create a card

| field | | |
|---|---|---|
| `id` | optional | `node_…`, minted on the device; makes retries safe |
| `text` | required | plain text, ≤ 10,000 characters |
| `x`, `y` | required | position |
| `type` | optional | `untyped` (default), `wonder`, `claim`, `ground`, `synthesis`, or the id of a custom type in this space. A type that is turned off for the space is refused with 422. |
| `page_id` | optional | defaults to the user's start page, then the space's landing page, then its first page |

Returns 201 with the card. A repeat with the same `id` returns 200 with the card this device
already made; any other card with that id gets 409 `conflict`.

Before the response is sent, the card's `#hashtags` become tags and the card is embedded, the
same as for a card typed in the browser. Embedding draws on the user's own embedding budget
(about 60 a minute, shared with their browser). Past it, the card is saved and tagged but not
embedded that time.

### `PATCH /api/v1/nodes/:id/position` — move a card

Body: `{ "x": 320, "y": 160 }`. Returns 200 with `{ "id", "x", "y" }`, kept small because
these can come several times a second.

Only the position is written, never the text, so a move cannot undo someone else's edit. It
does not change `updated_at`. Sending the same position twice is harmless.

If you stream positions from a dial or joystick, send at most about 5 per second per card, and
send the final position last.

### `PATCH /api/v1/nodes/:id/content` — change a card's text

Body: `{ "text": "…", "base_updated_at": "…" }`.

`base_updated_at` is optional. It should be the card's `updated_at` from your last read:

- With it, the change is compare-and-swap. If anyone changed the card since you read it, you get
  409 `conflict` with `current`, and nothing is overwritten.
- Without it, the change is last-writer-wins.

Only the text is written, never the position. Without `base_updated_at`, a save that races
another save is retried against the newer card rather than reported.

Sending text the card already has returns 200 and changes nothing, so a retry after a lost
response is safe either way.

Refusals:
- 403 `forbidden` for a card the user may not reword: another member's card (unless they manage
  the space), a shared copy (change the original instead), or a card credited to someone else.
- 422 `unsupported_content` for a card with `rich: true`.
- 422 `validation_failed` for a media card.

### `POST /api/v1/edges` — connect two cards

| field | | |
|---|---|---|
| `id` | optional | `edge_…`, minted on the device; makes retries safe |
| `from`, `to` | required | card ids in this space; not the same card. **`to` builds on `from`** — see below |
| `type` | optional | `related` (default), `supports`, `opposes`, `prompts`, `extends`, `raises`, `synthesizes`, `contextualizes`, `references` |

**Direction.** A connection reads `from` → `to`: the `to` card builds on the `from` card. This is
the arrow the app draws when a user chooses Build on, from the card being answered or extended to
the card that answers or extends it, usually the older card to the newer one. To reply to card X
with a new card Y, send `{"from": X, "to": Y}`. Sent the other way round, the link says X builds
on Y, and X still counts as unanswered, because the app counts a card as built on only when a link
starts from it (the "No build-on" filter uses this).

The server keeps the direction it is sent, as it does for a link a user draws by hand; it does not
reorder by age. `type` says how the two cards relate and does not change the direction. Use
`related` when no other type fits.

Returns 201 with `{ "id", "from", "to", "type", "author_id", "source_device_id", "created_at" }`.
A repeat with the same `id`, from this device, between the same two cards, returns 200; any
other use of that id gets 409. An end that is not a card in this space gets 422.

### `DELETE /api/v1/edges/:id` — remove a connection

Returns 204, including when the connection is already gone, so retries are safe. Returns 403
`forbidden` when the connection exists but the user did not draw it.

## Try it

These make real cards in the device's space. Remove them in the app afterwards: v1 cannot delete
cards.

```bash
TOKEN=wbd_…; BASE=https://www.wonderbits.org/api/v1
curl -s -H "Authorization: Bearer $TOKEN" $BASE/me
curl -s -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"id":"node_demo1","text":"from curl","x":0,"y":0}' $BASE/nodes
curl -s -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"id":"node_demo2","text":"second","x":300,"y":0}' $BASE/nodes
# node_demo2 builds on node_demo1: the arrow runs from the card answered to the card answering
curl -s -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"id":"edge_demo1","from":"node_demo1","to":"node_demo2"}' $BASE/edges
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"x":300,"y":200}' $BASE/nodes/node_demo2/position
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"text":"second, reworded"}' $BASE/nodes/node_demo2/content
curl -s -H "Authorization: Bearer $TOKEN" $BASE/nodes/node_demo2
curl -s -o /dev/null -w '%{http_code}\n' -X DELETE -H "Authorization: Bearer $TOKEN" $BASE/edges/edge_demo1
```

## What is recorded

Every write logs the same event the browser would log, with `actor_id` set to the user:

- `node.created`, with `creation_method: device`
- `node.position_changed`
- `node.content_revised`
- `edge.created`, with `discovery_method: device`
- `edge.deleted`

Each of these also carries `device_id` and `via: "api_v1"`.

A browser logs one `node.position_changed` per finished drag. A device has no "finished", so the
server logs a move only when it is at least 5 canvas units, and at most once per card per device
every 5 seconds.

## Not in v1 (yet)

- Deleting cards, changing a card's type, connection rationales, and images
- Mentions, because plain text cannot carry the structured mention the editor inserts
- Groups (clusters): moving a card does not add it to or remove it from a group
- Push notifications. To see what changed, poll `GET /nodes?updated_since=`.
- Tokens that reach more than one space

<style>
  .content pre { background: #f6f8fa; border: 1px solid #e5e7eb; border-radius: 6px; padding: 12px 14px; overflow-x: auto; font-size: 13px; line-height: 1.5; }
  .content pre code { background: none; color: inherit; padding: 0; }
  .content table { margin-bottom: 1rem; }
  .content th, .content td { border-bottom: 1px solid #e5e7eb; padding: 6px 12px 6px 0; vertical-align: top; }
</style>
