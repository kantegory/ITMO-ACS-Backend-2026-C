import express from "express"

import messageRoutes from './message.routes';

const router: express.Router = express.Router()

router.use('/message', messageRoutes)

export default router