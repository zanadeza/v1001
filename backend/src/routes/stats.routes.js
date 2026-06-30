// stats.routes.js
const router = require("express").Router();
const { getStats } = require("../controllers/stats.controller");
const { authenticate } = require("../middleware/auth.middleware");

router.get("/", authenticate, getStats);

module.exports = router;
