-- Công việc cá nhân gắn khách / lô / GD / sổ đỏ.
CREATE TABLE "WorkTask" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "dueOn" DATE NOT NULL,
    "targetType" TEXT NOT NULL,
    "customerId" TEXT,
    "lodatId" TEXT,
    "transactionId" TEXT,
    "titleServiceId" TEXT,
    "targetLabel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkTask_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkTask_employeeId_dueOn_idx" ON "WorkTask"("employeeId", "dueOn");
CREATE INDEX "WorkTask_customerId_idx" ON "WorkTask"("customerId");
CREATE INDEX "WorkTask_lodatId_idx" ON "WorkTask"("lodatId");
CREATE INDEX "WorkTask_transactionId_idx" ON "WorkTask"("transactionId");
CREATE INDEX "WorkTask_titleServiceId_idx" ON "WorkTask"("titleServiceId");

ALTER TABLE "WorkTask" ADD CONSTRAINT "WorkTask_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkTask" ADD CONSTRAINT "WorkTask_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkTask" ADD CONSTRAINT "WorkTask_lodatId_fkey" FOREIGN KEY ("lodatId") REFERENCES "Lodat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkTask" ADD CONSTRAINT "WorkTask_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkTask" ADD CONSTRAINT "WorkTask_titleServiceId_fkey" FOREIGN KEY ("titleServiceId") REFERENCES "TitleService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
