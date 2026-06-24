import { Router } from "express";
import { listUsers, updateUserRole } from "../controllers/adminController";
import { authenticate, requireRole } from "../middlewares/authMiddleware";

const router = Router();

// All admin routes require SUPER_ADMIN role
router.use(authenticate, requireRole("SUPER_ADMIN"));

router.get("/users", listUsers);
router.put("/users/:id/role", updateUserRole);

export default router;
