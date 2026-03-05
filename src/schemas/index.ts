import z from "zod";

import { WeekDay } from "../generated/prisma/enums.js";

export const ErrorSchema = z.object({
  message: z.string(),
  code: z.string(),
});

export const WorkoutPlanSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1, "Workout plan needs a name."),
  workoutDays: z.array(
    z.object({
      name: z.string().trim().min(1, "Workout day needs a name."),
      weekDay: z.enum(WeekDay),
      isRest: z.boolean().default(false),
      estimatedDurationInSeconds: z.number().min(1, "Invalid duration."),
      coverImageUrl: z.url().optional(),
      workoutExercises: z.array(
        z.object({
          order: z.number().min(0, "Exercise order must be at least 0."),
          name: z.string().trim().min(1, "Exercise needs a name."),
          sets: z.number().min(1, "Exercise must be at least 1 set."),
          reps: z.number().min(1, "Exercise must be at least 1 rep."),
          restTimeInSeconds: z
            .number()
            .min(1, "Exercice rest time must be at least 1 second."),
        }),
      ),
    }),
  ),
});
