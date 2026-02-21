const fetch = require("node-fetch");
const API_KEY = process.env.YOUTUBE_API_KEY;

exports.getPlaylists = async (channelId) => {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/playlists?part=snippet&channelId=${channelId}&maxResults=50&key=${API_KEY}`
  );
  return res.json();
};

exports.getPlaylistVideos = async (playlistId) => {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&key=${API_KEY}`
  );
  return res.json();
};