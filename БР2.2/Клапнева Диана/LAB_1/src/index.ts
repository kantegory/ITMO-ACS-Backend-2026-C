import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc'; 
import dotenv from 'dotenv';
import { AppDataSource } from './data-source';
import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;


app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Real Estate API - Lab 1',
            version: '1.0.0',
            description: 'Документация API для управления недвижимостью',
            contact: {
                name: 'API Support',
                email: 'support@realestate.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000/api/v1',
                description: 'Development server'
            }
        ],
        components: {
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        first_name: { type: 'string' },
                        middle_name: { type: 'string' },
                        last_name: { type: 'string' },
                        deal_role: { type: 'string', enum: ['landlord', 'tenant'] },
                        email: { type: 'string' },
                        is_verified: { type: 'boolean' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                CreateUserRequest: {
                    type: 'object',
                    required: ['first_name', 'last_name', 'email', 'password'],
                    properties: {
                        first_name: { type: 'string' },
                        middle_name: { type: 'string' },
                        last_name: { type: 'string' },
                        deal_role: { type: 'string', enum: ['landlord', 'tenant'] },
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 8 }
                    }
                },
                UpdateUserRequest: {
                    type: 'object',
                    properties: {
                        first_name: { type: 'string' },
                        middle_name: { type: 'string' },
                        last_name: { type: 'string' },
                        deal_role: { type: 'string', enum: ['landlord', 'tenant'] },
                        email: { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 8 },
                        is_verified: { type: 'boolean' }
                    }
                },
                Estate: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        user_id: { type: 'integer' },
                        address: { type: 'string' },
                        type: { type: 'string', enum: ['apartment', 'cottage', 'room'] },
                        room_amount: { type: 'integer' },
                        description: { type: 'string' },
                        price: { type: 'number' },
                        image_path: { type: 'string' },
                        bath_type: { type: 'string', enum: ['shower', 'bathtub'] },
                        fridge: { type: 'boolean' },
                        washing_machine: { type: 'boolean' },
                        internet: { type: 'boolean' },
                        tv: { type: 'boolean' },
                        furnished_rooms: { type: 'boolean' },
                        furnished_kitchen: { type: 'boolean' },
                        is_verified: { type: 'boolean' },
                        is_available: { type: 'boolean' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                CreateEstateRequest: {
                    type: 'object',
                    required: ['user_id', 'address', 'type', 'room_amount', 'price'],
                    properties: {
                        user_id: { type: 'integer' },
                        address: { type: 'string' },
                        type: { type: 'string', enum: ['apartment', 'cottage', 'room'] },
                        room_amount: { type: 'integer' },
                        description: { type: 'string' },
                        price: { type: 'number' },
                        image_path: { type: 'string' },
                        bath_type: { type: 'string', enum: ['shower', 'bathtub'] },
                        fridge: { type: 'boolean' },
                        washing_machine: { type: 'boolean' },
                        internet: { type: 'boolean' },
                        tv: { type: 'boolean' },
                        furnished_rooms: { type: 'boolean' },
                        furnished_kitchen: { type: 'boolean' }
                    }
                },
                UpdateEstateRequest: {
                    type: 'object',
                    properties: {
                        user_id: { type: 'integer' },
                        address: { type: 'string' },
                        type: { type: 'string', enum: ['apartment', 'cottage', 'room'] },
                        room_amount: { type: 'integer' },
                        description: { type: 'string' },
                        price: { type: 'number' },
                        image_path: { type: 'string' },
                        bath_type: { type: 'string', enum: ['shower', 'bathtub'] },
                        fridge: { type: 'boolean' },
                        washing_machine: { type: 'boolean' },
                        internet: { type: 'boolean' },
                        tv: { type: 'boolean' },
                        furnished_rooms: { type: 'boolean' },
                        furnished_kitchen: { type: 'boolean' },
                        is_verified: { type: 'boolean' },
                        is_available: { type: 'boolean' }
                    }
                },
                Deal: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        landlord_id: { type: 'integer' },
                        tenant_id: { type: 'integer' },
                        period: { type: 'string' },
                        deal_status: { type: 'string', enum: ['pending', 'active', 'closed'] },
                        is_published: { type: 'boolean' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                        estates: { type: 'array', items: { $ref: '#/components/schemas/Estate' } }
                    }
                },
                CreateDealRequest: {
                    type: 'object',
                    required: ['landlord_id', 'tenant_id', 'period', 'deal_status', 'estate_ids', 'is_published'],
                    properties: {
                        landlord_id: { type: 'integer' },
                        tenant_id: { type: 'integer' },
                        period: { type: 'string' },
                        deal_status: { type: 'string', enum: ['pending', 'active', 'closed'] },
                        estate_ids: { type: 'array', items: { type: 'integer' } },
                        is_published: { type: 'boolean' }
                    }
                },
                UpdateDealRequest: {
                    type: 'object',
                    properties: {
                        landlord_id: { type: 'integer' },
                        tenant_id: { type: 'integer' },
                        period: { type: 'string' },
                        deal_status: { type: 'string', enum: ['pending', 'active', 'closed'] },
                        estate_ids: { type: 'array', items: { type: 'integer' } },
                        is_published: { type: 'boolean' }
                    }
                },
                Session: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        user_id: { type: 'integer' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                CreateSessionRequest: {
                    type: 'object',
                    required: ['user_id'],
                    properties: {
                        user_id: { type: 'integer' }
                    }
                },
                Message: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        user_id: { type: 'integer' },
                        session_id: { type: 'integer' },
                        message: { type: 'string' },
                        attachment_file_path: { type: 'string' },
                        is_reshared: { type: 'boolean' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                CreateMessageRequest: {
                    type: 'object',
                    required: ['user_id', 'session_id', 'message'],
                    properties: {
                        user_id: { type: 'integer' },
                        session_id: { type: 'integer' },
                        message: { type: 'string' },
                        attachment_file_path: { type: 'string' },
                        is_reshared: { type: 'boolean' }
                    }
                },
                UpdateMessageRequest: {
                    type: 'object',
                    properties: {
                        message: { type: 'string' },
                        attachment_file_path: { type: 'string' },
                        is_reshared: { type: 'boolean' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        statusCode: { type: 'integer' },
                        error: {
                            type: 'object',
                            properties: {
                                code: { type: 'string' },
                                message: { type: 'string' },
                                details: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            field: { type: 'string' },
                                            message: { type: 'string' }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    apis: ['./src/controllers/*.ts'], // ← Путь к контроллерам с JSDoc
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);


// тут Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});


app.use('/api/v1', routes);


app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});


app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err.stack);
    res.status(500).json({
        statusCode: 500,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Something went wrong'
        }
    });
});


AppDataSource.initialize()
    .then(() => {
        console.log('Data Source инициирован');
        app.listen(PORT, () => {
            console.log(`Сервер: http://localhost:${PORT}`);
            console.log(`Swagger UI: http://localhost:${PORT}/api-docs`);
            console.log(`Статус работы: http://localhost:${PORT}/health`);
        });
    })
    .catch((error) => {
        console.error('Error:', error);
        process.exit(1);
    });

export default app;