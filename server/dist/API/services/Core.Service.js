import newspaperjs from "newspaperjs";
import puppeteer from "puppeteer";
import Keyword from "../../models/KeywordModel.js";
import jwt from "jsonwebtoken";
export default class BaseService {
    // Get list of all keywords
    getKeyWords() {
        return new Promise((resolve, reject) => {
            (async () => {
                await Keyword.findAll()
                    .then((keywords) => {
                    resolve(keywords);
                }).catch((err) => {
                    reject(err);
                });
            })();
        });
    }
    // Create new keyword
    createKeyWord(newKeyword) {
        return new Promise((resolve, reject) => {
            (async () => {
                await Keyword.create({
                    name: newKeyword
                }).then((created) => {
                    resolve(created);
                }).catch((err) => {
                    reject(err);
                });
            })();
        });
    }
    // Delete keyword by id
    deleteKeyWord(keyWordId) {
        console.log(keyWordId);
        return new Promise((resolve, reject) => {
            (async () => {
                await Keyword.destroy({
                    where: {
                        _id: keyWordId
                    }
                }).then((deleted) => {
                    resolve(deleted);
                }).catch((err) => {
                    reject(err);
                });
            })();
        });
    }
    // Perform google scraping. Returns list of Promises<Articles>
    async scrapeGoogleNews(reqTarget) {
        const keyWordsList = await this.getKeyWords();
        const words = keyWordsList.map((w) => w.name);
        console.log(words);
        const google = new Google();
        const results = await google.scrape(words, reqTarget);
        return results;
    }
    // Login the admin
    authenticate(reqData) {
        return new Promise((resolve, reject) => {
            if (reqData.login === process.env.ADMIN_LOGIN &&
                reqData.password === process.env.ADMIN_PASSWORD) {
                const token = jwt.sign({
                    _id: process.env.ADMIN_ID
                }, process.env.TOKEN);
                resolve(token);
            }
            else {
                reject({ message: 'Wrong password' });
            }
        });
    }
}
class Google {
    NEWSCRAPER;
    LAUNCH_PUPPETEER_OPTS;
    PAGE_PUPPETEER_OPTS;
    BROWSER;
    PAGE;
    constructor() {
        this.NEWSCRAPER = newspaperjs.Article;
        this.LAUNCH_PUPPETEER_OPTS = {
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu',
                '--window-size=1920x1080',
                // `--proxy-server=${proxy}`
            ],
            headless: true
        };
        this.PAGE_PUPPETEER_OPTS = {
            networkIdle2Timeout: 5000,
            waitUntil: 'networkidle2',
            timeout: 20000
        };
    }
    async scrape(keywords, target) {
        const d1 = new Date();
        console.log(d1.toLocaleString('en-us'));
        try {
            const scrapeResults = [];
            this.BROWSER = await puppeteer.launch(this.LAUNCH_PUPPETEER_OPTS);
            for (let k = 0; k < keywords.length; k++) {
                const QUERY_STRING = encodeURIComponent(`"${keywords[k]} ${target}"`);
                const START = 0;
                const URL = `https://www.google.com/search?q=${QUERY_STRING}&tbm=nws&start=${START}&hl=en`;
                const PAGE = (await this.BROWSER.pages())[0];
                const USERNAME = 'newcomplianceproject';
                const PASSWORD = 'm78DxmRQ6x';
                await PAGE.setExtraHTTPHeaders({
                    'Accept-Language': 'en-US,en;q=0.9'
                });
                await PAGE.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36');
                await PAGE.setDefaultNavigationTimeout(0);
                await PAGE.goto(URL, this.PAGE_PUPPETEER_OPTS);
                await PAGE.waitForSelector('.CEMjEf.NUnG9d');
                const googleParsingResults = await PAGE.evaluate(() => {
                    const $articles = Array.from(document.querySelectorAll('.SoaBEf'));
                    return $articles.map(($article) => {
                        const source = $article.querySelector('.CEMjEf.NUnG9d').textContent;
                        const title = $article.querySelector('.mCBkyc').textContent;
                        const body = $article.querySelector('.GI74Re').textContent;
                        const url = $article.querySelector('.WlydOe').getAttribute('href');
                        const date = $article.querySelector('.OSrXXb.ZE0LJd').textContent;
                        return {
                            source, title, body, url, date
                        };
                    });
                });
                scrapeResults.push(...googleParsingResults);
            }
            await this.BROWSER.close();
            return scrapeResults;
        }
        catch (err) {
            throw new Error(err);
        }
    }
}
