const express = require("express");
const router = express.Router();

const communityPostController = require("../controllers/community-post.controller");
const utilsController = require("../controllers/utils.controller");

router.get("/", communityPostController.findAll);
router.get("/:id", communityPostController.getCommunityPostById);
router.get("/get/:id", communityPostController.getPostByPostId);
router.get("/get-meta", communityPostController.getMeta);
router.post("/create", communityPostController.createPost);
router.post("/upload-community-post", utilsController.uploadPostImage);
router.get("/files/:folder/:id", utilsController.getFiles);
router.get("/:folder/:id/:filename", utilsController.readFile);
router.delete("/:id", communityPostController.deletePost);

module.exports = router;
