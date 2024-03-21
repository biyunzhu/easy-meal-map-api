const knex = require("knex")(require("../knexfile"));

const mealList = async (req, res) => {
  try {
    const meals = await knex("meals")
      .join("meal_recipes", "meals.id", "meal_recipes.meal_id")
      .select("meals.*", "meal_recipes.recipe_id");
    res.status(200).json(meals);
  } catch (error) {
    res.status(400).send(`Error retrieving meals: ${error}`);
  }
};

module.exports = {
  mealList,
};
