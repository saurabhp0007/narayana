/** Base pulse block — compose with width/height utility classes. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded ${className}`} />;
}

/** Grid of product-card-shaped skeletons, matching ProductCard's aspect-[4/5] image + two text lines. */
export function ProductGridSkeleton({
  count = 10,
  className = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {[...Array(count)].map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[4/5] rounded-lg mb-3" />
          <Skeleton className="h-3 mb-2" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

/** Row-shaped skeleton for cart/wishlist/order list items. */
export function RowSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="flex gap-4 border border-gray-200 rounded-lg p-4">
          <Skeleton className="w-20 h-24 shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
