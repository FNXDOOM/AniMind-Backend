const router = require("express").Router();
const supabase = require("../supabase");

// GET paginated anime list
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const sort = req.query.sort || "latest";
    const offset = (page - 1) * limit;

    let orderBy = { column: "updated_at", order: "desc" };
    if (sort === "az") orderBy = { column: "title", order: "asc" };
    if (sort === "za") orderBy = { column: "title", order: "desc" };

    const { data: totalData } = await supabase.from("anime").select("id", { count: "exact" });
    const total = totalData.length;

    const { data } = await supabase
      .from("anime")
      .select(`
        id, title, thumbnail, slug, youtube_playlist_id,
        episodes (episode_number)
      `)
      .order(orderBy.column, { ascending: orderBy.order === "asc" })
      .range(offset, offset + limit - 1);

    const formatted = data.map((anime) => ({
      ...anime,
      total_episodes: anime.episodes ? anime.episodes.length : 0
    }));

    res.json({
      data: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error fetching paginated anime" });
  }
});

// GET single anime with paginated episodes
router.get("/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { data: animeArr } = await supabase
      .from("anime")
      .select("*")
      .eq("slug", slug)
      .limit(1);

    if (!animeArr.length) return res.status(404).json({ error: "Anime not found" });

    const anime = animeArr[0];

    const { data: totalEpisodes } = await supabase
      .from("episodes")
      .select("*", { count: "exact" })
      .eq("anime_id", anime.id);

    const { data: episodes } = await supabase
      .from("episodes")
      .select("episode_number, youtube_video_id")
      .eq("anime_id", anime.id)
      .order("episode_number", { ascending: true })
      .range(offset, offset + limit - 1);

    res.json({
      ...anime,
      episodes,
      pagination: {
        total: totalEpisodes.length,
        page,
        limit,
        totalPages: Math.ceil(totalEpisodes.length / limit)
      }
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Error fetching anime episodes" });
  }
});

module.exports = router;