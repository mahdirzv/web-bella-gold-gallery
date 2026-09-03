import fs from "node:fs";
import path from "node:path";

const accountRoot = path.resolve(
  "gold-jewellery-showcase/assets/instagram/gold_gallery_uk",
);
const imagesDirectory = path.join(accountRoot, "images");

fs.mkdirSync(imagesDirectory, { recursive: true });

const profile = JSON.parse(
  fs.readFileSync(path.join(accountRoot, "profile.json"), "utf8"),
);
const postRecords = JSON.parse(
  fs.readFileSync(path.join(accountRoot, "post-records.json"), "utf8"),
);
const reelsHistoryPath = path.join(accountRoot, "brightdata-reels-history.json");
const discoveredReels = fs.existsSync(reelsHistoryPath)
  ? JSON.parse(fs.readFileSync(reelsHistoryPath, "utf8"))
  : [];
const profilePostsByUrl = new Map(
  (profile.posts ?? []).map((post) => [post.url, post]),
);

const assets = [];
const normalizeInstagramUrl = (url) => url?.replace(/\/+$/, "");

if (profile.profile_image_link) {
  assets.push({
    kind: "profile",
    source: profile.profile_url ?? profile.url,
    url: profile.profile_image_link,
    baseName: "profile",
  });
}

for (const [index, highlight] of (profile.highlights ?? []).entries()) {
  if (!highlight.image) continue;

  assets.push({
    kind: "highlight",
    source: highlight.highlight_url,
    title: highlight.title,
    url: highlight.image,
    baseName: `highlight-${String(index + 1).padStart(2, "0")}-${highlight.id}`,
  });
}

for (const record of postRecords) {
  const post = record.data?.[0];
  if (!post) continue;

  const date = post.date_posted?.slice(0, 10) ?? "undated";

  if (post.content_type === "Image") {
    for (const [index, image] of (post.images ?? []).entries()) {
      const source = post.url ?? record.url;
      assets.push({
        kind: "post-image",
        source,
        shortcode: post.shortcode,
        date: post.date_posted,
        url: image.url,
        fallbackUrl: profilePostsByUrl.get(source)?.image_url,
        baseName: `${date}_${post.shortcode}_${String(index + 1).padStart(2, "0")}`,
      });
    }
  } else if (post.thumbnail) {
    const source = post.url ?? record.url;
    assets.push({
      kind: "reel-cover",
      source,
      shortcode: post.shortcode,
      date: post.date_posted,
      url: post.thumbnail,
      fallbackUrl: profilePostsByUrl.get(source)?.image_url,
      baseName: `${date}_${post.shortcode}_cover`,
    });
  }
}

for (const reel of discoveredReels) {
  if (!reel.thumbnail || !reel.shortcode) continue;

  const date = reel.date_posted?.slice(0, 10) ?? "undated";
  assets.push({
    kind: "reel-cover",
    source: reel.url,
    shortcode: reel.shortcode,
    date: reel.date_posted,
    url: reel.thumbnail,
    baseName: `${date}_${reel.shortcode}_cover`,
  });
}

async function downloadAsset(asset) {
  const existingFilename = ["jpg", "webp", "png"]
    .map((extension) => `${asset.baseName}.${extension}`)
    .find((filename) => fs.existsSync(path.join(imagesDirectory, filename)));

  if (existingFilename) {
    return {
      ...asset,
      filename: existingFilename,
      bytes: fs.statSync(path.join(imagesDirectory, existingFilename)).size,
      contentType: "image/jpeg",
      reused: true,
    };
  }

  let lastError;

  const genericCdnUrl = (() => {
    try {
      const url = new URL(asset.url);
      if (!url.hostname.endsWith(".cdninstagram.com")) return undefined;
      url.hostname = "scontent.cdninstagram.com";
      return url.toString();
    } catch {
      return undefined;
    }
  })();
  const candidateUrls = [
    ...new Set([asset.url, asset.fallbackUrl, genericCdnUrl].filter(Boolean)),
  ];

  for (const [urlIndex, candidateUrl] of candidateUrls.entries()) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(candidateUrl, {
          signal: AbortSignal.timeout(20_000),
        });
        if (!response.ok) {
          throw new Error(`${response.status} while downloading ${asset.source}`);
        }

        const contentType = (response.headers.get("content-type") ?? "").toLowerCase();
        const extension = contentType.includes("webp")
          ? "webp"
          : contentType.includes("png")
            ? "png"
            : "jpg";
        const filename = `${asset.baseName}.${extension}`;
        const buffer = Buffer.from(await response.arrayBuffer());

        fs.writeFileSync(path.join(imagesDirectory, filename), buffer);

        return {
          ...asset,
          filename,
          bytes: buffer.length,
          contentType,
          attempt,
          usedFallback: urlIndex > 0,
        };
      } catch (error) {
        lastError = error;
      }
    }
  }

  throw lastError;
}

const downloadedAssets = [];
const failedAssets = [];

const uniqueAssets = [
  ...new Map(assets.map((asset) => [asset.baseName, asset])).values(),
];

for (let index = 0; index < uniqueAssets.length; index += 3) {
  const batch = uniqueAssets.slice(index, index + 3);
  const results = await Promise.allSettled(batch.map(downloadAsset));

  results.forEach((result, resultIndex) => {
    if (result.status === "fulfilled") {
      downloadedAssets.push(result.value);
      console.log(`Saved ${result.value.filename}`);
    } else {
      const asset = batch[resultIndex];
      failedAssets.push({
        ...asset,
        error: result.reason?.message ?? String(result.reason),
      });
      console.error(`Failed ${asset.source}: ${result.reason?.message ?? result.reason}`);
    }
  });
}

const manifest = {
  account: profile.account,
  profilePostsCount: profile.posts_count,
  accessiblePosts: new Set([
    ...postRecords.map((record) => normalizeInstagramUrl(record.url)),
    ...discoveredReels.map((reel) => normalizeInstagramUrl(reel.url)),
  ]).size,
  discoveredReels: discoveredReels.length,
  downloadedAt: new Date().toISOString(),
  assets: downloadedAssets,
  failures: failedAssets,
};

fs.writeFileSync(
  path.join(accountRoot, "manifest.json"),
  JSON.stringify(manifest, null, 2),
);

console.log(
  JSON.stringify(
    {
      requested: uniqueAssets.length,
      downloaded: downloadedAssets.length,
      failed: failedAssets.length,
      totalBytes: downloadedAssets.reduce((sum, asset) => sum + asset.bytes, 0),
      directory: imagesDirectory,
      manifest: path.join(accountRoot, "manifest.json"),
    },
    null,
    2,
  ),
);
