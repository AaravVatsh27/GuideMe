import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Replays every Prisma migration into an in-memory Postgres and checks that the database
 * itself enforces the integrity rules, independently of the application code.
 */

const MIGRATIONS = join(process.cwd(), "prisma", "migrations");
const MENTOR = "00000000-0000-0000-0000-000000000001";
const STUDENT_A = "00000000-0000-0000-0000-000000000002";
const STUDENT_B = "00000000-0000-0000-0000-000000000003";
const LEGACY_SESSION = "10000000-0000-0000-0000-999999999999";

let db: PGlite;
let sessionCounter = 0;

function insertSession(student: string, start: string, status = "SCHEDULED", pricePaise = 19900) {
  sessionCounter += 1;
  const id = `10000000-0000-0000-0000-${String(sessionCounter).padStart(12, "0")}`;
  return {
    id,
    sql: `INSERT INTO "Session"(id, "studentId", "mentorId", type, status, "scheduledAt", "durationMinutes", "pricePaise", "platformCutPaise", "mentorEarningPaise", "updatedAt")
          VALUES ('${id}', '${student}', '${MENTOR}', 'PAID', '${status}', '${start}', 30, ${pricePaise}, 0, 0, now());`,
  };
}

beforeAll(async () => {
  db = new PGlite({ extensions: { btree_gist } });
  const names = readdirSync(MIGRATIONS, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const paiseMigration = names.find((name) => name.endsWith("_money_in_paise"));

  for (const name of names) {
    if (name === paiseMigration) {
      // Seed a row with rupee amounts so the paise conversion can be checked.
      await db.exec(`
        INSERT INTO "User"(id, email, name, role, "updatedAt") VALUES
          ('${MENTOR}', 'm@x.test', 'Mentor', 'MENTOR', now()),
          ('${STUDENT_A}', 'a@x.test', 'Student A', 'STUDENT', now()),
          ('${STUDENT_B}', 'b@x.test', 'Student B', 'STUDENT', now());
        INSERT INTO "Session"(id, "studentId", "mentorId", type, status, "scheduledAt", "durationMinutes", price, "platformCut", "mentorEarning", "updatedAt")
          VALUES ('${LEGACY_SESSION}', '${STUDENT_A}', '${MENTOR}', 'PAID', 'COMPLETED', '2029-01-01T10:00:00Z', 30, 199, 40, 159, now());
        INSERT INTO "Payment"(id, "sessionId", "userId", "razorpayOrderId", amount, "refundAmount", metadata)
          VALUES ('30000000-0000-0000-0000-000000000009', '${LEGACY_SESSION}', '${STUDENT_A}', 'order_legacy', 199, 100,
                  '{"platformCut": 40, "mentorEarning": 159, "razorpayAmountSubunits": 19900}');
      `);
    }

    await db.exec(readFileSync(join(MIGRATIONS, name, "migration.sql"), "utf8"));
  }
});

afterAll(async () => {
  await db?.close();
});

describe("database integrity rules", () => {
  it("rejects overlapping active sessions for the same mentor", async () => {
    await db.exec(insertSession(STUDENT_A, "2030-01-01T10:00:00Z").sql);
    await expect(db.exec(insertSession(STUDENT_B, "2030-01-01T10:15:00Z").sql)).rejects.toThrow(/Session_mentor_no_overlap/);
  });

  it("allows back-to-back sessions and overlaps with cancelled ones", async () => {
    await expect(db.exec(insertSession(STUDENT_B, "2030-01-01T10:30:00Z").sql)).resolves.toBeDefined();
    await expect(db.exec(insertSession(STUDENT_B, "2030-01-01T10:10:00Z", "CANCELLED").sql)).resolves.toBeDefined();
  });

  it("rejects negative prices", async () => {
    await expect(db.exec(insertSession(STUDENT_A, "2030-02-01T10:00:00Z", "SCHEDULED", -1).sql)).rejects.toThrow(/Session_amounts_non_negative/);
  });

  it("rejects ratings outside 1-5", async () => {
    const { id, sql } = insertSession(STUDENT_A, "2030-03-01T10:00:00Z", "COMPLETED");
    await db.exec(sql);
    await expect(
      db.exec(`INSERT INTO "Review"(id, "sessionId", "studentId", "mentorId", rating, "wouldRebook")
               VALUES ('20000000-0000-0000-0000-000000000001', '${id}', '${STUDENT_A}', '${MENTOR}', 9, true);`),
    ).rejects.toThrow(/Review_rating_range/);
  });

  it("rejects refunds larger than the payment", async () => {
    const { id, sql } = insertSession(STUDENT_A, "2030-04-01T10:00:00Z");
    await db.exec(sql);
    await expect(
      db.exec(`INSERT INTO "Payment"(id, "sessionId", "userId", "razorpayOrderId", "amountPaise", "refundAmountPaise")
               VALUES ('30000000-0000-0000-0000-000000000001', '${id}', '${STUDENT_A}', 'order_test', 19900, 50000);`),
    ).rejects.toThrow(/Payment_refund_within_amount/);
  });

  it("rejects availability that ends before it starts", async () => {
    await expect(
      db.exec(`INSERT INTO "Availability"(id, "mentorId", "dayOfWeek", "startTime", "endTime", timezone)
               VALUES ('40000000-0000-0000-0000-000000000001', '${MENTOR}', 1, '10:00', '09:00', 'Asia/Kolkata');`),
    ).rejects.toThrow(/Availability_end_after_start/);
  });

  it("refuses to delete a user who has sessions", async () => {
    await expect(db.exec(`DELETE FROM "User" WHERE id = '${STUDENT_A}';`)).rejects.toThrow(/foreign key/);
  });

  it("converts existing rupee amounts to paise", async () => {
    const session = await db.query<{ pricePaise: number; platformCutPaise: number; mentorEarningPaise: number }>(
      `SELECT "pricePaise", "platformCutPaise", "mentorEarningPaise" FROM "Session" WHERE id = '${LEGACY_SESSION}'`,
    );
    expect(session.rows[0]).toEqual({ pricePaise: 19900, platformCutPaise: 4000, mentorEarningPaise: 15900 });

    const payment = await db.query<{ amountPaise: number; refundAmountPaise: number; metadata: Record<string, unknown> }>(
      `SELECT "amountPaise", "refundAmountPaise", metadata FROM "Payment" WHERE "sessionId" = '${LEGACY_SESSION}'`,
    );
    expect(payment.rows[0]).toMatchObject({ amountPaise: 19900, refundAmountPaise: 10000 });
    expect(payment.rows[0]?.metadata).toEqual({ razorpayAmountSubunits: 19900 });
  });

  it("stores timestamps with their time zone", async () => {
    const result = await db.query<{ data_type: string }>(
      `SELECT data_type FROM information_schema.columns WHERE table_name = 'Session' AND column_name = 'scheduledAt'`,
    );
    expect(result.rows[0]?.data_type).toBe("timestamp with time zone");
  });
});
