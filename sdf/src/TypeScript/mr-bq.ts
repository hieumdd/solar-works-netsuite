/**
 * mr-bq.ts
 *
 * @NApiVersion 2.1
 * @NScriptName mr-bq
 * @NScriptType MapReduceScript
 */

import { EntryPoints } from 'N/types';
import * as format from 'N/format';
import * as https from 'N/https';
import * as log from 'N/log';
import * as search from 'N/search';
import dayjs from './dayjs.min';

const lib = () => {
    const baseURL = 'https://us-central1-charge-bee.cloudfunctions.net/solar-works-netsuite-master';

    type GetUploadURLResponse = {
        filename: string;
        url: string;
    };

    const getUploadURL = () => {
        const response = https.request({ method: 'POST', url: `${baseURL}/upload` });

        if (response.code !== 200) {
            log.error('lib/get-upload-url', { response });
            return;
        }

        log.audit('lib/get-upload-url', { response });
        return <GetUploadURLResponse>JSON.parse(response.body);
    };

    const upload = (url: string, rows: MapResult[]) => {
        const response = https.request({
            method: https.Method.PUT,
            url,
            headers: { 'Content-Type': 'text/plain' },
            body: rows.map((row) => JSON.stringify(row)).join('\n'),
        });

        if (response.code !== 200) {
            log.error('lib/upload', { url });
            log.error('lib/upload', { response });
            return;
        }

        log.audit('lib/upload', { response });
        return true;
    };

    const loadFromGCS = (filename: string) => {
        const response = https.request({
            method: 'POST',
            url: `${baseURL}/load`,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename }),
        });

        if (response.code !== 200) {
            log.error('lib/load-from-gcs', { filename });
            log.error('lib/load-from-gcs', { response });
        }

        log.audit('lib/load-from-gcs', { response });
        return true;
    };

    return { getUploadURL, upload, loadFromGCS };
};

export const getInputData: EntryPoints.MapReduce.getInputData = () => {
    return search.create({
        type: 'job',
        columns: [
            search.createColumn({ name: 'custentity_bb_lead_start_date' }),
            search.createColumn({ name: 'custentity_bb_project_status' }),
            search.createColumn({ name: 'custentity_bb_revenue_amount' }),
            search.createColumn({ name: 'custentity_bb_system_size_decimal' }),
            search.createColumn({ name: 'custentity_sse_sales_vendor_enerflo' }),
            search.createColumn({ name: 'custentity_sw_setter' }),
            search.createColumn({ name: 'customer' }),
        ],
        filters: [
            ['isinactive', 'is', 'F'],
            'AND',
            ['custentity_bb_revenue_amount', 'greaterthan', '0.00'],
            'AND',
            ['customer', 'anyof', '@ALL@'],
        ],
    });
};

type SearchResponse = {
    id: string;
    recordType: string;
    values: {
        custentity_bb_lead_start_date?: string;
        custentity_bb_project_status?: { value: string; text: string };
        custentity_bb_revenue_amount: string;
        custentity_bb_system_size_decimal: string;
        custentity_sse_sales_vendor_enerflo?: { value: string; text: string };
        custentity_sw_setter?: { value: string; text: string };
        customer?: { value: string; text: string };
    };
};

type MapResult = {
    id: string;
    customer: string;
    lead_start_date: string;
    project_status: string;
    revenue: string;
    sales_vendor: string;
    setter: string;
    system_size: string;
};

export const map: EntryPoints.MapReduce.map = (context) => {
    const value = <SearchResponse>JSON.parse(context.value);

    const job: MapResult = {
        id: value.id,
        lead_start_date: value.values.custentity_bb_lead_start_date
            ? dayjs(
                  <Date>format.parse({
                      type: format.Type.DATE,
                      value: value.values.custentity_bb_lead_start_date,
                  }),
              ).format('YYYY-MM-DD')
            : undefined,
        customer: value.values.customer?.text,
        project_status: value.values.custentity_bb_project_status?.text,
        revenue: value.values.custentity_bb_revenue_amount || undefined,
        sales_vendor: value.values.custentity_sse_sales_vendor_enerflo?.text,
        setter: value.values.custentity_sw_setter?.text,
        system_size: value.values.custentity_bb_system_size_decimal || undefined,
    };

    context.write('load-to-bigquery', job);
};

export const reduce: EntryPoints.MapReduce.reduce = (context) => {
    const rows = context.values.map((row) => <MapResult>JSON.parse(row));
    log.debug('reduce/rows', rows);

    const { getUploadURL, upload, loadFromGCS } = lib();
    const uploadValues = getUploadURL();

    if (!uploadValues) {
        log.error('reduce/get-upload-url', {});
        return;
    }

    const { filename, url } = uploadValues;

    const isUploadSuccess = upload(url, rows);
    if (!isUploadSuccess) {
        log.error('reduce/upload', {});
        return;
    }

    const isLoadFromGCSSuccess = loadFromGCS(filename);
    if (!isLoadFromGCSSuccess) {
        log.error('reduce/load-from-gcs', { filename });
        return;
    }

    return;
};
