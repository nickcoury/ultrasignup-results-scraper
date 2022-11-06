import * as puppeteer from 'puppeteer';
import { promises as fsPromises } from 'fs';

run()
  .then(console.log)
  .catch(console.error);

async function run() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const allNames: string[] = [];
  let pageNames: string[];
  let pageNumber = 1;
  let finished = false;

  do {
    const url = `https://runsignup.com/Race/FindARunner/?search=&eventId=611088&raceId=76530&perPage=50&page=${pageNumber}`;
    console.log(`Getting page ${pageNumber}`);
    await page.goto(url);
    pageNames = await page.$$eval('table.data-display2 span.name', els => els.map(el => el?.textContent?.trim() || ''));
    allNames.push(...pageNames);
    pageNumber++;

    const currentPage = await page.$eval('div.showing-page input', el => (el as any)?.placeholder);
    const ofPages = await page.$eval('span.result-count', el => el?.textContent);
    finished = currentPage === ofPages;
  } while (!finished)

  const raceName = await page.$eval('h1.runnerUITitle a', el => el?.textContent?.toLowerCase().replace(/ /g, '-'));

  await browser.close();

  const runners = allNames.map(name => ({ first: name.split(' ')[0], last: name.split(' ').slice(1).join(' ')}))

  const filename = `./data/${(new Date().toISOString()).substring(0, 10)}_${raceName}.json`;
  await fsPromises.writeFile(filename, JSON.stringify(runners, undefined, 2));
}
