import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist

  if (!name || !description) {
    throw new ApiError(400, "All fields are required");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist is created"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists

  const playlists = await Playlist.find({
    owner: userId,
  }).select("_id name");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        playlists,
        playlists.length === 0
          ? "No playlists found for this user"
          : "Playlists fetched successfully"
      )
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  const playlistVideos = await Playlist.findById(playlistId)
    .populate("videos", "_id title thumbnail views createdAt duration")
    .select("_id title description videos ");

  return res
    .status(200)
    .json(new ApiResponse(200, playlistVideos, "playlist fetched by ID"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  const playlistVideos = await Playlist.updateOne(
    { _id: playlistId },
    {
      $addToSet: { videos: new mongoose.Types.ObjectId(videoId) },
    }
  );
  if (playlistVideos.matchedCount === 0) {
    throw new ApiError(404, "playlistvideos not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, playlistVideos, "video added to playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist

  const removeVideo = await Playlist.updateOne(
    {
      _id: playlistId,
    },
    {
      $pull: {
        videos: new mongoose.Types.ObjectId(videoId),
      },
    }
  );

  if (removeVideo.matchedCount === 0) {
    throw new ApiError(404, "removeVideo not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, removeVideo, "video removed from playlist"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

  if (!deletedPlaylist) {
    throw new ApiError(404, "deltePlaylist not found");
  }

  return res.status(200).json(new ApiResponse(200, {}, "Playlist deleted"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist

  const playlist = await Playlist.findById(playlistId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (name) playlist.name = name;
  if (description) playlist.description = description;

  await playlist.save();

  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist updated"));
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
