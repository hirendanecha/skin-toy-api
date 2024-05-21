const express = require("express");
const router = express.Router();
const favoriteProfilesController = require("../controllers/favorite-profiles.controller");
const authorize = require("../middleware/authorize");

router.use(authorize.authorization);
router.get("/:id", favoriteProfilesController.getFavoriteProfiles);
router.post("/add", favoriteProfilesController.addFavoriteProfile);
router.delete("/:id", favoriteProfilesController.removeFromFavorite);

module.exports = router;
