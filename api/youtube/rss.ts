import express from "express";
import Parser from "rss-parser";
import { applySecurity } from "../security";

const app = express();
applySecurity(app);
const rssParser = new Parser({
  customFields: {
    item: [
      ['yt:videoId', 'youtubeId'],
      ['yt:channelId', 'channelId'],
    ]
  }
});

app.get("/api/youtube/rss", async (req, res) => {
  try {
    const { channelId } = req.query;
    if (!channelId) return res.status(400).json({ error: "Channel ID required" });

    const feed = await rssParser.parseURL(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);

    // Clean up the feed items for the frontend
    const items = feed.items.map(item => ({
      youtubeId: (item as any).youtubeId,
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      author: item.author,
      thumbnail: `https://img.youtube.com/vi/${(item as any).youtubeId}/hqdefault.jpg`
    }));

    res.json({ title: feed.title, items });
  } catch (error: any) {
    console.error("[YouTube RSS Error]:", error.message);
    res.status(500).json({ error: "Failed to fetch media archive signals" });
  }
});

export default app;
