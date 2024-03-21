const knex = require("knex")(require("../knexfile"));

const mealList = async (req, res) => {
  try {
    const meals = await knex("meals")
      .join("meal_recipes", "meals.id", "meal_recipes.meal_id")
      .select(
        "meal_recipes.meal_id",
        "meals.date",
        "meals.type",
        "meal_recipes.recipe_id"
      );
    res.status(200).json(meals);
  } catch (error) {
    res.status(400).send(`Error retrieving meals: ${error}`);
  }
};

const mealRecipe = async (req, res) => {
  try {
    // const mealFound = await knex("meals")
    //   .join("meal_recipes", "meals.id", "meal_recipes.meal_id")
    //   .select("meals.*", "meal_recipes.recipe_id")
    //   .where({
    //     "meals.id": req.params.id,
    //   });

    const mealsFound = await knex("meal_recipes")
      .join("meals", "meals.id", "meal_recipes.meal_id")
      .select(
        "meal_recipes.meal_id",
        "meals.date",
        "meals.type",
        "meal_recipes.recipe_id"
      )
      .where({
        meal_id: req.params.id,
      });
    if (mealsFound.length === 0) {
      return res.status(404).json({
        message: `Meal with ID ${req.params.id} not found`,
      });
    }

    const recipeIds = mealsFound.map((meal) => meal.recipe_id);

    const mealData = {
      meal_id: mealsFound[0].meal_id,
      date: mealsFound[0].date,
      type: mealsFound[0].type,
      recipe_id: recipeIds,
    };

    res.status(200).json(mealData);
  } catch (error) {
    res.status(500).json({
      message: `Unable to retrieve meal data for recipe with ID ${req.params.id}`,
    });
  }
};

const editMealRecipe = async (req, res) => {
  try {
    const rowsUpdated = await knex("meal_recipes")
      .where({
        meal_id: req.params.id,
      })
      .update(req.body);

    if (rowsUpdated === 0) {
      return res.status(404).json({
        message: `Meal with ID ${req.params.id} not found`,
      });
    }

    const updatedMealRecipe = await knex("meal_recipes").where({
      meal_id: req.params.id,
    });

    res.status(200).json(updatedMealRecipe[0]);
  } catch (error) {
    res.status(500).json({
      message: `Unable to edit meal data for ID ${req.params.id}`,
    });
  }
};

module.exports = {
  mealList,
  //   mealDetail,
  mealRecipe,
  editMealRecipe,
};
