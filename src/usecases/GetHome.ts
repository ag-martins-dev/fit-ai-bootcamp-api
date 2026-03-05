import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

import { NotFoundError } from "../errors/index.js";
import { WeekDay } from "../generated/prisma/enums.js";
import { prisma } from "../lib/db.js";

dayjs.extend(utc);

interface InputDto {
  userId: string;
  date: string;
}

export interface OutputDto {
  activeWorkoutPlanId: string;
  todayWorkoutDay: {
    workoutPlanId: string;
    id: string;
    name: string;
    isRest: boolean;
    weekDay: WeekDay;
    estimatedDurationInSeconds: number;
    coverImageUrl?: string;
    exercisesCount: number;
  };
  workoutStreak: number;
  consistencyByDay: {
    [key: string]: {
      workoutDayCompleted: boolean;
      workoutDayStarted: boolean;
    };
  };
}

export class GetHome {
  async execute(dto: InputDto): Promise<OutputDto> {
    const workoutPlan = await prisma.workoutPlan.findFirst({
      where: {
        userId: dto.userId,
        isActive: true,
      },
    });

    if (!workoutPlan) {
      throw new NotFoundError("No active workout plan found");
    }

    const dateObj = dayjs.utc(dto.date);
    const dayOfWeek = dateObj.day();

    const weekStartDate = dateObj.subtract(dayOfWeek, "day").startOf("day");
    const weekEndDate = weekStartDate.add(6, "days").endOf("day");

    const dayNames = [
      "SUNDAY",
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
    ];
    const targetWeekDay = dayNames[dayOfWeek] as WeekDay;

    const todayWorkoutDay = await prisma.workoutDay.findFirst({
      where: {
        workoutPlanId: workoutPlan.id,
        weekDay: targetWeekDay as WeekDay,
      },
      include: {
        workoutExercises: true,
      },
    });

    if (!todayWorkoutDay) {
      throw new NotFoundError(
        `No workout day found for ${targetWeekDay} in active plan`,
      );
    }

    const allWorkoutDays = await prisma.workoutDay.findMany({
      where: {
        workoutPlanId: workoutPlan.id,
      },
    });

    const weekSessions = await prisma.workoutSession.findMany({
      where: {
        workoutDay: {
          workoutPlanId: workoutPlan.id,
        },
        startedAt: {
          gte: weekStartDate.toDate(),
          lte: weekEndDate.toDate(),
        },
      },
      include: {
        workoutDay: true,
      },
    });

    const consistencyByDay: {
      [key: string]: {
        workoutDayCompleted: boolean;
        workoutDayStarted: boolean;
      };
    } = {};

    for (let i = 0; i < 7; i++) {
      const dayDate = weekStartDate.add(i, "day");
      const dateKey = dayDate.format("YYYY-MM-DD");
      const dayName = dayNames[dayDate.day()] as WeekDay;

      const daySessions = weekSessions.filter((session) => {
        return dayjs.utc(session.startedAt).format("YYYY-MM-DD") === dateKey;
      });

      const scheduledDayForWeekday = allWorkoutDays.find(
        (wd) => wd.weekDay === dayName,
      );

      let workoutDayCompleted = false;
      let workoutDayStarted = false;

      if (daySessions.length > 0) {
        workoutDayStarted = true;
        workoutDayCompleted = daySessions.every((s) => s.completedAt !== null);
      } else if (scheduledDayForWeekday?.isRest) {
        workoutDayCompleted = true;
      }

      consistencyByDay[dateKey] = {
        workoutDayCompleted,
        workoutDayStarted,
      };
    }

    const workoutStreak = this.calculateStreak(consistencyByDay, weekStartDate);

    return {
      activeWorkoutPlanId: workoutPlan.id,
      todayWorkoutDay: {
        workoutPlanId: todayWorkoutDay.workoutPlanId,
        id: todayWorkoutDay.id,
        name: todayWorkoutDay.name,
        isRest: todayWorkoutDay.isRest,
        weekDay: targetWeekDay,
        estimatedDurationInSeconds: todayWorkoutDay.estimatedDurationInSeconds,
        coverImageUrl: todayWorkoutDay.coverImageUrl ?? undefined,
        exercisesCount: todayWorkoutDay.workoutExercises.length,
      },
      workoutStreak,
      consistencyByDay,
    };
  }

  private calculateStreak(
    consistencyByDay: {
      [key: string]: {
        workoutDayCompleted: boolean;
        workoutDayStarted: boolean;
      };
    },
    weekStartDate: dayjs.Dayjs,
  ): number {
    let streak = 0;

    for (let i = 0; i < 7; i++) {
      const dayDate = weekStartDate.add(i, "day");
      const dateKey = dayDate.format("YYYY-MM-DD");
      const dayConsistency = consistencyByDay[dateKey];

      if (dayConsistency?.workoutDayCompleted) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}
