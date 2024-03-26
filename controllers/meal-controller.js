const knex = require("knex")(require("../knexfile"));

function transformData(data) {
  // Create a temporary object to hold the grouped data
  const groupedByMealId = data.reduce(
    (acc, { meal_id, date, type, recipe_id }) => {
      // If the meal_id doesn't exist in the accumulator, add it
      if (!acc[meal_id]) {
        acc[meal_id] = { meal_id, date, type, recipe_id: [] };
      }
      // Push the current recipe_id into the meal's recipe_id array
      acc[meal_id].recipe_id.push(recipe_id);
      return acc;
    },
    {}
  );

  // Convert the object back into an array of values
  return Object.values(groupedByMealId);
}

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

const mealRecipeList = async (req, res) => {
  try {
    // Fetch the data from the database
    const meals = await knex("meals")
      .join("meal_recipes", "meals.id", "meal_recipes.meal_id")
      .select(
        "meal_recipes.meal_id",
        "meals.date",
        "meals.type",
        "meal_recipes.recipe_id"
      );

    // Transform the fetched data
    const transformedMeals = transformData(meals);

    // Send the transformed data in the response
    res.status(200).json(transformedMeals);
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

const addMealRecipe = async (req, res) => {
  try {
    const result = await knex("meal_recipes").insert(req.body);
    // const newMealRecipe = result[0];
    // const createdMealRecipe = await knex("meal_recipes").where({
    //   meal_id: newMealRecipe,
    // });
    res.sendStatus(201);
  } catch (error) {
    res.status(500).json({
      message: `Unable to post: ${error}`,
    });
  }
};

const deleteMealRecipe = async (req, res) => {
  // const { meal_id, recipe_id } = req.params;
  try {
    const rowDeleted = await knex("meal_recipes")
      .where({ meal_id: req.params.id })
      .del();
    if (rowDeleted === 0) {
      return res.status(404).json({
        message: `Item not found`,
      });
    }
    return res.sendStatus(204);
  } catch (error) {
    res.status(500).json({
      message: `Unable to delete: ${error}`,
    });
  }
};

module.exports = {
  mealList,
  mealRecipeList,
  mealRecipe,
  editMealRecipe,
  addMealRecipe,
  deleteMealRecipe,
};
