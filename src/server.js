require("dotenv").config();
const express = require("express");
const cors = require("cors");

require("./cron");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/anime", require("./routes/anime.routes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`⚡ Running on port ${PORT}`));