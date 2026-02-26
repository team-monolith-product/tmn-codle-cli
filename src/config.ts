import "dotenv/config";

export const config = {
  apiUrl: (process.env.CODLE_API_URL || "https://class.dev.codle.io").replace(
    /\/$/,
    ""
  ),
  authUrl: (process.env.CODLE_AUTH_URL || "").replace(/\/$/, ""),
  port: parseInt(process.env.CODLE_PORT || "3000", 10),
  logLevel: process.env.CODLE_LOG_LEVEL || "INFO",
};
