import { config } from "./config.js";

const linkGroups = document.querySelector("#link-groups");
const rssStatus = document.querySelector("#rss-status");
const rssItems = document.querySelector("#rss-items");
const rssRefresh = document.querySelector("#rss-refresh");
const localClock = document.querySelector("#local-clock");
const localDate = document.querySelector("#local-date");
const themeOptions = Array.from(document.querySelectorAll("[data-theme-option]"));
const themeModes = ["auto", "light", "night"];
const themePreference = "startpage-theme";
const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
const savedTheme = localStorage.getItem(themePreference);
let activeTheme = savedTheme === "dark" ? "night" : savedTheme;
if (!themeModes.includes(activeTheme)) activeTheme = "auto";

function applyTheme() {
  if (activeTheme === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.dataset.theme = activeTheme;

  for (const option of themeOptions) {
    const selected = option.dataset.themeOption === activeTheme;
    option.setAttribute("aria-checked", String(selected));
    option.tabIndex = selected ? 0 : -1;
  }

  const isNight = activeTheme === "night" || (activeTheme === "auto" && systemTheme.matches);
  document.querySelector('meta[name="theme-color"]').content = isNight ? "#343A3C" : "#f1f3ec";
}

function selectTheme(option) {
  activeTheme = option.dataset.themeOption;
  localStorage.setItem(themePreference, activeTheme);
  applyTheme();
}

for (const option of themeOptions) {
  option.addEventListener("click", () => selectTheme(option));
  option.addEventListener("keydown", (event) => {
    const currentIndex = themeOptions.indexOf(option);
    let nextIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % themeOptions.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + themeOptions.length) % themeOptions.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = themeOptions.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextOption = themeOptions[nextIndex];
    nextOption.focus();
    selectTheme(nextOption);
  });
}

systemTheme.addEventListener("change", () => {
  if (activeTheme === "auto") applyTheme();
});

applyTheme();

function updateLocalDateTime() {
  const now = new Date();
  localClock.dateTime = now.toISOString();
  localClock.textContent = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(now);
  localDate.textContent = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(now);
}

updateLocalDateTime();
setInterval(updateLocalDateTime, 60_000);

function safeUrl(value) {
  try {
    const url = new URL(value, window.location.href);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function renderLinks() {
  for (const [groupName, links] of Object.entries(config.links ?? {})) {
    const group = document.createElement("section");
    group.className = "link-group";

    const heading = document.createElement("h3");
    heading.textContent = groupName;
    group.append(heading);

    const list = document.createElement("ul");
    list.className = "link-list";

    for (const item of links) {
      const href = safeUrl(item.url);
      if (!href || !item.title) continue;

      const row = document.createElement("li");
      const link = document.createElement("a");
      link.className = "link-item";
      link.href = href;
      link.textContent = item.title;
      row.append(link);
      list.append(row);
    }

    group.append(list);
    linkGroups.append(group);
  }
}

function renderStories(data) {
  rssItems.replaceChildren();

  for (const item of data.slice(0, 10)) {
    const href = safeUrl(item.url);
    if (!href || !item.title) continue;

    const row = document.createElement("li");
    const link = document.createElement("a");
    link.className = "story-link";
    link.href = href;

    const title = document.createElement("span");
    title.className = "story-title";
    title.textContent = item.title;
    link.append(title);

    let source = typeof item.source === "string" ? item.source : "";
    if (!source) source = new URL(href).hostname.replace(/^www\./, "");
    const sourceLabel = document.createElement("span");
    sourceLabel.className = "story-source";
    sourceLabel.textContent = source;
    link.append(sourceLabel);

    if (item.pubDate && !Number.isNaN(Date.parse(item.pubDate))) {
      const date = document.createElement("time");
      date.className = "story-date";
      date.dateTime = new Date(item.pubDate).toISOString();
      date.textContent = new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(item.pubDate));
      link.append(date);
    }

    row.append(link);
    rssItems.append(row);
  }
}

function renderLoadingSkeleton() {
  rssItems.replaceChildren();
  for (let index = 0; index < 3; index += 1) {
    const row = document.createElement("li");
    row.className = "rss-skeleton";
    row.setAttribute("aria-hidden", "true");
    rssItems.append(row);
  }
}

let refreshCompletionTimeout;

async function loadStories(isManualRefresh = false) {
  clearTimeout(refreshCompletionTimeout);
  rssRefresh.disabled = true;
  rssRefresh.textContent = "Refreshing...";
  rssRefresh.removeAttribute("data-state");
  rssRefresh.removeAttribute("aria-label");
  const hasStories = rssItems.childElementCount > 0;
  rssStatus.textContent = hasStories ? "" : "Refreshing stories...";
  if (!hasStories) renderLoadingSkeleton();
  let loaded = false;

  try {
    const response = await fetch("/api/rss", {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`RSS request failed (${response.status})`);

    const result = await response.json();
    if (!Array.isArray(result.data)) throw new Error("RSS response was invalid");

    loaded = true;
    renderStories(result.data);

    if (result.unavailable && result.stale) {
      rssStatus.textContent = "Feeds are unavailable; showing saved stories.";
    } else if (result.unavailable) {
      rssStatus.textContent = "Stories are unavailable right now.";
    } else if (rssItems.childElementCount === 0) {
      rssStatus.textContent = "No stories found.";
    } else {
      rssStatus.textContent = "";
    }
  } catch (error) {
    console.error("Unable to load RSS stories", error);
    rssStatus.textContent = "Stories are unavailable right now.";
    rssItems.replaceChildren();
  } finally {
    rssRefresh.disabled = false;
    if (isManualRefresh && loaded) {
      rssRefresh.textContent = "Refresh";
      rssRefresh.dataset.state = "success";
      rssRefresh.setAttribute("aria-label", "Refresh complete");
      refreshCompletionTimeout = setTimeout(() => {
        rssRefresh.removeAttribute("data-state");
        rssRefresh.removeAttribute("aria-label");
      }, 1800);
    } else {
      rssRefresh.textContent = "Refresh";
    }
  }
}

rssRefresh.addEventListener("click", () => loadStories(true));

renderLinks();
loadStories();