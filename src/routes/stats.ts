import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { auth } from "../lib/auth.js";
import {
  ErrorSchema,
  GetStatsBodySchema,
  GetStatsQuerySchema,
} from "../schemas/index.js";
import { GetStats } from "../usecases/GetStats.js";

export const statsRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/",
    schema: {
      tags: ["Statistics"],
      description: "Get user statistics.",
      querystring: GetStatsQuerySchema,
      response: {
        200: GetStatsBodySchema,
        401: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (req, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(req.headers),
        });

        if (!session?.user) {
          return reply.status(401).send({
            message: "Unauthorized",
            code: "UNAUTHORIZED_ERROR",
          });
        }

        const getStats = new GetStats();
        const stats = await getStats.execute({
          userId: session.user.id,
          from: req.query.from,
          to: req.query.to,
        });

        return reply.status(200).send(stats);
      } catch (err) {
        if (err instanceof Error) {
          return reply.status(500).send({
            message: err.message,
            code: "INTERNAL_SERVER_ERROR",
          });
        }
      }
    },
  });
};
