const puppeteer = require('playwright')
const {chromium} = require('playwright');

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3239.108 Safari/537.36';

function ResourceManager() {
    let browser = null;

    this.init = async () => {
        browser = await runBrowser();
        browser.on('disconnected', async () => {
            await this.release();
            if (browser.process() != null) browser.process().kill('SIGINT');
            browser = await runBrowser();
        });
    };

    this.release = async  () => {
        if (browser) await browser.close();
    }

    this.createPage = async (url) => {
        return await createPage(browser,url);
    }

    async function runBrowser () {
        return await chromium.launch({
                headless: false,
                viewport: {width: 1280, height: 1024},
                devtools: false,
                slowMo: 200,
            });
    }

    async function createPage (browser,url) {
        const page = await browser.newPage({USER_AGENT});
        await page.setViewportSize({
            width: 1920,
            height: 3000,
        });

        await page.setDefaultNavigationTimeout(0);

        //skips css fonts and images for performance and efficiency
        // await page.setRequestInterception(true);
        await page.route('**/*', route => {
            const req = route.request().resourceType();

            return (req === 'image' || req === 'font' || req === 'stylesheet' ) ?
                route.abort() : route.continue();
        });

        await page.goto(url, {  waitUntil: 'domcontentloaded',timeout: 0});
        // await page.addScriptTag({url: 'https://code.jquery.com/jquery-3.2.1.min.js'});
        return page;
    }
}

module.exports = {ResourceManager}