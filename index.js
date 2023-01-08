const fs = require('fs/promises');
const rp = require('request-promise-native');

(async () => {
  try {
    const dataFile = process.argv[2];

    const runners = JSON.parse(await fs.readFile(dataFile, { encoding: 'utf8' }));

    if (!runners) {
      console.err('Please provie a valid runner file as the first argument!');
      return;
    }

    const rankPromises = runners.map(getRunnerRankings);

    const ranks = (await Promise.all(rankPromises));

    const result = ranks
      .filter(x => x)
      .map((response, i) => {
        const input = runners[i];
        const runnerList = JSON.parse(response)
          .filter(runner => !input.age || !runner.age || (Math.abs(input.age - runner.age) < 2));
        return runnerList;
      })
      .reduce((acc, val) => (acc || []).concat(val))
      .map(runner => ({ first: runner.FirstName, last: runner.LastName, rank: Math.round(runner.Rank * 10000) / 100, results: runner.Results && runner.Results.length || 0, age: runner.Age, gender: runner.Gender, identGender: runner.identGender }))
      .sort((x, y) => y.rank - x.rank);

    const output = result.map(({ first, last, rank, results, gender, age }) => `${gender} ${(' ' + age).substr(-2)} ${rank.toFixed(2)} (${`  ${results}`.substr(-3)}) ${first.trim()} ${last.trim()}`).join('\n');

    const filename = dataFile.replace('./data/', './rankings/').replace('.json', '.txt');
    await fs.writeFile(filename, output);
  } catch (ex) {
    console.log('Error in index.js');
    console.log(ex);
  }
})();

async function getRunnerRankings(runner) {
  const first = runner.first.toLowerCase();
  const last = runner.last.toLowerCase();

  const rankUrl = `https://ultrasignup.com/service/events.svc/history/${first}/${last}/`.replace(/ /g, '%20');

  try {
    return await rp.get(rankUrl);
  } catch (ex) {
    console.log(`Error fetching ${rankUrl}`);
  }
}

