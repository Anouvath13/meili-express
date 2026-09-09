-- CreateEnum
CREATE TYPE "PhoneChangeStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "staff_phone_change_requests" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "new_phone" TEXT NOT NULL,
    "status" "PhoneChangeStatus" NOT NULL DEFAULT 'pending',
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "staff_phone_change_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "staff_phone_change_requests" ADD CONSTRAINT "staff_phone_change_requests_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_phone_change_requests" ADD CONSTRAINT "staff_phone_change_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
