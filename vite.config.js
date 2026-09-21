import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served on 8000; exe.dev proxies it at https://snowflake.exe.xyz:8000/
const server = {
  port: 8000,
  strictPort: true,
  host: true,
  allowedHosts: ["snowflake.exe.xyz", ".exe.xyz", "localhost"],
};

export default defineConfig({
  plugins: [react()],
  server,
  preview: server,
});
