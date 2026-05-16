const express = require("express");
const swaggerUi = require("swagger-ui-express");
const openapiDocument = require("./tsp-output/@typespec/openapi3/openapi.json");

const app = express();

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

app.get("/", (req, res) => {
    res.redirect("/api-docs");
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Swagger UI on http://localhost:${PORT}/api-docs`);
});