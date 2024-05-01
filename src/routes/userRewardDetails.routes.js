const express = require("express");
const router = express.Router();

const userRewardDetailsController = require("../controllers/userRewardDetails.controller");
const authorize = require("../middleware/authorize");

router.get("/getCountByProfileId/:profileId", authorize.authorization, userRewardDetailsController.getCountByProfileId);

module.exports = router;
