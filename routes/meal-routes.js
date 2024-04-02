const router = require("express").Router();
const mealController = require("../controllers/meal-controller");

router
  .route("/")
  .get(mealController.mealRecipeList)
  .post(mealController.addMealRecipe)
  .delete(mealController.deleteMealRecipe);

router
  .route("/id/:id")
  .get(mealController.mealRecipe)
  .put(mealController.editMealRecipe);

router.route("/auto").get(mealController.generateMealRecipeList);

module.exports = router;
