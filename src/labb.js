const args = require('yargs').argv;
const okSound = require('./audio/ok');
const errorSound = require('./audio/error');

const { chromium } = require('playwright');

(async () => {
    let isTrue = true;

    const {user='jboive', pass='kEwvi4-deqxes-fugsom', timeout=2000, url='https://u4pp.u4a.se/FN667500P/tenant/login'} = args;

    const browser = await chromium.launch({
        headless: false,
        viewport: { width: 1280, height: 1024 },
        devtools: true,
        slowMo: 200,
    });

    const context = await browser.newContext();

    // Open new page
    const page = await context.newPage();

    // Block unnecessary requests to increase performance
    await page.route(/(\.png$)|(\.jpg$)|(\.woff$)/, route => route.abort());

    await page.goto(url);

    await page.fill('input[aria-label="Användarnamn"]', user);
    await page.fill('input[aria-label="Lösenord"]', pass);

    await Promise.all([
        page.waitForNavigation({waitUntil:'domcontentloaded'}),
        page.click('form[role="form"] >> text=/.*Logga in.*/')
    ]);

    do {
        try{
            //Found Something!
            await page.click('[id="offerPanelReplyBtn"]', {timeout});
            await okSound(page);
            isTrue = false;
        }catch(e){}

        try{
            await page.reload({waitUntil:'domcontentloaded'});
            await page.waitForSelector('.user-name');
        }catch(e){
            //Something went wrong!
            await errorSound(page);
            isTrue = false;
            console.error(e);
        }
    } while(isTrue)
})();
