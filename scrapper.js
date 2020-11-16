const cheerio = require('cheerio');
const axios = require('axios');
const { config } = require("dotenv");
config({
	path: "/root/apis/gogoanime/.env"
});

const gogoURL = process.env.URL || "https://gogoanime.so"
const episodeRegex = /^.*(?:gogoanime\..+\/)(?!category\/)(.+-episode-[0-9]+).*/
const animeRegex = /^.*(?:gogoanime\..+\/)(?:category\/)(.+)/

function episode_parser(query) {
    const match = query.match(episodeRegex);
    return match? match[1] : false;
}
function anime_parser(query) {
    const match = query.match(animeRegex);
    return match? match[1] : false;
}

async function newSeason(page) {
    let anime_list = [];
    let ret;

    await axios.get(`${gogoURL}/new-season.html?page=${page}`)
    .then(async res => {
        const body = await res.data;
        const $ = cheerio.load(body);
    
        $('div.main_body div.last_episodes ul.items li').each((index, element) => {
            const $elements = $(element);
            const name = $elements.find('p').find('a');
            const img = $elements.find('div').find('a').find('img').attr('src');
            const link = $elements.find('div').find('a').attr('href');
            const anime_name = { 
                'name': name.html(), 
                'img_url': img, 
                'anime_link': `${gogoURL}${link}`,
                'anime_id': link.slice(10,)
            }
            anime_list.push(anime_name);
        });
    
        ret = anime_list
    })
    .catch(err => {
        ret = { 'error': err.message }
    });

    return ret
}


async function popular(page) {
    let anime_list = [];
    let ret;

    await axios.get(`${gogoURL}/popular.html`)
    .then(async res => {
        const body = await res.data;
        const $ = cheerio.load(body);
        
        $('div.main_body div.last_episodes ul.items li').each((index, element) => {
            const $elements = $(element);
            const name = $elements.find('p').find('a');
            const img = $elements.find('div').find('a').find('img').attr('src');
            const link = $elements.find('div').find('a').attr('href');
            const anime_name = { 
                'name': name.html(), 
                'img_url': img, 
                'anime_link': `${gogoURL}${link}`,
                'anime_id': link.slice(10,)
            }
            anime_list.push(anime_name);

        });

        ret = anime_list
    })
    .catch(err => {
        ret = { 'error': err.message }
    });

    return ret
}

async function search(query) {
    let anime_list = [];
    let ret;

    await axios.get(`${gogoURL}/search.html?keyword=${query}`)
    .then(async res => {
        const body = await res.data;
        const $ = cheerio.load(body);

        $('div.main_body div.last_episodes ul.items li').each((index, element) => {
            const $elements = $(element);
            const name = $elements.find('p').find('a');
            const img = $elements.find('div').find('a').find('img').attr('src');
            const link = $elements.find('div').find('a').attr('href');
            const anime_name = { 
                'name': name.text(), 
                'img_url': img, 
                'anime_link': `${gogoURL}${link}`,
                'anime_id': link.slice(10,)
            }
            anime_list.push(anime_name);
        });

        ret = anime_list
    })
    .catch(err => {
        ret = { 'error': err.message }
    });

    return ret
}

async function anime(_anime_name) {
    let episode_array = [];
    let ret;
    let query = anime_parser(_anime_name)
    if(!query) query = _anime_name

    await axios.get(`${gogoURL}/category/${query}`)
    .then(async res => {
        const body = await res.data;
        const $ = cheerio.load(body);

        const img_url = $('div.anime_info_body_bg  img').attr('src');
        const anime_name = $('div.anime_info_body_bg  h1').text();
        const anime_about = $('div.anime_info_body_bg p:nth-child(5)').text();
        const release = $('div.anime_info_body_bg p:nth-child(7)').text();
        const status = $('div.anime_info_body_bg p:nth-child(8)').text();
        const el = $('#episode_page');

        const ep_start = 1;
        const ep_end = el.children().last().find('a').attr('ep_end');

        for (let i = ep_start; i <= ep_end; i++) {
            const arr = {
                'episode_id': `${query}-episode-${i}`,
                'episode_link': `${gogoURL}/${query}-episode-${i}`
            }
            episode_array.push(arr);
        }

        const anime_result = { 
            'name': anime_name, 
            'img_url': img_url, 
            'about': anime_about, 
            'release_date': release,
            'status': status,
            'anime_link': `${gogoURL}/category/${query}`,
            'episodes': episode_array 
        }

        ret = anime_result
    })
    .catch(err => {
        ret = { 'error': err.message }
    });

    return ret
}

async function watchAnime(episode_id) {
    let ret;
    let query = episode_parser(episode_id)
    if(!query) query = episode_id

    await axios.get(`${gogoURL}/${query}`)
    .then(async res => {
        const body = await res.data;
        const $ = cheerio.load(body);

        const episode_link = $('li.dowloads > a').attr('href');
        const name = $('div.anime_video_body h1').text();
        const image = $('head meta[itemprop=image]').attr("content");

        const ep = await getDownloadLink(episode_link);
        let arr;
        if(typeof ep.error == "undefined"){
            arr = {
                'name': name.replace(" at gogoanime", ""),
                'anime_link': `${gogoURL}/category/${query.replace(/-episode-[0-9]+/g, "")}`,
                'img_url': image,
                'anime_id': query,
                'episode_link': `${gogoURL}/${query}`,
                'download_links': ep
            }
        }
        else arr = { 'error': ep.error }

        ret = arr
    })
    .catch(err => {
        ret = { 'error': err.message }
    });

    return ret
}

async function getDownloadLink(episode_link) {
    let ep_array = [];
    let ret;

    await axios.get(episode_link)
    .then(async res => {
        const body = await res.data;
        const $ = cheerio.load(body);

        $('div.mirror_link div').each((index, element) => {
            const check = $(element).find('a').attr('target')
            if(!check){
                const ep_name = $(element).find('a').html();
                const ep_link = $(element).find('a').attr('href');

                const formName = ep_name.replace('Download\n', 'watch').replace(/ +/g, " ")
                const ep_dic = { 
                    'title': formName, 
                    'link': ep_link 
                }
                ep_array.push(ep_dic);
            }
        });

        ret = ep_array
    })
    .catch(err => {
        ret = { 'error': 'Not an existing episode.' }
    });

    return ret
}

module.exports = {
    popular,
    newSeason,
    search,
    anime,
    watchAnime
}

