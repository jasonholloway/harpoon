import { Phase, Loader, newRun, FakeStore, MonoidData } from 'kharai'
import { harpoon, Harpoon } from "./Harpoon";

const loader: Loader<Phase<Harpoon>> =
	ids => Promise.resolve(
		ids.toMap().map(_ => ['$boot', []])
	);

const MD = new MonoidData()

const store = new FakeStore(MD, 10);

(async () => {
	const run = newRun(harpoon(), loader, { store, threshold: 10 });

	run.log$.subscribe(l => console.log(l[0], l[1]));
	setInterval(() => console.log('BATCHES', store.batches.length), 3000)

	await Promise.all([
		run.boot('fetcher', ['fetcher', ['start', []]]),
		run.boot('differ', ['differ', ['start', []]])
	]);
})();

