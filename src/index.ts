import fs from 'fs'
import { act, LocalStore, newRun, World, Num, Tup} from 'kharai'
import axios from 'axios'
import { load as cheerio } from 'cheerio'
import { isArray, isObject } from 'node:util';
import { delay } from 'kharai/out/src/util';

const world = World
  .shape({
    scrape: act(Tup(Num,Num)),

    handle: act(),

    index: act()
  })
  .impl({

    async scrape({and,convene}, [offset, size]) {

      await delay(2000);

      const resp = await axios.get(`https://ao.com/l/refrigerators/1/29/?page=${offset}&pagesize=${size}`);
      const $ = cheerio(resp.data);

      const found = $('#lister-data');

      if(found.length) {
        const data = JSON.parse(found.text());

        if(!hasProp('Products')(data)) {
          return and.end(['bad data', data]);
        }

        const r = await convene(['h:page'], ([p]) => {
          return p.chat(data.Products);
        }) || [];

        const [newEvidence] = r;

        await convene(['index'], ([p]) => {
          //if this was proper orchestration a failure below would lead us to stow the data locally till we could pass it on
          p.chat(newEvidence);
        });

        return and.wait([10000, and.scrape([offset+size, size])]);
      }
      else {
        return and.wait([10000, and.scrape([0, size])]);
      }
    },


    async handle({and,attend,id}) {
      await attend(m => {

        console.log('handling', id, m);
        
        switch(id) {
          case 'h:page':
            if(isArray(m)) {
              const codes = m.flatMap(p => hasProp('Code')(p) ? [p.Code] : []);
              return [,codes];
            }
        }
      });

      return and.handle();
    },


    async index({and,attend}) {
      const [m] = (await attend(m => [m]) || []);

      fs.writeFileSync('index.raw', JSON.stringify(m));

      return and.index();
    }

  })
  .build();


const store = new LocalStore();
const x = newRun(world, store, store, { save: true });

Promise.all([
  x.log$,
  x.boot('ao', ['scrape', [0,5]]),
  x.boot('h:page', ['handle']),
  x.boot('index', ['index'])
]);



function hasProp<P extends string>(prop: P): ((o: unknown) => o is { [k in P]: unknown }) {
  return <any>((o: unknown) => typeof o === 'object' && (<any>o)[prop] !== undefined);
}


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
