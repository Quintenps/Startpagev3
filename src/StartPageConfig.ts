export class StartPageConfig {
    static readonly RSS_FEEDS: string[] = [
      "https://www.security.nl/rss/headlines.xml",
      "https://news.ycombinator.com/rss",
      "https://krebsonsecurity.com/feed/"
    ];
  
    static readonly LINKS = {
      video: [
        { url: "//youtube.com", title: "Youtube" },
        { url: "//twitch.com", title: "Twitch" },
        { url: "//dumpert.nl", title: "Dumpert" }
      ],
      entertainment: [
        { url: "//nu.nl", title: "NU" },
        { url: "//lowendtalk.com", title: "LowendTalk" },
        { url: "//tweakers.net", title: "Tweakers" },
        { url: "//news.ycombinator.com", title: "The HackerNews" },
        { url: "//github.com/trending", title: "Github Trending" },
        { url: "//www.autoweek.nl/", title: "Autoweek" },
      ],
      other: [
        { url: "//www.myfitnesspal.com/food/diary", title: "MyFitnessPal" },
        { url: "//start.exactonline.nl/", title: "Exact" },
        { url: "//royals.ms/vote", title: "MapleRoyals vote" },
        { url: "https://docs.google.com/spreadsheets/d/1q40bD2me8TKLovc9tysyQSGxRtEP6k2OlTT6EWdvtSc/edit?gid=0#gid=0", title: "Gym spreadsheet" },
        { url: "https://docs.google.com/spreadsheets/d/1McUoEBz7u_4frvzBbh9TswtZPaoVE4q9UdcOYIY7tNs/edit?usp=drive_link", title: "Weight spreadsheet" },
      ]
    };
  }
  
