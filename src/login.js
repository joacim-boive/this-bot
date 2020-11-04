const login = async ({page, url, user, pass}) => {
    // let offers = url.split('/')
    // offers[offers.length -1] = 'offers';
    // offers = offers.join('/');

    await page.goto(url);

    await page.fill('input[aria-label="Användarnamn"]', user);
    await page.fill('input[aria-label="Lösenord"]', pass);

    await Promise.all([
        page.waitForNavigation({waitUntil:'domcontentloaded'}),
        page.click('form[role="form"] >> text=/.*Logga in.*/')
    ]);

    await page.goto('https://u4pp.u4a.se/FN667500P/tenant/?t=2&q=%7B%22leaseOutAreaIds%22:%5B%222-2%22%5D,%22rentMax%22:4500,%22roomsMin%22:1,%22roomsMax%22:2%7D&p=1');
    // await page.goto(offers);
}

module.exports = login;