import Link from 'next/link';

export default function ReturnRefundPolicyPage() {
  return (
    <div className="bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Return & Refund Policy</h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: January 31, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">No Refunds Policy</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <p className="text-yellow-800 font-medium">
                  We do not offer any refunds under any circumstances. All sales are final.
                </p>
              </div>
              <p className="text-gray-600">
                We do not accept returns of any item once delivered. However, we offer an exchange policy under specific conditions outlined below.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Exchange Policy</h2>
              <p className="text-gray-600 mb-4">
                We offer exchanges as an alternative to refunds. Please review the following eligibility requirements carefully:
              </p>

              <h3 className="text-lg font-medium text-gray-900 mb-3">Eligibility Requirements:</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Exchange requests must be made <strong>within 1 day (24 hours)</strong> of receiving the parcel</li>
                <li>Items must be completely unused and in original condition</li>
                <li>Original packaging, tags, labels, and accessories must remain intact</li>
                <li>No used, worn, washed, or altered items qualify for exchange</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Required Video Evidence</h2>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                <p className="text-blue-800 font-medium">
                  IMPORTANT: Video documentation is mandatory for all exchange requests.
                </p>
              </div>
              <p className="text-gray-600 mb-4">
                Before opening the package, you must record a 360-degree video showing:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>The unopened package from all sides</li>
                <li>The sealed packaging condition</li>
                <li>The outer box condition</li>
                <li>Serial numbers and labels visible on the package</li>
              </ul>
              <p className="text-gray-600 mt-4 font-medium">
                Failure to provide this documentation will disqualify your exchange request.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Exchange Process</h2>
              <ol className="list-decimal pl-6 text-gray-600 space-y-3">
                <li>Contact our support team within 24 hours of delivery</li>
                <li>Provide your order number and reason for exchange</li>
                <li>Submit the video evidence of the unopened package</li>
                <li>Wait for verification from our team</li>
                <li>Ship the item back in its original condition once approved</li>
                <li>Receive your replacement after inspection is complete</li>
              </ol>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Non-Exchangeable Items</h2>
              <p className="text-gray-600 mb-4">
                The following items cannot be exchanged:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Items showing any signs of use or wear</li>
                <li>Items with damage not documented in the unboxing video</li>
                <li>Items with missing packaging, tags, or accessories</li>
                <li>Requests submitted after the 24-hour window</li>
                <li>Items without proper video documentation</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Shipping Costs for Exchange</h2>
              <p className="text-gray-600">
                Customers typically bear return and replacement shipping costs, unless the defect resulted from Narayan Enterprises&apos; error (such as sending the wrong item or a factory-defective product).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us for Exchange</h2>
              <p className="text-gray-600 mb-4">
                To initiate an exchange request, contact us immediately:
              </p>
              <ul className="list-none text-gray-600 space-y-2">
                <li><strong>Email:</strong> narayanenterpriseofficials@gmail.com</li>
                <li><strong>WhatsApp:</strong> +91 7303946369 / +91 7303825311</li>
                <li><strong>Store Address:</strong> Dwarka Sector 29, Delhi 110077</li>
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
