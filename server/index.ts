import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Set environment
const isDevelopment = process.env.NODE_ENV === "development";
app.set("env", isDevelopment ? "development" : "production");

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

// Security headers for production
if (!isDevelopment) {
  app.use((req, res, next) => {
    // Basic security headers
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // Don't expose server information
    res.removeHeader("X-Powered-By");
    next();
  });
}

// CORS configuration for production
if (!isDevelopment) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [process.env.BASE_URL || "https://thanvish.com"].filter(Boolean);
  
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
}

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  },
  limit: "10mb", // Limit JSON payload size
}));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Error handler - hide sensitive errors in production
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    
    // Log full error for debugging
    console.error("Error:", err);
    
    // In production, don't expose internal error details
    if (isDevelopment) {
      res.status(status).json({ 
        error: err.message || "Internal Server Error",
        stack: err.stack,
      });
    } else {
      // Production: generic error message
      res.status(status).json({ 
        error: status >= 500 ? "Internal Server Error" : (err.message || "An error occurred"),
      });
    }
    
    // Re-throw only in development for debugging
    if (isDevelopment) {
      throw err;
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    const env = app.get("env");
    log(`🚀 Application started`);
    log(`   Environment: ${env}`);
    log(`   Server: http://localhost:${port}`);
    log(`   API: http://localhost:${port}/api`);
    log(`   Serving on port ${port}`);
  });
})();
