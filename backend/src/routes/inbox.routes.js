const router = require("express").Router();
const { getAll, getOne, create, bulkCreate, update, remove } = require("../controllers/inbox.controller");
const { authenticate, authorize } = require("../middleware/auth.middleware");

router.use(authenticate);

router.get("/", getAll);
router.get("/:id", getOne);
router.post("/", authorize("ADMIN", "SUPERADMIN"), create);
router.post("/bulk", authorize("SUPERADMIN"), bulkCreate);
router.patch("/:id", authorize("ADMIN", "SUPERADMIN"), update);
router.delete("/:id", authorize("SUPERADMIN"), remove);

module.exports = router;
