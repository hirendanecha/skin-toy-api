const express = require("express");
const router = express.Router();
const bugsAndReportsController = require("../controllers/bugs-reports.controller");
const authorize = require("../middleware/authorize");

router.use(authorize.authorization);
router.get("/:id", bugsAndReportsController.getBugDetails);
router.post("/", bugsAndReportsController.getBugsList);
router.post("/add-bugs", bugsAndReportsController.addBugReports);
router.put("/change-status", bugsAndReportsController.updateBugsStatus);
router.delete("/delete/:id", bugsAndReportsController.deleteBugs);

module.exports = router;
