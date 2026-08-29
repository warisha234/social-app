import Group from "../models/Group.js";
import User from "../models/User.js";

export async function createGroup(req, res) {
  try {
    const { name, members } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Group name is required",
      });
    }

    let memberIds = Array.isArray(members)
      ? members.filter(Boolean).map(String)
      : [];

    const creatorId = req.user._id.toString();

    if (!memberIds.includes(creatorId)) {
      memberIds.push(creatorId);
    }

    if (memberIds.length < 2) {
      return res.status(400).json({
        message: "Select at least one person",
      });
    }

    // Remove duplicate IDs
    memberIds = [...new Set(memberIds)];

    const users = await User.find({
      _id: { $in: memberIds },
    }).select("_id username avatar fullName");

    if (users.length !== memberIds.length) {
      return res.status(400).json({
        message: "One or more selected users were not found",
      });
    }

    const group = await Group.create({
      name: name.trim(),
      members: memberIds,
      admins: [req.user._id],
      createdBy: req.user._id,
    });

    const populatedGroup = await Group.findById(group._id)
      .populate("members", "username avatar fullName")
      .populate("admins", "username avatar fullName")
      .populate("createdBy", "username avatar fullName");

    return res.status(201).json(populatedGroup);
  } catch (error) {
    console.error("Create group error:", error);

    return res.status(500).json({
      message: "Failed to create group",
    });
  }
}


// GET MY GROUPS
export async function getMyGroups(req, res) {
  try {
    const groups = await Group.find({
      members: req.user._id,
    })
      .populate("members", "username avatar fullName")
      .populate("admins", "username avatar fullName")
      .populate("createdBy", "username avatar fullName")
      .sort({ updatedAt: -1 });

    return res.json(groups);
  } catch (error) {
    console.error("Get groups error:", error);

    return res.status(500).json({
      message: "Failed to load groups",
    });
  }
}