import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc.js";

import { NotFoundError } from "../errors/index.js";
import { WeekDay, WorkoutDay } from "../generated/prisma/client.js";
import { prisma } from "../lib/db.js";

dayjs.extend(utc);

const WEEKDAY_MAP: Record<number, WeekDay> = {
  0: "SUNDAY",
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
  6: "SATURDAY",
};

interface InputDto {
  userId: string;
  from: string;
  to: string;
}

interface OutputDto {
  workoutStreak: number;
  consistencyByDay: Record<
    string,
    {
      workoutDayCompleted: boolean;
      workoutDayStarted: boolean;
    }
  >;
  completedWorkoutsCount: number;
  conclusionRate: number;
  totalTimeInSeconds: number;
}

export class GetStats {
  async execute(dto: InputDto): Promise<OutputDto> {
    const fromDate = dayjs.utc(dto.from).startOf("day");
    const toDate = dayjs.utc(dto.to).endOf("day");

    const workoutPlan = await prisma.workoutPlan.findFirst({
      where: {
        userId: {
          equals: dto.userId,
        },
        isActive: {
          equals: true,
        },
      },
      include: {
        workoutDays: true,
      },
    });

    if (!workoutPlan) {
      throw new NotFoundError("Active workout plan not found");
    }

    const startedWorkoutSessions = await prisma.workoutSession.findMany({
      where: {
        workoutDay: {
          workoutPlanId: {
            equals: workoutPlan.id,
          },
        },
        startedAt: {
          lte: toDate.toDate(),
          gte: fromDate.toDate(),
        },
      },
    });

    const consistencyByDay: Record<string, { workoutDayCompleted: boolean; workoutDayStarted: boolean }> = {};

    startedWorkoutSessions.forEach((session) => {
      const date = dayjs.utc(session.startedAt).format("YYYY-MM-DD");

      if (!consistencyByDay[date]) {
        consistencyByDay[date] = {
          workoutDayCompleted: false,
          workoutDayStarted: true,
        };
      }

      if (session.completedAt !== null) {
        consistencyByDay[date].workoutDayCompleted = true;
      }
    });

    const completedWorkoutSessions = startedWorkoutSessions.filter((session) => session.completedAt !== null);
    const completedWorkoutsCount = completedWorkoutSessions.length;

    const conclusionRate =
      startedWorkoutSessions.length > 0 ? completedWorkoutsCount / startedWorkoutSessions.length : 0;

    const totalTimeInSeconds = completedWorkoutSessions.reduce((total, session) => {
      const start = dayjs.utc(session.startedAt);
      const end = dayjs.utc(session.completedAt);
      return total + end.diff(start, "second");
    }, 0);

    const workoutStreak = await this.calculateStreak(workoutPlan.createdAt, workoutPlan.workoutDays, workoutPlan.id);

    return {
      workoutStreak,
      consistencyByDay,
      completedWorkoutsCount,
      conclusionRate,
      totalTimeInSeconds,
    };
  }

  private async calculateStreak(
    workoutPlanStartDay: Date,
    workoutDays: Pick<WorkoutDay, "weekDay" | "isRest">[],
    workoutPlanId: string,
  ) {
    const allCompletedSessions = await prisma.workoutSession.findMany({
      where: {
        workoutDay: {
          workoutPlanId,
        },
        completedAt: { not: null },
      },
    });

    if (allCompletedSessions.length === 0) {
      return 0;
    }

    const workoutWeekDays = new Set(workoutDays.filter((day) => !day.isRest).map((day) => day.weekDay));
    const restWeekDays = new Set(workoutDays.filter((day) => day.isRest).map((day) => day.weekDay));

    const completedWorkoutsDates = new Set(
      allCompletedSessions.map((session) => dayjs.utc(session.startedAt).format("YYYY-MM-DD")),
    );

    let lastCompletedWorkoutDate: Dayjs | null = null;

    for (const session of allCompletedSessions) {
      const sessionCompletionDate = dayjs.utc(session.startedAt);
      if (!lastCompletedWorkoutDate || sessionCompletionDate.isAfter(lastCompletedWorkoutDate)) {
        lastCompletedWorkoutDate = sessionCompletionDate;
      }
    }

    let streak = 0;
    let day = dayjs.utc(lastCompletedWorkoutDate);

    for (let i = 0; i < 360; i++) {
      if (day.isBefore(dayjs.utc(workoutPlanStartDay), "day")) break;

      const workoutWeekDay = WEEKDAY_MAP[day.day()];
      const dateKey = day.format("YYYY-MM-DD");

      if (restWeekDays.has(workoutWeekDay)) {
        if (completedWorkoutsDates.has(dateKey)) {
          streak++;
        }

        day = day.subtract(1, "day");
        continue;
      }

      if (!workoutWeekDays.has(workoutWeekDay)) {
        day = day.subtract(1, "day");
        continue;
      }

      if (completedWorkoutsDates.has(dateKey)) {
        streak++;
        day = day.subtract(1, "day");
        continue;
      }

      break;
    }

    return streak;
  }
}
