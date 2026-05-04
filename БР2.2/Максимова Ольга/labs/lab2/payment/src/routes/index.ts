import express from "express"

import paymentRoutes from './payment.routes';

const router: express.Router = express.Router()

router.use('/payment', paymentRoutes)

export default router