import {
  NotFoundError,
  SessionAlreadyCompletedError,
} from "../errors/index.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  workoutPlanId: string;
  workoutDayId: string;
  sessionId: string;
  completedAt: string;
}

export interface OutputDto {
  id: string;
  completedAt: string;
  startedAt: string;
}

export class UpdateWorkoutSession {
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
    });

    if (!workoutDay) {
      throw new NotFoundError("Workout day not found");
    }

    if (workoutDay.workoutPlanId !== dto.workoutPlanId) {
      throw new Error(
        "Unauthorized: Workout day does not belong to workout plan",
      );
    }

    const session = await prisma.workoutSession.findUnique({
      where: { id: dto.sessionId },
    });

    if (!session) {
      throw new NotFoundError("Workout session not found");
    }

    if (session.workoutDayId !== dto.workoutDayId) {
      throw new Error(
        "Unauthorized: Workout session does not belong to workout day",
      );
    }

    if (session.completedAt) {
      throw new SessionAlreadyCompletedError(
        "Workout session has already been completed",
      );
    }

    const completedAtDate = new Date(dto.completedAt);

    if (completedAtDate <= session.startedAt) {
      throw new Error("Completed date must be after started date");
    }

    const updatedSession = await prisma.workoutSession.update({
      where: { id: dto.sessionId },
      data: {
        completedAt: completedAtDate,
      },
    });

    return {
      id: updatedSession.id,
      completedAt: updatedSession.completedAt?.toISOString() ?? "",
      startedAt: updatedSession.startedAt.toISOString(),
    };
  }
}