import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { Tweet } from "../models/tweet.model.js";

const toggleLike = asyncHandler(async (req, res) => {
  const { mediaId } = req.params;
  const { targetType } = req.body;

  let targetDoc;
  if (!targetType) {
    throw new ApiError(404, "targetType doesn't exist");
  }
  if (targetType === "video") {
    targetDoc = await Video.findById(mediaId);
  } else if (targetType === "comment") {
    targetDoc = await Comment.findById(mediaId);
  } else if (targetType === "tweet") {
    targetDoc = await Tweet.findById(mediaId);
  } else {
    throw new ApiError(400, `${targetDoc} not found`);
  }

  const existingLike = await Like.findOne({
    targetType,
    targetId: mediaId,
    likedBy: req.user._id,
  });

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id);
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Unliked successfully"));
  } else {
    await Like.create({
      targetType,
      targetId: mediaId,
      likedBy: req.user._id,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Liked successfully"));
  }
});

const likeCounts = asyncHandler(async (req, res) => {
  const { mediaId } = req.params;
  const { targetType } = req.body;

  let targetDoc;

  if (!targetType) {
    throw new ApiError(404, "targetType doesn't exist");
  }
  if (targetType === "video") {
    targetDoc = await Video.findById(mediaId);
  } else if (targetType === "comment") {
    targetDoc = await Comment.findById(mediaId);
  } else if (targetType === "tweet") {
    targetDoc = await Tweet.findById(mediaId);
  } else {
    throw new ApiError(400, `${targetDoc} not found`);
  }

  const likeCount = await Like.countDocuments({
    targetType,
    targetId: mediaId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, likeCount, "Like count fetched successfully"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  const likedVideoDocs = await Like.find({
    targetType: "video",
    likedBy: req.user._id,
  }).select("targetId");

  if (!likedVideoDocs.length) {
    throw new ApiError(400, "videos not found");
  }

  const videoIds = likedVideoDocs.map((like) => like.targetId);

  const videos = await Video.find({ _id: { $in: videoIds } }).select(
    "title duration thumbnail views owner createdAt"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

export { toggleLike, likeCounts, getLikedVideos };
