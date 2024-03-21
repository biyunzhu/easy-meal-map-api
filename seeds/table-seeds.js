/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// import seed data files, arrays of objects
const recipeData = require("../seed-data/recipes");
const mealData = require("../seed-data/meals");
const mealRecipesData = require("../seed-data/meal_recipes");

exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("recipes").del();
  await knex("meals").del();
  await knex("meal_recipes").del();
  await knex("recipes").insert(recipeData);
  await knex("meals").insert(mealData);
  await knex("meal_recipes").insert(mealRecipesData);
};
