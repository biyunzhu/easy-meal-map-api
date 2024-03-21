const express = require("express");
const cors = require("cors");
require("dotenv").config();
const recipeRoutes = require("./routes/recipe-routes");
const mealRoutes = require("./routes/meal-routes");

const app = express();
const PORT = process.env.PORT || 5050;

app.use(express.json());
app.use(cors());

app.use("/recipes", recipeRoutes);

app.use("/meals", mealRoutes);

app.listen(PORT, () => {
  console.log(`running at http://localhost:${PORT}`);
});
