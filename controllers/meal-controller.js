const knex = require("knex")(require("../knexfile"));

function transformData(mealsData) {
  const groupedByMealId = mealsData.reduce((acc, meal) => {
    const key = `${meal.meal_id}-${meal.date}-${meal.type}`;
    if (!acc[key]) {
      acc[key] = { ...meal };
      delete acc[key].recipe_id;
      delete acc[key].recipe_name;
      delete acc[key].recipe_url;
      acc[key].recipes = [];
    }
    if (meal.recipe_id && meal.recipe_name && meal.recipe_url) {
      acc[key].recipes.push({
        recipe_id: meal.recipe_id,
        recipe_name: meal.recipe_name,
        recipe_url: meal.recipe_url,
      });
    }
    return acc;
  }, {});

  return Object.values(groupedByMealId);
}

function getDaysOfWeekStartingFromMonday() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  const monday = new Date(today); // Copy the current date

  // Find the date of the Monday of the current week
  monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));

  const daysOfWeek = [];
  // Loop to generate dates for the next 7 days
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(monday);
    nextDay.setDate(monday.getDate() + i);
    daysOfWeek.push(nextDay.toISOString().split("T")[0]); // Format date as 'YYYY-MM-DD'
  }
  return daysOfWeek;
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
      .join("recipes", "meal_recipes.recipe_id", "recipes.id")
      .select(
        "meals.id as meal_id",
        "meals.date",
        "meals.type",
        "meal_recipes.recipe_id",
        "recipes.name as recipe_name",
        "recipes.url as recipe_url"
      );

    // Transform the fetched data
    const transformedMeals = transformData(meals);

    // Send the transformed data in the response
    res.status(200).json(transformedMeals);
    // res.status(200).json(meals);
  } catch (error) {
    res.status(400).send(`Error retrieving meals: ${error}`);
  }
};

const generateMealRecipeList = async (req, res) => {
  try {
    const targetDate = getDaysOfWeekStartingFromMonday();

    for (const date of targetDate) {
      const existingMeals = await knex("meals").where("date", date);

      // Check if meals for all types (1, 2, 3) exist
      const typesPresent = existingMeals.map((meal) => meal.type);
      const missingTypes = [1, 2, 3].filter(
        (type) => !typesPresent.includes(type)
      );

      // Add meals for missing types
      const newMeals = missingTypes.map((type) => ({
        date: date,
        type: type,
      }));

      // Insert new meals into the database
      if (newMeals.length > 0) {
        await knex("meals").insert(newMeals);
      }
    }

    // Subquery to select meal IDs from the `meals` table where the date matches
    const mealIdArrayToDelete = await knex("meals")
      .select("id")
      .whereIn("date", targetDate);
    const mealIdsToDelete = mealIdArrayToDelete.map((row) => row.id);
    await knex("meal_recipes").whereIn("meal_id", mealIdsToDelete).del();

    const mealIds = await knex("meals")
      .whereIn("date", targetDate)
      .select("id", "type");
    const pairs = [];

    const recipeCategories = [
      [8, 10, 21, 22, 23],
      [1, 2, 3, 4, 5, 6, 7, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      [1, 2, 3, 4, 5, 6, 7, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    ];
    for (let i = 0; i < mealIds.length; i++) {
      const recipeCategory = recipeCategories[mealIds[i].type - 1];
      const recipeIds = await knex("recipes")
        .whereIn("categoryId", recipeCategory)
        .pluck("id");

      for (let j = 0; j < 3; j++) {
        const randomRecipeId =
          recipeIds[Math.floor(Math.random() * recipeIds.length)];
        const pairMatched = await knex("meal_recipes").where({
          meal_id: mealIds[i].id,
          recipe_id: randomRecipeId,
        });
        // Add the pair to the pairs array if there's no existing pair
        if (pairMatched.length === 0) {
          await knex("meal_recipes").insert({
            recipe_id: randomRecipeId,
            meal_id: mealIds[i].id,
          });
        } else {
          pairs.push({ recipe_id: randomRecipeId, meal_id: mealIds[i].id });
        }
      }
    }

    // Fetch the data from the database
    const meals = await knex("meals")
      .join("meal_recipes", "meals.id", "meal_recipes.meal_id")
      .join("recipes", "meal_recipes.recipe_id", "recipes.id")
      .select(
        "meals.id as meal_id",
        "meals.date",
        "meals.type",
        "meal_recipes.recipe_id",
        "recipes.name as recipe_name",
        "recipes.url as recipe_url"
      )
      .whereIn("date", targetDate);

    // Transform the fetched data
    const transformedMeals = transformData(meals);

    // Send the transformed data in the response
    res.status(200).json(transformedMeals);
  } catch (error) {
    res.status(400).send(`Error generating meals: ${error}`);
  }
};

const mealRecipe = async (req, res) => {
  try {
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
    res.sendStatus(201);
  } catch (error) {
    res.status(500).json({
      message: `Unable to post: ${error}`,
    });
  }
};

const deleteMealRecipe = async (req, res) => {
  try {
    const rowDeleted = await knex("meal_recipes")
      .where({ meal_id: req.query.meal_id, recipe_id: req.query.recipe_id })
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
  generateMealRecipeList,
  mealRecipe,
  editMealRecipe,
  addMealRecipe,
  deleteMealRecipe,
};
