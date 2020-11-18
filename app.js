const scapper = require('./scrapper');
const express = require('express');
const { config } = require("dotenv");
config({
	path: "/root/apis/gogoanime/.env"
});
const cors = require('cors');
const scrapper = require('./scrapper');

const app = express();
app.use(cors());

app.get('/', (req, res) => {
    res.send("gogoanime API");
});

app.get('/popular', async (req, res) => {
    const result = await scapper.popular();
    res.json(result);
});

app.get('/newseasons', async (req, res) => {
    const result = await scapper.newSeason();
    res.json(result);
});

app.get('/recent', async (req, res) => {
    const result = await scrapper.recent();
    res.json(result);
});

app.get('/search', async (req, res) => {
    const result = await scapper.search(req.query.query);
    res.json(result);
});

app.get('/getanime', async (req, res) => {
    const result = await scapper.anime(req.query.query);
    res.json(result);
});

app.get('/getepisode', async (req, res) => {
    const result = await scapper.watchAnime(req.query.query);
    res.json(result);
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
    console.log(`Listening to port ${port}`);
});;
