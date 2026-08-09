-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'KHACH_MOI',
    "budgetMinVnd" INTEGER,
    "budgetMaxVnd" INTEGER,
    "note" TEXT,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "sourceHotlineId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerFacebook" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "customerUid" TEXT,
    "threadId" TEXT,
    "facebookName" TEXT,
    "avatarUrl" TEXT,
    "scanSource" TEXT,
    "rawMeta" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerFacebook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerPhone" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerPhone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerMessengerMessage" (
    "id" TEXT NOT NULL,
    "customerFacebookId" TEXT NOT NULL,
    "externalMessageId" TEXT,
    "body" TEXT,
    "direction" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerMessengerMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerMessengerImage" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerMessengerImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerCareNote" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerCareNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeFacebookProfile" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "facebookUid" TEXT NOT NULL,
    "nickname" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeFacebookProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeHotline" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeHotline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Province" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Province_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ward" (
    "id" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Ward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Address" (
    "id" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'REGULAR',
    "name" TEXT,
    "detail" TEXT,
    "provinceId" TEXT,
    "districtId" TEXT,
    "wardId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AddressImage" (
    "id" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AddressImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lodat" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "areaM2" DOUBLE PRECISION,
    "frontageM" DOUBLE PRECISION,
    "direction" TEXT,
    "note" TEXT,
    "addressId" TEXT,
    "isForSale" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lodat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LodatImage" (
    "id" TEXT NOT NULL,
    "lodatId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LodatImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LodatTempImage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LodatTempImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LodatCustomerMap" (
    "id" TEXT NOT NULL,
    "lodatId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "priceVnd" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DANG_BAN',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LodatCustomerMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "lodatCustomerMapId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'OWN',
    "status" TEXT NOT NULL DEFAULT 'DA_COC',
    "amountVnd" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionParty" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "note" TEXT,

    CONSTRAINT "TransactionParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionAttachment" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TitleService" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DANG_LAM',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TitleService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TitleServiceProgress" (
    "id" TEXT NOT NULL,
    "titleServiceId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TitleServiceProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TitleServiceMoney" (
    "id" TEXT NOT NULL,
    "titleServiceId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amountVnd" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TitleServiceMoney_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TitleServiceAttachment" (
    "id" TEXT NOT NULL,
    "titleServiceId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "label" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TitleServiceAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImageRotation" (
    "id" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "degrees" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageRotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "Customer_employeeId_idx" ON "Customer"("employeeId");

-- CreateIndex
CREATE INDEX "Customer_status_idx" ON "Customer"("status");

-- CreateIndex
CREATE INDEX "Customer_isHidden_idx" ON "Customer"("isHidden");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerFacebook_customerId_key" ON "CustomerFacebook"("customerId");

-- CreateIndex
CREATE INDEX "CustomerFacebook_customerUid_idx" ON "CustomerFacebook"("customerUid");

-- CreateIndex
CREATE INDEX "CustomerFacebook_threadId_idx" ON "CustomerFacebook"("threadId");

-- CreateIndex
CREATE INDEX "CustomerPhone_customerId_idx" ON "CustomerPhone"("customerId");

-- CreateIndex
CREATE INDEX "CustomerPhone_phone_idx" ON "CustomerPhone"("phone");

-- CreateIndex
CREATE INDEX "CustomerMessengerMessage_customerFacebookId_idx" ON "CustomerMessengerMessage"("customerFacebookId");

-- CreateIndex
CREATE INDEX "CustomerCareNote_customerId_idx" ON "CustomerCareNote"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeFacebookProfile_employeeId_facebookUid_key" ON "EmployeeFacebookProfile"("employeeId", "facebookUid");

-- CreateIndex
CREATE INDEX "EmployeeHotline_employeeId_idx" ON "EmployeeHotline"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Province_code_key" ON "Province"("code");

-- CreateIndex
CREATE UNIQUE INDEX "District_provinceId_code_key" ON "District"("provinceId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "Ward_districtId_code_key" ON "Ward"("districtId", "code");

-- CreateIndex
CREATE INDEX "LodatTempImage_sessionId_idx" ON "LodatTempImage"("sessionId");

-- CreateIndex
CREATE INDEX "LodatCustomerMap_customerId_idx" ON "LodatCustomerMap"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "LodatCustomerMap_lodatId_customerId_key" ON "LodatCustomerMap"("lodatId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "ImageRotation_objectKey_key" ON "ImageRotation"("objectKey");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_sourceHotlineId_fkey" FOREIGN KEY ("sourceHotlineId") REFERENCES "EmployeeHotline"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerFacebook" ADD CONSTRAINT "CustomerFacebook_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPhone" ADD CONSTRAINT "CustomerPhone_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerMessengerMessage" ADD CONSTRAINT "CustomerMessengerMessage_customerFacebookId_fkey" FOREIGN KEY ("customerFacebookId") REFERENCES "CustomerFacebook"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerMessengerImage" ADD CONSTRAINT "CustomerMessengerImage_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "CustomerMessengerMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCareNote" ADD CONSTRAINT "CustomerCareNote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCareNote" ADD CONSTRAINT "CustomerCareNote_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeFacebookProfile" ADD CONSTRAINT "EmployeeFacebookProfile_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeHotline" ADD CONSTRAINT "EmployeeHotline_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ward" ADD CONSTRAINT "Ward_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AddressImage" ADD CONSTRAINT "AddressImage_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lodat" ADD CONSTRAINT "Lodat_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LodatImage" ADD CONSTRAINT "LodatImage_lodatId_fkey" FOREIGN KEY ("lodatId") REFERENCES "Lodat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LodatCustomerMap" ADD CONSTRAINT "LodatCustomerMap_lodatId_fkey" FOREIGN KEY ("lodatId") REFERENCES "Lodat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LodatCustomerMap" ADD CONSTRAINT "LodatCustomerMap_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_lodatCustomerMapId_fkey" FOREIGN KEY ("lodatCustomerMapId") REFERENCES "LodatCustomerMap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionParty" ADD CONSTRAINT "TransactionParty_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionAttachment" ADD CONSTRAINT "TransactionAttachment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitleServiceProgress" ADD CONSTRAINT "TitleServiceProgress_titleServiceId_fkey" FOREIGN KEY ("titleServiceId") REFERENCES "TitleService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitleServiceMoney" ADD CONSTRAINT "TitleServiceMoney_titleServiceId_fkey" FOREIGN KEY ("titleServiceId") REFERENCES "TitleService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TitleServiceAttachment" ADD CONSTRAINT "TitleServiceAttachment_titleServiceId_fkey" FOREIGN KEY ("titleServiceId") REFERENCES "TitleService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
