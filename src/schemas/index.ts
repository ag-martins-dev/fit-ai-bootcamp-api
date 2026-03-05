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
      coverImageUrl: z.url().nullable(),
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

export const UpdateWorkoutSessionSchema = z.object({
  completedAt: z.iso.datetime(),
});

export const GetHomeSchema = z.object({
  activeWorkoutPlanId: z.uuid(),
  todayWorkoutDay: z.object({
    workoutPlanId: z.uuid(),
    id: z.uuid(),
    name: z.string(),
    isRest: z.boolean(),
    weekDay: z.enum(WeekDay),
    estimatedDurationInSeconds: z.number(),
    coverImageUrl: z.string().optional(),
    exercisesCount: z.number(),
  }),
  workoutStreak: z.number(),
  consistencyByDay: z.record(
    z.string(),
    z.object({
      workoutDayCompleted: z.boolean(),
      workoutDayStarted: z.boolean(),
    }),
  ),
});

export const GetWorkoutPlanSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  workoutDays: z.array(
    z.object({
      id: z.uuid(),
      weekDay: z.string(),
      name: z.string(),
      isRest: z.boolean(),
      coverImageUrl: z.string().optional(),
      estimatedDurationInSeconds: z.number(),
      exercisesCount: z.number(),
    }),
  ),
});
