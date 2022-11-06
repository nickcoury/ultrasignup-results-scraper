const fs = require('fs/promises');
const rp = require('request-promise-native');

(async () => {

  const dataFile = process.argv[2];
  
  const runners = JSON.parse(await fs.readFile(dataFile, { encoding: 'utf8' }));
  
  if (!runners) {
    console.err('Please provie a valid runner file as the first argument!');
    return;
  }
  
  const rankPromises = runners.map(getRunnerRankings);

  const ranks = (await Promise.all(rankPromises));

  const result = ranks
    .map(response => JSON.parse(response))
    .reduce((acc, val) => (acc || []).concat(val))
    .map(runner => ({ first: runner.FirstName, last: runner.LastName, rank: Math.round(runner.Rank*10000)/100, results: runner.Results && runner.Results.length || 0 }))
    .sort((x, y) => y.rank - x.rank);

  result.forEach(({first, last, rank, results}) => {
    console.log(`${rank.toFixed(2)} (${`  ${results}`.substr(-3)}) ${first.trim()} ${last.trim()}`);
  });
})();

async function getRunnerRankings(runner) {

  const first = runner.first.toLowerCase();
  const last = runner.last.toLowerCase();

  const rankUrl = `https://ultrasignup.com/service/events.svc/history/${first}/${last}/`;

  const ranks = await rp.get(rankUrl);

  return ranks;
}

