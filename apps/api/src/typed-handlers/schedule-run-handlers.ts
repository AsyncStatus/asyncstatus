import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { and, desc, eq, sql } from "drizzle-orm";
import * as schema from "../db";
import type { TypedHandlersContextWithOrganization } from "../lib/env";
import { requiredOrganization, requiredSession } from "./middleware";
import { getScheduleRunContract, listScheduleRunsContract } from "./schedule-run-contracts";

export const listScheduleRunsHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof listScheduleRunsContract
>(
  listScheduleRunsContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input }) => {
    const pageSize = input.pageSize ?? 25;
    const page = input.page ?? 0;

    const tasksJson = sql<string>`COALESCE((
      SELECT json_group_array(
        json_object(
          'id', t.id,
          'scheduleRunId', t.schedule_run_id,
          'status', t.status,
          'results', json(t.results),
          'attempts', t.attempts,
          'maxAttempts', t.max_attempts,
          'createdAt', t.created_at,
          'updatedAt', t.updated_at
        )
      )
      FROM schedule_run_task t
      WHERE t.schedule_run_id = ${schema.scheduleRun.id}
      ORDER BY t.updated_at DESC
    ), '[]')`;

    const rows = await db
      .select({
        run: schema.scheduleRun,
        createdByMember: schema.member,
        user: schema.user,
        tasksJson,
      })
      .from(schema.scheduleRun)
      .innerJoin(schema.schedule, eq(schema.schedule.id, schema.scheduleRun.scheduleId))
      .leftJoin(schema.member, eq(schema.member.id, schema.scheduleRun.createdByMemberId))
      .leftJoin(schema.user, eq(schema.user.id, schema.member.userId))
      .where(
        and(
          eq(schema.scheduleRun.scheduleId, input.scheduleId),
          eq(schema.schedule.organizationId, organization.id),
        ),
      )
      .orderBy(desc(schema.scheduleRun.createdAt))
      .limit(pageSize)
      .offset(page * pageSize);

    return rows.map((row) => {
      const raw = JSON.parse(row.tasksJson ?? "[]");
      const tasks = raw.map((t: unknown) => schema.ScheduleRunTask.parse(t));
      const createdByMember =
        row.createdByMember && row.user ? { ...row.createdByMember, user: row.user } : null;
      return { ...row.run, tasks, createdByMember };
    });
  },
);

export const getScheduleRunHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getScheduleRunContract
>(
  getScheduleRunContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input }) => {
    const tasksJson = sql<string>`COALESCE((
      SELECT json_group_array(
        json_object(
          'id', t.id,
          'scheduleRunId', t.schedule_run_id,
          'status', t.status,
          'results', json(t.results),
          'attempts', t.attempts,
          'maxAttempts', t.max_attempts,
          'createdAt', t.created_at,
          'updatedAt', t.updated_at
        )
      )
      FROM schedule_run_task t
      WHERE t.schedule_run_id = ${schema.scheduleRun.id}
      ORDER BY t.updated_at DESC
    ), '[]')`;

    const [row] = await db
      .select({
        run: schema.scheduleRun,
        createdByMember: schema.member,
        user: schema.user,
        tasksJson,
      })
      .from(schema.scheduleRun)
      .innerJoin(schema.schedule, eq(schema.schedule.id, schema.scheduleRun.scheduleId))
      .leftJoin(schema.member, eq(schema.member.id, schema.scheduleRun.createdByMemberId))
      .leftJoin(schema.user, eq(schema.user.id, schema.member.userId))
      .where(
        and(
          eq(schema.scheduleRun.id, input.scheduleRunId),
          eq(schema.schedule.organizationId, organization.id),
        ),
      )
      .limit(1);

    if (!row) {
      throw new TypedHandlersError({ code: "NOT_FOUND", message: "Schedule run not found" });
    }

    const raw = JSON.parse(row.tasksJson ?? "[]");
    const tasks = raw.map((t: unknown) => schema.ScheduleRunTask.parse(t));
    const createdByMember =
      row.createdByMember && row.user ? { ...row.createdByMember, user: row.user } : null;
    return { ...row.run, tasks, createdByMember };
  },
);
