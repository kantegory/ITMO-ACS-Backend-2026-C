import { DataSource } from 'typeorm';
import { User } from './models/User.entity';
import { Estate } from './models/Estate.entity';
import { Deal } from './models/Deal.entity';
import { Session } from './models/Session.entity';
import { Message } from './models/Message.entity';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',               
    port: 5432,                      
    username: 'postgres',            
    password: 'postgres',            
    database: 'maindb',              
    synchronize: true,               
    logging: false,                  
    entities: [User, Estate, Deal, Session, Message],
    migrations: [],
    subscribers: [],
});