const app = require("express")();

let chrome = {};
let puppeteer;

if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
  chrome = require("chrome-aws-lambda");
  puppeteer = require("puppeteer-core");
} else {
  puppeteer = require("puppeteer");
}

app.get("/api", async (req, res) => {
  let options = {};

  if (process.env.AWS_LAMBDA_FUNCTION_VERSION) {
    options = {
      args: [...chrome.args, "--hide-scrollbars", "--disable-web-security"],
      defaultViewport: chrome.defaultViewport,
      executablePath: await chrome.executablePath,
      headless: true,
      ignoreHTTPSErrors: true,
    };
  }

  try {
    let browser = await puppeteer.launch(options);

    let page = await browser.newPage();
    await page.goto(`https://alephzero.subscan.io/transfer?startDate=&endDate=&startBlock=&endBlock=&timeType=date&direction=all&result=success&minAmount=${minAmount}&maxAmount=&currency=usd`);

    // Wait for 10 seconds
    await page.waitForTimeout(5000);

    // Wait for the table to fully load.
    await page.waitForSelector('.el-table__body');

    const data = await page.$$eval('table.el-table__body tr', rows => {
        return Array.from(rows, row => {
            const columns = row.querySelectorAll('td div.cell');
            return Array.from(columns, column => column.textContent.trim())
                .filter(columnText => columnText !== ""); // remove empty columns
        });
    });

    console.log("Number of rows: ", data.length);
    res.send(await data.length);
  } catch (err) {
    console.error(err);
    return null;
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});

module.exports = app;
