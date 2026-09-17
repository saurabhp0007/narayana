'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { paymentApi } from '@/lib/api';
import { printOrderReceipt } from '@/lib/receipt';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useGuestStore } from '@/store/guestStore';
import { Order } from '@/types';

type View = 'checking' | 'success' | 'failed' | 'unknown';

function StatusInner() {
  const txnid = useSearchParams().get('txnid') || '';
  const { userType } = useAuthStore();
  const { guestId } = useGuestStore();
  const clearCart = useCartStore((s) => s.clearCart);

  const [view, setView] = useState<View>('checking');
  const [orderId, setOrderId] = useState('');
  const [receipt, setReceipt] = useState<{
    order: Order;
    paymentMode?: string;
    bankRefNum?: string;
  } | null>(null);
  const cleared = useRef(false);

  useEffect(() => {
    if (!txnid) {
      setView('unknown');
      return;
    }

    let active = true;
    let attempts = 0;
    const maxAttempts = 20;

    const resolve = async (status: string, order: string) => {
      if (!active) return;
      setOrderId(order);
      if (status === 'success') {
        if (!cleared.current) {
          cleared.current = true;
          try {
            await clearCart(userType === 'user' ? undefined : guestId);
          } catch {
            /* server cart is already cleared on payment success */
          }
          try {
            const { data } = await paymentApi.getReceipt(txnid);
            setReceipt({
              order: data.order,
              paymentMode: data.paymentMode,
              bankRefNum: data.bankRefNum,
            });
          } catch {
            /* receipt is optional */
          }
        }
        setView('success');
      } else if (status === 'failure' || status === 'cancelled') {
        setView('failed');
      } else if (attempts >= maxAttempts) {
        setView('unknown');
      }
    };

    const poll = async () => {
      attempts += 1;
      try {
        const { data } = await paymentApi.getStatus(txnid);
        await resolve(data.status, data.orderId);
        if (
          active &&
          data.status !== 'success' &&
          data.status !== 'failure' &&
          data.status !== 'cancelled' &&
          attempts < maxAttempts
        ) {
          setTimeout(poll, 2500);
        }
      } catch {
        if (active && attempts < maxAttempts) setTimeout(poll, 2500);
        else if (active) setView('unknown');
      }
    };

    poll();
    return () => {
      active = false;
    };
  }, [txnid, clearCart, userType, guestId]);

  return (
    <div className="bg-white min-h-[60vh]">
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        {view === 'checking' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-gray-900 border-t-transparent mx-auto" />
            <h1 className="mt-6 text-xl font-semibold text-gray-900">Confirming your payment…</h1>
            <p className="mt-2 text-sm text-gray-500">This can take a few seconds. Please don’t close this page.</p>
          </>
        )}

        {view === 'success' && (
          <>
            <div className="mx-auto h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="mt-6 text-xl font-semibold text-gray-900">Payment successful</h1>
            {orderId && <p className="mt-2 text-sm text-gray-600">Order ID: {orderId}</p>}
            <p className="mt-1 text-sm text-gray-500">A confirmation email is on its way.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {receipt && (
                <button
                  onClick={() =>
                    printOrderReceipt(receipt.order, {
                      txnid,
                      paymentMode: receipt.paymentMode,
                      bankRefNum: receipt.bankRefNum,
                    })
                  }
                  className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800"
                >
                  Print Receipt
                </button>
              )}
              <Link href="/orders" className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50">
                View Orders
              </Link>
              <Link href="/" className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50">
                Continue Shopping
              </Link>
            </div>
          </>
        )}

        {view === 'failed' && (
          <>
            <div className="mx-auto h-14 w-14 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="mt-6 text-xl font-semibold text-gray-900">Payment not completed</h1>
            <p className="mt-2 text-sm text-gray-500">
              You were not charged. Your cart is still saved — you can try again.
            </p>
            <div className="mt-6">
              <Link href="/checkout" className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800">
                Back to Checkout
              </Link>
            </div>
          </>
        )}

        {view === 'unknown' && (
          <>
            <h1 className="mt-6 text-xl font-semibold text-gray-900">We’re still verifying your payment</h1>
            <p className="mt-2 text-sm text-gray-500">
              If money was debited, your order will be confirmed shortly and you’ll get an email. You can check your
              orders in a few minutes.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/orders" className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-gray-800">
                View Orders
              </Link>
              <Link href="/checkout" className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md hover:bg-gray-50">
                Back to Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <StatusInner />
    </Suspense>
  );
}
