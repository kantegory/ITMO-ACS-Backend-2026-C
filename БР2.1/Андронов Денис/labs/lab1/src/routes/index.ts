import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { UserController } from "../controllers/UserController";
import { RestaurantController } from "../controllers/RestaurantController";
import { ReservationController } from "../controllers/ReservationController";
import { ReviewController } from "../controllers/ReviewController";
import { authMiddleware, adminMiddleware } from "../middlewares/auth.middleware";

const router = Router();

// ================== auth ==================
router.post("/auth/register", AuthController.register);
router.post("/auth/login", AuthController.login);

// ================== users ==================
router.get("/users/me", authMiddleware, UserController.getCurrentUser);
router.get("/users/:id", UserController.getUser);

// ================== restaurants ==================
router.get("/restaurants", RestaurantController.listRestaurants);
router.get("/restaurants/:id", RestaurantController.getRestaurant);

// ================== reservations ==================
router.post("/reservations", authMiddleware, ReservationController.createReservation);
router.get("/reservations/my", authMiddleware, ReservationController.getMyReservations);
router.get("/reservations/user/:userId", authMiddleware, adminMiddleware, ReservationController.getUserReservations);

// ================== reviews ==================
router.post("/reviews", authMiddleware, ReviewController.createReview);
router.get("/reviews/restaurant/:restaurantId", ReviewController.getRestaurantReviews);

export default router;