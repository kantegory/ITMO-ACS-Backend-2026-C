import fs from 'fs';
import path from 'path';

import { Express } from 'express';
import { RoutingControllersOptions } from 'routing-controllers';
import * as swaggerUi from 'swagger-ui-express';
import { parse } from 'yaml';

// Подключает страницу документации /docs.
// Важно: документация НЕ генерируется автоматически из кода контроллеров —
// вместо этого мы просто читаем готовый файл openapi.yaml (из ДЗ2) и показываем его.
// Так сделано, потому что автогенератор (routing-controllers-openapi) периодически
// падает на некоторых декораторах под tsx/esbuild — а так документация гарантированно
// совпадает со спецификацией, по которой оценивают лабу.
export function useSwagger(
    app: Express,
    _options: RoutingControllersOptions, // параметр не используется, но оставлен для совместимости сигнатуры
): Express {
    try {
        const specPath = path.join(__dirname, '..', 'openapi.yaml');
        const spec = parse(fs.readFileSync(specPath, 'utf-8')); // читаем YAML-файл и превращаем в обычный JS-объект

        app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec)); // отдаёт страницу Swagger UI по адресу /docs

        return app;
    } catch (error) {
        // если файл не нашёлся или в нём ошибка — сервер всё равно должен запуститься,
        // просто без документации
        console.error('Ошибка настройки Swagger:', error);
        return app;
    }
}
