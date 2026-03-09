import z from "zod";

import { NotFoundError } from "../errors/index.js";
import { prisma } from "../lib/db.js";
import { GetWorkoutPlansSchema } from "../schemas/index.js";

interface InputDto {
  userId: string;
  active?: boolean;
}

type OutputDto = z.infer<typeof GetWorkoutPlansSchema>;

export class GetWorkoutPlans {
  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutPlans = await prisma.workoutPlan.findMany({
      where: {
        userId: { equals: dto.userId },
        isActive: { equals: dto.active },
      },
      include: {
        workoutDays: {
          include: {
            workoutExercises: true,
          },
        },
      },
    });
    if (!workoutPlans) {
      throw new NotFoundError("Workout plans not found.");
    }

    return workoutPlans.map((workoutPlan) => ({
      id: workoutPlan.id,
      name: workoutPlan.name,
      isActive: workoutPlan.isActive,
      workoutDays: workoutPlan.workoutDays.map((workoutDay) => ({
        id: workoutDay.id,
        name: workoutDay.name,
        weekDay: workoutDay.weekDay,
        isRest: workoutDay.isRest,
        estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
        coverImageUrl: workoutDay.coverImageUrl,
        workoutPlanId: workoutDay.workoutPlanId,
        exercises: workoutDay.workoutExercises.map((exercise) => ({
          id: exercise.id,
          name: exercise.name,
          order: exercise.order,
          sets: exercise.sets,
          reps: exercise.reps,
          workoutDayId: exercise.workoutDayId,
          restTimeInSeconds: exercise.restTimeInSeconds,
        })),
      })),
    }));
  }
}
