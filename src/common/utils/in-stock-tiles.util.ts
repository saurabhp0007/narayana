import { Model, Types } from 'mongoose';
import { Product } from '../../modules/product/schemas/product.schema';

// Storefront tiles that would open an empty listing are hidden: keep only tiles mapping
// at least one active, in-stock product.
export async function withInStockProducts<T extends { productIds: Types.ObjectId[] }>(
  productModel: Model<Product>,
  tiles: T[],
): Promise<T[]> {
  const ids = tiles.flatMap((tile) => tile.productIds);
  if (!ids.length) return [];

  const available = await productModel.distinct('_id', { _id: { $in: ids }, isActive: true, stock: { $gt: 0 } });
  const availableIds = new Set(available.map(String));
  return tiles.filter((tile) => tile.productIds.some((id) => availableIds.has(String(id))));
}
