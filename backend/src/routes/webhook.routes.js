// webhook.routes.js
const router = require("express").Router();
const { receiveEmail } = require("../controllers/webhook.controller");
const { receiveFromCloudflare } = require("../controllers/cloudflare-webhook.controller");

router.post("/mailgun", receiveEmail);
router.post("/cloudflare", receiveFromCloudflare);

module.exports = router;
