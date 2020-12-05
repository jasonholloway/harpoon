import { Run, LoaderFac, Phase } from 'kharai'
import { harpoon, Harpoon } from "./Harpoon";

const loader: LoaderFac<Phase<Harpoon>> =
	x => ids => Promise.resolve(
		ids.toMap().map(_ => [x.head(), ['$boot', []]])
	);

const run = new Run(harpoon(), loader);

run.boot('fetcher', ['fetcher', ['download', []]])

run.boot('differ', ['differ', ['watchFiles', []]])

//above should be loaded rather than booted
//or even - booted if unloadable
