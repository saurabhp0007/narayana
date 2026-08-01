import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: January 31, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview</h2>
              <p className="text-gray-600">
                Narayan Enterprises (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) collects and processes personal information from website visitors and customers at www.narayanenterprise.in. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Information We Collect</h2>

              <h3 className="text-lg font-medium text-gray-900 mb-3">Direct Collection</h3>
              <p className="text-gray-600 mb-4">
                We collect information you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Contact details (name, address, phone number, email)</li>
                <li>Order information (billing/shipping addresses, payment confirmation)</li>
                <li>Account credentials and security questions</li>
                <li>Customer support communications</li>
                <li>Product reviews and feedback</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mb-3">Automatic Collection</h3>
              <p className="text-gray-600 mb-4">
                We automatically collect certain information when you visit our website:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-4">
                <li>Device information (type, operating system, browser)</li>
                <li>IP address and location data</li>
                <li>Pages visited and time spent on site</li>
                <li>Referring URLs and search terms</li>
                <li>Interaction patterns and preferences</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mb-3">Third-Party Sources</h3>
              <p className="text-gray-600">
                We may receive information from vendors, payment processors, and service providers to enhance our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">How We Use Your Information</h2>
              <p className="text-gray-600 mb-4">
                We use collected information to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Fulfill orders and process payments</li>
                <li>Send transactional notifications (order confirmations, shipping updates)</li>
                <li>Manage customer accounts</li>
                <li>Send marketing, advertising, and promotional communications</li>
                <li>Detect and prevent fraud</li>
                <li>Improve our services and website functionality</li>
                <li>Respond to customer inquiries and support requests</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Cookie Policy</h2>
              <p className="text-gray-600 mb-4">
                We use cookies and similar tracking technologies to collect information about your browsing activities. Most browsers automatically accept cookies by default, but you can choose to set your browser to remove or reject cookies through your browser controls.
              </p>
              <div className="bg-gray-50 border-l-4 border-gray-400 p-4">
                <p className="text-gray-700">
                  <strong>Note:</strong> Blocking cookies may negatively impact website functionality and your user experience.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Information Sharing</h2>
              <p className="text-gray-600 mb-4">
                We may share your personal information with:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Service vendors and contractors:</strong> Who help us operate our business</li>
                <li><strong>Business and marketing partners:</strong> For promotional purposes</li>
                <li><strong>Affiliates:</strong> Within our corporate family</li>
                <li><strong>Legal authorities:</strong> When required by law or to protect our rights</li>
                <li><strong>Business transactions:</strong> In connection with mergers, acquisitions, or bankruptcy</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Rights</h2>
              <p className="text-gray-600 mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Right to access:</strong> Request copies of your personal data</li>
                <li><strong>Right to deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Right to correction:</strong> Request correction of inaccurate data</li>
                <li><strong>Right to data portability:</strong> Request transfer of your data</li>
                <li><strong>Right to restrict processing:</strong> Request limitation of data processing</li>
                <li><strong>Right to withdraw consent:</strong> Withdraw previously given consent</li>
              </ul>
              <p className="text-gray-600 mt-4">
                To exercise these rights, please contact us using the information below.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Security</h2>
              <p className="text-gray-600">
                We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Children&apos;s Privacy</h2>
              <p className="text-gray-600">
                Our services are not intended to be used by children, and we do not knowingly collect any personal information about children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
              <p className="text-gray-600">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-600 mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <ul className="list-none text-gray-600 space-y-2">
                <li><strong>Email:</strong> narayanenterpriseofficials@gmail.com</li>
                <li><strong>Address:</strong> Narayan Enterprises Clothing, g/f plot kh no 266, Mahadev Road, Dhul Siras, Dwarka Sector 29, 110077 Delhi</li>
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
