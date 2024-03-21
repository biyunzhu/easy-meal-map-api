const router = require("express").Router();
const recipeController = require("../controllers/recipe-controller");

router.route("/").get(recipeController.recipeList);

router.route("/:id").get(recipeController.recipeDetail);

module.exports = router;
