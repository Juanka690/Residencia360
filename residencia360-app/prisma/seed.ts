import bcrypt from "bcryptjs";
import {
  ChargeStatus,
  GateType,
  LedgerStatus,
  PaymentStatus,
  PqrsPriority,
  PqrsStatus,
  PrismaClient,
  ProviderAccessStatus,
  ReservationStatus,
  ReviewStatus,
  Role,
  VisitStatus,
} from "@prisma/client";

const prisma = new PrismaClient();

const PASSWORD = "Residencia360!";

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function addHours(date: Date, hours: number) {
  const copy = new Date(date);
  copy.setHours(copy.getHours() + hours);
  return copy;
}

function apartmentNumber(floor: number, index: number) {
  return `${floor}${String(index).padStart(2, "0")}`;
}

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  await prisma.auditLog.deleteMany();
  await prisma.paymentSupport.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.charge.deleteMany();
  await prisma.ledgerAccount.deleteMany();
  await prisma.maintenanceBlock.deleteMany();
  await prisma.reservation.deleteMany();
  await prisma.commonArea.deleteMany();
  await prisma.pqrsAttachment.deleteMany();
  await prisma.pqrsComment.deleteMany();
  await prisma.providerAccess.deleteMany();
  await prisma.pqrs.deleteMany();
  await prisma.announcementRead.deleteMany();
  await prisma.announcementAttachment.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.visitorParkingAssignment.deleteMany();
  await prisma.parkingSpot.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.visitor.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.providerCompany.deleteMany();
  await prisma.user.deleteMany();
  await prisma.residentialUnit.deleteMany();
  await prisma.tower.deleteMany();

  const towers = await Promise.all(
    [
      { name: "Torre 1", code: "T1" },
      { name: "Torre 2", code: "T2" },
      { name: "Torre 3", code: "T3" },
    ].map((tower) => prisma.tower.create({ data: tower })),
  );

  const units = [];
  for (const tower of towers) {
    for (let floor = 1; floor <= 20; floor += 1) {
      for (let index = 1; index <= 4; index += 1) {
        const number = apartmentNumber(floor, index);
        units.push({
          towerId: tower.id,
          number,
          floor,
          apartmentCode: `${tower.code}-${number}`,
        });
      }
    }
  }
  await prisma.residentialUnit.createMany({ data: units });
  const allUnits = await prisma.residentialUnit.findMany({ include: { tower: true } });

  const users = await prisma.user.createManyAndReturn({
    data: [
      {
        email: "admin@residencia360.local",
        passwordHash,
        firstName: "Laura",
        lastName: "Restrepo",
        phone: "3001112233",
        document: "100000001",
        role: Role.ADMIN,
        towerId: towers[0].id,
      },
      {
        email: "auxiliar@residencia360.local",
        passwordHash,
        firstName: "Mateo",
        lastName: "Arango",
        phone: "3001112244",
        document: "100000002",
        role: Role.ADMIN,
        towerId: towers[0].id,
      },
      {
        email: "vigilante@residencia360.local",
        passwordHash,
        firstName: "Samuel",
        lastName: "Londoño",
        phone: "3001112255",
        document: "100000003",
        role: Role.GUARD,
      },
      {
        email: "consejo@residencia360.local",
        passwordHash,
        firstName: "Diana",
        lastName: "Gómez",
        phone: "3001112266",
        document: "100000004",
        role: Role.BOARD,
        towerId: towers[1].id,
      },
      {
        email: "proveedor@residencia360.local",
        passwordHash,
        firstName: "Carlos",
        lastName: "Montoya",
        phone: "3001112277",
        document: "100000005",
        role: Role.CONTRACTOR,
      },
      {
        email: "residente1@residencia360.local",
        passwordHash,
        firstName: "Juan",
        lastName: "Cardona",
        phone: "3001112288",
        document: "100000006",
        role: Role.RESIDENT,
        towerId: towers[0].id,
        apartmentId: allUnits[0].id,
      },
      {
        email: "residente2@residencia360.local",
        passwordHash,
        firstName: "Valentina",
        lastName: "Pérez",
        phone: "3001112299",
        document: "100000007",
        role: Role.RESIDENT,
        towerId: towers[1].id,
        apartmentId: allUnits[80].id,
      },
      {
        email: "residente3@residencia360.local",
        passwordHash,
        firstName: "Andrés",
        lastName: "Sánchez",
        phone: "3001112200",
        document: "100000008",
        role: Role.RESIDENT,
        towerId: towers[2].id,
        apartmentId: allUnits[160].id,
      },
    ],
  });

  const resident1 = users.find((user) => user.email === "residente1@residencia360.local")!;
  const resident2 = users.find((user) => user.email === "residente2@residencia360.local")!;
  const resident3 = users.find((user) => user.email === "residente3@residencia360.local")!;
  const admin = users.find((user) => user.email === "admin@residencia360.local")!;
  const guard = users.find((user) => user.email === "vigilante@residencia360.local")!;

  const commonAreas = await prisma.commonArea.createManyAndReturn({
    data: [
      {
        name: "Salón social",
        description: "Espacio para eventos familiares y reuniones.",
        capacity: 80,
        color: "#1d4ed8",
        minimumAdvanceHours: 48,
        maxActiveReservationsWeekly: 1,
      },
      {
        name: "Gimnasio",
        description: "Área de entrenamiento con control por franja.",
        capacity: 18,
        color: "#059669",
        minimumAdvanceHours: 4,
        maxActiveReservationsWeekly: 3,
        blockIfInArrears: false,
      },
      {
        name: "Piscina",
        description: "Zona húmeda con turnos y aforo controlado.",
        capacity: 24,
        color: "#0284c7",
        minimumAdvanceHours: 24,
        maxActiveReservationsWeekly: 2,
      },
      {
        name: "Cancha",
        description: "Cancha múltiple para actividades deportivas.",
        capacity: 20,
        color: "#ea580c",
        minimumAdvanceHours: 12,
        maxActiveReservationsWeekly: 2,
      },
      {
        name: "BBQ",
        description: "Zona BBQ con reserva por bloques de tiempo.",
        capacity: 12,
        color: "#b45309",
        minimumAdvanceHours: 24,
        maxActiveReservationsWeekly: 1,
      },
    ],
  });

  await prisma.maintenanceBlock.create({
    data: {
      areaId: commonAreas[2].id,
      startAt: addDays(new Date(), 2),
      endAt: addDays(new Date(), 3),
      reason: "Mantenimiento preventivo del sistema de filtrado.",
    },
  });

  const visitorSpots = await prisma.parkingSpot.createManyAndReturn({
    data: Array.from({ length: 12 }).map((_, index) => ({
      label: `V-${String(index + 1).padStart(2, "0")}`,
    })),
  });

  const announcements = await prisma.announcement.createManyAndReturn({
    data: [
      {
        title: "Asamblea extraordinaria del mes",
        summary: "Convocatoria a propietarios para revisar presupuesto y seguridad.",
        content:
          "Se convoca a la asamblea extraordinaria el próximo sábado a las 9:00 a. m. en el salón social. Se presentará el balance de cartera, nuevas medidas de acceso y cronograma de mantenimiento.",
        critical: true,
        createdById: admin.id,
        publishAt: addDays(new Date(), -1),
      },
      {
        title: "Mantenimiento programado de piscina",
        summary: "La piscina estará cerrada durante 24 horas.",
        content:
          "El área de piscina estará en mantenimiento preventivo entre el martes y miércoles. Las reservas en esa franja se bloquearán automáticamente.",
        critical: false,
        createdById: admin.id,
        publishAt: new Date(),
      },
      {
        title: "Nuevos protocolos para proveedores",
        summary: "Todo proveedor debe ingresar con autorización previa y código.",
        content:
          "A partir de esta semana, los contratistas deberán presentar código de autorización o documento registrado. Portería validará horario, apartamento solicitante y salida.",
        critical: false,
        createdById: admin.id,
        audience: "TOWER",
        towerId: towers[0].id,
      },
    ],
  });

  await prisma.announcementRead.create({
    data: {
      announcementId: announcements[0].id,
      userId: resident1.id,
    },
  });

  const visitors = await prisma.visitor.createManyAndReturn({
    data: [
      {
        fullName: "Mariana Hoyos",
        document: "43123456",
        phone: "3012345678",
        vehiclePlate: "KLM234",
      },
      {
        fullName: "Felipe Castaño",
        document: "99112233",
        phone: "3024567812",
      },
      {
        fullName: "Ana Lucía Soto",
        document: "55119933",
        phone: "3120044556",
      },
    ],
  });

  const sampleStart = addHours(new Date(), 3);
  const visits = await prisma.visit.createManyAndReturn({
    data: [
      {
        code: "VIS-0001",
        visitorId: visitors[0].id,
        residentId: resident1.id,
        apartmentId: resident1.apartmentId!,
        createdById: resident1.id,
        approvedById: resident1.id,
        gateType: GateType.VEHICULAR,
        reason: "Visita familiar",
        qrToken: "QR-VIS-0001",
        scheduledStart: sampleStart,
        scheduledEnd: addHours(sampleStart, 3),
        approvedAt: new Date(),
        status: VisitStatus.APPROVED,
      },
      {
        code: "VIS-0002",
        visitorId: visitors[1].id,
        residentId: resident2.id,
        apartmentId: resident2.apartmentId!,
        createdById: resident2.id,
        approvedById: resident2.id,
        guardInId: guard.id,
        gateType: GateType.PEDESTRIAN,
        reason: "Apoyo técnico internet",
        qrToken: "QR-VIS-0002",
        scheduledStart: addDays(new Date(), -1),
        scheduledEnd: addHours(addDays(new Date(), -1), 2),
        approvedAt: addDays(new Date(), -1),
        checkedInAt: addDays(new Date(), -1),
        checkedOutAt: addHours(addDays(new Date(), -1), 2),
        status: VisitStatus.COMPLETED,
      },
      {
        code: "VIS-0003",
        visitorId: visitors[2].id,
        residentId: resident3.id,
        apartmentId: resident3.apartmentId!,
        createdById: resident3.id,
        gateType: GateType.PEDESTRIAN,
        reason: "Entrega de documentos",
        qrToken: "QR-VIS-0003",
        scheduledStart: addHours(new Date(), 10),
        scheduledEnd: addHours(new Date(), 12),
        status: VisitStatus.PRE_REGISTERED,
      },
    ],
  });

  await prisma.visitorParkingAssignment.create({
    data: {
      parkingSpotId: visitorSpots[0].id,
      visitId: visits[0].id,
      startAt: sampleStart,
      endAt: addHours(sampleStart, 3),
    },
  });

  const pqrs = await prisma.pqrs.createManyAndReturn({
    data: [
      {
        ticketNumber: "PQRS-2026-0001",
        category: "Mantenimiento",
        subject: "Fuga de agua en pasillo del piso 3",
        description:
          "Se evidencia humedad constante en el pasillo y goteo cerca al ascensor de la Torre 1.",
        priority: PqrsPriority.HIGH,
        status: PqrsStatus.IN_PROGRESS,
        residentId: resident1.id,
        apartmentId: resident1.apartmentId!,
        assignedToId: admin.id,
        slaDueAt: addDays(new Date(), 2),
      },
      {
        ticketNumber: "PQRS-2026-0002",
        category: "Seguridad",
        subject: "Vehículo desconocido en parqueadero de visitantes",
        description: "Durante la madrugada se observó un vehículo sin registro ocupando el cupo V-04.",
        priority: PqrsPriority.MEDIUM,
        status: PqrsStatus.FILED,
        residentId: resident2.id,
        apartmentId: resident2.apartmentId!,
        assignedToId: admin.id,
        slaDueAt: addDays(new Date(), 3),
      },
    ],
  });

  await prisma.pqrsComment.createMany({
    data: [
      {
        pqrsId: pqrs[0].id,
        authorId: admin.id,
        message: "Se asignó revisión de fontanería para hoy a las 4:00 p. m.",
      },
      {
        pqrsId: pqrs[0].id,
        authorId: admin.id,
        internal: true,
        message: "Solicitar presupuesto de reparación si la fuga compromete ducto principal.",
      },
    ],
  });

  const provider = await prisma.providerCompany.create({
    data: {
      name: "Soluciones Hidráulicas Medellín",
      taxId: "900123456",
      contactName: "Nicolás Franco",
      contactPhone: "3158823344",
      contactEmail: "contacto@solucioneshidraulicas.co",
    },
  });

  await prisma.providerAccess.create({
    data: {
      code: "PROV-0001",
      providerId: provider.id,
      apartmentId: resident1.apartmentId!,
      authorizedById: admin.id,
      pqrsId: pqrs[0].id,
      activity: "Inspección y reparación de fuga reportada",
      workOrderRef: "OT-3021",
      scheduledStart: addHours(new Date(), 5),
      scheduledEnd: addHours(new Date(), 8),
      status: ProviderAccessStatus.APPROVED,
    },
  });

  const reservations = await prisma.reservation.createManyAndReturn({
    data: [
      {
        areaId: commonAreas[0].id,
        residentId: resident1.id,
        apartmentId: resident1.apartmentId!,
        startAt: addDays(new Date(), 6),
        endAt: addHours(addDays(new Date(), 6), 6),
        attendees: 45,
        purpose: "Cumpleaños familiar",
        status: ReservationStatus.PENDING,
      },
      {
        areaId: commonAreas[1].id,
        residentId: resident2.id,
        apartmentId: resident2.apartmentId!,
        startAt: addHours(new Date(), 8),
        endAt: addHours(new Date(), 9),
        attendees: 2,
        purpose: "Entrenamiento personal",
        status: ReservationStatus.APPROVED,
        approvedById: admin.id,
        approvedAt: new Date(),
      },
    ],
  });

  for (const unit of allUnits) {
    const overdue = unit.id === resident2.apartmentId ? 180000 : 0;
    const dueAmount = unit.id === resident2.apartmentId ? 420000 : 210000;
    const balance = dueAmount + overdue;
    await prisma.ledgerAccount.create({
      data: {
        apartmentId: unit.id,
        balance,
        dueAmount,
        overdueAmount: overdue,
        status: overdue > 0 ? LedgerStatus.IN_ARREARS : LedgerStatus.CURRENT,
        charges: {
          create: [
            {
              concept: "Administración",
              periodLabel: "Abril 2026",
              amount: 210000,
              dueDate: addDays(new Date(), 10),
              status: ChargeStatus.PENDING,
            },
            {
              concept: "Fondo extraordinario seguridad",
              periodLabel: "Marzo 2026",
              amount: overdue > 0 ? 180000 : 0,
              dueDate: addDays(new Date(), -20),
              status: overdue > 0 ? ChargeStatus.PENDING : ChargeStatus.VOID,
            },
          ],
        },
      },
    });
  }

  const resident2Account = await prisma.ledgerAccount.findUniqueOrThrow({
    where: { apartmentId: resident2.apartmentId! },
  });

  const payment = await prisma.payment.create({
    data: {
      ledgerAccountId: resident2Account.id,
      reference: "PAY-2026-0001",
      amount: 210000,
      paidAt: new Date(),
      status: PaymentStatus.SUBMITTED,
      createdById: resident2.id,
      notes: "Transferencia Bancolombia",
    },
  });

  await prisma.paymentSupport.create({
    data: {
      paymentId: payment.id,
      fileName: "soporte-transferencia.pdf",
      fileUrl: "/uploads/mock/soporte-transferencia.pdf",
      status: ReviewStatus.PENDING,
    },
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorId: resident1.id,
        action: "VISIT_CREATED",
        entityType: "Visit",
        entityId: visits[0].id,
        detail: "Pre-registro de visitante Mariana Hoyos para la Torre 1 apartamento 101.",
      },
      {
        actorId: guard.id,
        action: "LOGIN_SUCCESS",
        entityType: "Auth",
        detail: "Inicio de sesión exitoso en portería peatonal.",
      },
      {
        actorId: admin.id,
        action: "PQRS_ASSIGNED",
        entityType: "Pqrs",
        entityId: pqrs[0].id,
        detail: "PQRS asignada a administración con prioridad alta.",
      },
      {
        actorId: admin.id,
        action: "RESERVATION_REVIEW_PENDING",
        entityType: "Reservation",
        entityId: reservations[0].id,
        detail: "Reserva del salón social quedó pendiente de aprobación.",
      },
    ],
  });

  console.log("Seed completado");
  console.log(`Usuarios demo creados. Contraseña común: ${PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
