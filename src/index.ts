import fs from 'fs'
import { act, LocalStore, newRun, World} from 'kharai'
import axios from 'axios'
import { load as cheerio } from 'cheerio'

const world = World
  .shape({

    scrape: act()

  })
  .impl({

    async scrape({and}) {
      const resp = await axios.get('https://ao.com/l/fridges-free_standing/1-9/29-30/');
      const $ = cheerio(resp.data);

      const dataRaw = $('#lister-data').text();;
      const data = JSON.parse(dataRaw);

      fs.writeFileSync('ao0.json', dataRaw);

      return and.end(data);
    }

  })
  .build();


const store = new LocalStore();
const x = newRun(world, store, store, { save: true });

Promise.all([
  x.log$,
  x.boot('ao', ['scrape'])
]);



// function agent(setup?: superagent.Plugin) {
//   return superagent
//     .agent()
//     .use(http => {
//       http.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8')
//           .set('User-Agent', 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:70.0) Gecko/20100101 Firefox/70.0')
//           .set('Accept-Language', 'en-US,en;q=0.5')
//           .set('Accept-Encoding', 'gzip, deflate, br')
//           .set('Pragma', 'no-cache')
//           .set('Cache-Control', 'no-cache')
//           .set('Connection', 'keep-alive')
//           .set('DNT', '1')
//           .set('Upgrade-Insecure-Requests', '1');

//       if(setup) setup(http);
//     });
// }
