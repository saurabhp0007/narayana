'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { reviewApi } from '@/lib/api';
import { Review } from '@/types';

function StarRating({ rating, className = 'w-4 h-4' }: { rating: number; className?: string }) {
  const full = Math.round(rating);
  return (
    <div className="flex text-yellow-400" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={className} fill={i <= full ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.447a1 1 0 00-.364 1.118l1.287 3.958c.3.922-.755 1.688-1.538 1.118l-3.367-2.447a1 1 0 00-1.176 0l-3.368 2.447c-.783.57-1.838-.196-1.538-1.118l1.287-3.958a1 1 0 00-.364-1.118L2.02 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.958z" />
        </svg>
      ))}
    </div>
  );
}

// A 3D flip-slide: the card rotates in on its Y-axis from the direction navigated,
// combined with a horizontal slide and fade, instead of a flat cross-fade or slide.
const cardVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 120 : -120,
    rotateY: direction > 0 ? 35 : -35,
    scale: 0.94,
  }),
  center: { opacity: 1, x: 0, rotateY: 0, scale: 1 },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction < 0 ? 120 : -120,
    rotateY: direction < 0 ? -35 : 35,
    scale: 0.94,
  }),
};

export default function ReviewsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    reviewApi
      .getHomepage(8)
      .then((res) => setReviews(res.data || []))
      .catch((err) => console.error('Failed to load reviews:', err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading || reviews.length === 0) return null;

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  // Two-at-a-time, but the window slides by one review per click (not by two),
  // so consecutive clicks overlap by one card instead of jumping to a disjoint pair.
  // Circular indexing (mod length) means it wraps cleanly at either end.
  const visible = [reviews[index % reviews.length], reviews[(index + 1) % reviews.length]];

  const goToPrev = () => {
    setDirection(-1);
    setIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const goToNext = () => {
    setDirection(1);
    setIndex((prev) => (prev + 1) % reviews.length);
  };

  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-2">Customer Reviews</p>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">What Our Customers Say</h2>
          <div className="flex items-center justify-center gap-2">
            <StarRating rating={averageRating} />
            <span className="text-lg font-semibold text-gray-900">{averageRating.toFixed(1)}</span>
            <span className="text-sm text-gray-500">Based on {reviews.length}+ reviews</span>
          </div>
        </div>

        <div className="relative max-w-4xl mx-auto overflow-hidden" style={{ perspective: 1200 }}>
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.div
              key={index}
              custom={direction}
              variants={cardVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              style={{ transformStyle: 'preserve-3d' }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {visible.map((review) => (
                <div key={review._id} className="relative border border-gray-200 rounded-xl p-6 md:p-8 bg-white shadow-sm overflow-hidden">
                  <span className="absolute -top-3 left-5 font-display text-accent-100 text-7xl select-none leading-none" aria-hidden="true">
                    &ldquo;
                  </span>

                  <div className="relative flex items-center justify-between mb-4">
                    <StarRating rating={review.rating} className="w-4 h-4" />
                    <span className="text-xs text-gray-500">{review.rating.toFixed(1)}</span>
                  </div>

                  {review.verifiedPurchase && (
                    <div className="relative flex items-center gap-1 text-xs text-green-600 mb-3">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Verified Purchase
                    </div>
                  )}

                  <p className="relative text-sm text-gray-700 mb-4">&ldquo;{review.text}&rdquo;</p>

                  {review.productLabel && (
                    <span className="relative inline-block text-xs px-2 py-1 bg-gray-100 rounded text-gray-600 mb-3">
                      {review.productLabel}
                    </span>
                  )}

                  <div className="relative flex items-center gap-2 mt-2">
                    <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-xs font-semibold text-white">
                      {review.customerName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{review.customerName}</p>
                      <p className="text-xs text-gray-500">{review.location}</p>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {reviews.length > 2 && (
          <div className="flex items-center justify-center gap-6 mt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={goToPrev}
              aria-label="Previous review"
              className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </motion.button>

            <div className="flex items-center gap-1.5">
              {reviews.map((r, i) => (
                <button
                  key={r._id}
                  onClick={() => {
                    setDirection(i > index ? 1 : -1);
                    setIndex(i);
                  }}
                  aria-label={`Go to review ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-gray-900' : 'w-1.5 bg-gray-300'}`}
                />
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={goToNext}
              aria-label="Next review"
              className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </motion.button>
          </div>
        )}
      </div>
    </section>
  );
}
