import mongoose, { Types } from 'mongoose';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

const logger = new Logger('FixProductIdTypes');

/**
 * Scans the products collection for genderId/categoryId stored as raw strings
 * instead of ObjectId (a type mismatch that silently breaks every query
 * filtering on these fields, since MongoDB does not treat an ObjectId equal
 * to a string of the same hex value). Converts any it finds to ObjectId,
 * preserving the referenced id. Safe to re-run.
 */
async function bootstrap() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.error('MONGODB_URI is not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const products = db.collection('products');

  try {
    const affected = await products
      .find({
        $or: [{ genderId: { $type: 'string' } }, { categoryId: { $type: 'string' } }],
      })
      .toArray();

    logger.log(`Found ${affected.length} product(s) with genderId/categoryId stored as string`);

    let fixed = 0;
    let skipped = 0;

    for (const p of affected) {
      const genderIdStr = p.genderId;
      const categoryIdStr = p.categoryId;

      if (
        !Types.ObjectId.isValid(genderIdStr) ||
        !Types.ObjectId.isValid(categoryIdStr)
      ) {
        logger.warn(
          `Skipping product ${p._id} (${p.name}): genderId/categoryId is not a valid ObjectId hex string`,
        );
        skipped++;
        continue;
      }

      const res = await products.updateOne(
        { _id: p._id },
        {
          $set: {
            genderId: new Types.ObjectId(genderIdStr),
            categoryId: new Types.ObjectId(categoryIdStr),
          },
        },
      );

      if (res.modifiedCount === 1) {
        logger.log(`Fixed product ${p._id} (${p.name})`);
        fixed++;
      } else {
        logger.warn(`Update did not apply for product ${p._id} (${p.name})`);
        skipped++;
      }
    }

    logger.log(`Done. Fixed: ${fixed}, Skipped: ${skipped}, Total found: ${affected.length}`);
  } finally {
    await mongoose.disconnect();
  }
}

bootstrap();
