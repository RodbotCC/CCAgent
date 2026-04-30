#!/usr/bin/env node

const fs = require("fs");
const { chromium } = require("playwright");

const payload = JSON.parse(process.env.BROWSER_USE_PAYLOAD || "{}");
const text = String(payload.text || "").trim();
const screenshotPath = payload.screenshot_path || "";
const settings = payload.settings || {};
const maxItems = Math.max(3, Math.min(20, Number(settings.resultLimit || payload.max_items || 8) || 8));
const detail = String(settings.detail || payload.detail || "standard").toLowerCase();
const includeLinks = settings.includeLinks !== false && payload.include_links !== false;

function pickTarget(input) {
  const raw = String(input || "");
  const urlMatch = raw.match(/https?:\/\/[^\s)]+/i);
  if (urlMatch) {
    return { kind: "url", url: urlMatch[0], query: raw };
  }

  const lower = raw.toLowerCase();
  if (/\bai news\b/i.test(raw)) {
    return {
      kind: "youtube",
      query: "AI news",
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent("AI news")}&sp=CAI%253D`,
    };
  }
  let query = raw
    .replace(/\b(open up|open|go to|search|look up|find|show me|let'?s see what'?s new in|let us see what is new in|what'?s new in|what is new in)\b/gi, " ")
    .replace(/\bgoogle chrome\b/gi, " ")
    .replace(/\byoutube\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!query) query = "AI news";

  if (lower.includes("youtube") || lower.includes("video")) {
    return {
      kind: "youtube",
      query,
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=CAI%253D`,
    };
  }
  return {
    kind: "web",
    query,
    url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
  };
}

async function launchBrowser() {
  try {
    return await chromium.launch({ channel: "chrome", headless: true });
  } catch (_e) {
    return await chromium.launch({ headless: true });
  }
}

async function extractYoutube(page) {
  await page.waitForLoadState("domcontentloaded", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const items = await page.locator("ytd-video-renderer").evaluateAll((nodes) => {
    return nodes.map((node) => {
      const titleAnchor = node.querySelector("#video-title");
      const channel = node.querySelector("ytd-channel-name a, #channel-info a");
      const meta = Array.from(node.querySelectorAll("#metadata-line span"))
        .map((el) => (el.textContent || "").trim())
        .filter(Boolean);
      const desc = node.querySelector("#description-text");
      return {
        title: (titleAnchor && titleAnchor.textContent || "").trim(),
        url: titleAnchor && titleAnchor.href || "",
        channel: (channel && channel.textContent || "").trim(),
        metadata: meta,
        description: (desc && desc.textContent || "").trim().replace(/\s+/g, " ").slice(0, 220),
      };
    }).filter((item) => item.title);
  }).catch(() => []);
  const sliced = items.slice(0, maxItems);

  const lineFor = (item, idx) => {
    const meta = item.metadata && item.metadata.length ? ` (${item.metadata.join(" · ")})` : "";
    const channel = item.channel ? ` — ${item.channel}` : "";
    const url = includeLinks && item.url ? `\n   ${item.url}` : "";
    const desc = detail === "deep" && item.description ? `\n   ${item.description}` : "";
    return `${idx + 1}. ${item.title}${channel}${meta}${url}${desc}`;
  };

  return {
    title: await page.title().catch(() => "YouTube"),
    items: sliced,
    summary: sliced.length
      ? sliced.map(lineFor).join("\n")
      : "Opened YouTube search, but no video result cards were readable from the headless page.",
  };
}

async function extractGeneric(page) {
  await page.waitForLoadState("domcontentloaded", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const links = await page.locator("a").evaluateAll((nodes) => {
    return nodes.map((node) => ({
      text: (node.textContent || "").trim().replace(/\s+/g, " "),
      url: node.href || "",
    }))
    .filter((item) => item.text && item.url && !item.url.startsWith("javascript:"))
  }).catch(() => []);
  const sliced = links.slice(0, maxItems);
  return {
    title: await page.title().catch(() => "Browser result"),
    items: sliced,
    summary: sliced.length
      ? sliced.map((item, idx) => `${idx + 1}. ${item.text}${includeLinks && item.url ? `\n   ${item.url}` : ""}`).join("\n")
      : /sorry|unusual traffic/i.test(await page.title().catch(() => ""))
        ? "Search provider blocked the automated request. Use `open browser` for a visible search, or try a more specific URL."
        : "Opened the page, but no readable links were found.",
  };
}

(async () => {
  if (!text) throw new Error("missing text");
  const target = pickTarget(text);
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  try {
    await page.goto(target.url, { waitUntil: "domcontentloaded", timeout: 30000 });
    const result = target.kind === "youtube" ? await extractYoutube(page) : await extractGeneric(page);
    if (screenshotPath) {
      fs.mkdirSync(require("path").dirname(screenshotPath), { recursive: true });
      await page.screenshot({ path: screenshotPath, fullPage: false }).catch(() => {});
    }
    console.log(JSON.stringify({
      ok: true,
      kind: target.kind,
      query: target.query,
      url: page.url(),
      title: result.title,
      settings: { resultLimit: maxItems, detail, includeLinks },
      items: result.items,
      summary: result.summary,
      screenshot_path: screenshotPath || null,
    }));
  } finally {
    await browser.close().catch(() => {});
  }
})().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
