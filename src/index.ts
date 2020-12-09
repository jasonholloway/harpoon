import { Phase, Loader, newRun, FakeStore, MonoidData } from 'kharai'
import config from './config';
import { BlobStore, createBlobStore } from './db/BlobStore';
import { harpoon, Harpoon } from "./Harpoon";

const loader: Loader<Phase<Harpoon>> =
	ids => Promise.resolve(
		ids.toMap().map(_ => ['$boot', []])
	);

const MD = new MonoidData()

const store = new FakeStore(MD, 10);

const blobs = createBlobStore(config, undefined);


(async () => {
	const run = newRun(harpoon({ config, blobs }), loader, { store, threshold: 10 });

	run.log$.subscribe(l => console.log(l[0], l[1]));
	setInterval(() => console.log('BATCHES', store.batches.length), 3000)

	await Promise.all([
		run.boot('fetcher', ['fetcher', ['download', [{ fileCursor: 0 }]]]),
		run.boot('differ', ['differ', ['watchFiles', [{ fileCursor: 0, updateCursor: 0, logCursor: 0 }]]])
	]);
})();

