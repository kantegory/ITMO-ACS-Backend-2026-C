import { defaultMetadataStorage } from 'class-transformer/cjs/storage';
import { Express } from 'express';
import {
    getMetadataArgsStorage,
    RoutingControllersOptions,
} from 'routing-controllers';
import { routingControllersToSpec } from 'routing-controllers-openapi';
import * as swaggerUi from 'swagger-ui-express';
import { validationMetadatasToSchemas } from 'class-validator-jsonschema';

const fallbackSpec = {
    openapi: '3.0.3',
    info: {
        title: 'Rental API documentation',
        description: 'Fallback docs when automatic schema generation is unavailable',
        version: '1.0.0',
    },
    paths: {},
};

export function useSwagger(
    app: Express,
    options: RoutingControllersOptions,
): Express {
    try {
        const schemas = validationMetadatasToSchemas({
            classTransformerMetadataStorage: defaultMetadataStorage,
            refPointerPrefix: '#/definitions/',
        });

        const storage = getMetadataArgsStorage();

        const spec = routingControllersToSpec(storage, options, {
            components: {
                schemas,
                securitySchemes: {
                    bearerAuth: {
                        type: 'http',
                        scheme: 'bearer',
                        bearerFormat: 'JWT',
                    },
                },
            },
            info: {
                title: 'Boilerplate API documentation',
                description: 'API documentation for boilerplate',
                version: '1.0.0',
            },
        });

        app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));

        return app;
    } catch (error) {
        console.warn(
            'Swagger auto-generation is unavailable, using fallback spec on /docs',
        );
        app.use('/docs', swaggerUi.serve, swaggerUi.setup(fallbackSpec));
        return app;
    }
}
