import { randomUUID } from "crypto";
import z from "zod";

import { WeekDay } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";
import { CreateWorkoutPlanSchema } from "../schemas/index.js";

interface InputDto {
  userId: string;
  name: string;
  workoutDays: {
    name: string;
    weekDay: WeekDay;
    isRest: boolean;
    estimatedDurationInSeconds: number;
    coverImageUrl: string | null;
    exercises: {
      order: number;
      name: string;
      sets: number;
      reps: number;
      restTimeInSeconds: number;
    }[];
  }[];
}

type OutputDto = z.infer<typeof CreateWorkoutPlanSchema>;

export class CreateWorkoutPlan {
  async execute(dto: InputDto): Promise<OutputDto> {
    const activeWorkoutPlan = await prisma.workoutPlan.findFirst({
      where: {
        isActive: true,
      },
    });
    const hasSomeActiveWorkoutPlan = !!activeWorkoutPlan;

    return prisma.$transaction(async (tx) => {
      if (hasSomeActiveWorkoutPlan) {
        await tx.workoutPlan.update({
          where: {
            id: activeWorkoutPlan.id,
          },
          data: {
            isActive: false,
          },
        });
      }

      const result = await tx.workoutPlan.create({
        data: {
          id: randomUUID(),
          userId: dto.userId,
          name: dto.name,
          workoutDays: {
            create: dto.workoutDays.map((workoutDay) => ({
              name: workoutDay.name,
              weekDay: workoutDay.weekDay,
              estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
              isRest: workoutDay.isRest,
              coverImageUrl: workoutDay.coverImageUrl,
              workoutExercises: {
                create: workoutDay.exercises.map((exercise) => ({
                  name: exercise.name,
                  order: exercise.order,
                  sets: exercise.sets,
                  reps: exercise.reps,
                  restTimeInSeconds: exercise.restTimeInSeconds,
                })),
              },
            })),
          },
        },
        include: {
          workoutDays: {
            include: {
              workoutExercises: true,
            },
          },
        },
      });

      return {
        id: result.id,
        name: result.name,
        workoutDays: result.workoutDays.map((workoutDay) => ({
          name: workoutDay.name,
          weekDay: workoutDay.weekDay,
          isRest: workoutDay.isRest,
          estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
          coverImageUrl: workoutDay.coverImageUrl,
          exercises: workoutDay.workoutExercises.map((exercise) => ({
            order: exercise.order,
            name: exercise.name,
            sets: exercise.sets,
            reps: exercise.reps,
            restTimeInSeconds: exercise.restTimeInSeconds,
          })),
        })),
      };
    });
  }
}
