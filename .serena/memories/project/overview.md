# Bootcamp Fit API - Project Overview

## Purpose
A fitness API built with TypeScript/Fastify that manages workout plans, daily workout sessions, and user fitness tracking. Users can create workout plans with daily exercises, start/complete sessions, and view their fitness consistency and streaks.

## Tech Stack
- **Runtime**: Node.js 24.x
- **Framework**: Fastify 5.7.4 with fastify-type-provider-zod for automatic validation
- **Database**: PostgreSQL 13+ with Prisma ORM 7.4.2
- **Validation**: Zod 4.3.6
- **Authentication**: better-auth 1.5.0
- **Language**: TypeScript 5.9.3

## Key Technologies & Versions
- `@fastify/swagger` + `@scalar/fastify-api-reference` for API documentation
- `@prisma/adapter-pg` for PostgreSQL adapter
- `prettier` + `eslint` for code quality

## Database Models
- **User**: Core user entity
- **WorkoutPlan**: User's training plan (has many WorkoutDays)
- **WorkoutDay**: Single day of training with exercises (linked to WeekDay enum: MONDAY-SUNDAY)
- **WorkoutExercise**: Individual exercise with sets/reps/rest
- **WorkoutSession**: Tracking of session execution (startedAt/completedAt timestamps)
