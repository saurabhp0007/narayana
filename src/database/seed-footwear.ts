import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { Gender } from '../modules/gender/schemas/gender.schema';
import { Category } from '../modules/category/schemas/category.schema';
import { Product, ProductBadge } from '../modules/product/schemas/product.schema';
import { Offer, OfferType } from '../modules/offer/schemas/offer.schema';
import { FootwearTab } from '../modules/footwear-tab/schemas/footwear-tab.schema';

type TabKey = 'dealsCombos' | 'mensShoes' | 'formal' | 'womenMore';

const TAB_DEFS: { key: TabKey; name: string; displayOrder: number }[] = [
  { key: 'dealsCombos', name: 'Deals & Combos', displayOrder: 0 },
  { key: 'mensShoes', name: "Men's Shoes", displayOrder: 1 },
  { key: 'formal', name: 'Formal', displayOrder: 2 },
  { key: 'womenMore', name: 'Women & More', displayOrder: 3 },
];

const IMAGE = {
  sneaker1: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
  sneaker2: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80',
  sneaker3: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80',
  slides: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&q=80',
  trailRunner: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80',
  hightop: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80',
  canvas: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800&q=80',
  oxford: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=800&q=80',
  derby: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&q=80',
  monkStrap: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&q=80',
  womenSneaker: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=800&q=80',
  sandals: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800&q=80',
  womenSlides: 'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=800&q=80',
};

interface SeedProduct {
  sku: string;
  name: string;
  price: number;
  badge: ProductBadge;
  image: string;
  offer: {
    name: string;
    footwearTab: TabKey;
    offerType: OfferType;
    rules: Record<string, number>;
  };
}

async function findOrCreateFootwearTab(
  model: Model<FootwearTab>,
  name: string,
  slug: string,
  displayOrder: number,
): Promise<Types.ObjectId> {
  const existing = await model.findOne({ name });
  if (existing) return existing._id as Types.ObjectId;
  const created = await new model({ name, slug, displayOrder, isActive: true }).save();
  return created._id as Types.ObjectId;
}

async function findOrCreateGender(model: Model<Gender>, name: string, slug: string): Promise<Types.ObjectId> {
  const existing = await model.findOne({ name });
  if (existing) return existing._id as Types.ObjectId;
  const created = await new model({ name, slug, isActive: true }).save();
  return created._id as Types.ObjectId;
}

async function findOrCreateCategory(
  model: Model<Category>,
  name: string,
  slug: string,
  genderId: Types.ObjectId,
): Promise<Types.ObjectId> {
  const existing = await model.findOne({ name, genderId });
  if (existing) return existing._id as Types.ObjectId;
  const created = await new model({ name, slug, genderId, isActive: true }).save();
  return created._id as Types.ObjectId;
}

async function bootstrap() {
  const logger = new Logger('SeedFootwear');
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const genderModel = app.get<Model<Gender>>(getModelToken(Gender.name));
    const categoryModel = app.get<Model<Category>>(getModelToken(Category.name));
    const productModel = app.get<Model<Product>>(getModelToken(Product.name));
    const offerModel = app.get<Model<Offer>>(getModelToken(Offer.name));
    const footwearTabModel = app.get<Model<FootwearTab>>(getModelToken(FootwearTab.name));

    const tabIdByKey = {} as Record<TabKey, Types.ObjectId>;
    for (const tabDef of TAB_DEFS) {
      tabIdByKey[tabDef.key] = await findOrCreateFootwearTab(
        footwearTabModel,
        tabDef.name,
        tabDef.key,
        tabDef.displayOrder,
      );
    }

    const menId = await findOrCreateGender(genderModel, 'Men', 'men');
    const womenId = await findOrCreateGender(genderModel, 'Women', 'women');

    const menFootwearCategoryId = await findOrCreateCategory(categoryModel, 'Footwear', 'footwear', menId);
    const womenFootwearCategoryId = await findOrCreateCategory(categoryModel, 'Footwear', 'footwear', womenId);

    const mensProducts: SeedProduct[] = [
      {
        sku: 'FW-MEN-BUDGET-001',
        name: "Men's Everyday Runner",
        price: 1499,
        badge: ProductBadge.BUDGET_PICK,
        image: IMAGE.sneaker1,
        offer: { name: 'Men\'s Shoes Under ₹1,500', footwearTab: 'mensShoes', offerType: OfferType.PERCENTAGE_OFF, rules: {} },
      },
      {
        sku: 'FW-MEN-LUXURY-001',
        name: 'Aria Luxury Sneaker',
        price: 8999,
        badge: ProductBadge.LUXURY,
        image: IMAGE.sneaker2,
        offer: { name: 'Luxury Shoes', footwearTab: 'mensShoes', offerType: OfferType.PERCENTAGE_OFF, rules: {} },
      },
      {
        sku: 'FW-MEN-PREMIUM-001',
        name: 'Retro Premium Sneaker',
        price: 12795,
        badge: ProductBadge.PREMIUM,
        image: IMAGE.sneaker3,
        offer: {
          name: 'Premium Sneaker Sale',
          footwearTab: 'mensShoes',
          offerType: OfferType.PERCENTAGE_OFF,
          rules: { discountPercentage: 50 },
        },
      },
      {
        sku: 'FW-MEN-CASUAL-001',
        name: 'Comfort Slides',
        price: 1999,
        badge: ProductBadge.CASUAL,
        image: IMAGE.slides,
        offer: { name: 'Slides & Crocs', footwearTab: 'mensShoes', offerType: OfferType.PERCENTAGE_OFF, rules: {} },
      },
    ];

    const dealsProducts: SeedProduct[] = [
      {
        sku: 'FW-DEAL-BESTVALUE-001',
        name: 'Trail Runner Low',
        price: 6000,
        badge: ProductBadge.BEST_VALUE,
        image: IMAGE.trailRunner,
        offer: {
          name: 'Pick Any 1 or Buy 3 & Save',
          footwearTab: 'dealsCombos',
          offerType: OfferType.BUNDLE_DISCOUNT,
          rules: { minQuantity: 3, bundlePrice: 15000 },
        },
      },
      {
        sku: 'FW-DEAL-COMBO-001',
        name: 'Court Classic High-Top',
        price: 3500,
        badge: ProductBadge.COMBO,
        image: IMAGE.hightop,
        offer: {
          name: 'Any 3 Pairs for ₹10,000',
          footwearTab: 'dealsCombos',
          offerType: OfferType.BUNDLE_DISCOUNT,
          rules: { minQuantity: 3, bundlePrice: 10000 },
        },
      },
      {
        sku: 'FW-DEAL-UNDER1K-001',
        name: 'Budget Canvas Sneaker',
        price: 999,
        badge: ProductBadge.UNDER_1K,
        image: IMAGE.canvas,
        offer: { name: 'Shoes Under ₹1,000', footwearTab: 'dealsCombos', offerType: OfferType.PERCENTAGE_OFF, rules: {} },
      },
    ];

    const formalProducts: SeedProduct[] = [
      {
        sku: 'FW-FORMAL-SALE-001',
        name: 'Oxford Leather Formal Shoes',
        price: 3499,
        badge: ProductBadge.SALE,
        image: IMAGE.oxford,
        offer: {
          name: 'Oxford Formal Shoes Sale',
          footwearTab: 'formal',
          offerType: OfferType.PERCENTAGE_OFF,
          rules: { discountPercentage: 20 },
        },
      },
      {
        sku: 'FW-FORMAL-NEW-001',
        name: 'Classic Derby Formal Shoes',
        price: 2999,
        badge: ProductBadge.NEW,
        image: IMAGE.derby,
        offer: { name: 'Classic Derby Shoes', footwearTab: 'formal', offerType: OfferType.PERCENTAGE_OFF, rules: {} },
      },
      {
        sku: 'FW-FORMAL-TRENDING-001',
        name: 'Monk Strap Leather Shoes',
        price: 4499,
        badge: ProductBadge.TRENDING,
        image: IMAGE.monkStrap,
        offer: { name: 'Monk Strap Shoes', footwearTab: 'formal', offerType: OfferType.PERCENTAGE_OFF, rules: {} },
      },
    ];

    const womenProducts: SeedProduct[] = [
      {
        sku: 'FW-WOMEN-NEW-001',
        name: "Women's Canvas Sneaker",
        price: 1799,
        badge: ProductBadge.NEW,
        image: IMAGE.womenSneaker,
        offer: { name: "Women's Canvas Sneaker", footwearTab: 'womenMore', offerType: OfferType.PERCENTAGE_OFF, rules: {} },
      },
      {
        sku: 'FW-WOMEN-OFFER-001',
        name: 'Heeled Sandals',
        price: 2499,
        badge: ProductBadge.OFFER,
        image: IMAGE.sandals,
        offer: {
          name: 'Heeled Sandals Offer',
          footwearTab: 'womenMore',
          offerType: OfferType.PERCENTAGE_OFF,
          rules: { discountPercentage: 30 },
        },
      },
      {
        sku: 'FW-WOMEN-UNDER1K-001',
        name: "Women's Slides",
        price: 999,
        badge: ProductBadge.UNDER_1K,
        image: IMAGE.womenSlides,
        offer: { name: "Women's Slides", footwearTab: 'womenMore', offerType: OfferType.PERCENTAGE_OFF, rules: {} },
      },
    ];

    const groups: { products: SeedProduct[]; genderId: Types.ObjectId; categoryId: Types.ObjectId }[] = [
      { products: mensProducts, genderId: menId, categoryId: menFootwearCategoryId },
      { products: dealsProducts, genderId: menId, categoryId: menFootwearCategoryId },
      { products: formalProducts, genderId: menId, categoryId: menFootwearCategoryId },
      { products: womenProducts, genderId: womenId, categoryId: womenFootwearCategoryId },
    ];

    const now = new Date();
    const startDate = now;
    const endDate = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    let createdCount = 0;
    let skippedCount = 0;

    for (const group of groups) {
      for (const seedProduct of group.products) {
        const existingProduct = await productModel.findOne({ sku: seedProduct.sku });
        let productId: Types.ObjectId;

        if (existingProduct) {
          productId = existingProduct._id as Types.ObjectId;
          skippedCount++;
        } else {
          const product = await new productModel({
            name: seedProduct.name,
            sku: seedProduct.sku,
            genderId: group.genderId,
            categoryId: group.categoryId,
            stock: 50,
            price: seedProduct.price,
            images: [seedProduct.image],
            isActive: true,
            badge: seedProduct.badge,
          }).save();
          productId = product._id as Types.ObjectId;
          createdCount++;
        }

        const existingOffer = await offerModel.findOne({ name: seedProduct.offer.name });
        const tabId = tabIdByKey[seedProduct.offer.footwearTab];
        if (!existingOffer) {
          await new offerModel({
            name: seedProduct.offer.name,
            description: `${seedProduct.name} — Footwear section demo offer`,
            offerType: seedProduct.offer.offerType,
            rules: seedProduct.offer.rules,
            productIds: [productId],
            startDate,
            endDate,
            isActive: true,
            priority: 1,
            footwearTabId: tabId,
          }).save();
        } else {
          // Re-sync every run (updateOne, not load-then-save, so legacy docs missing `rules`
          // due to Mongoose's minimize:true stripping empty embedded objects don't fail
          // required-field validation) — keeps demo data consistent even after manual edits
          // made while testing the admin form, and drops the pre-migration `footwearTab` field.
          await offerModel.updateOne(
            { _id: existingOffer._id },
            {
              $set: {
                rules: seedProduct.offer.rules,
                productIds: [productId],
                footwearTabId: tabId,
              },
              $unset: { footwearTab: 1 },
            },
          );
        }
      }
    }

    logger.log(`Footwear seed complete. Products created: ${createdCount}, already existed: ${skippedCount}.`);
  } catch (error) {
    logger.error('Error seeding footwear data:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
