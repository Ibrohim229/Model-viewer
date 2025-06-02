import express from "express";
import fileUpload from "express-fileupload";
import router from "./routes/router.js";
import config from "./config.js";
import setupSwagger from "./swagger.js";
import cors from "cors";

const app = express();

app.use(cors());

app.use(fileUpload());
app.use("/", router);

setupSwagger(app);

app.listen(config.PORT, () => {
  console.log(`Server is listening on port: ${config.PORT}`);
  console.log(
    `Swagger UI is available at: http://localhost:${config.PORT}/api-docs`
  );
});
