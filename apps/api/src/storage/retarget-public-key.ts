import type { PrismaClient } from '@prisma/client';

/** Every public-bucket image pointer that must move with an R2 key rename. */
export async function countPublicImageKeyRefs(
  db: PrismaClient,
  objectKey: string,
): Promise<number> {
  const [lodat, address, messenger, temp, snapshot, attachment, avatar, userAvatar, rotation] =
    await Promise.all([
      db.lodatImage.count({ where: { objectKey } }),
      db.addressImage.count({ where: { objectKey } }),
      db.customerMessengerImage.count({ where: { objectKey } }),
      db.lodatTempImage.count({ where: { objectKey } }),
      db.transactionSnapshotImage.count({ where: { objectKey } }),
      db.transactionAttachment.count({ where: { objectKey } }),
      db.customerFacebook.count({ where: { avatarObjectKey: objectKey } }),
      db.user.count({ where: { avatarObjectKey: objectKey } }),
      db.imageRotation.count({ where: { objectKey } }),
    ]);
  return (
    lodat +
    address +
    messenger +
    temp +
    snapshot +
    attachment +
    avatar +
    userAvatar +
    rotation
  );
}

/** Point every DB row at `to` then return leftover refs on `from`. */
export async function retargetPublicImageKey(
  db: PrismaClient,
  from: string,
  to: string,
): Promise<number> {
  if (from === to) return countPublicImageKeyRefs(db, from);
  await db.$transaction(async (tx) => {
    await tx.lodatImage.updateMany({ where: { objectKey: from }, data: { objectKey: to } });
    await tx.addressImage.updateMany({ where: { objectKey: from }, data: { objectKey: to } });
    await tx.customerMessengerImage.updateMany({
      where: { objectKey: from },
      data: { objectKey: to },
    });
    await tx.customerMessengerImage.updateMany({
      where: { originalPath: from },
      data: { originalPath: to },
    });
    await tx.lodatTempImage.updateMany({ where: { objectKey: from }, data: { objectKey: to } });
    await tx.transactionSnapshotImage.updateMany({
      where: { objectKey: from },
      data: { objectKey: to },
    });
    await tx.transactionAttachment.updateMany({
      where: { objectKey: from },
      data: { objectKey: to },
    });
    await tx.customerFacebook.updateMany({
      where: { avatarObjectKey: from },
      data: { avatarObjectKey: to },
    });
    await tx.user.updateMany({
      where: { avatarObjectKey: from },
      data: { avatarObjectKey: to },
    });
    const fromRot = await tx.imageRotation.findUnique({ where: { objectKey: from } });
    if (fromRot) {
      const toRot = await tx.imageRotation.findUnique({ where: { objectKey: to } });
      if (toRot) {
        await tx.imageRotation.delete({ where: { objectKey: from } });
      } else {
        await tx.imageRotation.update({
          where: { objectKey: from },
          data: { objectKey: to },
        });
      }
    }
  });
  return countPublicImageKeyRefs(db, from);
}
