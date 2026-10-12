import type { Config } from "@react-router/dev/config";

export default {
  // Vercel hosts static assets; local npm start retains the Node server.
  ssr: process.env.VERCEL !== "1",
} satisfies Config;
