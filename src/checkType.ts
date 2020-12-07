import { isArray } from "util"




type Check<S, T> = { _s: S }


export const Num: Check<'num', number> = {
  _s: 'num'
}

export const Bool: Check<'bool', boolean> = {
  _s: 'bool'
}

export const Str: Check<'str', string> = {
  _s: 'str'
}




type Read<S> =
    ReadDomain<S>
  | ReadRegex<S>
  | ReadConstant<S>
  | ReadTuple<S>

type ReadDomain<S> =
  S extends Check<any, infer T> ? T : never

type ReadRegex<S> =
  S extends RegExp ? string : never

type ReadConstant<S> =
    ReadString<S>
  | ReadNumber<S>
  | ReadBool<S>

type ReadString<S> =
  S extends string ? S : never

type ReadNumber<S> =
  S extends number ? S : never

type ReadBool<S> =
  S extends boolean ? S : never

type ReadTuple<S> = S extends readonly any[]
  ? ({ -readonly [I in keyof S]: Read<S[I]> })
  : never


export const is =
	<S>(s: S) =>
	(o: any): o is Read<S> => {

    if(isArray(s)) {
      console.assert(isArray(o))
      
    }
    
		return true;
	}


const check = <V>(v) => ({
  is: <S extends Witness<Wit<V>, Read<S>>>(s: S) => {
  }
})

const r = is([Num, [/blah/, true]] as const)
r


type Z = Wit<123>
type X = Read<typeof Num>
type Y = Witness<Z, X>


check(123).is(Num); //   <><unknown>undefined)



type Wit<V> = V extends Read<infer S> ? S : never

type Witness<C, P> = C extends P ? any : never


type ExtendsWitness<U extends T, T> = U
