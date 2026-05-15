import express from "express"

import paymentRoutes from '../routes/rent.routes';

const router: express.Router = express.Router()

router.use('/rents', paymentRoutes)

export default router