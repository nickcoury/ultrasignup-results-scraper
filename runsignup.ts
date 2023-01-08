import * as puppeteer from 'puppeteer';
import { promises as fsPromises } from 'fs';

run()
  .then(console.log)
  .catch(console.error);

async function run() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const runners: any[] = [];
  let pageRunners: any[] = [];
  let pageNames: string[];
  let pageGenders: string[];
  let pageAges: string[];
  let pageCities: string[];
  let pageStates: string[];
  let pageNumber = 1;
  let finished = false;

  do {
    const url = `https://runsignup.com/Race/FindARunner/?search=&eventId=648412&raceId=136443&perPage=50&page=${pageNumber}`;
    console.log(`Getting page ${pageNumber}`);
    await page.goto(url);
    pageNames = await page.$$eval('table.data-display2 span.name', els => els.map(el => el?.textContent?.trim() || ''));
    pageRunners = pageNames.map(name => ({ first: name.split(' ')[0], last: name.split(' ').slice(1).join(' ')}));
    pageGenders = await page.$$eval('table.data-display2 tbody > tr > td:nth-child(5)', els => els.map(el => el?.textContent?.trim() || ''));
    pageAges = await page.$$eval('table.data-display2 tbody > tr > td:nth-child(6)', els => els.map(el => el?.textContent?.trim() || ''));
    pageCities = await page.$$eval('table.data-display2 tbody > tr > td:nth-child(7)', els => els.map(el => el?.textContent?.trim().replace(/\s+/g, ', ') || ''));
    pageStates = await page.$$eval('table.data-display2 tbody > tr > td:nth-child(8)', els => els.map(el => el?.textContent?.trim().replace(/\s+/g, ', ') || ''));
    pageRunners.forEach((runner, i) => {
      let age: number = Number(pageAges[i]);
      if (age > 0) {
        runner.age = age;
      }
      runner.gender = pageGenders[i];
      runner.city = pageCities[i];
      runner.state = pageStates[i];
    });
    runners.push(...pageRunners);
    pageNumber++;

    const currentPage = await page.$eval('div.showing-page input', el => (el as any)?.placeholder);
    const ofPages = await page.$eval('span.result-count', el => el?.textContent);
    finished = currentPage === ofPages;
  } while (!finished)

  const raceName = await page.$eval('h1.runnerUITitle a', el => el?.textContent?.toLowerCase().replace(/ /g, '-'));

  await browser.close();

  const filename = `./data/${(new Date().toISOString()).substring(0, 10)}_${raceName}.json`;
  await fsPromises.writeFile(filename, JSON.stringify(runners, undefined, 2));
  
  const csvFileContents = `"First","Last","Age","Gender","City","State"\n` + runners
    .map(runner => [runner.first, runner.last, runner.age, runner.gender, runner.city, runner.state])
    .map(entries => entries.map(x => `"${x || ''}"`).join(','))
    .join(`\n`);
  const csvFilename = `./data/${(new Date().toISOString()).substring(0, 10)}_${raceName}.csv`;
  await fsPromises.writeFile(csvFilename, csvFileContents);
}
