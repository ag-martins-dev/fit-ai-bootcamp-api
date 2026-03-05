export class NotFoundError extends Error {
  constructor(readonly message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class WorkoutPlanNotActiveError extends Error {
  constructor(readonly message: string) {
    super(message);
    this.name = "WorkoutPlanNotActiveError";
  }
}

export class SessionAlreadyStartedError extends Error {
  constructor(readonly message: string) {
    super(message);
    this.name = "SessionAlreadyStartedError";
  }
}

export class SessionAlreadyCompletedError extends Error {
  constructor(readonly message: string) {
    super(message);
    this.name = "SessionAlreadyCompletedError";
  }
}
