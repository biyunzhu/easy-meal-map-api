const knex = require("knex")(require("../knexfile"));

function transformData(mealsData) {
  // // Create a temporary object to hold the grouped data
  // const groupedByMealId = data.reduce(
  //   (acc, { meal_id, date, type, recipe_id }) => {
  //     // If the meal_id doesn't exist in the accumulator, add it
  //     if (!acc[meal_id]) {
  //       acc[meal_id] = { meal_id, date, type, recipe_id: [] };
  //     }
  //     // Push the current recipe_id into the meal's recipe_id array
  //     acc[meal_id].recipe_id.push(recipe_id);
  //     return acc;
  //   },
  //   {}
  // );
  // Create an object to group meals by meal_id, date, and type
  const groupedByMealId = mealsData.reduce((acc, meal) => {
    const key = `${meal.meal_id}-${meal.date}-${meal.type}`;
    if (!acc[key]) {
      acc[key] = { ...meal };
      delete acc[key].recipe_id;
      delete acc[key].recipe_name;
      acc[key].recipes = [];
    }
    if (meal.recipe_id && meal.recipe_name) {
      acc[key].recipes.push({
        recipe_id: meal.recipe_id,
        recipe_name: meal.recipe_name,
      });
    }
    return acc;
  }, {});

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
      .join("recipes", "meal_recipes.recipe_id", "recipes.id")
      .select(
        "meals.id as meal_id",
        "meals.date",
        "meals.type",
        "meal_recipes.recipe_id",
        "recipes.name as recipe_name"
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
    // Define the date you're interested in
    const targetDate = [
      "2024-03-20",
      "2024-03-21",
      "2024-03-22",
      "2024-03-23",
      "2024-03-24",
      "2024-03-25",
      "2024-03-26",
    ];
    // Subquery to select meal IDs from the `meals` table where the date matches
    const mealIdArrayToDelete = await knex("meals")
      .select("id")
      .whereIn("date", targetDate);
    const mealIdsToDelete = mealIdArrayToDelete.map((row) => row.id);
    const rowDeleted = await knex("meal_recipes")
      .whereIn("meal_id", mealIdsToDelete)
      .del();
    // // if (rowDeleted === 0) {
    // //   return res.status(404).json({
    // //     message: `Item not found`,
    // //   });
    // // }
    // res.sendStatus(204);

    const mealIds = await knex("meals").pluck("id");
    // console.log(mealIds);
    const recipeIds = await knex("recipes").pluck("id");
    const pairs = [];
    for (let i = 0; i < 50; i++) {
      // Randomly select a meal ID and recipe ID from the provided arrays
      const randomMealId = mealIds[Math.floor(Math.random() * mealIds.length)];
      // console.log(randomMealId);
      const randomRecipeId =
        recipeIds[Math.floor(Math.random() * recipeIds.length)];
      // check if there's existing pair in database
      const pairMatched = await knex("meal_recipes").where({
        meal_id: randomMealId,
        recipe_id: randomRecipeId,
      });
      const mealMatched = await knex("meal_recipes").where({
        meal_id: randomMealId,
      });
      // Add the pair to the pairs array if there's no existing pair
      if (mealMatched.length === 0 || pairMatched.length !== 0) {
        pairs.push({ recipe_id: randomRecipeId, meal_id: randomMealId });
        const result = await knex("meal_recipes").insert({
          recipe_id: randomRecipeId,
          meal_id: randomMealId,
        });
        // console.log("result: ", result);
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
        "recipes.name as recipe_name"
      );

    // Transform the fetched data
    const transformedMeals = transformData(meals);

    // Send the transformed data in the response
    res.status(200).json(transformedMeals);
    // res.status(200).json(pairs);
  } catch (error) {
    res.status(400).send(`Error generating meals: ${error}`);
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
