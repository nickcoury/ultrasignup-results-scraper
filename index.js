const rp = require('request-promise-native');

const dataFile = process.argv[2];

const runners = require(dataFile);

if (!runners) {
  console.err('Please provie a valid runner file as the first argument!');
  return;
}

(async () => {
  const rankPromises = runners.map(getRunnerRankings);

  const ranks = (await Promise.all(rankPromises));

  const result = ranks
    .map(response => JSON.parse(response))
    .reduce((acc, val) => (acc || []).concat(val))
    .map(runner => ({ first: runner.FirstName, last: runner.LastName, rank: runner.Rank*100, results: runner.Results && runner.Results.length || 0 }))
    .sort((x, y) => y.rank - x.rank);

  console.log(JSON.stringify(result));
})();

async function getRunnerRankings(runner) {

  const first = runner.first.toLowerCase();
  const last = runner.last.toLowerCase();

  const rankUrl = `https://ultrasignup.com/service/events.svc/history/${first}/${last}/`;

  const ranks = await rp.get(rankUrl);

  return ranks;
}

