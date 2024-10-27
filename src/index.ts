import { newRun, World, Str, Any, Many, LocalStore } from 'kharai'
import FakeStore from 'kharai/out/src/FakeStore';
import { act, root } from 'kharai/out/src/shape/common';
import { delay, isString } from 'kharai/out/src/util';
import http, { ServerResponse } from "http";
import { isArray } from 'util';
import { Call } from 'kharai/out/src/SimpleCall';
import * as azdo from 'azure-devops-node-api';
import { Dict, Or } from 'kharai/out/src/guards/Guard';

const IndexAdd = Call([Str, Str], true);
const IndexDump = Call([], Any);
const IndexLookup = Call([Many(Str)], Many(Str));

const LinkGet = Call([], { name: Str, url: Str });

const RepoId = Str;
const RepoState = { id: Str, name: Str, url: Str };
const RepoPut = Call([RepoState], true);
const RepoGet = Call([], RepoState);

const PipelineId = Str;
const PipelineState = { id: Str, name: Str, url: Str };
const PipelinePut = Call([PipelineState], true);
const PipelineGet = Call([], PipelineState);


const azdoOrgUrl = `https://dev.azure.com/${process.env.HARPOON_AZDO_ORG}`;
const azdoProject = process.env.HARPOON_AZDO_PROJ!;
const azdoPAT = process.env.HARPOON_AZDO_PAT!;

const azdoAuth = azdo.getPersonalAccessTokenHandler(azdoPAT);
const azdoApi = new azdo.WebApi(azdoOrgUrl, azdoAuth)

const world = World
  .shape({
    Index: {
      ...root(Str),
      serving: act(Dict(Str))
    },

    RepoSpear: {
      ...root(Str),
      spearing: act(),
      stowing: act(Many(RepoState)) 
    },
    Repo: {
      ...root(RepoId),
      serving: act(RepoState),
      putting: act([Or(RepoState, false), RepoState])
    },

    PipelineSpear: {
      ...root(Str),
      spearing: act(),
      stowing: act(Many(PipelineState)) 
    },
    Pipeline: {
      ...root(PipelineId),
      serving: act(PipelineState),
      putting: act([Or(PipelineState, false), PipelineState])
    }
  })
  .impl({

    Repo: {
      act({and,server}) {
        return server
          .given(RepoPut, d => [and.putting([false, d]), true])
          .else(and.skip());
      },

      async serving({and,server}, data0) {
        return server
          .given(RepoPut, d => [and.putting([data0, d]), true])
          .given(RepoGet, () => [and.serving(data0), data0])
          .given(LinkGet, () => [and.serving(data0), { name: data0.name, url: data0.url }])
          .else(and.skip());
      },

      async putting(x, [data0, data1]) {
        const index = x.ref.Index('repos');

        if(await x.meet(index).call(IndexAdd, data1.name, x.id)) {
          return x.and.serving(data1);
        }

        if(data0) {
          return x.and.serving(data0);
        }

        throw 'very badly handled this - don\'t have sufficient data to go anywhere, and have overeagerly received unactionable work';
      }

    },

    RepoSpear: {
      async act(x) {
        return x.and.spearing();
      },

      async spearing({and}) {
        const azdoGit = await await azdoApi.getGitApi();
        const result = await azdoGit.getRepositories(azdoProject);

        const mapped = [...result.values()]
          .flatMap(v =>
            v.id && v.name && v.webUrl
              ? [{ id: v.id, name: v.name, url: v.webUrl }]
              : []);
        
        return and.stowing(mapped);
      },

      async stowing({and,meet,ref}, repos) {
        if(!repos.length) {
          return and.wait([Date.now() + (15 * 60 * 1000), and.spearing()]);
        }
        else {
          const [repo, ...rest] = repos;

          await meet(ref.Repo(repo.id)).call(RepoPut, repo);

          return and.stowing(rest);
        }
      }
    },

    Pipeline: {
      act({and,server}) {
        return server
          .given(PipelinePut, d => [and.putting([false, d]), true])
          .else(and.skip());
      },

      async serving({and,server}, data0) {
        return server
          .given(PipelinePut, d => [and.putting([data0, d]), true])
          .given(PipelineGet, () => [and.serving(data0), data0])
          .given(LinkGet, () => [and.serving(data0), { name: data0.name, url: data0.url }])
          .else(and.skip());
      },

      async putting(x, [data0, data1]) {
        const index = x.ref.Index('pipelines');

        if(await x.meet(index).call(IndexAdd, data1.name, x.id)) {
          return x.and.serving(data1);
        }

        if(data0) {
          return x.and.serving(data0);
        }

        throw 'very badly handled this - don\'t have sufficient data to go anywhere, and have overeagerly received unactionable work';
      }
    },

    PipelineSpear: {
      async act(x) {
        return x.and.spearing();
      },

      async spearing({and}) {
        const azdoPipelines = await azdoApi.getPipelinesApi();
        const result = await azdoPipelines.listPipelines(azdoProject);

        const mapped = [...result.values()]
          .flatMap(v => {
            const { id, name } = v;
            const url = v._links.web?.href;

            return id && name && url
              ? [{ id: id.toString(), name, url }]
              : [];
          });
        
        return and.stowing(mapped);
      },

      async stowing({and,meet,ref}, pipelines) {
        if(!pipelines.length) {
          return and.wait([Date.now() + (17 * 60 * 1000), and.spearing()]);
        }
        else {
          const [pipeline, ...rest] = pipelines;

          await meet(ref.Pipeline(pipeline.id)).call(PipelinePut, pipeline);

          return and.stowing(rest);
        }
      }
    },
    
    Index: {
      async act(x) {
        return x.and.serving({});
      },

      serving(x, data) {
        return x.server
          .given(IndexAdd, (k, v) => [x.and.serving({ ...data, [k.toLowerCase()]: v }), true])
          .given(IndexDump, () => [x.and.skip(), data])
          .given(IndexLookup, terms => {
            let candidates = [...Object.getOwnPropertyNames(data)];

            for(const term of terms) {
              const matched = [];

              for(const k of candidates) {
                if(k.includes(term)) {
                  matched.push(k);
                }
              }

              candidates = matched;
            }

            const results = candidates.flatMap(k => {
              const ref = data[k];
              return ref ? [ref] : [];
            });
            
            return [x.and.skip(), results];
          })
          .else(x.and.skip());
      },
    }
  })
  .build();


