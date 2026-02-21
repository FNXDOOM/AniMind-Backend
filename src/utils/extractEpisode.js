module.exports = function extractEpisode(title) {
  const match = title.match(/#(\d+)|Episode\s(\d+)/i);
  return match ? parseInt(match[1] || match[2]) : null;
};