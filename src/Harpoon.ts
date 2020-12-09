import { World, SpecWorld, Phase, makeWorld, bootPhase, endPhase, waitPhase } from 'kharai'
import { filter, first, map, takeWhile, tap } from 'rxjs/operators'
import { Any, Bool, Guard, Num, Str } from './Guard'
import createMeetup from './behaviour/meetup'
import { Config } from './config'
import { BlobStore } from './db/BlobStore'


type FetcherState = {
	fileCursor: number,
	cookie?: string,
	lastLoginAttempt?: number
}

const isFetcherState =
	Guard(
		{
			fileCursor: Num
		} as const
	).to<FetcherState>();


type DifferState = {
  fileCursor: number,
  updateCursor: number,
	logCursor: number
}

const isDifferState =
	Guard(
		{
			fileCursor: Num,
			updateCursor: Num,
			logCursor: Num
		} as const
	).to<DifferState>();


export type THarpoon<Me extends World = World> = SpecWorld<{
  $boot: []
  $end: [any]
  $wait: [number, Phase<Me>]

	fetcher: {
		download: [FetcherState]
		getCookie: [FetcherState]
	}

	differ: {
		watchFiles: [DifferState]
		diffFiles: [DifferState]
	}

	membersList: [number, string]

	membersLog: [any] 
}>

export type Harpoon = THarpoon<THarpoon>

export const harpoon = (o: { config: Config, blobs: BlobStore }) => makeWorld<Harpoon>()(
	{
		contextFac: x => ({
			...x,
			meetup: () => createMeetup(o.config, o.blobs)
		}),
	},
	{
		phases: {

			$boot: bootPhase(),
			$end: endPhase(),
			$wait: waitPhase(),

			fetcher: {
				
				download: x => ({
					guard: Guard([isFetcherState]),
					async run([state]) {
						const { fileCursor, cookie } = state;

            if(!cookie) {
							return ['getCookie', [state]]; //need to pass cursor here
            }

            await x.meetup().getMembers(cookie, fileCursor);
						
						const oneHour = 1000 * 60 * 60;
						const now = Date.now();

						//add weight to save here

						return ['$wait', [now + oneHour,
															['fetcher', ['download', [{
																 ...state,
																 fileCursor: fileCursor + 1
															 }]]]]];
					}
				}),

				getCookie: x => ({
					guard: Guard([isFetcherState]),
					async run([state]) {
            const { lastLoginAttempt } = state;

						const oneHour = 1000 * 60 * 60;
						const now = Date.now();

            if(lastLoginAttempt && now < (lastLoginAttempt + oneHour)) {
              return ['$wait', [now + oneHour,
																['fetcher', ['getCookie', [state]]]]];
            }
            else {
							const cookie = await x.meetup().getCookie(); //and failure???

							return ['download', [{ ...state, cookie }]]
            }
					}
				})
			},


			differ: {

				watchFiles: x => ({
					guard: Guard([isDifferState]),
					async run([state]) {
						const { fileCursor } = state;

						const q = await x.watch(['fetcher']).pipe(
							filter(Guard(['fetcher', ['download', [isFetcherState]]] as const)), //should nicely type arg too
							map(([,[,[other]]]) => other),
							filter(other => other.fileCursor > fileCursor),
							first()
						).toPromise();
						
						return ['diffFiles', [state]]
					}
				}),

				diffFiles: x => ({
					guard: Guard([isDifferState]),
					async run([state]) {

						await x.convene(['membersLog:1234'], {
							convene([p]) {
								const r = p.chat(['membersLog', ['d', [8367,"changed",227687527,{"loc":"Headington"}]]])
								//...
							}
						});

						
						return ['watchFiles', [state]]
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

