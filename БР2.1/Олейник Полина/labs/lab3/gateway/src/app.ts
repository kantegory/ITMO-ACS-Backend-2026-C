import express from 'express';
import cors from 'cors';

import SETTINGS from './config/settings';
import { resolveTarget, Service } from './routing';
import { forwardRequest } from './proxy';

const SERVICE_URLS: Record<Service, string> = {
    auth: SETTINGS.AUTH_SERVICE_URL,
    restaurants: SETTINGS.RESTAURANTS_SERVICE_URL,
    bookings: SETTINGS.BOOKINGS_SERVICE_URL,
};

const app = express();

app.use(cors());
app.use(express.json());

// Смонтировано на префиксе -> req.path внутри уже относительный (без /api/v1),
// а req.originalUrl (используется в forwardRequest) остаётся полным.
app.use(SETTINGS.APP_API_PREFIX, async (req, res) => {
    const target = resolveTarget(req.path);

    if (!target) {
        res.status(404).json({ statusCode: 404, message: 'Not found' });
        return;
    }

    await forwardRequest(SERVICE_URLS[target], req, res);
});

// Всё вне /api/v1 (включая голый /internal/... без префикса) — тоже 404.
app.use((req, res) => {
    res.status(404).json({ statusCode: 404, message: 'Not found' });
});

app.listen(SETTINGS.APP_PORT, SETTINGS.APP_HOST, () => {
    console.log(`gateway running on http://${SETTINGS.APP_HOST}:${SETTINGS.APP_PORT}`);
});
