import z from "zod";

import { WeekDay } from "../generated/prisma/enums.js";

export const ErrorSchema = z.object({
  message: z.string(),
  code: z.string(),
});

export const CreateWorkoutPlanSchema = z.object({
  id: z.uuid(),
  name: z.string().trim().min(1, "Workout plan needs a name."),
  workoutDays: z.array(
    z.object({
      name: z.string().trim().min(1, "Workout day needs a name."),
      weekDay: z.enum(WeekDay),
      isRest: z.boolean().default(false),
      estimatedDurationInSeconds: z.number().min(1, "Invalid duration."),
      coverImageUrl: z.url().nullable(),
      exercises: z.array(
        z.object({
          order: z.number().min(0, "Exercise order must be at least 0."),
          name: z.string().trim().min(1, "Exercise needs a name."),
          sets: z.number().min(1, "Exercise must be at least 1 set."),
          reps: z.number().min(1, "Exercise must be at least 1 rep."),
          restTimeInSeconds: z.number().min(1, "Exercice rest time must be at least 1 second."),
        }),
      ),
    }),
  ),
});

export const UpdateWorkoutSessionBodySchema = z.object({
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
      weekDay: z.enum(WeekDay),
      name: z.string(),
      isRest: z.boolean(),
      coverImageUrl: z.string().optional(),
      estimatedDurationInSeconds: z.number(),
      exercisesCount: z.number(),
    }),
  ),
});

export const GetWorkoutDaySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  isRest: z.boolean(),
  coverImageUrl: z.string().optional(),
  estimatedDurationInSeconds: z.number(),
  weekDay: z.enum(WeekDay),
  exercises: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      order: z.number(),
      sets: z.number(),
      reps: z.number(),
      restTimeInSeconds: z.number(),
      workoutDayId: z.uuid(),
    }),
  ),
  sessions: z.array(
    z.object({
      id: z.uuid(),
      workoutDayId: z.uuid(),
      startedAt: z.string(),
      completedAt: z.string().optional(),
    }),
  ),
});

export const GetStatsBodySchema = z.object({
  workoutStreak: z.number(),
  consistencyByDay: z.record(
    z.iso.date(),
    z.object({
      workoutDayCompleted: z.boolean(),
      workoutDayStarted: z.boolean(),
    }),
  ),
  completedWorkoutsCount: z.number(),
  conclusionRate: z.number(),
  totalTimeInSeconds: z.number(),
});

export const GetStatsQuerySchema = z.object({
  from: z.iso.date(),
  to: z.iso.date(),
});

export const ListWorkoutPlansSchema = z.array(
  z.object({
    id: z.uuid(),
    name: z.string(),
    isActive: z.boolean(),
    workoutDays: z.array(
      z.object({
        id: z.uuid(),
        name: z.string(),
        isRest: z.boolean(),
        coverImageUrl: z.string().nullable(),
        estimatedDurationInSeconds: z.number(),
        weekDay: z.enum(WeekDay),
        exercises: z.array(
          z.object({
            id: z.uuid(),
            name: z.string(),
            order: z.number(),
            sets: z.number(),
            reps: z.number(),
            restTimeInSeconds: z.number(),
            workoutDayId: z.uuid(),
          }),
        ),
      }),
    ),
  }),
);

export const UserTrainDataSchema = z.object({
  userId: z.string(),
  userName: z.string(),
  weightInGrams: z.number(),
  heightInCentimeters: z.number(),
  age: z.number(),
  bodyFatPercentage: z.number().min(0).max(100),
});
