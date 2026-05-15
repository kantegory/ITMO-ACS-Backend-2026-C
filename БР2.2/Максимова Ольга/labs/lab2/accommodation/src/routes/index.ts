import express from "express"

import accommodationRoutes from './accommodation.routes';

const router: express.Router = express.Router()

router.use('/accommodation', accommodationRoutes)

export default router