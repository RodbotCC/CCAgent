# Comeketo Agent Connectors — what each channel needs

Comeketo Agent keeps all credentials server-side in `.env`, read by `server.py` at startup.
**Never paste a secret into the browser or the code.** Paste it into `.env`, restart the server, refresh the app — the channel flips from amber ("needs setup") to green ("ready").

After editing `.env`:
```sh
# stop the running server (Ctrl-C in its terminal), then:
cd "/Users/jakeaaron/Downloads/CC Agent"
python3 server.py 3423
```

## Status summary (as of 2026-04-22)

| Channel   | Status      | What's needed                                                                  |
|-----------|-------------|--------------------------------------------------------------------------------|
| ClickUp   | ✅ ready     | Already set. `CLICKUP_API_TOKEN` is in `.env`. Just paste a `CLICKUP_LIST_ID`. |
| Slack     | ⚠️ fix      | Current token is `xapp-` (app-level). Need `xoxb-` Bot User OAuth token.       |
| Calendar  | ⭕️ add      | Need Google Calendar OAuth — see below.                                        |
| WhatsApp  | ⭕️ add      | Cleanest route is Twilio sandbox — see below.                                  |
| SMS       | ⭕️ add      | Same Twilio account as WhatsApp.                                               |
| Email     | ⭕️ add      | Gmail API or SMTP — see below.                                                 |

---

## ClickUp — already works, just needs a default list

Paste into `.env`:
```
# Already present:
CLICKUP_API_TOKEN=pk_...
CLICKUP_TEAM_ID=36002229
CLICKUP_SPACE_ID=90114126381

# Add this — the list you want commits to land in by default:
CLICKUP_LIST_ID=901234567890
```

Finding your list ID: open a list in ClickUp, the URL is `https://app.clickup.com/…/l/901234567890` — that last number is it.

Alternatively, you can skip `CLICKUP_LIST_ID` and paste the list id into the **Target** field on any commitment.

**Commitment shape when channel = clickup:**
- `target` → list id (falls back to `CLICKUP_LIST_ID`)
- `subject` → task name
- `body` → task description

---

## Slack — swap the token

You currently have `SLACK_BOT_TOKEN=xapp-…`. That's the app-level token for Socket Mode and won't work for `chat.postMessage`. You need a **Bot User OAuth Token** starting with `xoxb-`.

Steps:
1. Go to https://api.slack.com/apps → your app → **OAuth & Permissions**
2. Scopes → Bot Token Scopes → add `chat:write`, `chat:write.public` (if you want to post to public channels without being invited), `im:write`, `users:read`
3. Scroll up, click **Install to Workspace** (or Reinstall)
4. Copy the **Bot User OAuth Token** (starts with `xoxb-`)
5. Paste into `.env`:
   ```
   SLACK_BOT_TOKEN=xoxb-...
   ```
6. Restart `server.py`

**Commitment shape when channel = slack:**
- `target` → channel ID like `C01ABCDEF` or user ID `U01ABCDEF`, or `#channel-name`
- `body` → message text (Slack markdown supported)

---

## Google Calendar — OAuth or access token

Fastest for solo-operator use: generate an access token via OAuth Playground and paste it.

1. Go to https://developers.google.com/oauthplayground/
2. In the left panel, find **Google Calendar API v3** → select `https://www.googleapis.com/auth/calendar.events`
3. Click **Authorize APIs**, sign in, grant access
4. Click **Exchange authorization code for tokens**
5. Copy **Access token** (expires in 1 hour) and **Refresh token** (long-lived)
6. Paste into `.env`:
   ```
   GOOGLE_CALENDAR_ACCESS_TOKEN=ya29...
   GOOGLE_CALENDAR_REFRESH_TOKEN=1//0g...
   GOOGLE_OAUTH_CLIENT_ID=...apps.googleusercontent.com
   GOOGLE_OAUTH_CLIENT_SECRET=...
   ```

The server.py will handle refresh using the refresh token + client creds.

For something more durable: create a Google Cloud project → enable Calendar API → OAuth consent screen → Desktop-app client credentials → paste Client ID + Secret above, then run a one-time auth script (I'll write one when you want to actually ship this).

**Commitment shape when channel = calendar:**
- `target` → comma-separated attendee emails
- `subject` → event title
- `body` → event description (optionally starts with `YYYY-MM-DD HH:MM / N min` to auto-parse the time)

---

## WhatsApp — Twilio is the cleanest path

Twilio has a free sandbox that works immediately. Full business setup is a multi-day Meta verification; skip until you care.

**Sandbox setup (5 minutes):**
1. Create Twilio account: https://www.twilio.com/try-twilio
2. Console → Messaging → Try it out → **Send a WhatsApp message**
3. Follow instructions to join the sandbox from your phone (send `join <word>` to +1-415-523-8886 via WhatsApp)
4. Copy from the Twilio console:
   - Account SID
   - Auth Token
   - Sandbox number (shown as something like `whatsapp:+14155238886`)
5. Paste into `.env`:
   ```
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```

**Sandbox caveats:** recipients have to join the sandbox first (same `join <word>` process). In practice this means it works for you and anyone you onboard personally.

**Production:** requires Meta business verification + approved message templates. Ask me when you want it.

**Commitment shape when channel = whatsapp:**
- `target` → phone with country code, no spaces, like `+15551234567`
- `body` → message text

---

## SMS — same Twilio account

Once Twilio is up:
1. Twilio console → Phone Numbers → buy a number (~$1/mo + per-message)
2. Paste into `.env`:
   ```
   TWILIO_SMS_FROM=+15551234567
   # TWILIO_ACCOUNT_SID + AUTH_TOKEN already set for WhatsApp
   ```

---

## Email — Gmail API or SMTP

**SMTP route (dumbest, works):**
1. Gmail → Google account → Security → 2-Step Verification (must be on)
2. App passwords → generate one for "Mail"
3. Paste into `.env`:
   ```
   GMAIL_ADDRESS=you@gmail.com
   GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
   ```

**Gmail API route (more capable — supports labels, threading, attachments):**
Same OAuth Playground flow as Calendar, scope: `https://www.googleapis.com/auth/gmail.send`

---

## What the app does when you click Send

1. Commitment has a `channel` field (AI-picked on draft, user-editable via bubble picker).
2. `connectors.send(channel, { target, subject, body })` hits the right proxy route.
3. Server forwards to the vendor API with the right auth header.
4. Vendor response → `{ ok: true/false, note: "...", transcript: {...} }`
5. Commitment updates: traffic light turns green (sent) or red (failed); note field shows vendor's reply.

In demo mode (default ON, Settings → Intelligence), the proxy blocks all vendor writes — the traffic light still goes green but the `note` says "demo · blocked at proxy, no write." Turn demo mode off to actually send.
