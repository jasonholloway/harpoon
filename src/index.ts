import { act, LocalStore, newRun, World, Num, Tup, Many, Str, Guard, Any } from 'kharai'
import axios from 'axios'
import { load as cheerio } from 'cheerio'
import { isArray, isObject } from 'node:util';
import { delay } from 'kharai/out/src/util';
import { Set } from 'immutable'
import { Or } from 'kharai/out/src/guards/Guard';
import { take } from 'rxjs/operators'

const world = World
  .shape({
    scrape: act(Tup(Num,Num)),

    percolate: {
      pool: {
        start: act(),
        run: act(Many(Str)) // AgentId[]
      },

      agent: {
        take: act(),
        work: act(Tup(Str,Any)), // [EvidenceType,Evidence]
        finish: act()
      }
    },

    handle: act(),

    index: act(Many(Str))
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
          return and.end(['BADDATA', data]);
        }

        const [newEvidence] = await convene(['h:page'], ([p]) => p.chat(data.Products)) || [];

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

    percolate: {
      pool: {
        async start({and}) {
          return and.percolate.pool.run([]);
        },
        
        async run({and,attend,watch,isFresh}, ids) {
          if(isFresh()) {
            await watch(ids)
              .pipe(take(0))
              .toPromise(); //think this will summon?!?!?
          }
          
          const [op] = await attend(m => {
            if(Guard(Tup(Or('reg' as const, 'dereg' as const),Str))(m)) {
              return [m, true];
            }
            else {
              return [, false];
            }
          }) || [];

          if(op) {
            switch(op[0]) {
              case 'reg':
                return and.percolate.pool.run(Set(ids).union([op[1]]).toArray());
              case 'dereg':
                return and.percolate.pool.run(Set(ids).remove(op[1]).toArray());
            }
          }
          
          return and.percolate.pool.run(ids);
        }

        //next question is: how do the agents re-enlivened on restart?
        //simple: they get summoned
        //as soon as run gets called
        //then we summon them
        //but how do we know we've started up?
        //need some secret sideband data...
      },

      agent: {
        async take({and,attend,convene,id}) {

          //receive some evidence
          const [ev] = await attend(m => ['']) || [];

          //anchor, guarantee safety
          await convene(['pool'], ([p]) => {
            p.chat(['reg',id]);
          });

          //step into task
          return and.percolate.agent.work(['',ev]);
        },

        async work({and}, [evType,ev]) {

          //if more to do, continue

          //if done, pass to sink
          
          return and.percolate.agent.finish();
        },

        async finish({and,convene,id}) {
          await convene(['pool'], ([p]) => {
            p.chat(['dereg',id]);
          });

          return and.percolate.agent.take();
        }
        
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


    async index({and,attend}, data) {
      const [m] = await attend(m => [m]) || [];

      if(Guard(Many(Str))(m)) {
        //new fridges to be detected here
        //each new fridge should then be farmed out 
        //to a stateful, fridge-specific machine
        //or, maybe each fridge, whether new or not,
        //should go to such an aggregator

        //then that machine will be responsible for detecting differences
        //though here we have the same old evidence mechanism
        //the fridge is provided as evidence
        //and is split up 
        
        //
        //
        //
        
        return and.index([...Set.union<string>([data, m])]);
      }

      return and.index(data);
    }

  })
  .build();


const store = new LocalStore();
const x = newRun(world, store, store, { save: true });

Promise.all([
  x.log$,
  x.boot('ao', ['scrape', [0,5]]),
  x.boot('h:page', ['handle']),
  x.boot('index', ['index', []])
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
