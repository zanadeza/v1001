const router = require("express").Router();
const { getByInbox, getOne, send, markRead, remove } = require("../controllers/message.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

router.use(authenticate);

router.get("/inbox/:inboxId", getByInbox);
router.get("/:id", getOne);
router.post("/send", authorize("ADMIN", "SUPERADMIN"), send);
router.patch("/:id/read", markRead);
router.delete("/:id", authorize("ADMIN", "SUPERADMIN"), remove);

module.exports = router;
