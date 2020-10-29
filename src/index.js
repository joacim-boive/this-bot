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

    const checkOffers = async (isTrue) => {
        try {
            await page.click('ul.media-list a', {timeout});
            await page.click('#createExpressionOfInterestButton', {timeout});

            await okSound(page);
            return true;

        } catch (e) {
        }
        return false;
    }

    const hasOffers = async () => (await page.evaluate(async() => {
        const response = await fetch("https://u4pp.u4a.se/FN667500P/api/odata/Tenant/Offers?$expand=LeaseOutCase($expand=MainImage,Details,Address,Descriptions($filter=(LanguageCode%20eq%20%27SV%27))),CurrentViewing&$orderby=CurrentViewing/LastReplyDate%20desc&$top=3", {
            "referrer": "https://u4pp.u4a.se/FN667500P/tenant/",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": null,
            "method": "GET",
            "mode": "cors"
        });
        const offers = await response.json();
        return offers?.value.length > 0;
    }));

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

    let hasFoundOffers = false;

    do {
        hasFoundOffers = await checkOffers();

        if(hasFoundOffers) return;

        try {
            let isOffersAvailable = await hasOffers();

            while(!isOffersAvailable){
                isOffersAvailable = await new Promise(resolve => (
                    setTimeout(async () =>{
                    resolve(await hasOffers())
                }, 1000)));

                if(isOffersAvailable) console.info('Offer is available!');
            }

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
    } while (!hasFoundOffers)
})();
