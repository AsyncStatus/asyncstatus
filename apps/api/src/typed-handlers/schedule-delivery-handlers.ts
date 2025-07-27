import { TypedHandlersError, typedHandler } from "@asyncstatus/typed-handlers";
import { generateId } from "better-auth";
import { and, eq } from "drizzle-orm";
import * as schema from "../db";
import type { TypedHandlersContextWithOrganization } from "../lib/env";
import { requiredOrganization, requiredSession } from "./middleware";
import {
  deleteScheduleDeliveryContract,
  getScheduleDeliveryContract,
  upsertScheduleDeliveryContract,
} from "./schedule-delivery-contracts";

export const upsertScheduleDeliveryHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof upsertScheduleDeliveryContract
>(
  upsertScheduleDeliveryContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input, member }) => {
    const { scheduleId, idOrSlug: _, id, ...deliveryData } = input;

    // First verify the schedule exists and belongs to the organization
    const existingSchedule = await db.query.schedule.findFirst({
      where: and(
        eq(schema.schedule.id, scheduleId),
        eq(schema.schedule.organizationId, organization.id),
      ),
    });

    if (!existingSchedule) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Schedule not found",
      });
    }

    // Check permissions - only admin/owner or creator can add deliveries
    if (
      member.role !== "admin" &&
      member.role !== "owner" &&
      member.id !== existingSchedule.createdByMemberId
    ) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You do not have permission to add deliveries to this schedule",
      });
    }

    // Perform upsert in transaction
    return await db.transaction(async (tx) => {
      const whereConditions = [eq(schema.scheduleDelivery.scheduleId, scheduleId)];

      if (id) {
        whereConditions.push(eq(schema.scheduleDelivery.id, id));
      } else {
        whereConditions.push(
          eq(schema.scheduleDelivery.deliveryMethod, deliveryData.deliveryMethod),
        );
      }

      // Check if delivery method already exists for this schedule
      const existingDelivery = await tx
        .select()
        .from(schema.scheduleDelivery)
        .where(and(...whereConditions))
        .limit(1);

      const now = new Date();

      if (existingDelivery[0]) {
        // Update existing delivery
        const updatedDelivery = await tx
          .update(schema.scheduleDelivery)
          .set({ deliveryMethod: deliveryData.deliveryMethod, updatedAt: now })
          .where(eq(schema.scheduleDelivery.id, existingDelivery[0].id))
          .returning();

        if (!updatedDelivery || !updatedDelivery[0]) {
          throw new TypedHandlersError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to update schedule delivery",
          });
        }

        return updatedDelivery[0];
      } else {
        // Create new delivery
        const deliveryId = generateId();

        const newDelivery = await tx
          .insert(schema.scheduleDelivery)
          .values({
            id: deliveryId,
            scheduleId: scheduleId,
            deliveryMethod: deliveryData.deliveryMethod,
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        if (!newDelivery || !newDelivery[0]) {
          throw new TypedHandlersError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create schedule delivery",
          });
        }

        return newDelivery[0];
      }
    });
  },
);

export const getScheduleDeliveryHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof getScheduleDeliveryContract
>(
  getScheduleDeliveryContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input }) => {
    const { scheduleId, deliveryId } = input;

    // First verify the schedule exists and belongs to the organization
    const existingSchedule = await db.query.schedule.findFirst({
      where: and(
        eq(schema.schedule.id, scheduleId),
        eq(schema.schedule.organizationId, organization.id),
      ),
    });

    if (!existingSchedule) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Schedule not found",
      });
    }

    // Find the delivery
    const delivery = await db.query.scheduleDelivery.findFirst({
      where: and(
        eq(schema.scheduleDelivery.id, deliveryId),
        eq(schema.scheduleDelivery.scheduleId, scheduleId),
      ),
    });

    if (!delivery) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Schedule delivery not found",
      });
    }

    return delivery;
  },
);

export const deleteScheduleDeliveryHandler = typedHandler<
  TypedHandlersContextWithOrganization,
  typeof deleteScheduleDeliveryContract
>(
  deleteScheduleDeliveryContract,
  requiredSession,
  requiredOrganization,
  async ({ db, organization, input, member }) => {
    const { scheduleId, deliveryId } = input;

    // First verify the schedule exists and belongs to the organization
    const existingSchedule = await db.query.schedule.findFirst({
      where: and(
        eq(schema.schedule.id, scheduleId),
        eq(schema.schedule.organizationId, organization.id),
      ),
    });

    if (!existingSchedule) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Schedule not found",
      });
    }

    // Check permissions - only admin/owner or creator can delete deliveries
    if (
      member.role !== "admin" &&
      member.role !== "owner" &&
      member.id !== existingSchedule.createdByMemberId
    ) {
      throw new TypedHandlersError({
        code: "FORBIDDEN",
        message: "You do not have permission to delete deliveries from this schedule",
      });
    }

    // Verify the delivery exists and belongs to the schedule
    const existingDelivery = await db.query.scheduleDelivery.findFirst({
      where: and(
        eq(schema.scheduleDelivery.id, deliveryId),
        eq(schema.scheduleDelivery.scheduleId, scheduleId),
      ),
    });

    if (!existingDelivery) {
      throw new TypedHandlersError({
        code: "NOT_FOUND",
        message: "Schedule delivery not found",
      });
    }

    const result = await db
      .delete(schema.scheduleDelivery)
      .where(eq(schema.scheduleDelivery.id, deliveryId))
      .returning();

    if (!result || result.length === 0) {
      throw new TypedHandlersError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete schedule delivery",
      });
    }

    return { success: true };
  },
);
