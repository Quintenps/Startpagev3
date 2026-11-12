export const config = {
  rssFeeds: [
    // Existing
    "https://www.security.nl/rss/headlines.xml",
    "https://news.ycombinator.com/rss",
    "https://krebsonsecurity.com/feed/",

    // DevOps & infrastructure
    "https://kubernetes.io/feed.xml",
    "https://www.cncf.io/feed/",
    "https://thenewstack.io/feed/",
    "https://blog.cloudflare.com/rss/",

    // Development
    "https://devblogs.microsoft.com/dotnet/feed/",
    "https://github.blog/feed/",
    "https://simonwillison.net/atom/everything/",

    // Security
    "https://www.bleepingcomputer.com/feed/",
    "https://isc.sans.edu/rssfeed.xml",

    // Homelab
    "https://selfh.st/rss/",
    "https://www.jeffgeerling.com/blog.xml",
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
        url: "https://docs.google.com/spreadsheets/d/13W6KCogiRJPt5h1cNdZEuXSKUnw_1lp0tqWHEwwBafk/edit?usp=sharing",
        title: "Gym spreadsheet",
      },
    ],
  },
};
