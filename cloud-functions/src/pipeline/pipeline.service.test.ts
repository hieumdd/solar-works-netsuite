import { loadFromGCS } from './pipeline.service';

it('load-from-gcs', async () => {
    const filename = '';

    return loadFromGCS(filename)
        .then((result) => expect(result).toBeDefined())
        .catch((error) => {
            console.error({ error });
            throw error;
        });
});
