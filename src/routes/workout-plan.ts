import { fromNodeHeaders } from "better-auth/node";
import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";

import {
  NotFoundError,
  SessionAlreadyStartedError,
  WorkoutPlanNotActiveError,
} from "../errors/index.js";
import { auth } from "../lib/auth.js";
import { ErrorSchema, WorkoutPlanSchema } from "../schemas/index.js";
import { CreateWorkoutPlan } from "../usecases/CreateWorkoutPlan.js";
import { StartWorkoutSession } from "../usecases/StartWorkoutSession.js";

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
};
