import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;

  const options = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 10,
  };

  const commentsAggregateQuery = Comment.aggregate([
    { $match: { video: new mongoose.Types.ObjectId(videoId) } },
    {
      $lookup: {
        from: "users",
        foreignField: "_id",
        localField: "owner",
        as: "owner",
      },
    },
    {
      $unwind: "$owner",
    },
    { $sort: { createdAt: -1 } }, // Newest first
    {
      $project: {
        content: 1,
        "owner.username": 1,
        "owner.avatar": 1,
        createdAt: 1,
      },
    },
  ]);

  const paginatedComments = await Comment.aggregatePaginate(
    commentsAggregateQuery,
    options
  );

  if (!paginatedComments || !paginatedComments.docs.length) {
    throw new ApiError(404, "Paginated comments not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, paginatedComments, "Comment fetched successfully")
    );
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(400, "Invalid add comment request");
  }
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Comment not found");
  }
  const user = req.user;
  await Comment.create({
    content,
    owner: user._id,
    video: videoId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, "comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  const { content } = req.body;

  if (!content || typeof content !== "string") {
    throw new ApiError(400, "Content is required and must be a string");
  }
  const comment = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(400, "Comment not found");
  }

  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not allowed to update this comment");
  }

  comment.content = content.trim();
  await comment.save();

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;

  const comment = await Comment.findByIdAndDelete(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
