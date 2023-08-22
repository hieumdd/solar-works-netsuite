import { loadFromGCS } from './pipeline.service';

it('load-from-gcs', async () => {
    const filename = '2b1f7745-b34f-4721-a23d-9209cc3ff3ba.ndjson';

    return loadFromGCS(filename)
        .then((result) => expect(result).toBeDefined())
        .catch((error) => {
            console.error({ error });
            throw error;
        });
});
