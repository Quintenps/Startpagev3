export const config = {
  rssFeeds: [
    "https://www.security.nl/rss/headlines.xml",
    "https://news.ycombinator.com/rss/",
    "https://krebsonsecurity.com/feed/",
  ],
  links: {
    video: [
      { url: "//youtube.com", title: "YouTube" },
      { url: "//twitch.com", title: "Twitch" },
      { url: "//dumpert.nl", title: "Dumpert" },
    ],
    entertainment: [
      { url: "//nu.nl", title: "NU" },
      { url: "//lowendtalk.com", title: "LowEndTalk" },
      { url: "//tweakers.net", title: "Tweakers" },
      { url: "//news.ycombinator.com", title: "The Hacker News" },
      { url: "//github.com/trending", title: "GitHub Trending" },
      { url: "//www.autoweek.nl/", title: "AutoWeek" },
      { url: "//livestreamfails.com/", title: "Livestreamfails" },
    ],
    other: [
      { url: "http://homepage.default.svc.cluster.local", title: "Homelab" },
      {
        url: "https://docs.google.com/spreadsheets/d/15ZnQydcf5_NyXJkyzgxDAgdcXgeJC_9dXOIO6GNKfjE/edit?usp=sharing",
        title: "Gym spreadsheet",
      },
    ],
  },
};