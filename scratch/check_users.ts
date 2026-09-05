import { db } from "../src/Backend/server/db";

async function main() {
  const users = await db.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      onboardingComplete: true,
      mentorProfile: {
        select: {
          userId: true,
          username: true,
        },
      },
    },
  });
  console.log("USERS:", JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => process.exit(0));
