import { Router } from "express";
import { getCart, addToCart, updateCartItem, removeCartItem, mergeCart } from "../controllers/cartController";

const router = Router();

router.route("/").get(getCart).post(addToCart);
router.route("/merge").post(mergeCart);
router.route("/item/:cartItemId").put(updateCartItem).delete(removeCartItem);

export default router;
