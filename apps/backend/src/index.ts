import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { startMealReminderCronJob } from "./jobs/meal-reminder.job.js";

async function startServer() {
  const app = await buildApp();
  try {
    await app.listen({
      port: env.BACKEND_PORT,
      host: "0.0.0.0",
    });
    startMealReminderCronJob();
    console.log(
      `🚀 NutriSnap Backend API running on http://localhost:${env.BACKEND_PORT}/api/v1/health`
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void startServer();

