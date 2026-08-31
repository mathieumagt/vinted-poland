import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export type ActivityAction =
  | "ORDER_SYNCED"
  | "ORDER_CREATED_MANUAL"
  | "ORDER_EDITED"
  | "ORDER_RELEASED"
  | "ORDER_SHIPPED"
  | "DOTB_PACK_OK"
  | "DOTB_PACK_FAILED"
  | "ACCOUNT_TOGGLED"
  | "SYNC_RUN"
  | "EMPLOYEE_PAID";

export function logActivity(params: {
  action: ActivityAction;
  orderId?: string;
  userId?: string;
  metadata?: Prisma.InputJsonValue;
}) {
  return prisma.activityLog.create({
    data: {
      action: params.action,
      orderId: params.orderId,
      userId: params.userId,
      metadata: params.metadata,
    },
  });
}
