import Notification from "../models/Notification.js";

export async function listNotifications(req, res) {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("actor", "username avatar");

  res.json(notifications);
}
