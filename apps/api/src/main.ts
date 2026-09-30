import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./lib/openapi";
import { apiRouter } from "./routes";

const app = express();
const port = Number(process.env.PORT ?? 4000);
const uploadDirectory = resolve(process.cwd(), "storage", "uploads");

if (!existsSync(uploadDirectory)) {
  mkdirSync(uploadDirectory, { recursive: true });
}

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "sos-procuresphere-api",
    timestamp: new Date().toISOString()
  });
});

app.use("/uploads", express.static(uploadDirectory));
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));
app.get("/openapi.json", (_request, response) => {
  response.json(openApiDocument);
});

app.use("/api/v1", apiRouter);

app.use((error: Error, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  response.status(400).json({
    message: error.message || "Unexpected server error."
  });
});

app.listen(port, () => {
  console.log(`SOS ProcureSphere 360 API listening on http://localhost:${port}`);
});
