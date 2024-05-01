const express = require("express");
const router = express.Router();

const seeFirstUserController = require("../controllers/seeFirstUser.controller");
const authorize = require("../middleware/authorize");

router.use(authorize.authorization);
router.post("/create", seeFirstUserController.create);
router.delete("/remove/:id", seeFirstUserController.remove);
router.delete("/remove/:profileId/:seeFirstProfileId", seeFirstUserController.removeByProfileIdAndSeeFirstId);
router.get("/getByProfileId/:profileId", seeFirstUserController.getByProfileId);
router.get("/getSeeFirstIdByProfileId/:profileId", seeFirstUserController.getSeefirstIdByProfileId);

module.exports = router;
