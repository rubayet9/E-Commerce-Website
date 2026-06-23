import { Router } from "express";
import { getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct } from "../controllers/productController";

const router = Router();

router.route("/").get(getProducts).post(createProduct);
router.route("/slug/:slug").get(getProductBySlug);
router.route("/:id").put(updateProduct).delete(deleteProduct);

export default router;
