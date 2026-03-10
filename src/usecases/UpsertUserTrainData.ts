import { prisma } from "../lib/db.js";

interface InputDto {
  userId: string;
  weightInGrams: number;
  heightInCentimeters: number;
  age: number;
  bodyFatPercentage: number; // 1 representa 100%
}

type OutputDto = InputDto;

export class UpsertUserTrainData {
  async execute(dto: InputDto): Promise<OutputDto> {
    const user = await prisma.user.update({
      where: {
        id: dto.userId,
      },
      data: {
        bodyFatPercentage: dto.bodyFatPercentage,
        age: dto.age,
        heightInCentimeters: dto.heightInCentimeters,
        weightInGrams: dto.weightInGrams,
      },
    });

    return {
      userId: user.id,
      age: user.age as number,
      bodyFatPercentage: user.bodyFatPercentage as number,
      heightInCentimeters: user.heightInCentimeters as number,
      weightInGrams: user.weightInGrams as number,
    };
  }
}
