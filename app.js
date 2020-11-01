const puppeteer = require('puppeteer');
var CronJob = require('cron').CronJob;
const USERNAME_SELECTOR = 'input[name=username]';
const PASSWORD_SELECTOR = 'input[name=password]';
const LOGIN_SELECTOR = 'button[name="Login"]';
let loginUrl = "https://www.noip.com/login";
let hostUrl = "https://my.noip.com/#!/dynamic-dns";
const username = process.env.USERNAME;
const password = process.env.USERPASS;

async function startBrowser() {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    return {
        browser,
        page
    };
}

async function closeBrowser(browser) {
    console.log("closing down browser");
    return browser.close();
}

async function renewNoip(loginUrl) {
    const {
        browser,
        page
    } = await startBrowser();
    page.setViewport({
        width: 1366,
        height: 768
    });
    await page.goto(loginUrl);
    await page.click(USERNAME_SELECTOR);
    await page.keyboard.type(username);
    await page.click(PASSWORD_SELECTOR);
    await page.keyboard.type(password);
    await page.click(LOGIN_SELECTOR);
    await page.waitForNavigation({
        waitUntil: 'networkidle0',
    });
    await page.goto(hostUrl);
    const buttons = await page.$x('//*[@id="host-panel"]/table/tbody/tr/td[5]/button');
    for (let button of buttons) {
        const element = await page.$(".no-link-style");
        const timeLeft = await (await element.getProperty('textContent')).jsonValue();
        var intDays = parseInt(timeLeft.substring(11, 13));
        if (intDays <= 7) {
            await button.click();
            console.log("success: url is renewed for 29 days more");
        }
        if (intDays > 7) {
            console.log("not able to renew right now, good for " + intDays + " remaining days");
        }

    }
    console.log("renew script has finished");
    await closeBrowser(browser);
}



(async () => {
    var job = new CronJob('0 33 0 * * *', async function () {
        console.log('job is started, checking if a renew is available');
        await renewNoip(loginUrl);
    }, null, true, 'Europe/Stockholm');
    job.start();
    //process.exit(1);

})

();