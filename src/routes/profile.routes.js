const express = require("express");
const router = express.Router();
const profileController = require("./../controllers/profile.controller");
const authorize = require("../middleware/authorize");

router.get("/getGroupBasicDetails/:uniqueLink", profileController.getGroupBasicDetails);
router.use(authorize.authorization);
router.get("/groupsAndPosts", profileController.groupsAndPosts);
router.get("/getGroups", profileController.getGroups);
router.get("/getGroupPostById/:id", profileController.getGroupPostById);
router.get("/getGroupFileResourcesById/:id", profileController.getGroupFileResourcesById);

module.exports = router;
