import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>

          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">
              Last updated: January 31, 2025
            </p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Agreement to Terms</h2>
              <p className="text-gray-600">
                By accessing and using the Narayan Enterprises website (www.narayanenterprise.in), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. We reserve the right to modify these terms at any time, and your continued use of the website constitutes acceptance of any changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Eligibility</h2>
              <p className="text-gray-600">
                You must be of legal age (18 years or older) to use this website and make purchases. By using our services, you represent that you are at least 18 years old and have the legal capacity to enter into binding agreements.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">User Obligations</h2>
              <p className="text-gray-600 mb-4">
                When using our website, you agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized account use</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Use the website only for lawful purposes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Prohibited Activities</h2>
              <p className="text-gray-600 mb-4">
                You are prohibited from:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Using the site for any illegal purpose</li>
                <li>Harassing, abusing, or threatening others</li>
                <li>Discriminating against others based on any protected characteristics</li>
                <li>Transmitting viruses, malware, or malicious code</li>
                <li>Scraping, data mining, or unauthorized data collection</li>
                <li>Phishing or spamming</li>
                <li>Circumventing security features</li>
                <li>Reselling our services without permission</li>
                <li>Infringing on intellectual property rights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Products and Pricing</h2>
              <p className="text-gray-600 mb-4">
                All products are offered &quot;as is&quot; without warranties of merchantability or fitness for a particular purpose. We reserve the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Refuse any order at our discretion</li>
                <li>Limit quantities of products sold</li>
                <li>Discontinue any product without notice</li>
                <li>Change prices without prior notice</li>
                <li>Correct pricing errors</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Acceptance</h2>
              <p className="text-gray-600">
                Your receipt of an order confirmation does not constitute acceptance of your order. We reserve the right to accept or decline your order for any reason, including product availability, errors in product or pricing information, or other reasons.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Intellectual Property</h2>
              <p className="text-gray-600">
                All content on this website, including text, graphics, logos, images, and software, is the property of Narayan Enterprises and is protected by copyright and intellectual property laws. You may not reproduce, distribute, modify, or create derivative works without our express written consent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">User Content</h2>
              <p className="text-gray-600 mb-4">
                By submitting content (reviews, comments, feedback) to our website, you grant us a non-exclusive, royalty-free, perpetual right to use, reproduce, and publish such content. You warrant that:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Your content does not violate third-party rights</li>
                <li>Your content is truthful and accurate</li>
                <li>Your content does not contain illegal or harmful material</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Limitation of Liability</h2>
              <div className="bg-gray-50 border-l-4 border-gray-400 p-4 mb-4">
                <p className="text-gray-700 font-medium">
                  Narayan Enterprises shall have no liability arising from your use of any of the Service for damages including lost profits or data loss.
                </p>
              </div>
              <p className="text-gray-600">
                We are not responsible for:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Service interruptions or errors</li>
                <li>Third-party links, products, or services</li>
                <li>Indirect, incidental, or consequential damages</li>
                <li>Loss of data or profits</li>
                <li>Damages resulting from unauthorized access</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Indemnification</h2>
              <p className="text-gray-600">
                You agree to indemnify and hold harmless Narayan Enterprises, its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the website or violation of these terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Termination</h2>
              <p className="text-gray-600">
                We may terminate or suspend your account and access to our services immediately, without prior notice, for any reason, including breach of these Terms of Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Governing Law</h2>
              <p className="text-gray-600">
                These Terms of Service are governed by and construed in accordance with the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in Delhi, India.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-600 mb-4">
                For questions about these Terms of Service, please contact us:
              </p>
              <ul className="list-none text-gray-600 space-y-2">
                <li><strong>Email:</strong> narayanenterpriseofficials@gmail.com</li>
                <li><strong>Address:</strong> Dwarka, Sector 29, Delhi 110077</li>
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
