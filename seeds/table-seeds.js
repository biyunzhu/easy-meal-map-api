/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// import seed data files, arrays of objects
const recipeData = require("../seed-data/recipes");

exports.seed = async function (knex) {
  await knex("recipes").del();
  await knex("recipes").insert(recipeData);
};
