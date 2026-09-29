import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { assertConfigShape, assertRequiredFiles } from "../scripts/validate-build.js";

test("build validation rejects missing required public files", () => {
  const directory = mkdtempSync(join(tmpdir(), "startpage-build-"));
  try {
    for (const file of ["index.html", "app.js", "config.js", "styles.css", "_headers", "mascot.gif"]) {
      writeFileSync(join(directory, file), "");
    }
    assert.doesNotThrow(() => assertRequiredFiles(directory));
    rmSync(join(directory, "_headers"));
    assert.throws(() => assertRequiredFiles(directory), /_headers/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("build validation checks RSS and link configuration shapes", () => {
  assert.doesNotThrow(() => assertConfigShape({ rssFeeds: [], links: { news: [] } }));
  assert.throws(() => assertConfigShape({ rssFeeds: "feed", links: {} }), /rssFeeds/);
  assert.throws(() => assertConfigShape({ rssFeeds: [], links: { news: [{ url: "/" }] } }), /links.news/);
});