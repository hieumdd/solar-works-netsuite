import { load } from '../google-cloud/bigquery.service';
import { getFile } from '../google-cloud/cloud-storage.service';
import { logger } from '../logging.service';

export const loadFromGCS = async (filename: string) => {
    logger.info({ action: 'load-from-gcs', filename });

    const loadOptions = {
        table: 'Report',
        schema: [],
    };

    return load(loadOptions, getFile(filename)).then(() => filename);
};
