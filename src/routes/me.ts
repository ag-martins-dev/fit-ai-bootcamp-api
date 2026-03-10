import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";

import { NotFoundError } from "../errors/index.js";
import { auth } from "../lib/auth.js";
import { ErrorSchema, UserTrainDataSchema } from "../schemas/index.js";
import { GetUserTrainData } from "../usecases/GetUserTrainData.js";

export const meRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/",
    schema: {
      tags: ["Me"],
      summary: "Get user train data.",
      response: {
        200: UserTrainDataSchema.nullable(),
        401: ErrorSchema,
        404: ErrorSchema,
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
            message: "Unauthorized.",
            code: "UNATHORIZED_ERROR",
          });
        }

        const getUserTrainData = new GetUserTrainData();
        const userTrainData = await getUserTrainData.execute({
          userId: session.user.id,
        });

        return userTrainData;
      } catch (err) {
        if (err instanceof NotFoundError) {
          return reply.status(404).send({
            message: err.message,
            code: "NOT_FOUND_ERROR",
          });
        }

        return reply.status(500).send({
          message: "Internal Server Error.",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });
};
