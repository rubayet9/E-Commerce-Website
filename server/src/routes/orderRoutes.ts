import { Router } from "express";
import { placeOrder, getOrderByNumber, getUserOrders } from "../controllers/orderController";

const router = Router();

router.route("/").post(placeOrder);
router.route("/track/:orderNumber").get(getOrderByNumber);
router.route("/user/:userId").get(getUserOrders);

export default router;
