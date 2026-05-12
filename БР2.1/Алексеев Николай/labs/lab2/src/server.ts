import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

// Импорт маршрутов API
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import recipeRoutes from './routes/recipe.routes';
import commentRoutes from './routes/comment.routes';
import interactionRoutes from './routes/interaction.routes';

// Импорт DataSource
import { AppDataSource } from './config/data-source';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/recipes', commentRoutes);
app.use('/api/recipes', interactionRoutes);

app.get('/', (req, res) => {
  res.json({
    name: 'Recipe API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login'
      },
      users: {
        me: 'GET /api/users/me',
        profile: 'GET /api/users/:id',
        subscriptions: 'GET /api/users/me/subscriptions',
        savedRecipes: 'GET /api/users/me/saved-recipes'
      },
      recipes: {
        list: 'GET /api/recipes',
        get: 'GET /api/recipes/:id',
        create: 'POST /api/recipes',
        update: 'PATCH /api/recipes/:id',
        delete: 'DELETE /api/recipes/:id',
        publish: 'POST /api/recipes/:id/publish'
      },
      interactions: {
        like: 'POST /api/recipes/:id/like',
        unlike: 'DELETE /api/recipes/:id/like',
        dislike: 'POST /api/recipes/:id/dislike',
        undislike: 'DELETE /api/recipes/:id/dislike',
        save: 'POST /api/recipes/:id/save',
        unsave: 'DELETE /api/recipes/:id/save'
      },
      comments: {
        list: 'GET /api/recipes/:id/comments',
        add: 'POST /api/recipes/:id/comments',
        delete: 'DELETE /api/comments/:id'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: `Cannot ${req.method} ${req.url}`,
    error: 'Not Found'
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Ошибка:', err);
  console.error('Stack:', err.stack);
  
  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || 'Internal server error occurred',
    ...(process.env.NODE_ENV === 'development' && { error: err.message, stack: err.stack })
  });
});

// Запуск сервера после подключения к БД
AppDataSource.initialize()
  .then(() => {
    console.log('Database connected');
    
    app.listen(PORT, () => {});
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });