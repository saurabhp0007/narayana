import mongoose from 'mongoose';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

const logger = new Logger('MigrateFootwearSubcategoryTabNames');

/**
 * Migrates footwear-subcategory documents from the legacy single `tabName: string`
 * field to `tabNames: string[]`, so a tile can be mapped to more than one homepage
 * Footwear tab. Wraps the existing value in a single-element array and drops the old
 * field. Idempotent — docs that already have `tabNames` are left untouched, so this
 * is safe to re-run.
 */
async function bootstrap() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    logger.error('MONGODB_URI is not set');
    process.exit(1);
  }

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const collection = db.collection('footwearsubcategories');

  try {
    const affected = await collection
      .find({ tabName: { $exists: true }, tabNames: { $exists: false } })
      .toArray();

    logger.log(`Found ${affected.length} footwear subcategory doc(s) on the legacy tabName field`);

    let fixed = 0;
    for (const doc of affected) {
      const res = await collection.updateOne(
        { _id: doc._id },
        {
          $set: { tabNames: [doc.tabName] },
          $unset: { tabName: '' },
        },
      );
      if (res.modifiedCount === 1) {
        logger.log(`Migrated "${doc.name}": tabName "${doc.tabName}" -> tabNames ["${doc.tabName}"]`);
        fixed++;
      } else {
        logger.warn(`Update did not apply for footwear subcategory ${doc._id} (${doc.name})`);
      }
    }

    // Drop the old single-tab unique index — it references a field no longer written,
    // and NestJS's Mongoose autoIndex only creates newly-declared indexes, it doesn't
    // drop retired ones.
    const indexes = await collection.indexes();
    if (indexes.some((idx) => idx.name === 'tabName_1_name_1')) {
      await collection.dropIndex('tabName_1_name_1');
      logger.log('Dropped legacy index tabName_1_name_1');
    }
    if (indexes.some((idx) => idx.name === 'tabName_1_displayOrder_1')) {
      await collection.dropIndex('tabName_1_displayOrder_1');
      logger.log('Dropped legacy index tabName_1_displayOrder_1');
    }

    logger.log(`Done. Migrated: ${fixed}, Total found: ${affected.length}`);
  } finally {
    await mongoose.disconnect();
  }
}

bootstrap();
