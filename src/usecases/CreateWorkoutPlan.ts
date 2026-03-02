import { WeekDay } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  name: string;
  workoutDays: Array<{
    name: string;
    weekDay: WeekDay;
    isRest: boolean;
    estimatedDurationInSeconds: number;
    exercises: Array<{
      order: number;
      name: string;
      sets: number;
      reps: number;
      restTimeInSeconds: number;
    }>;
  }>;
}

export interface OutputDto {
  id: string;
}

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

      const createdWorkoutDay = await tx.workoutPlan.create({
        data: {
          userId: dto.userId,
          name: dto.name,
          workoutDays: {
            create: dto.workoutDays.map((workoutDay) => ({
              name: workoutDay.name,
              weekDay: workoutDay.weekDay,
              estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
              isRest: workoutDay.isRest,
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
      });

      return {
        id: createdWorkoutDay.id,
      };
    });
  }
}
