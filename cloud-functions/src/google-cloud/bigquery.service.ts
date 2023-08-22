import { BigQuery } from '@google-cloud/bigquery';
import { File } from '@google-cloud/storage';

import { logger } from '../logging.service';

const client = new BigQuery();

const dataset = 'NetSuite';

type LoadOptions = {
    table: string;
    schema: Record<string, any>[];
};

export const load = (options: LoadOptions, file: File) => {
    logger.info({ action: 'load', table: options.table });

    return client
        .dataset(dataset)
        .table(options.table)
        .load(file, {
            schema: { fields: options.schema },
            sourceFormat: 'NEWLINE_DELIMITED_JSON',
            createDisposition: 'CREATE_IF_NEEDED',
            writeDisposition: 'WRITE_TRUNCATE',
        });
};
