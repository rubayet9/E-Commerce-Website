import { Router } from "express";
import { addFavourite, removeFavourite, getFavourites } from "../controllers/favouriteController";
import { authenticate } from "../middlewares/authMiddleware";

const router = Router();

// All favourite routes require authentication
router.use(authenticate);

router.post("/", addFavourite);
router.delete("/:productId", removeFavourite);
router.get("/", getFavourites);

export default router;
