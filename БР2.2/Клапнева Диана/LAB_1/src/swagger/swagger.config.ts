import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
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
                Session: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        user_id: { type: 'integer' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
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
                }
            }
        }
    },
    apis: ['./src/controllers/*.ts'] 
};

export const swaggerSpec = swaggerJsdoc(options);
