import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
}

interface OutputDto {
  userId: string;
  userName: string;
  weightInGrams: number;
  heightInCentimeters: number;
  age: number;
  bodyFatPercentage: number; // 1 representa 100%
}

export class GetUserTrainData {
  async execute(dto: InputDto): Promise<OutputDto | null> {
    const user = await prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) {
      return null;
    }

    const { bodyFatPercentage, heightInCentimeters, weightInGrams, age } = user;
    if (bodyFatPercentage === null || heightInCentimeters === null || weightInGrams === null || age === null) {
      return null;
    }

    return {
      userId: user.id,
      userName: user.name,
      bodyFatPercentage,
      heightInCentimeters,
      weightInGrams,
      age,
    };
  }
}
