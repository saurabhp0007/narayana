'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CareersPage() {
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  const positions = [
    {
      id: 'sales-associate',
      title: 'Sales Associate',
      type: 'Full-time',
      location: 'Dwarka, Delhi',
      description: 'Join our retail team to provide exceptional customer service and help customers find their perfect style.',
      requirements: [
        'Excellent communication skills',
        'Passion for fashion and customer service',
        'Ability to work in a fast-paced environment',
        'Basic computer knowledge',
        'Fluency in Hindi and English',
      ],
    },
    {
      id: 'store-manager',
      title: 'Store Manager',
      type: 'Full-time',
      location: 'Dwarka, Delhi',
      description: 'Lead our retail operations and team to deliver outstanding shopping experiences.',
      requirements: [
        '3+ years of retail management experience',
        'Strong leadership and team management skills',
        'Inventory management expertise',
        'Sales target achievement track record',
        'Problem-solving abilities',
      ],
    },
    {
      id: 'digital-marketing',
      title: 'Digital Marketing Executive',
      type: 'Full-time',
      location: 'Dwarka, Delhi',
      description: 'Drive our online presence and help grow our digital customer base.',
      requirements: [
        'Experience with social media marketing',
        'Knowledge of SEO and content marketing',
        'Creative thinking and design skills',
        'Familiarity with e-commerce platforms',
        'Data analysis capabilities',
      ],
    },
    {
      id: 'warehouse-staff',
      title: 'Warehouse Staff',
      type: 'Full-time',
      location: 'Dwarka, Delhi',
      description: 'Help manage our inventory and ensure efficient order fulfillment.',
      requirements: [
        'Physical fitness for handling inventory',
        'Attention to detail',
        'Basic organizational skills',
        'Reliable and punctual',
        'Team player attitude',
      ],
    },
  ];

  return (
    <div className="bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-sm p-8 mb-8 text-white">
          <h1 className="text-4xl font-bold mb-4">Join Our Team</h1>
          <p className="text-xl opacity-90">
            Build your career with Narayan Enterprises and be part of our growing fashion retail family.
          </p>
        </div>

        {/* Why Work With Us */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Why Work With Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Growth Opportunities</h3>
              <p className="text-gray-600 text-sm">Advance your career with continuous learning and development.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Supportive Team</h3>
              <p className="text-gray-600 text-sm">Work with passionate colleagues in a collaborative environment.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Competitive Pay</h3>
              <p className="text-gray-600 text-sm">Enjoy competitive salaries and performance incentives.</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Fashion Industry</h3>
              <p className="text-gray-600 text-sm">Work with premium brands and stay ahead of fashion trends.</p>
            </div>
          </div>
        </div>

        {/* Open Positions */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Open Positions</h2>
          <div className="space-y-4">
            {positions.map((position) => (
              <div key={position.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setSelectedPosition(selectedPosition === position.id ? null : position.id)}
                  className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-900">{position.title}</h3>
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {position.type}
                      </span>
                      <span className="text-sm text-gray-600 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {position.location}
                      </span>
                    </div>
                  </div>
                  <svg
                    className={`w-6 h-6 text-gray-400 transform transition-transform ${
                      selectedPosition === position.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {selectedPosition === position.id && (
                  <div className="px-6 pb-6 border-t border-gray-200 pt-4">
                    <p className="text-gray-600 mb-4">{position.description}</p>
                    <h4 className="font-medium text-gray-900 mb-3">Requirements:</h4>
                    <ul className="list-disc pl-6 text-gray-600 space-y-2 mb-6">
                      {position.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                    <a
                      href={`mailto:narayanenterpriseofficials@gmail.com?subject=Application for ${position.title}`}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Apply Now
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* General Application */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Don&apos;t See Your Role?</h2>
          <p className="text-gray-600 mb-6">
            We&apos;re always looking for talented individuals to join our team. Send us your resume and we&apos;ll keep you in mind for future opportunities.
          </p>
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">How to Apply</h3>
            <ol className="list-decimal pl-6 text-gray-600 space-y-3">
              <li>Prepare your updated resume/CV</li>
              <li>Write a brief cover letter explaining why you want to join Narayan Enterprises</li>
              <li>
                Send your application to:{' '}
                <a
                  href="mailto:narayanenterpriseofficials@gmail.com?subject=General Application"
                  className="text-blue-600 hover:text-blue-800"
                >
                  narayanenterpriseofficials@gmail.com
                </a>
              </li>
              <li>We&apos;ll review your application and contact you if there&apos;s a suitable opportunity</li>
            </ol>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <a
              href="mailto:narayanenterpriseofficials@gmail.com?subject=General Application"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              Send Application
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
