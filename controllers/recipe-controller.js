const knex = require("knex")(require("../knexfile"));

const recipeList = async (req, res) => {
  try {
    const recipes = await knex("recipes");
    res.status(200).json(recipes);
  } catch (err) {
    res.status(400).send(`Error retrieving Recipes: ${err}`);
  }
};

const recipeDetail = async (req, res) => {
  try {
    const recipeFound = await knex("recipes").where({ id: req.params.id });
    if (recipeFound.length === 0) {
      return res.status(404).json({
        message: `Recipes with ID ${req.params.id} not found`,
      });
    }

    const recipeData = recipeFound[0];
    res.status(200).json(recipeData);
  } catch (error) {
    res.status(500).json({
      message: `Unable to retrieve recipe data for recipe with ID ${req.params.id}`,
    });
  }
};

module.exports = {
  recipeList,
  recipeDetail,
};
