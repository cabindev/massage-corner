-- AlterTable: เพิ่ม therapistId + ขยายชุดสถานะ
ALTER TABLE `Booking` ADD COLUMN `therapistId` VARCHAR(191) NULL,
    MODIFY `status` ENUM('PENDING', 'CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING';

-- AlterTable: เพิ่ม endTime แบบ nullable ก่อน เพื่อ backfill ข้อมูลเดิม
ALTER TABLE `Booking` ADD COLUMN `endTime` DATETIME(3) NULL;

-- Backfill: endTime = bookingTime + ระยะเวลาบริการ (นาที) สำหรับ booking ที่มีอยู่เดิม
UPDATE `Booking` `b`
  JOIN `Service` `s` ON `b`.`serviceId` = `s`.`id`
  SET `b`.`endTime` = DATE_ADD(`b`.`bookingTime`, INTERVAL `s`.`durationMinutes` MINUTE)
  WHERE `b`.`endTime` IS NULL;

-- เปลี่ยน endTime เป็น NOT NULL หลัง backfill เสร็จ
ALTER TABLE `Booking` MODIFY `endTime` DATETIME(3) NOT NULL;

-- CreateTable
CREATE TABLE `Therapist` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `bio` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Booking_therapistId_idx` ON `Booking`(`therapistId`);

-- CreateIndex
CREATE INDEX `Booking_endTime_idx` ON `Booking`(`endTime`);

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_therapistId_fkey` FOREIGN KEY (`therapistId`) REFERENCES `Therapist`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
