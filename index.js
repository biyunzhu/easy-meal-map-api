const express = require("express");
const app = express();
require("dotenv").config();

const PORT = process.env.PORT || 5050;

const recipeRoutes = require("./routes/recipe-routes");

app.use("/recipes", recipeRoutes);

app.listen(PORT, () => {
  console.log(`running at http://localhost:${PORT}`);
});
