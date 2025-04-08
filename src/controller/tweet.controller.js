import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized: User not found");
  }
  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Content is required");
  }
  content = content.trim();

  const tweet = await Tweet.create({
    content,
    owner: userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;

  if (!userId) {
    throw new ApiError(401, "Unauthorized: User not found");
  }

  const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 });

  if (tweets.length === 0) {
    throw new ApiError(404, "Tweets not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    throw new ApiError(400, "Content is required");
  }
  if (!tweetId) {
    throw new ApiError(400, "tweet not found");
  }

  const tweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      content: content.trim(),
    },
    { new: true, runValidators: true }
  );

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "tweet ID is required");
  }

  const response = await Tweet.findByIdAndDelete(tweetId);
  if (!response) {
    throw new ApiError(400, "Tweet not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
