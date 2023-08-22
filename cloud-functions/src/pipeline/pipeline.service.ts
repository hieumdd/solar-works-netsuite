import { load } from '../google-cloud/bigquery.service';
import { getFile } from '../google-cloud/cloud-storage.service';
import { logger } from '../logging.service';

export const loadFromGCS = async (filename: string) => {
    logger.info({ action: 'load-from-gcs', filename });

    const loadOptions = {
        table: 'TotalSales',
        schema: [
            { name: 'id', type: 'NUMERIC' },
            { name: 'customer', type: 'STRING' },
            { name: 'lead_start_date', type: 'DATE' },
            { name: 'project_status', type: 'STRING' },
            { name: 'revenue', type: 'NUMERIC' },
            { name: 'sales_vendor', type: 'STRING' },
            { name: 'setter', type: 'STRING' },
            { name: 'system_size', type: 'NUMERIC' },
        ],
    };

    return load(loadOptions, getFile(filename)).then(() => filename);
};
