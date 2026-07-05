# Deploy Tell capture backend on Vultr

Use this when you have **Vultr credits** and want live Playwright capture for the hybrid setup:

| Layer | Platform | URL to share |
|---|---|---|
| **UI** | Vercel | [tell-five.vercel.app](https://tell-five.vercel.app) |
| **Capture** | Vultr VPS (Docker) | `http://YOUR_VULTR_IP:3000` (proxy only) |
| **MCP** | Local Cursor | clone repo |

Vercel proxies `/api/diagnose` to `TELL_CAPTURE_API_URL` on your Vultr box.

---

## 1. Create a Vultr instance

1. [my.vultr.com](https://my.vultr.com) → **Deploy** → **Cloud Compute**
2. **Location:** closest to you (e.g. Bangalore if available, else Singapore / US)
3. **Image:** Ubuntu 24.04 LTS
4. **Plan:** at least **2 vCPU / 4 GB RAM** (~$24/mo — well within $200 credits)
5. **SSH key:** add yours (recommended) or use password
6. **Firewall / Group:** allow **TCP 22** (SSH) and **TCP 3000** (Tell API)
7. Deploy → copy the **public IPv4**

Do **not** expose secrets in Vultr “User Data”; set keys on the server in step 3.

---

## 2. One-command install (SSH)

```bash
ssh root@YOUR_VULTR_IP

curl -fsSL https://raw.githubusercontent.com/ashishpatill/tell-ai-ui-critic/master/scripts/vultr/setup.sh | bash
```

First build takes **10–15 minutes** (Playwright + Chromium).

---

## 3. Add API keys on the server

```bash
sudo nano /etc/tell-capture.env
```

Set at minimum:

```
GEMINI_API_KEY=your-key-here
CURSOR_API_KEY=          # optional
```

Restart:

```bash
docker restart tell-capture
```

---

## 4. Smoke test

```bash
curl -X POST "http://YOUR_VULTR_IP:3000/api/diagnose" \
  -H "content-type: application/json" \
  -d '{"url":"https://example.com"}'
```

You should get JSON with `"live": true` in `meta` (may take ~30s first run).

---

## 5. Wire Vercel to Vultr

1. [vercel.com](https://vercel.com) → project **tell** → **Settings → Environment Variables**
2. Set **`TELL_CAPTURE_API_URL`** = `http://YOUR_VULTR_IP:3000`
3. **Redeploy** production

Judges still use **https://tell-five.vercel.app** — capture runs on your Vultr VPS in the background.

---

## Manual / update deploy

On the server:

```bash
cd /opt/tell
git pull origin master
docker build -t tell-capture:latest .
docker rm -f tell-capture
docker run -d --name tell-capture --restart unless-stopped \
  -p 3000:3000 --env-file /etc/tell-capture.env tell-capture:latest
```

Or with compose:

```bash
cd /opt/tell
docker compose -f docker-compose.vultr.yml up -d --build
```

---

## Optional: HTTPS with a domain

If you have a domain pointing at the Vultr IP:

```bash
apt-get install -y caddy
cat >/etc/caddy/Caddyfile <<EOF
capture.yourdomain.com {
  reverse_proxy localhost:3000
}
EOF
systemctl reload caddy
```

Then set `TELL_CAPTURE_API_URL=https://capture.yourdomain.com` on Vercel.

---

## Troubleshooting

| Issue | Fix |
|---|---|
| Connection refused on :3000 | Vultr firewall group + `ufw allow 3000` |
| Container OOM | Upgrade to 4 GB+ RAM plan |
| Capture timeout | Increase `TELL_CAPTURE_TIMEOUT_MS=120000` in `/etc/tell-capture.env` |
| Vercel still offline demo | Confirm `TELL_CAPTURE_API_URL` and redeploy Vercel |

---

## Cost note

~$24/mo for 4 GB RAM → **~8 months** on $200 credits for the hackathon demo window.
