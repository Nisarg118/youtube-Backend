import { Router } from "express";
import {
  getSubscribedChannels,
  toggleSubscription,
  getsubscriberCount,
} from "../controller/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/c/:channelId").get(getsubscriberCount).post(toggleSubscription);

router.route("/u/").get(getSubscribedChannels);

export default router;
