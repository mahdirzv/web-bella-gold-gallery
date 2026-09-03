import fs from "node:fs";
import path from "node:path";

const account = "gold_gallery_uk";
const profileUrl = `https://www.instagram.com/${account}/`;
const accountRoot = path.resolve(
  `gold-jewellery-showcase/assets/instagram/${account}`,
);
const configPath = "/Users/rzvmahdi/.codex/config.toml";

const config = fs.readFileSync(configPath, "utf8");
const serverSection = config.match(
  /\[mcp_servers\.bright-data\.env\]([\s\S]*?)(?=\n\[|$)/,
);
const token = serverSection?.[1].match(/API_TOKEN\s*=\s*"([^"]+)"/)?.[1];

if (!token) {
  throw new Error("Bright Data API token was not found in the Codex configuration.");
}

fs.mkdirSync(accountRoot, { recursive: true });

const standardJobs = [
  {
    name: "posts",
    datasetId: "gd_lk5ns7kz21pck8jpis",
    input: { url: profileUrl, num_of_posts: 68, post_type: "post" },
  },
  {
    name: "reels",
    datasetId: "gd_lyclm20il4r5helnj",
    input: { url: profileUrl, num_of_posts: 68 },
  },
];
const jobs = process.argv.includes("--legacy-posts")
  ? [
      {
        name: "posts-legacy-retry",
        datasetId: "gd_l1vikfch901nx3by4",
        input: { url: profileUrl, num_of_posts: 33, post_type: "post" },
      },
    ]
  : process.argv.includes("--retry-posts")
    ? [
      {
        name: "posts-capital-retry",
        datasetId: "gd_lk5ns7kz21pck8jpis",
        input: { url: profileUrl, num_of_posts: 33, post_type: "Post" },
      },
      ]
    : standardJobs;

async function brightDataRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
    signal: AbortSignal.timeout(90_000),
  });

  const text = await response.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 500)}`);
  }

  return data;
}

async function triggerJob(job) {
  const query = new URLSearchParams({
    dataset_id: job.datasetId,
    type: "discover_new",
    discover_by: "url",
    format: "json",
    include_errors: "true",
  });
  const url = `https://api.brightdata.com/datasets/v3/trigger?${query}`;
  const result = await brightDataRequest(url, {
    method: "POST",
    body: JSON.stringify([job.input]),
  });

  if (!result?.snapshot_id) {
    throw new Error(`No snapshot_id returned for ${job.name}: ${JSON.stringify(result)}`);
  }

  return { ...job, snapshotId: result.snapshot_id };
}

async function waitForJob(job) {
  const startedAt = Date.now();
  const maximumWait = 15 * 60 * 1000;
  let lastStatus;

  while (Date.now() - startedAt < maximumWait) {
    const progress = await brightDataRequest(
      `https://api.brightdata.com/datasets/v3/progress/${job.snapshotId}`,
    );
    const status = progress.status;

    if (status !== lastStatus) {
      console.log(`${job.name}: ${status} (${job.snapshotId})`);
      lastStatus = status;
    }

    if (status === "ready") return progress;
    if (status === "failed") {
      throw new Error(`${job.name} failed: ${JSON.stringify(progress)}`);
    }

    await new Promise((resolve) => setTimeout(resolve, 10_000));
  }

  throw new Error(`${job.name} timed out after 15 minutes (${job.snapshotId})`);
}

async function downloadSnapshot(job) {
  const query = new URLSearchParams({ format: "json" });
  return brightDataRequest(
    `https://api.brightdata.com/datasets/v3/snapshot/${job.snapshotId}?${query}`,
  );
}

const run = {
  account,
  profileUrl,
  startedAt: new Date().toISOString(),
  jobs: [],
};

for (const job of jobs) {
  try {
    const triggered = await triggerJob(job);
    run.jobs.push({
      name: job.name,
      datasetId: job.datasetId,
      snapshotId: triggered.snapshotId,
      status: "triggered",
    });
    console.log(`${job.name}: triggered (${triggered.snapshotId})`);
  } catch (error) {
    run.jobs.push({
      name: job.name,
      datasetId: job.datasetId,
      status: "trigger_failed",
      error: error.message,
    });
    console.error(`${job.name}: ${error.message}`);
  }
}

fs.writeFileSync(
  path.join(accountRoot, "brightdata-async-run.json"),
  JSON.stringify(run, null, 2),
);

for (const runJob of run.jobs.filter((job) => job.snapshotId)) {
  try {
    const job = jobs.find((candidate) => candidate.name === runJob.name);
    const activeJob = { ...job, snapshotId: runJob.snapshotId };
    await waitForJob(activeJob);
    const records = await downloadSnapshot(activeJob);
    const recordCount = Array.isArray(records) ? records.length : 0;

    fs.writeFileSync(
      path.join(accountRoot, `brightdata-${job.name}-history.json`),
      JSON.stringify(records, null, 2),
    );

    Object.assign(runJob, {
      status: "ready",
      recordCount,
      output: `brightdata-${job.name}-history.json`,
    });
    console.log(`${job.name}: downloaded ${recordCount} records`);
  } catch (error) {
    Object.assign(runJob, { status: "failed", error: error.message });
    console.error(`${runJob.name}: ${error.message}`);
  }

  fs.writeFileSync(
    path.join(accountRoot, "brightdata-async-run.json"),
    JSON.stringify({ ...run, completedAt: new Date().toISOString() }, null, 2),
  );
}

console.log(JSON.stringify(run, null, 2));
