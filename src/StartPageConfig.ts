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
        { url: "//news.ycombinator.com", title: "The HackerNews" },
        { url: "//github.com/trending", title: "Github Trending" }
      ],
      other: [
        { url: "//www.myfitnesspal.com/food/diary", title: "MyFitnessPal" },
        { url: "//royals.ms/vote", title: "MapleRoyals vote" }
      ]
    };
  }
  