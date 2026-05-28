import { db } from "@/lib/db";

export async function getParkingOverview() {
  const [spots, activeAssignments] = await Promise.all([
    db.parkingSpot.findMany({
      include: {
        assignments: {
          where: {
            endAt: { gte: new Date() },
          },
          include: {
            visit: { include: { visitor: true } },
            providerAccess: { include: { provider: true } },
          },
        },
      },
      orderBy: { label: "asc" },
    }),
    db.visitorParkingAssignment.count({
      where: {
        startAt: { lte: new Date() },
        endAt: { gte: new Date() },
      },
    }),
  ]);

  return { spots, activeAssignments };
}
