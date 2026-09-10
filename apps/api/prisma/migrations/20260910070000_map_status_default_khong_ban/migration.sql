-- Default map status for new lodats: Không bán (create = not yet listing).
ALTER TABLE "LodatCustomerMap" ALTER COLUMN "status" SET DEFAULT 'KHONG_BAN';
