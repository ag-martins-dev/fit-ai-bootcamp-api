import { NotFoundError } from "../errors/index.js";
import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  workoutPlanId: string;
}

export interface OutputDto {
  id: string;
  name: string;
  workoutDays: Array<{
    id: string;
    weekDay: string;
    name: string;
    isRest: boolean;
    coverImageUrl?: string;
    estimatedDurationInSeconds: number;
    exercisesCount: number;
  }>;
}

export class GetWorkoutPlan {
  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutPlan = await prisma.workoutPlan.findUnique({
      where: { id: dto.workoutPlanId },
      include: {
        workoutDays: {
          include: {
            _count: {
              select: { workoutExercises: true },
            },
          },
        },
      },
    });

    if (!workoutPlan) {
      throw new NotFoundError("Workout plan not found");
    }

    if (workoutPlan.userId !== dto.userId) {
      throw new Error("Unauthorized: Workout plan does not belong to user");
    }

    return {
      id: workoutPlan.id,
      name: workoutPlan.name,
      workoutDays: workoutPlan.workoutDays.map((day) => ({
        id: day.id,
        weekDay: day.weekDay,
        name: day.name,
        isRest: day.isRest,
        coverImageUrl: day.coverImageUrl ?? undefined,
        estimatedDurationInSeconds: day.estimatedDurationInSeconds,
        exercisesCount: day._count.workoutExercises,
      })),
    };
  }
}
