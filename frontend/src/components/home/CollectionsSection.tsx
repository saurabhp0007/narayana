'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { collectionApi } from '@/lib/api';
import { Collection, Product } from '@/types';
import { productBadgeStyles, productBadgeLabels } from '@/lib/productBadge';
import { Skeleton } from '@/components/common/Skeleton';

function CollectionRowSkeleton() {
  return (
    <div className="mb-1 last:mb-0">
      <Skeleton className="w-full aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/9] rounded-none" />
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-px bg-gray-100">
        {[...Array(7)].map((_, i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-none" />
        ))}
      </div>
    </div>
  );
}

function ProductTile({ product }: { product: Product }) {
  const price = product.discountPrice || product.price;

  return (
    <Link href={`/products/${product._id}`} className="group relative block aspect-[4/5] overflow-hidden bg-gray-100">
      {product.images && product.images.length > 0 ? (
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 14vw"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {product.badge && (
        <span
          className={`absolute top-2 left-2 text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded font-medium ${
            productBadgeStyles[product.badge] || 'bg-gray-900'
          }`}
        >
          {productBadgeLabels[product.badge] || product.badge}
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent px-2.5 pt-8 pb-2.5">
        <h3 className="text-xs sm:text-sm font-medium text-white line-clamp-1">{product.name}</h3>
        <p className="text-xs sm:text-sm font-semibold text-white">₹{price.toFixed(0)}</p>
      </div>
    </Link>
  );
}

function CollectionRow({ collection }: { collection: Collection }) {
  const products = (collection.productIds as Product[]).filter((p) => typeof p === 'object');
  if (products.length === 0) return null;

  return (
    <div className="mb-1 last:mb-0">
      {collection.bannerImage && (
        <div className="relative w-full aspect-[4/5] sm:aspect-[16/9] md:aspect-[21/9] overflow-hidden">
          <Image src={collection.bannerImage} alt={collection.name} fill className="object-cover" sizes="100vw" />
        </div>
      )}
      <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-7 gap-px bg-gray-100">
        {products.map((product) => (
          <ProductTile key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
}

export default function CollectionsSection() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    collectionApi
      .getActive()
      .then((res) => setCollections(res.data || []))
      .catch((err) => console.error('Failed to load collections:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const visibleCollections = collections.filter((c) => (c.productIds as Product[])?.length > 0);

  if (!isLoading && visibleCollections.length === 0) return null;

  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto">
        {isLoading ? (
          <div className="space-y-8">
            <CollectionRowSkeleton />
          </div>
        ) : (
          <div className="space-y-8">
            {visibleCollections.map((collection) => (
              <CollectionRow key={collection._id} collection={collection} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
