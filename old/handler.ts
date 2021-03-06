import { Command, Cons, Tail, Yield, tail, Prop, Only, Lit} from './lib'
import { Map } from 'immutable'
import { RO } from './util'
import { Subject } from 'rxjs'
import { Dispatch } from './dispatch'

export type Handler<I extends Command = Command, O extends Command = Command> =
	(readonly [I[0], (...args: Tail<I>) => Yield<O>])[]

export type HandlerMap<OH extends string = string, OT extends any[] = any[], O extends Command<OH, OT> = Command<OH, OT>> = {
	[k: string]: ((...args: any[]) => Yield<Command<OH, OT>>)
}


export function createHandler<OH extends string, OT extends any[], O extends Command<OH, OT>, H extends Only<HandlerMap<OH, OT, O>>>(h: H): Handler<Obj2In<H>, Obj2Out<H>> {
	return <Handler<Obj2In<H>, Obj2Out<H>>><any>Object.entries(h)
}

export type Obj2In<W extends HandlerMap> =
	Prop<{ [k in keyof W & string]: W[k] extends (...args: infer I) => any ? (I extends Lit[] ? RO<Cons<k, I>> : never) : never }>

export type Obj2Out<W extends HandlerMap> =
	W[keyof W] extends ((...args: any[]) => Yield<infer O>) ? (O extends Command ? RO<O> : never) : never


export type In<H> =
	H extends Handler[]
	? H[number] extends Handler<infer I, any> ? I : never
	: H extends Handler<infer I, any> ? I : never

export type Out<H> =
	H extends Handler[]
  ? H[number] extends Handler<any, infer O> ? O : never
	: H extends Handler<any, infer O> ? O : never



export function join<HR extends Handler[]>(...handlers: HR) : Handler<In<HR[number]>, Out<HR[number]>> {
	return <Handler<In<HR[number]>, Out<HR[number]>>>
					handlers.reduce((ac, h) => [...ac, ...h], []);
}

export function compile<I extends Command, O extends Command>(handler: Handler<I, O>): (i: I) => Yield<O> {
	const map = Map(handler.map(r => [r[0], r[1]]))
	return (c: I) => {
		const found = map.get(c[0]);
		if(found) return found(...tail(c));
		else throw Error(`can't find ${c}!`);
	}
}

export function localize(id: string, handler: Handler): Handler {
	const dispatch = compile(handler);
	return [[
		id,
		async (...r: Command) => {
			const res = await dispatch(r);
			return res.map(c => {
				switch(c[0]) {
					case '@me': return [id, ...tail(c)];
					default: return c;
				}
			});
		}
	]];
}

