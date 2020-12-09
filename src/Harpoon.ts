import { World, SpecWorld, Phase, makeWorld, bootPhase, endPhase, waitPhase } from 'kharai'
import { filter, first, takeWhile, tap } from 'rxjs/operators'
import { Any, Bool, Guard, Num, Str } from './Guard'

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
					guard: Guard([]),
					async run() {
						return ['download', []];
					}
				}),
				
				download: x => ({
					guard: Guard([]),
					async run() {
						return ['$wait', [2000, ['fetcher', ['download', []]]]];
					}
				}),

				getCookie: x => ({
					guard: Guard([]),
					async run() {
						return ['download', []]
					}
				})
			},


			differ: {
				start: x => ({
					guard: Guard([]),
					async run() {
						return ['watchFiles', []];
					}
				}),

				watchFiles: x => ({
					guard: Guard([]),
					async run() {

						const q = await x.watch(['fetcher']).pipe( //wait until the file count exceeds our index
							filter(Guard(['fetcher', ['download', []]] as const)),
							first()
						).toPromise();
						
						return ['diffFiles', []]
					}
				}),

				//having bumped our index, now we do the outstanding work below until we run short
				//
				//

				diffFiles: x => ({
					guard: Guard([]),
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
				guard: Guard([Num, Str] as const),
				async run() {
					return false;
				}
			}),

			membersLog: x => ({
				guard: Guard([Num]),
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

