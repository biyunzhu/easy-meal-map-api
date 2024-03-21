const router = require("express").Router();
const mealController = require("../controllers/meal-controller");

router.route("/").get(mealController.mealList);

router
  .route("/:id")
  .get(mealController.mealRecipe)
  .put(mealController.editMealRecipe);

module.exports = router;
