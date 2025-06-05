import { Router } from "express";
import {
  getLikedVideos,
  toggleLike,
  likeCounts,
} from "../controller/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/toggle/v/:mediaId").post(toggleLike);
router.route("/:mediaId").get(likeCounts);

router.route("/videos").get(getLikedVideos);

export default router;
