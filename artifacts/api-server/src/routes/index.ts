import { Router, type IRouter } from "express";
import healthRouter from "./health";
import relworxRouter from "./relworx";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/relworx", relworxRouter);

export default router;
