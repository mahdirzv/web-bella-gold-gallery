import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const account = "gold_gallery_uk";
const accountRoot = path.resolve(
  `gold-jewellery-showcase/assets/instagram/${account}`,
);
const config = fs.readFileSync("/Users/rzvmahdi/.codex/config.toml", "utf8");
const section = config.match(
  /\[mcp_servers\.bright-data\.env\]([\s\S]*?)(?=\n\[|$)/,
);
const token = section?.[1].match(/API_TOKEN\s*=\s*"([^"]+)"/)?.[1];

if (!token) throw new Error("Bright Data API token not found.");

const child = spawn("npx", ["-y", "@brightdata/mcp"], {
  env: { ...process.env, API_TOKEN: token, PRO_MODE: "true" },
  stdio: ["pipe", "pipe", "inherit"],
});

let nextId = 1;
let buffer = "";
const pending = new Map();

child.stdout.setEncoding("utf8");
child.stdout.on("data", (chunk) => {
  buffer += chunk;
  const lines = buffer.split("\n");
  buffer = lines.pop() ?? "";

  for (const line of lines) {
    if (!line.trim().startsWith("{")) continue;
    const message = JSON.parse(line);
    if (!message.id || !pending.has(message.id)) continue;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result);
  }
});

function request(method, params = {}) {
  const id = nextId++;
  const promise = new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
  });
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
  return promise;
}

function notify(method, params = {}) {
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method, params })}\n`);
}

function textFromResult(result) {
  return (result?.content ?? [])
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");
}

function extractInstagramUrls(html) {
  const urls = new Set();
  const decoded = html.replaceAll("&amp;", "&").replaceAll("\\/", "/");
  const pattern = /(?:https:\/\/www\.instagram\.com)?\/(?:p|reel)\/[A-Za-z0-9_-]+\/?/g;

  for (const match of decoded.matchAll(pattern)) {
    urls.add(`https://www.instagram.com${match[0].replace(/^https:\/\/www\.instagram\.com/, "")}`);
  }
  return urls;
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

try {
  await request("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "gold-gallery-history", version: "1.0.0" },
  });
  notify("notifications/initialized");

  const navigate = await request("tools/call", {
    name: "scraping_browser_navigate",
    arguments: {
      url: `https://www.instagram.com/${account}/`,
      country: "GB",
    },
  });
  console.log(textFromResult(navigate));

  const discovered = new Set();
  let unchangedPasses = 0;

  for (let pass = 0; pass < 20 && unchangedPasses < 4; pass += 1) {
    await sleep(pass === 0 ? 4_000 : 2_500);
    const htmlResult = await request("tools/call", {
      name: "scraping_browser_get_html",
      arguments: { full_page: false },
    });
    const before = discovered.size;

    for (const url of extractInstagramUrls(textFromResult(htmlResult))) {
      discovered.add(url);
    }

    console.log(`browser pass ${pass + 1}: ${discovered.size} post links`);
    unchangedPasses = discovered.size === before ? unchangedPasses + 1 : 0;

    await request("tools/call", {
      name: "scraping_browser_scroll",
      arguments: {},
    });
  }

  const output = {
    account,
    profileUrl: `https://www.instagram.com/${account}/`,
    collectedAt: new Date().toISOString(),
    count: discovered.size,
    urls: [...discovered],
  };
  fs.writeFileSync(
    path.join(accountRoot, "brightdata-browser-post-links.json"),
    JSON.stringify(output, null, 2),
  );
  console.log(JSON.stringify({ count: output.count, output: "brightdata-browser-post-links.json" }));
} finally {
  child.kill("SIGTERM");
}
