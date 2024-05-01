const express = require("express");
const router = express.Router();
const featuredChannels = require("../controllers/featuredChannels.controller");
const authorize = require("../middleware/authorize");

router.get("/", featuredChannels.getChannels);
router.get("/get/:id", featuredChannels.findChannelById);
router.get("/search-user", featuredChannels.getUsersByUsername);
router.get("/:name", featuredChannels.getChannelById);
router.get("/my-channel/:id", featuredChannels.getChannelByUserId);
router.get("/post/:id", featuredChannels.getPostDetails);
router.post("/posts", featuredChannels.getVideos);
router.post("/my-posts", featuredChannels.getChannelVideos);
router.use(authorize.authorization);
router.get("/activate-channel", featuredChannels.channelsApprove);
router.get("/feature/:id", featuredChannels.updateChannleFeature);
router.post("/search-all", featuredChannels.searchAllData);
router.post("/create-admin", featuredChannels.CreateSubAdmin);
router.post("/get", featuredChannels.getAllChannels);
router.post("/create-channel", featuredChannels.createChannel);
router.delete("/leave", featuredChannels.removeFormChannel);
router.delete("/:id", featuredChannels.deleteChannel);

module.exports = router;
