const fs= require('fs');
const args = require('yargs').argv;
const okSound = require('./audio/ok');
const errorSound = require('./audio/error');
const login = require("./login");
const {ResourceManager} = require('./resourceManager');

let total = 0;
let messages = [];

const init = async ({user, pass, url}) => {

    const browser = new ResourceManager();
    await browser.init()

    const page = await browser.createPage(url)


    // Block unnecessary requests to increase performance
    await page.route(/(\.png$)|(\.jpg$)|(\.woff$)|(\.woff2$)|(\.ttf$)|(fonts.googleapis.com)/, route => route.abort());

    await login({page, url, user, pass});

    return {
        browser,
        page
    }
}

const run = async () => {
    let isTrue = true;
    let isLoggedIn = false;
    let reloadCount = 0;
    let link;

    const {user, pass, timeout = 2000, url = 'https://u4pp.u4a.se/FN667500P/tenant', blockList = [], maxReload = 250} = args;

    let blocked = new Map([...blockList]);

    if (!user || !pass) {
        console.error('You have to provide both "user" and "pass"-params');
        console.info('Launch like this: npm start -- --user=YourUserName --pass=YouPassword')
        return;
    }

    let {browser, page} = await init({user, pass, url});

    try {

        let html = '';
        do {
            html = '';
            link = '';

            if(reloadCount === maxReload){
                await browser.release();
                total += reloadCount;
                messages.push('Restarted browser at: ', total);
                return run();
            }

            try {
                await Promise.all([
                    page.waitForSelector('.fn-footer', {state: 'attached'}),
                    // page.waitForNavigation({waitUntil: 'domcontentloaded'})
                ]);

                await page.waitForTimeout(timeout);
                const list = await page.$$('ul.media-list a', {timeout});

                for (const address of list) {
                    link = await address.textContent();

                    if (!blocked.has(link)) {
                        html = await page.innerHTML('html');
                        await page.click('ul.media-list a', {timeout});
                        html = await page.innerHTML('html');
                        await page.click('#createExpressionOfInterestButton', {timeout});
                        html = await page.innerHTML('html');
                        await page.click('#confirmButton', {timeout});
                        html = await page.innerHTML('html');

                        await okSound(page);
                        isTrue = false;
                    }
                }
            } catch (e) {
                blocked.set(link, true);
                messages.push('Failed to process:', link);
                fs.writeFile(link + '.html', html, err => {
                    if(err) {console.log(err);}
                    messages.push('created debug html file:', link+'.html');
                })
            }

            try {
                https://u4pp.u4a.se/FN667500P/tenant/await page.reload({waitUntil: 'domcontentloaded'});

                await Promise.all([
                    page.waitForSelector('.fn-footer', {state: 'attached'}),
                    // page.waitForNavigation({waitUntil: 'domcontentloaded'})
                ]);


                // await page.waitForTimeout(1000);
                isLoggedIn = await page.evaluate(() => {
                    return document.querySelector('.user-name')
                });

                if (!isLoggedIn) {
                    //You have been logged out - too tight reloads?
                   messages.push('You are spamming the site! Increase reload times to avoid being logged out and possibly blocked!');
                    await login({page, url, user, pass});
                }

                reloadCount++;

                console.clear()
                console.log('Reloaded: ', reloadCount);
                messages.forEach(message => {
                    console.log(message);
                })

                await page.goto(url);

            } catch (e) {
                //Something went wrong!
                await errorSound(page);
                // isTrue = false;
                console.error(e);

                try{
                    await browser.close();
                }catch(e){

                }

                messages.push('browser crashed!', reloadCount)

                let env = await init({user, pass, url});
                browser = null;
                page = null;

                browser = env.browser;
                page = env.page;
            }
        } while (isTrue)
    } catch (e) {
        //Something went wrong!
        try {
            await errorSound(page);
        } catch (e) {
            console.error('Unable to play sound')
        }
        // isTrue = false;
        console.error(e);

        await browser.close();
        let env = await init({user, pass});
        browser = null;
        page = null;

        browser = env.browser;
        page = env.page;

        return run();
    }
}

run();
