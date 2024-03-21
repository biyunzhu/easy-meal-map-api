const router = require("express").Router();
const mealController = require("../controllers/meal-controller");

router.route("/").get(mealController.mealList);

module.exports = router;
