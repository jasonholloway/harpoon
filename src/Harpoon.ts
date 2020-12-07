import { World, SpecWorld, Phase, makeWorld, bootPhase, endPhase, waitPhase } from 'kharai'
import { takeWhile, tap } from 'rxjs/operators'
import { when, _, A, B, then, end, P } from 'ex-patterns'
import { is, is, Num, Str } from './checkType'

export type THarpoon<Me extends World = World> = SpecWorld<{
  $boot: []
  $end: [any]
  $wait: [number, Phase<Me>]

	fetcher: {
		start: []
		download: []
		getCookie: []
	}

	differ: {
		start: []
		watchFiles: [],
		diffFiles: []
	}

	membersList: [number, string]

	membersLog: [any] 
}>

export type Harpoon = THarpoon<THarpoon>

export const harpoon = () => makeWorld<Harpoon>()(
	{
		contextFac: x => ({
			...x,
			blah: 3
		}),
	},
	{
		phases: {

			$boot: bootPhase(),
			$end: endPhase(),
			$wait: waitPhase(),


			fetcher: {
				start: x => ({
					guard(d): d is [] { return true },
					async run() {
						return ['download', []];
					}
				}),
				
				download: x => ({
					guard(d): d is [] { return true },
					async run() {
						return ['$wait', [2000, ['fetcher', ['download', []]]]];
					}
				}),

				getCookie: x => ({
					guard(d): d is [] { return true },
					async run() {
						return ['download', []]
					}
				})
			},


			differ: {
				start: x => ({
					guard(d): d is [] { return true },
					async run() {
						return ['watchFiles', []];
					}
				}),

				watchFiles: x => ({
					guard(d): d is [] { return true },
					async run() {

						await x.watch(['fetcher']).pipe( //wait until the file count exceeds our index
							tap(l => console.log('SEEN:', l[0], l[1])),
							takeWhile(([,p]) => when(p)
												(['fetcher', [P, _]], ({ P }) => { console.log(P); return false; })
												(_, then(() => true))
												(end))
						).toPromise();
						
						return ['diffFiles', []]
					}
				}),

				//having bumped our index, now we do the outstanding work below until we run short
				//
				//

				diffFiles: x => ({
					guard(d): d is [] { return true },
					async run() {

						await x.convene(['membersLog:1234'], {
							convene([p]) {
								const r = p.chat(['membersLog', ['d', [8367,"changed",227687527,{"loc":"Headington"}]]])
								//...
							}
						});

						
						return ['watchFiles', []]
					}
				})
			},

			membersList: x => ({
				guard: is([Num, Str] as const),
				async run() {
					return false;
				}
			}),

			membersLog: x => ({
				guard(d): d is [any] { return true },
				async run() {
					return false;
				}
			})

			//and ultimately of course we want to have a machine per person
			//but to do this we need some way of storing them, of indexing them
			//well actually we don't need that up front - incoming events will always be sent to the right machine by name

			//but if we create loads of peeps without indexing, what will happen?
			//at some point we'll want to gather them all;
			//eg all members who've been active over the past month
			//
			//
		}
	});

