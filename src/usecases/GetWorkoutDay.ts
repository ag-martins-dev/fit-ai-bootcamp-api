import dayjs from "dayjs";
import z from "zod";

import { NotFoundError } from "../errors/index.js";
import { prisma } from "../lib/db.js";
import { GetWorkoutDaySchema } from "../schemas/index.js";

interface InputDto {
  userId: string;
  workoutPlanId: string;
  workoutDayId: string;
}

type OutputDto = z.infer<typeof GetWorkoutDaySchema>;

export class GetWorkoutDay {
  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: { id: dto.workoutPlanId },
    });

    if (!workoutPlan) {
      throw new NotFoundError("Workout plan not found");
    }

    if (workoutPlan.userId !== dto.userId) {
      throw new Error("Unauthorized: Workout plan does not belong to user");
    }

    const workoutDay = await prisma.workoutDay.findUnique({
      where: { id: dto.workoutDayId },
      include: {
        workoutExercises: { orderBy: { order: "asc" } },
        workoutSessions: true,
      },
    });

    if (!workoutDay) {
      throw new NotFoundError("Workout day not found");
    }

    if (workoutDay.workoutPlanId !== dto.workoutPlanId) {
      throw new Error("Unauthorized: Workout day does not belong to workout plan");
    }

    return {
      id: workoutDay.id,
      name: workoutDay.name,
      isRest: workoutDay.isRest,
      coverImageUrl: workoutDay.coverImageUrl ?? undefined,
      estimatedDurationInSeconds: workoutDay.estimatedDurationInSeconds,
      weekDay: workoutDay.weekDay,
      exercises: workoutDay.workoutExercises.map((exercise) => ({
        id: exercise.id,
        name: exercise.name,
        order: exercise.order,
        sets: exercise.sets,
        reps: exercise.reps,
        restTimeInSeconds: exercise.restTimeInSeconds,
        workoutDayId: exercise.workoutDayId,
      })),
      sessions: workoutDay.workoutSessions.map((session) => ({
        id: session.id,
        workoutDayId: session.workoutDayId,
        startedAt: dayjs.utc(session.startedAt).format("YYYY-MM-DD"),
        completedAt: session.completedAt ? dayjs.utc(session.completedAt).format("YYYY-MM-DD") : undefined,
      })),
    };
  }
}
