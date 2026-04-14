import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import { join } from "path";
import { itemRoutes } from "./routes/items.ts";
import { reviewRoutes } from "./routes/reviews.ts";
import { importExportRoutes } from "./routes/importExport.ts";

const app = new Hono();

// 開発時のCORS対応（CORS_ORIGIN環境変数またはデフォルトのVite devサーバー）
const corsOrigin = process.env["CORS_ORIGIN"] ?? "http://localhost:5173";
app.use("/api/*", cors({ origin: corsOrigin }));

// APIルート
app.route("/api/items", itemRoutes);
app.route("/api/reviews", reviewRoutes);
app.route("/api", importExportRoutes);

// 本番用: ビルド済みSPAの静的ファイル配信
const clientDistPath = join(import.meta.dir, "../client/dist");
app.use("/*", serveStatic({ root: clientDistPath }));

// SPAフォールバック: 未知のパスはindex.htmlを返す
app.get("*", async (c) => {
  const indexPath = join(clientDistPath, "index.html");
  const file = Bun.file(indexPath);
  const exists = await file.exists();
  if (!exists) {
    return c.text("クライアントがビルドされていません。bun run build を実行してください。", 404);
  }
  return c.html(await file.text());
});

const port = Number(process.env["PORT"]) || 3000;
console.log(`サーバー起動: http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
