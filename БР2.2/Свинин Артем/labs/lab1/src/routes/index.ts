import { Router } from "express";
import authRoutes from "./auth.routes";
import usersRoutes from "./users.routes";
import addressesRoutes from "./addresses.routes";
import propertyTypesRoutes from "./property-types.routes";
import propertiesRoutes from "./properties.routes";
import bookingsRoutes from "./bookings.routes";
import transactionsRoutes from "./transactions.routes";
import reviewsRoutes from "./reviews.routes";
import favouritesRoutes from "./favourites.routes";
import imagesRoutes from "./images.routes";
import facilitiesRoutes from "./facilities.routes";
import propertyFacilitiesRoutes from "./property-facilities.routes";
import chatsRoutes from "./chats.routes";
import messagesRoutes from "./messages.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/addresses", addressesRoutes);
router.use("/property-types", propertyTypesRoutes);
router.use("/properties", propertiesRoutes);
router.use("/bookings", bookingsRoutes);
router.use("/transactions", transactionsRoutes);
router.use("/reviews", reviewsRoutes);
router.use("/favourites", favouritesRoutes);
router.use("/images", imagesRoutes);
router.use("/facilities", facilitiesRoutes);
router.use("/property-facilities", propertyFacilitiesRoutes);
router.use("/chats", chatsRoutes);
router.use("/messages", messagesRoutes);

export default router;