import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { populate } from "dotenv";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const mongoQuery = {};

  if (query) {
    mongoQuery.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }

  if (userId) {
    mongoQuery.owner = userId;
  }

  const sortOptions = {};
  if (sortType) {
    sortOptions[sortBy || "createdAt"] = sortType === "asc" ? 1 : -1;
  }

  const videos = await Video.find(mongoQuery)
    .sort(sortOptions)
    .skip((options.page - 1) * options.limit)
    .limit(options.limit)
    .populate("owner", "username avatar");

  const total = await Video.countDocuments(mongoQuery);
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        pagination: { total, page: options.page, limit: options.limit },
      },
      "Videos fetched successfully"
    )
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (!title || !description) {
    throw new ApiError(400, "All fields are required");
  }

  const videoLocalPath = req.files?.videoFile[0].path;
  if (!videoLocalPath) {
    throw new ApiError(400, "Video file is required");
  }
  const thumbnailLocalPath = req.files?.thumbnail[0].path;
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail file is required");
  }

  const video = await uploadOnCloudinary(videoLocalPath);
  if (!video) {
    throw new ApiError(404, "Error uploading video on cloudinary");
  }
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail) {
    throw new ApiError(404, "Error uploading thumbnail on cloudinary");
  }

  const duration = video.duration || 0; // seconds

  const newVideo = await Video.create({
    title,
    description,
    videoFile: video.url,
    thumbnail: thumbnail.url,
    duration,
    owner: req.user._id,
    cloudinary_video_id: video.public_id,
    cloudinary_thumbnail_id: thumbnail.public_id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, newVideo, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  const video = await Video.findById(videoId)
    .select("-isPublished -duration")
    .populate("owner", "username avatar");

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  //TODO: update video details like title, description, thumbnail
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this video");
  }

  const deleteThumbnail = await deleteFromCloudinary(
    video.cloudinary_thumbnail_id
  );

  if (deleteThumbnail?.result !== "ok") {
    throw new ApiError(
      404,
      "Error while deleting while uploading on cloudinary"
    );
  }

  const thumbnailLocalPath = req.file?.path;
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail file is missing");
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail.url) {
    throw new ApiError(400, "Error uploading thumbnail on cloudinary");
  }

  if (title) video.title = title;
  if (description) video.description = description;
  video.thumbnail = thumbnail.url;

  await video.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        _id: video._id,
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail,
        cloudinary_thumbnail_id: thumbnail.public_id,
      },
      "Video updated successfully"
    )
  );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }

  const deleteVideo = await deleteFromCloudinary(video.cloudinary_video_id);

  if (deleteVideo?.result !== "ok") {
    throw new ApiError(404, "Error deleting video from cloudinary");
  }

  const deleteThumbnail = await deleteFromCloudinary(
    video.cloudinary_thumbnail_id
  );

  if (deleteThumbnail?.result !== "ok") {
    throw new ApiError(404, "Error deleting thumbnail from cloudinary");
  }

  await video.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (video.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }

  video.isPublished = !video.isPublished;

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Publish status toggled successfully"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
