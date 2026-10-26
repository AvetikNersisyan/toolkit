// PM2 process config for the tools-landing Next.js app.
// Usage on the server (from /var/www/toolkit):
//   pm2 start ecosystem.config.js
//   pm2 save
// Next.js reads env vars from .env.local at build and runtime, so secrets
// live in /var/www/toolkit/.env.local on the server — not here.

module.exports = {
  apps: [
    {
      name: "toolkit",
      cwd: "/var/www/toolkit",
      // Run Next's own binary directly (more reliable under pm2 than `npm run start`).
      script: "node_modules/next/dist/bin/next",
      // Bind to localhost only; nginx is the public entry point.
      args: "start -p 3030 -H 127.0.0.1",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: "3030",
      },
      max_memory_restart: "400M",
      autorestart: true,
      // Keep a little log history without filling the disk.
      out_file: "/var/log/toolkit/out.log",
      error_file: "/var/log/toolkit/error.log",
      merge_logs: true,
      time: true,
    },
  ],
};
