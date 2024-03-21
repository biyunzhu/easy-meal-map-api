/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("meal_recipes", (table) => {
    table.integer("recipe_id").unsigned().notNullable();
    table.foreign("recipe_id").references("id").inTable("recipes");
    table.integer("meal_id").unsigned().notNullable();
    table.foreign("meal_id").references("id").inTable("meals");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.dropTable("meal_recipes");
};
