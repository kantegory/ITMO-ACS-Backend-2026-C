import { Express } from 'express';
import { RoutingControllersOptions } from 'routing-controllers';
import * as swaggerUi from 'swagger-ui-express';

const { openApiSpec } = require('../../../../homeworks/hw2/src/openapi.js');

export function useSwagger(
    app: Express,
    _options: RoutingControllersOptions,
): Express {
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
    return app;
}
