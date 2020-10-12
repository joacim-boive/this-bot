const login = async ({page, url, user, pass}) => {
    await page.goto(url);

    await page.fill('input[aria-label="Användarnamn"]', user);
    await page.fill('input[aria-label="Lösenord"]', pass);

    await Promise.all([
        page.waitForNavigation({waitUntil:'domcontentloaded'}),
        page.click('form[role="form"] >> text=/.*Logga in.*/')
    ]);
}

module.exports = login;