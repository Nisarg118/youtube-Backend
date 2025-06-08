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
      .json(new ApiResponse(200, {}, "Channel subscribed successfully"));
  } else {
    await Subscription.findByIdAndDelete(existingSubscription._id);

    return res
      .status(200)
      .json(new ApiResponse(200, {}, "Channel unsubscribed successfully"));
  }
});

// controller for getting all the subscribed channels
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const subscribedChannels = await Subscription.find({
    subscriber: userId,
  })
    .skip(skip)
    .limit(limit)
    .populate("channel", "username avatar");

  const channels = subscribedChannels.map((sub) => sub.channel);
  return res
    .status(200)
    .json(
      new ApiResponse(200, channels, "subscribed channels fetched successfully")
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
