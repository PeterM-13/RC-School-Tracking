-- CreateTable
CREATE TABLE "SchoolProgress" (
    "id" SERIAL NOT NULL,
    "school" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "progress" INTEGER[],
    "comments" TEXT[],

    CONSTRAINT "SchoolProgress_pkey" PRIMARY KEY ("id")
);
