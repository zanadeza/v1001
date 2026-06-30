const router = require("express").Router();
const { getAll, create, update, remove } = require("../controllers/user.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

router.use(authenticate);
router.use(authorize("SUPERADMIN"));

router.get("/", getAll);
router.post("/", create);
router.patch("/:id", update);
router.delete("/:id", remove);

module.exports = router;
