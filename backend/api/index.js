const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

app.get("/api/news", async (req, res) => {
  try {
    const response = await fetch("https://www.fa.ru/university/press-center/");
    const html = await response.text();
    res.send({ html });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

app.listen(4000, () => console.log("Server running on port 4000"));
