import Link from 'next/link';

export default function ShippingPolicyPage() {
  return (
    <div className="bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Shipping Policy</h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: January 31, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Methods & Delivery</h2>
              <p className="text-gray-600 mb-4">
                At Narayan Enterprises, we are committed to delivering your orders promptly and securely. We partner with reliable courier services to ensure your products reach you in perfect condition.
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Standard Delivery: 5-7 business days</li>
                <li>Express Delivery: 2-3 business days (where available)</li>
                <li>Same Day Delivery: Available in select Delhi NCR areas</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Charges</h2>
              <p className="text-gray-600 mb-4">
                Shipping charges are calculated based on your order value and delivery location:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Orders above ₹999: FREE shipping across India</li>
                <li>Orders below ₹999: Flat ₹99 shipping charge</li>
                <li>Express Delivery: Additional charges may apply</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Processing</h2>
              <p className="text-gray-600 mb-4">
                Orders are processed within 24-48 hours of placement. You will receive a confirmation email with tracking details once your order is dispatched.
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Order confirmation sent immediately after purchase</li>
                <li>Dispatch notification with tracking number within 48 hours</li>
                <li>Real-time tracking available through our website</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Areas</h2>
              <p className="text-gray-600 mb-4">
                We currently ship to all major cities and towns across India. For remote locations, delivery may take an additional 2-3 business days.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Delivery Attempt</h2>
              <p className="text-gray-600 mb-4">
                Our courier partners will make up to 3 delivery attempts. If delivery fails after all attempts, the package will be returned to our warehouse, and you will be contacted for rescheduling or refund processing.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Important Notes</h2>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Please ensure someone is available to receive the package at the delivery address</li>
                <li>Verify the package contents at the time of delivery</li>
                <li>Report any damage or discrepancy immediately to our customer support</li>
                <li>Keep the original packaging until you&apos;re satisfied with your purchase</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-600 mb-4">
                For any shipping-related queries, please contact us:
              </p>
              <ul className="list-none text-gray-600 space-y-2">
                <li><strong>Email:</strong> narayanenterpriseofficials@gmail.com</li>
                <li><strong>WhatsApp:</strong> +91 7303946369 / +91 7303825311</li>
                <li><strong>Address:</strong> g/f plot kh no 266, Mahadev Road, Dhul Siras, Dwarka Sector 29, Delhi 110077</li>
              </ul>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link href="/" className="text-blue-600 hover:text-blue-800 transition-colors">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
