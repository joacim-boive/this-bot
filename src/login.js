const login = async ({page, url, user, pass}) => {
    let offers = url.split('/')
    offers[offers.length -1] = 'offers';
    offers = offers.join('/');

    await page.goto(url);

    await page.fill('input[aria-label="Användarnamn"]', user);
    await page.fill('input[aria-label="Lösenord"]', pass);

    await Promise.all([
        page.waitForNavigation({waitUntil:'domcontentloaded'}),
        page.click('form[role="form"] >> text=/.*Logga in.*/')
    ]);

    await page.goto(offers);
}

module.exports = login;