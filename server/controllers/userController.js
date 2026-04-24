import { asyncWrapProviders } from "async_hooks";

import imageKit from "../configs/imageKit.js";

import User from "../modules/User.js";

import fs from "fs";

import Connection from "../modules/Connection.js";
import { inngest } from "../inngest/index.js";
import Post from "../modules/Post.js";

// get user data using userId

export const getUserData = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId);
    if (!userId) {
      return res.json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// update user data

export const updateUserData = async (req, res) => {
  try {
    const { userId } = req.auth();
    let { username, bio, location, full_name } = req.body;
    const tempUser = await User.findById(userId);
    !username && (username = tempUser.username);
    if (tempUser.username !== username) {
      const user = await User.findOne({ username });
      if (user) {
        username = tempUser.username;
      }
    }
    const updatedData = {
      username,
      bio,
      location,
      full_name,
    };

    const profile = req.files.profile && req.files.profile[0];
    const cover = req.files.cover && req.files.cover[0];

    if (profile) {
      const buffer = fs.readFileSync(profile.path);
      const response = await imageKit.upload({
        file: buffer,
        fileName: profile.originalname,
      });

      const url = imageKit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { quality: "webp" },
          { quality: "512" },
        ],
      });

      updatedData.profile_picture = url;
    }
    if (cover) {
      const buffer = fs.readFileSync(cover.path);

      const response = await imageKit.upload({
        file: buffer,
        fileName: cover.originalname,
      });

      const url = imageKit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { quality: "webp" },
          { quality: "1280" },
        ],
      });

      updatedData.cover_photo = url;
    }

    const user = await User.findByIdAndUpdate(userId, updatedData, {
      new: true,
    });
    res.json({ success: true, user, message: "Profile update successfully" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// find users...
export const discoverUsers = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { input } = req.body;
    const currentUser = await User.findById(userId).select("blockUsers");
    const blockedByMe = currentUser?.blockedUsers?.map(String) || [];

    const excludedIds = [...blockedByMe, userId];

    const users = await User.find({
      $and: [
        {
          $or: [
            { username: new RegExp(input, "i") },
            { email: new RegExp(input, "i") },
            { full_name: new RegExp(input, "i") },
            { location: new RegExp(input, "i") },
          ],
        },
        { _id: { $nin: excludedIds } },
      ],
    }).select("_id full_name username profile_picture bio location");

    res.json({ success: true, users });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// follow user

export const followUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;
    const user = await User.findById(userId);
    if (user.following.includes(id)) {
      return res.json({
        success: false,
        message: "You already following this user",
      });
    }
    user.following.push(id);
    await user.save();
    const toUser = await User.findById(id);

    toUser.followers.push(userId);
    await toUser.save();

    res.json({ success: true, message: "Now You Are Following This User" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Unfollow user

export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;
    const user = await User.findById(userId);

    user.following = user.following.filter((user) => user !== id);
    await user.save();
    const toUser = await User.findById(id);

    toUser.followers = toUser.followers.filter((user) => user !== userId);
    await toUser.save();

    res.json({
      success: true,
      message: "Yiu Are Now Longer Following this user",
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// send connection request

export const sendConnectionRequest = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const connectionRequests = await Connection.find({
      from_user_id: userId,
      created_at: { $gt: last24Hours },
    });

    if (connectionRequests.length >= 20) {
      return res.json({
        success: false,
        message: "You Have Sent than 20 connection in the last 24 hours",
      });
    }
    const connection = await Connection.findOne({
      $or: [
        { from_user_id: userId, to_user_id: id },
        { from_user_id: userId, to_user_id: id },
      ],
    });

    if (!connection) {
      const newConnection = await Connection.create({
        from_user_id: userId,
        to_user_id: id,
      });

      await inngest.send({
        name: "app/connection-request",
        data: { connectionId: newConnection._id },
      });

      return res.json({
        success: true,
        message: "Connection request sent successfully",
      });
    } else if (connection && connection.status === "accepted") {
      return res.json({
        success: false,
        message:
          "You have sent than 20 connection requests in the last 24 hours",
      });
    }

    return res.json({ success: false, message: "Connection request pending" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// get user connection

export const getUserConnections = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId).populate(
      "connections followers following",
    );
    const connections = user.connections;
    const followers = user.followers;
    const following = user.following;
    const pendingConnections = (
      await Connection.find({ to_user_id: userId, status: "pending" }).populate(
        "from_user_id",
      )
    ).map((connection) => connection.from_user_id);

    res.json({
      success: true,
      connections,
      followers,
      following,
      pendingConnections,
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// accept connection request

export const acceptConnectionRequest = async (res, req) => {
  try {
    const { userId } = req.auth();
    const { id } = req.body;
    const connection = await Connection.findOne({ from_user_id: userId });

    if (!connection) {
      return res.json({ success: false, message: "connection not found" });
    }
    const user = await User.findById(userId);
    user.connections.push(id);
    await user.save();
    const toUser = await User.findById(id);
    await toUser.save();

    connection.status = "accepted";

    await connection.save();

    res.json({ success: true, message: "connection accepted successfully" });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// get profile
export const getUserProfile = async (req, res) => {
  try {
    const { profileId } = req.body;
    if (!profileId)
      return res.json({ success: false, message: "profileId is required" });
    const profileDoc = await User.findById(profileId).select(
      "_id full_name username profile_picture cover_photo bio location blockedUsers",
    );

    if (!profileDoc)
      return res.json({ success: false, message: "profile not found" });
    const profile = profileDoc.toObject();
    const { userId } = req.auth();
    const currentUser = await User.findById(userId).select("blockedUsers");

    const isBlocked =
      currentUser?.blockedUsers?.includes(String(profile._id)) ||
      profile?.blockedUsers?.includes(String(userId));

    let posts = [];
    if (!isBlocked) {
      posts = await Post.find({ user: profileId })
        .sort({ createdAt: -1 })
        .populate("user", "_id full_name username profile_picture");
    }

    delete profile.blockedUsers;
    res.json({success:true, profile, posts , isBlocked})
  } catch (error) {
    console.log(error)
    res.json({success:false, message:error.message})
  }
};


// ====== Block User ======

export const blockUser = async(req,res)=> {
  try{
    const {userId} = req.auth()
    const {userIdToBlock} = req.body
    const currentUser = await User.findById(userId)
    if(!currentUser.blockedUsers.includes(userIdToBlock)){
      currentUser.blockedUsers.push(userIdToBlock)
      await currentUser.save()
    }

    return res.json({
      success:true,
      message:"User blocked successfully",
      blockedUsers:currentUser.blockedUsers,

    })

  } catch (error) {
           console.log(error)
    res.json({success:false, message:error.message})
    }
}
// ====== UnBlock User ======

export const unBlockUser = async(req,res)=> {
  try{
    const {userId} = req.auth()
    const {userIdToUnBlock} = req.body
    const currentUser = await User.findById(userId)
   currentUser.blockedUsers = currentUser.blockedUsers.filter(
    (id)=>String(id) !== String(userIdToUnBlock)
   )

   await currentUser.save()

    return res.json({
      success:true,
      message:"User unblocked successfully",
      blockedUsers:currentUser.blockedUsers,

    })

  } catch (error) {
           console.log(error)
    res.json({success:false, message:error.message})
    }
}
