import { Router } from "express";
import {
  deleteVideo,
  getAllVideosOfChannel,
  getVideoById,
  publishAVideo,
  togglePublishStatus,
  updateVideo,
  getAllVideos,
} from "../controller/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();
router.route("/").get(getAllVideos);

router.route("/").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  verifyJWT,
  publishAVideo
);

router.route("/u/:userId").get(verifyJWT, getAllVideosOfChannel);
router
  .route("/:videoId")
  .get(verifyJWT, getVideoById)
  .delete(verifyJWT, deleteVideo)
  .patch(upload.single("thumbnail"), verifyJWT, updateVideo);

router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

export default router;
