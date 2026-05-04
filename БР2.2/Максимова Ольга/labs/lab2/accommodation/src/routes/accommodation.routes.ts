import { Router } from "express";
import { accommodationController } from "../controllers";
import { authMiddleware } from "../middleware";
import { serviceAuthMiddleware } from "common";

const router = Router();

router.get("/internal/batch", serviceAuthMiddleware, accommodationController.getBatch);
router.get(
  "/internal/:id/availability",
  serviceAuthMiddleware,
  accommodationController.getAvailabilityForService,
);

router.post("/facilities", authMiddleware, accommodationController.createFacility);

router.get("/find/me", authMiddleware, accommodationController.getMyLandlord);
router.get("/", authMiddleware, accommodationController.list);

router.post("/", authMiddleware, accommodationController.create);
router.patch("/:id", authMiddleware, accommodationController.patch);
router.post("/:id/photos", authMiddleware, accommodationController.addPhoto);
router.delete("/:id/photos/:photoId", authMiddleware, accommodationController.deletePhoto);
router.delete("/:id", authMiddleware, accommodationController.remove);

router.get("/:id/availability", authMiddleware, accommodationController.getAvailability);
router.get("/:id", authMiddleware, accommodationController.getById);

export default router;