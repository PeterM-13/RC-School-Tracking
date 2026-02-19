/*
  Warnings:

  - Changed the type of `comments` on the `SchoolProgress` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "SchoolProgress" DROP COLUMN "comments",
ADD COLUMN     "comments" JSONB NOT NULL;
