import swaggerJsdoc from "swagger-jsdoc";

const PORT = process.env.PORT || 5000;
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "app.sid";
const API_BASE = "/api/v1";

const servers = [
  {
    url: `http://localhost:${PORT}${API_BASE}`,
    description: "Development server",
  },
];

if (process.env.API_PUBLIC_URL) {
  servers.push({
    url: `${process.env.API_PUBLIC_URL}${API_BASE}`,
    description: "Production server",
  });
}

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "DoodleBlue API",
      version: "1.0.0",
      description: [
        "REST API for user, role & permission management.",
        "",
        "**Authentication** — session-based. `POST /auth/login` sets an",
        `HttpOnly session cookie (\`${COOKIE_NAME}\`) that must be sent`,
        "with every subsequent request.",
        "",
        "**Authorization** — RBAC. Users carry a role with a",
        "resource/action permission matrix. `SUPER_ADMIN` bypasses all",
        "checks. Other roles need `create`/`read`/`update`/`delete` on the",
        "resource being accessed.",
        "",
        "**Envelope** — all responses are JSON:",
        "`{ success: true, data: … }` or `{ success: false, error: { message } }`.",
      ].join("\n"),
      contact: { name: "DoodleBlue" },
      license: { name: "ISC" },
    },
    servers,
    tags: [
      { name: "Auth", description: "Login, logout, session" },
      { name: "Roles", description: "Custom roles & permission matrices" },
      { name: "Users", description: "User management" },
    ],
    components: {
      securitySchemes: {
        sessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: COOKIE_NAME,
          description:
            "HttpOnly session cookie set by `POST /auth/login`. " +
            "Include it on every authenticated request.",
        },
      },
      schemas: {
        ApiError: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: {
              type: "object",
              properties: {
                message: { type: "string", example: "Not authorized" },
                code: { type: "string", example: "FORBIDDEN" },
              },
            },
          },
        },
        Permission: {
          type: "object",
          properties: {
            resource: {
              type: "string",
              enum: ["roles", "users"],
            },
            actions: {
              type: "array",
              items: {
                type: "string",
                enum: ["create", "read", "update", "delete"],
              },
            },
          },
        },
        Role: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string", example: "Manager" },
            description: { type: "string" },
            isSystem: { type: "boolean", example: false },
            isActive: { type: "boolean", example: true },
            permissions: {
              type: "array",
              items: { $ref: "#/components/schemas/Permission" },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string", example: "Ada Lovelace" },
            email: { type: "string", format: "email" },
            role: { type: "string", example: "Manager" },
            isActive: { type: "boolean", example: true },
            image: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        AuthUser: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", example: "SUPER_ADMIN" },
            roleId: { type: "string", nullable: true },
            image: { type: "string", nullable: true },
            mustChangePassword: { type: "boolean", example: false },
            isActive: { type: "boolean", example: true },
            permissions: {
              type: "array",
              items: { $ref: "#/components/schemas/Permission" },
            },
          },
        },
        UserOption: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string" },
            isActive: { type: "boolean" },
          },
        },
        Meta: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 50 },
            total: { type: "integer", example: 42 },
            totalPages: { type: "integer", example: 1 },
          },
        },
      },
      parameters: {
        ObjectIdPath: {
          in: "path",
          name: "id",
          required: true,
          schema: { type: "string" },
          description: "MongoDB ObjectId",
        },
        PageQuery: {
          in: "query",
          name: "page",
          schema: { type: "integer", minimum: 1, default: 1 },
        },
        LimitQuery: {
          in: "query",
          name: "limit",
          schema: { type: "integer", minimum: 1, maximum: 100, default: 50 },
        },
      },
      responses: {
        Unauthorized: {
          description: "No valid session",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
        Forbidden: {
          description: "Missing permission for this resource/action",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
        ValidationError: {
          description: "Request body failed validation",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
        NotFound: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ApiError" },
            },
          },
        },
      },
    },
    security: [{ sessionCookie: [] }],
  },
  // Scan route files for @openapi JSDoc — covers both tsx dev (src) and
  // compiled production builds (dist).
  apis: [
    "./src/modules/**/*.routes.ts",
    "./src/app.ts",
    "./dist/modules/**/*.routes.js",
    "./dist/app.js",
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
