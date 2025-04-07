import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
  {
    targetType: {
      type: String,
      enum: ["video", "comment", "tweet"],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Like = mongoose.model("Like", likeSchema);
