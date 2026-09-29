import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { config } from "../public/config.js";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const publicDirectory = join(projectRoot, "public");
const requiredFiles = ["index.html", "app.js", "config.js", "styles.css", "_headers", "mascot.gif"];

export function assertRequiredFiles(directory) {
  const missing = requiredFiles.filter((file) => !existsSync(join(directory, file)));
  if (missing.length > 0) throw new Error(`Missing required public files: ${missing.join(", ")}`);
}

export function assertConfigShape(value) {
  if (!Array.isArray(value?.rssFeeds) || !value.rssFeeds.every((feed) => typeof feed === "string")) {
    throw new Error("config.rssFeeds must be an array of strings");
  }
  if (!value.links || typeof value.links !== "object" || Array.isArray(value.links)) {
    throw new Error("config.links must be an object of link groups");
  }
  for (const [group, links] of Object.entries(value.links)) {
    if (!Array.isArray(links) || !links.every((link) => (
      link && typeof link.url === "string" && typeof link.title === "string"
    ))) {
      throw new Error(`config.links.${group} must be an array of links with string URLs and titles`);
    }
  }
}

export function validateBuild() {
  assertRequiredFiles(publicDirectory);
  assertConfigShape(config);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    validateBuild();
    console.log("Build assets and configuration are valid.");
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}