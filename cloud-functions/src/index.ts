import express from 'express';
import { http } from '@google-cloud/functions-framework';

import { logger } from './logging.service';
import { getUploadURL } from './google-cloud/cloud-storage.service';
import { LoadFromGCSBodySchema } from './pipeline/pipeline.request.dto';
import { loadFromGCS } from './pipeline/pipeline.service';

const app = express();

app.use(({ path, body }, _, next) => {
    logger.debug({ path, body });
    next();
});

app.use('/upload', (req, res) => {
    getUploadURL()
        .then((result) => res.status(200).json(result))
        .catch((error) => {
            logger.error({ error });
            res.status(500).json({ error });
        });
});

app.use('/load', (req, res) => {
    const { value, error } = LoadFromGCSBodySchema.validate(req.body);

    if (error) {
        logger.warn({ error });
        res.status(400).json({ error });
        return;
    }

    loadFromGCS(value.filename)
        .then((result) => res.status(200).json({ result }))
        .catch((error) => {
            logger.error({ error });
            res.status(500).json({ error });
        });
});

http('main', app);