const store = new LocalStore('harpoon'); // new FakeStore(10); //LocalStore();
const run = newRun(world, store, store, { save: true });

run.machineSpace.runArbitrary(async x => {
  x.summon(x.ref.RepoSpear('spear'));
})

run.machineSpace.runArbitrary(async x => {
  x.summon(x.ref.PipelineSpear('spear'));
})

http.createServer(async (req, res) => {
  const [path, query] = req.url?.split('?', 2) || [];
  const queryParts = query?.split('+') || [];

  const links =
      /\/repos$/.test(path) ? await searchLinks('repos', queryParts)
    : /\/pipelines$/.test(path) ? await searchLinks('pipelines', queryParts)
    : [];

  renderLinks(res, links);

}).listen(59992);



async function searchLinks(indexName: string, query: string[]): Promise<Link[]> {
  const refs = await run.machineSpace.runArbitrary(x =>
    x.meet(x.ref.Index(indexName)).call(IndexLookup, query).ok()
  );

  return await Promise.all(
    refs.map(ref => run.machineSpace.runArbitrary(x =>
      x.meet(ref).call(LinkGet).ok()
    )
  ));
}

function renderLinks(res: ServerResponse, links: Link[]) {
  if(links.length == 1) {
    res.writeHead(301, undefined, { 'Location': links[0].url });
    res.end();
    return;
  }
  
  res.writeHead(200, undefined, { 'Content-Type': 'text/html' });
  res.write('<!DOCTYPE html><html><style>li { font-size: 20px; margin: 5px; }</style><ul>');

  for(const link of links) {
    res.write(`<li><a href="${link.url}">${link.name}</a></li>`);
  }

  res.write('</ul></html>');
  res.end();
}

type Link = { name: string, url: string };

