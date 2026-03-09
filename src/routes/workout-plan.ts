import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

import {
  NotFoundError,
  SessionAlreadyCompletedError,
  SessionAlreadyStartedError,
  WorkoutPlanNotActiveError,
} from "../errors/index.js";
import { auth } from "../lib/auth.js";
import {
  ErrorSchema,
  GetWorkoutDaySchema,
  GetWorkoutPlanSchema,
  UpdateWorkoutSessionBodySchema,
  WorkoutPlanSchema,
} from "../schemas/index.js";
import { CreateWorkoutPlan } from "../usecases/CreateWorkoutPlan.js";
import { GetWorkoutDay } from "../usecases/GetWorkoutDay.js";
import { GetWorkoutPlan } from "../usecases/GetWorkoutPlan.js";
import { StartWorkoutSession } from "../usecases/StartWorkoutSession.js";
import { UpdateWorkoutSession } from "../usecases/UpdateWorkoutSession.js";

export const workoutPlanRoutes = async (app: FastifyInstance) => {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/",
    schema: {
      tags: ["Workout Plan"],
      summary: "Create a workout plan",
      body: WorkoutPlanSchema.omit({ id: true }),
      response: {
        201: WorkoutPlanSchema,
        400: ErrorSchema,
        401: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (req, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(req.headers),
        });
        const isUserUnauthorized = !session;

        if (isUserUnauthorized) {
          return reply.status(401).send({
            message: "Unauthorized",
            code: "UNAUTHORIZED",
          });
        }

        const { name, workoutDays } = req.body;

        const createWorkoutPlan = new CreateWorkoutPlan();
        const workoutPlan = await createWorkoutPlan.execute({
          userId: session.user.id,
          name,
          workoutDays,
        });

        return reply.status(201).send(workoutPlan);
      } catch (err) {
        app.log.error(err);
        return reply.status(500).send({
          message: "Internal Server Error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "POST",
    url: "/:workoutPlanId/days/:workoutDayId/sessions",
    schema: {
      tags: ["Workout Plan"],
      summary: "Start a workout session.",
      params: z.object({
        workoutPlanId: z.uuid(),
        workoutDayId: z.uuid(),
      }),
      response: {
        201: z.object({
          userWorkoutSessionId: z.uuid(),
        }),
        400: ErrorSchema,
        401: ErrorSchema,
        404: ErrorSchema,
        409: ErrorSchema,
        422: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (req, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(req.headers),
        });
        const isUserUnauthorized = !session;

        if (isUserUnauthorized) {
          return reply.status(401).send({
            message: "Unauthorized",
            code: "UNAUTHORIZED",
          });
        }

        const { workoutPlanId, workoutDayId } = req.params;

        const startWorkoutSession = new StartWorkoutSession();
        const result = await startWorkoutSession.execute({
          userId: session.user.id,
          workoutPlanId,
          workoutDayId,
        });

        return reply.status(201).send(result);
      } catch (err) {
        app.log.error(err);

        if (err instanceof WorkoutPlanNotActiveError) {
          return reply.status(422).send({
            message: err.message,
            code: "WORKOUT_PLAN_NOT_ACTIVE",
          });
        }

        if (err instanceof SessionAlreadyStartedError) {
          return reply.status(409).send({
            message: err.message,
            code: "WORKOUT_SESSION_ALREADY_STARTED",
          });
        }

        if (err instanceof NotFoundError) {
          return reply.status(404).send({
            message: err.message,
            code: "NOT_FOUND_ERROR",
          });
        }

        return reply.status(500).send({
          message: "Internal Server Error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "PUT",
    url: "/:workoutPlanId/days/:workoutDayId/sessions/:sessionId",
    schema: {
      tags: ["Workout Plan"],
      summary: "Update workout session completion",
      params: z.object({
        workoutPlanId: z.uuid(),
        workoutDayId: z.uuid(),
        sessionId: z.uuid(),
      }),
      body: UpdateWorkoutSessionBodySchema,
      response: {
        200: z.object({
          id: z.uuid(),
          completedAt: z.string(),
          startedAt: z.string(),
        }),
        400: ErrorSchema,
        401: ErrorSchema,
        404: ErrorSchema,
        409: ErrorSchema,
        500: ErrorSchema,
      },
    },
    handler: async (req, reply) => {
      try {
        const session = await auth.api.getSession({
          headers: fromNodeHeaders(req.headers),
        });

        if (!session) {
          return reply.status(401).send({
            message: "Unauthorized",
            code: "UNAUTHORIZED",
          });
        }

        const { workoutPlanId, workoutDayId, sessionId } = req.params;
        const { completedAt } = req.body;

        const updateWorkoutSession = new UpdateWorkoutSession();
        const result = await updateWorkoutSession.execute({
          userId: session.user.id,
          workoutPlanId,
          workoutDayId,
          sessionId,
          completedAt,
        });

        return reply.status(200).send(result);
      } catch (err) {
        app.log.error(err);

        if (err instanceof SessionAlreadyCompletedError) {
          return reply.status(409).send({
            message: err.message,
            code: "SESSION_ALREADY_COMPLETED",
          });
        }

        if (err instanceof NotFoundError) {
          return reply.status(404).send({
            message: err.message,
            code: "NOT_FOUND",
          });
        }

        if (err instanceof Error && err.message.includes("Unauthorized")) {
          return reply.status(401).send({
            message: err.message,
            code: "UNAUTHORIZED",
          });
        }

        if (err instanceof Error && err.message.includes("Completed date")) {
          return reply.status(400).send({
            message: err.message,
            code: "INVALID_COMPLETED_DATE",
          });
        }

        return reply.status(500).send({
          message: "Internal Server Error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/:workoutPlanId",
    schema: {
      tags: ["Workout Plan"],
      summary: "Get a workout plan with its days",
      params: z.object({
        workoutPlanId: z.uuid(),
      }),
      response: {
        200: GetWorkoutPlanSchema,
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

        if (!session) {
          return reply.status(401).send({
            message: "Unauthorized",
            code: "UNAUTHORIZED_ERROR",
          });
        }

        const { workoutPlanId } = req.params;

        const getWorkoutPlan = new GetWorkoutPlan();
        const result = await getWorkoutPlan.execute({
          userId: session.user.id,
          workoutPlanId,
        });

        return reply.status(200).send(result);
      } catch (err) {
        app.log.error(err);

        if (err instanceof NotFoundError) {
          return reply.status(404).send({
            message: err.message,
            code: "NOT_FOUND_ERROR",
          });
        }

        if (err instanceof Error && err.message.includes("Unauthorized")) {
          return reply.status(401).send({
            message: err.message,
            code: "UNAUTHORIZED_ERROR",
          });
        }

        return reply.status(500).send({
          message: "Internal Server Error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });

  app.withTypeProvider<ZodTypeProvider>().route({
    method: "GET",
    url: "/:workoutPlanId/days/:workoutDayId",
    schema: {
      tags: ["Workout Plan"],
      summary: "Get a workout day with exercises and sessions",
      params: z.object({
        workoutPlanId: z.uuid(),
        workoutDayId: z.uuid(),
      }),
      response: {
        200: GetWorkoutDaySchema,
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

        if (!session) {
          return reply.status(401).send({
            message: "Unauthorized",
            code: "UNAUTHORIZED",
          });
        }

        const { workoutPlanId, workoutDayId } = req.params;

        const getWorkoutDay = new GetWorkoutDay();
        const result = await getWorkoutDay.execute({
          userId: session.user.id,
          workoutPlanId,
          workoutDayId,
        });

        return reply.status(200).send(result);
      } catch (err) {
        app.log.error(err);

        if (err instanceof NotFoundError) {
          return reply.status(404).send({
            message: err.message,
            code: "NOT_FOUND",
          });
        }

        if (err instanceof Error && err.message.includes("Unauthorized")) {
          return reply.status(401).send({
            message: err.message,
            code: "UNAUTHORIZED",
          });
        }

        return reply.status(500).send({
          message: "Internal Server Error",
          code: "INTERNAL_SERVER_ERROR",
        });
      }
    },
  });
};
