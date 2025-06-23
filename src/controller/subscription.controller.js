import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription

  const userId = req.user._id;

  // Prevent users from subscribing to themselves
  if (channelId === String(userId)) {
    throw new ApiError(400, "You cannot subscribe to your own channel");
  }

  const existingSubscription = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });

  if (!existingSubscription) {
    await Subscription.create({
      subscriber: userId,
      channel: channelId,
    });

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isSubscribed: true },
          "Channel subscribed successfully"
        )
      );
  } else {
    await Subscription.findByIdAndDelete(existingSubscription._id);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { isSubscribed: false },
          "Channel unsubscribed successfully"
        )
      );
  }
});

// controller for getting all the subscribed channels
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: { subscriber: userId },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              subscribersCount: { $size: "$subscribers" },
            },
          },
          {
            $project: {
              _id: 1,
              fullName: 1,
              username: 1,
              avatar: 1,
              subscribersCount: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$channel" }, // flatten channel from array
    { $skip: skip },
    { $limit: limit },
  ]);

  const channels = subscribedChannels.map((s) => s.channel);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channels,
        "Subscribed channels fetched successfully with subscribers count"
      )
    );
});

// controller for getting subscriber count
const getsubscriberCount = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  const subscriberCount = await Subscription.countDocuments({
    channel: channelId,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscriberCount,
        "Subscriber count fetched successfully"
      )
    );
});

export { toggleSubscription, getsubscriberCount, getSubscribedChannels };
