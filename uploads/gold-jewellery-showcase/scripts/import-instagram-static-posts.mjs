import fs from "node:fs";
import path from "node:path";

const sourceManifestPath = process.argv[2];

if (!sourceManifestPath || !fs.existsSync(sourceManifestPath)) {
  throw new Error("Pass the browser static-post manifest path as the first argument.");
}

const accountRoot = path.resolve(
  "gold-jewellery-showcase/assets/instagram/gold_gallery_uk",
);
const imagesDirectory = path.join(accountRoot, "images");
const staticDirectory = path.join(imagesDirectory, "static-posts");
const rootImageNames = fs.readdirSync(imagesDirectory, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name);
const sourceRecords = JSON.parse(fs.readFileSync(sourceManifestPath, "utf8"));

fs.mkdirSync(staticDirectory, { recursive: true });

const records = sourceRecords.map((record) => {
  const existingName = rootImageNames.find((name) =>
    name.includes(`_${record.shortcode}_`),
  );
  const relativeFilename = existingName
    ? path.join("images", existingName)
    : path.join("images", "static-posts", `${record.shortcode}.jpg`);
  const destination = path.join(accountRoot, relativeFilename);

  if (!existingName) {
    fs.copyFileSync(record.downloadedPath, destination);
  }

  return {
    shortcode: record.shortcode,
    postUrl: record.postUrl,
    alt: record.alt,
    sourceUrl: record.sourceUrl,
    filename: relativeFilename,
    bytes: fs.statSync(destination).size,
    reused: Boolean(existingName),
  };
});

fs.writeFileSync(
  path.join(accountRoot, "static-posts.json"),
  JSON.stringify(records, null, 2),
);

const countImages = (directory) => fs.readdirSync(directory, { withFileTypes: true })
  .reduce(
    (count, entry) => count + (entry.isDirectory()
      ? countImages(path.join(directory, entry.name))
      : 1),
    0,
  );
const manifestPath = path.join(accountRoot, "manifest.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

Object.assign(manifest, {
  accessiblePosts: 68,
  staticPosts: records.length,
  discoveredReels: 35,
  totalLocalImages: countImages(imagesDirectory),
  staticPostsManifest: "static-posts.json",
  enrichedAt: new Date().toISOString(),
});

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(JSON.stringify({
  staticPosts: records.length,
  reused: records.filter((record) => record.reused).length,
  newlyCopied: records.filter((record) => !record.reused).length,
  totalLocalImages: manifest.totalLocalImages,
  output: path.join(accountRoot, "static-posts.json"),
}, null, 2));
