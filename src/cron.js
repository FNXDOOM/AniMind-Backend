const cron = require("node-cron");
const supabase = require("./supabase");
const slugify = require("slugify");
const youtube = require("./services/youtube.service");
const extractEpisode = require("./utils/extractEpisode");

const CHANNEL_ID = process.env.MUSE_CHANNEL_ID;

async function syncChannel() {
  console.log("🔁 Running YouTube sync...");

  const playlists = await youtube.getPlaylists(CHANNEL_ID);

  for (const playlist of playlists.items || []) {
    const title = playlist.snippet.title;
    const thumbnail = playlist.snippet.thumbnails.high.url;
    const playlistId = playlist.id;

    // Upsert anime
    const { data: existingAnime } = await supabase
      .from("anime")
      .select("id")
      .eq("youtube_playlist_id", playlistId)
      .single();

    let anime_id;

    if (existingAnime) {
      anime_id = existingAnime.id;
      await supabase
        .from("anime")
        .update({
          title,
          thumbnail,
          updated_at: new Date()
        })
        .eq("id", anime_id);
    } else {
      const slug = slugify(title, { lower: true });
      const { data: newAnime } = await supabase
        .from("anime")
        .insert([
          { title, slug, thumbnail, youtube_playlist_id: playlistId, source: "muse" }
        ])
        .single();
      anime_id = newAnime.id;
    }

    // Fetch episodes
    const videos = await youtube.getPlaylistVideos(playlistId);

    for (const item of videos.items || []) {
      const videoId = item.contentDetails.videoId;
      const videoTitle = item.snippet.title;
      const publishedAt = item.snippet.publishedAt;

      const episodeNumber = extractEpisode(videoTitle);

      if (!episodeNumber) continue;

      await supabase.from("episodes").insert({
        anime_id,
        episode_number: episodeNumber,
        youtube_video_id: videoId,
        title: videoTitle,
        published_at: publishedAt
      }, { onConflict: "youtube_video_id" }).single();
    }
  }

  console.log("✔ Sync complete!");
}

cron.schedule("0 * * * *", syncChannel);

module.exports = syncChannel;