/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

// import seed data files, arrays of objects
const recipeData = require("../seed-data/recipes");
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  await knex("recipe").del();
  await knex("recipe").insert(recipeData);
};
