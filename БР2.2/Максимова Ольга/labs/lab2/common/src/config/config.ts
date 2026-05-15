class Settings {
    SERVICE_TOKEN = process.env.SERVICE_TOKEN || 'service-token'; 
    KAFKA_BROKERS = process.env.KAFKA_BROKERS || 'kafka:9092'; 
    JWT_SECRET_KEY = process.env.JWT_SECRET_KEY || 'secret';
    JWT_TOKEN_TYPE = process.env.JWT_TOKEN_TYPE || 'Bearer';
}

export default new Settings();