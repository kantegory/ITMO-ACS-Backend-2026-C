import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { AppDataSource } from './config/data-source';
import likeRoutes from './routes/like.routes';
import commentRoutes from './routes/comment.routes';
import saveRoutes from './routes/save.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8003;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/recipes', likeRoutes);
app.use('/api/recipes', commentRoutes);
app.use('/api/recipes', saveRoutes);
app.use('/api/comments', commentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'engagement-service' });
});

AppDataSource.initialize()
  .then(() => {
    console.log(`Engagement Service running on port ${PORT}`);
    app.listen(PORT);
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });