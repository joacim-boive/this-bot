const args = require('yargs').argv;
const okSound = require('./audio/ok');
const errorSound = require('./audio/error');
const login = require("./login");

const {chromium} = require('playwright');

(async () => {
    let isTrue = true;

    const {user, pass, timeout = 2000, url = 'https://u4pp.u4a.se/FN667500P/tenant/login'} = args;

    if (!user || !pass) {
        console.error('You have to provide both "user" and "pass"-params');
        console.info('Launch like this: npm start -- --user=YourUserName --pass=YouPassword')
        return;
    }

    const browser = await chromium.launch({
        headless: false,
        viewport: {width: 1280, height: 1024},
        devtools: true,
        slowMo: 200,
    });

    const context = await browser.newContext();

    // Open new page
    const page = await context.newPage();

    let isLoggedIn = false;
    let reloadCount = 0;

    // Block unnecessary requests to increase performance
    await page.route(/(\.png$)|(\.jpg$)|(\.woff$)|(\.woff2$)|(\.ttf$)|(fonts.googleapis.com)/, route => route.abort());

    await login({page, url, user, pass});

    do {
        try {
            await page.click('ul.media-list a', {timeout});

            await okSound(page);
            isTrue = false;

            return;

        } catch (e) {
        }

        try {
            await page.reload({waitUntil: 'domcontentloaded'});

            await Promise.all([
                page.waitForSelector('.fn-footer', {state: 'attached'}),
                page.waitForNavigation({waitUntil: 'domcontentloaded'})
            ]);


            isLoggedIn = await page.evaluate(() => {
                return document.querySelector('.user-name')
            });

            if (!isLoggedIn) {
                //You have been logged out - too tight reloads?
                console.warn('You are spamming the site! Increase reload times to avoid being logged out and possibly blocked!');
                await login({page, url, user, pass});
            }

            reloadCount++;

            console.clear()
            console.log('Reloaded: ', reloadCount);

        } catch (e) {
            //Something went wrong!
            await errorSound(page);
            isTrue = false;
            console.error(e);
        }
    } while (isTrue)
})();
