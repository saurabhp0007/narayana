// Copy ported verbatim from the web frontend's static pages
// (frontend/src/app/{about,careers,contact,privacy-policy,shipping-policy,terms-of-service,return-refund-policy}/page.tsx)
// so the mobile app carries identical content, not a paraphrase.

export interface PolicySection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
  ordered?: string[];
  callout?: { tone: 'yellow' | 'blue' | 'gray'; text: string };
}

export interface PolicyContent {
  title: string;
  lastUpdated: string;
  sections: PolicySection[];
}

export const CONTACT_EMAIL = 'narayanenterpriseofficials@gmail.com';
export const WHATSAPP_NUMBERS = ['+91 7303946369', '+91 7303825311'];
export const STORE_ADDRESS = 'g/f plot at kh no 266, Mahadev Road, Dhul Siras, Dwarka Sector 29, Delhi 110077';
export const INSTAGRAM_HANDLE = '@narayan_enterprises2.0';

export const privacyPolicy: PolicyContent = {
  title: 'Privacy Policy',
  lastUpdated: 'January 31, 2025',
  sections: [
    {
      heading: 'Overview',
      paragraphs: [
        'Narayan Enterprises ("we," "our," or "us") collects and processes personal information from website visitors and customers at www.narayanenterprise.in. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.',
      ],
    },
    {
      heading: 'Information We Collect',
      paragraphs: ['We collect information you provide directly to us, including:'],
      bullets: [
        'Contact details (name, address, phone number, email)',
        'Order information (billing/shipping addresses, payment confirmation)',
        'Account credentials and security questions',
        'Customer support communications',
        'Product reviews and feedback',
        'Device information (type, operating system, browser), IP address and location data',
        'Pages visited, time spent on site, referring URLs and search terms',
      ],
    },
    {
      heading: 'How We Use Your Information',
      paragraphs: ['We use collected information to:'],
      bullets: [
        'Fulfill orders and process payments',
        'Send transactional notifications (order confirmations, shipping updates)',
        'Manage customer accounts',
        'Send marketing, advertising, and promotional communications',
        'Detect and prevent fraud',
        'Improve our services and website functionality',
        'Respond to customer inquiries and support requests',
        'Comply with legal obligations',
      ],
    },
    {
      heading: 'Cookie Policy',
      paragraphs: [
        'We use cookies and similar tracking technologies to collect information about your browsing activities. Most browsers automatically accept cookies by default, but you can choose to set your browser to remove or reject cookies through your browser controls.',
      ],
      callout: { tone: 'gray', text: 'Note: Blocking cookies may negatively impact website functionality and your user experience.' },
    },
    {
      heading: 'Information Sharing',
      paragraphs: ['We may share your personal information with:'],
      bullets: [
        'Service vendors and contractors who help us operate our business',
        'Business and marketing partners for promotional purposes',
        'Affiliates within our corporate family',
        'Legal authorities when required by law or to protect our rights',
        'Business transactions in connection with mergers, acquisitions, or bankruptcy',
      ],
    },
    {
      heading: 'Your Rights',
      paragraphs: ['Depending on your location, you may have the following rights:'],
      bullets: [
        'Right to access: Request copies of your personal data',
        'Right to deletion: Request deletion of your personal data',
        'Right to correction: Request correction of inaccurate data',
        'Right to data portability: Request transfer of your data',
        'Right to restrict processing: Request limitation of data processing',
        'Right to withdraw consent: Withdraw previously given consent',
      ],
    },
    {
      heading: 'Data Security',
      paragraphs: [
        'We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure.',
      ],
    },
    {
      heading: "Children's Privacy",
      paragraphs: [
        'Our services are not intended to be used by children, and we do not knowingly collect any personal information about children. If you believe we have collected information from a child, please contact us immediately.',
      ],
    },
    {
      heading: 'Changes to This Policy',
      paragraphs: [
        'We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.',
      ],
    },
    {
      heading: 'Contact Us',
      paragraphs: ['If you have questions about this Privacy Policy or our data practices, please contact us:'],
      bullets: [`Email: ${CONTACT_EMAIL}`, `Address: Narayan Enterprises Clothing, ${STORE_ADDRESS}`],
    },
  ],
};

export const returnRefundPolicy: PolicyContent = {
  title: 'Return & Refund Policy',
  lastUpdated: 'January 31, 2025',
  sections: [
    {
      heading: 'No Refunds Policy',
      callout: { tone: 'yellow', text: 'We do not offer any refunds under any circumstances. All sales are final.' },
      paragraphs: [
        'We do not accept returns of any item once delivered. However, we offer an exchange policy under specific conditions outlined below.',
      ],
    },
    {
      heading: 'Exchange Policy — Eligibility Requirements',
      paragraphs: ['We offer exchanges as an alternative to refunds. Please review the following eligibility requirements carefully:'],
      bullets: [
        'Exchange requests must be made within 1 day (24 hours) of receiving the parcel',
        'Items must be completely unused and in original condition',
        'Original packaging, tags, labels, and accessories must remain intact',
        'No used, worn, washed, or altered items qualify for exchange',
      ],
    },
    {
      heading: 'Required Video Evidence',
      callout: { tone: 'blue', text: 'IMPORTANT: Video documentation is mandatory for all exchange requests.' },
      paragraphs: ['Before opening the package, you must record a 360-degree video showing:'],
      bullets: [
        'The unopened package from all sides',
        'The sealed packaging condition',
        'The outer box condition',
        'Serial numbers and labels visible on the package',
      ],
    },
    {
      heading: 'Exchange Process',
      ordered: [
        'Contact our support team within 24 hours of delivery',
        'Provide your order number and reason for exchange',
        'Submit the video evidence of the unopened package',
        'Wait for verification from our team',
        'Ship the item back in its original condition once approved',
        'Receive your replacement after inspection is complete',
      ],
    },
    {
      heading: 'Non-Exchangeable Items',
      bullets: [
        'Items showing any signs of use or wear',
        'Items with damage not documented in the unboxing video',
        'Items with missing packaging, tags, or accessories',
        'Requests submitted after the 24-hour window',
        'Items without proper video documentation',
      ],
    },
    {
      heading: 'Shipping Costs for Exchange',
      paragraphs: [
        "Customers typically bear return and replacement shipping costs, unless the defect resulted from Narayan Enterprises' error (such as sending the wrong item or a factory-defective product).",
      ],
    },
    {
      heading: 'Contact Us for Exchange',
      bullets: [`Email: ${CONTACT_EMAIL}`, `WhatsApp: ${WHATSAPP_NUMBERS.join(' / ')}`, 'Store Address: Dwarka Sector 29, Delhi 110077'],
    },
  ],
};

export const shippingPolicy: PolicyContent = {
  title: 'Shipping Policy',
  lastUpdated: 'January 31, 2025',
  sections: [
    {
      heading: 'Shipping Methods & Delivery',
      paragraphs: [
        'At Narayan Enterprises, we are committed to delivering your orders promptly and securely. We partner with reliable courier services to ensure your products reach you in perfect condition.',
      ],
      bullets: [
        'Standard Delivery: 5-7 business days',
        'Express Delivery: 2-3 business days (where available)',
        'Same Day Delivery: Available in select Delhi NCR areas',
      ],
    },
    {
      heading: 'Shipping Charges',
      paragraphs: ['Shipping charges are calculated based on your order value and delivery location:'],
      bullets: [
        'Orders above ₹999: FREE shipping across India',
        'Orders below ₹999: Flat ₹99 shipping charge',
        'Express Delivery: Additional charges may apply',
      ],
    },
    {
      heading: 'Order Processing',
      paragraphs: [
        'Orders are processed within 24-48 hours of placement. You will receive a confirmation email with tracking details once your order is dispatched.',
      ],
      bullets: [
        'Order confirmation sent immediately after purchase',
        'Dispatch notification with tracking number within 48 hours',
        'Real-time tracking available through our website',
      ],
    },
    {
      heading: 'Delivery Areas',
      paragraphs: [
        'We currently ship to all major cities and towns across India. For remote locations, delivery may take an additional 2-3 business days.',
      ],
    },
    {
      heading: 'Delivery Attempt',
      paragraphs: [
        'Our courier partners will make up to 3 delivery attempts. If delivery fails after all attempts, the package will be returned to our warehouse, and you will be contacted for rescheduling or refund processing.',
      ],
    },
    {
      heading: 'Important Notes',
      bullets: [
        'Please ensure someone is available to receive the package at the delivery address',
        'Verify the package contents at the time of delivery',
        'Report any damage or discrepancy immediately to our customer support',
        "Keep the original packaging until you're satisfied with your purchase",
      ],
    },
    {
      heading: 'Contact Us',
      paragraphs: ['For any shipping-related queries, please contact us:'],
      bullets: [`Email: ${CONTACT_EMAIL}`, `WhatsApp: ${WHATSAPP_NUMBERS.join(' / ')}`, `Address: ${STORE_ADDRESS}`],
    },
  ],
};

export const termsOfService: PolicyContent = {
  title: 'Terms of Service',
  lastUpdated: 'January 31, 2025',
  sections: [
    {
      heading: 'Agreement to Terms',
      paragraphs: [
        'By accessing and using the Narayan Enterprises website (www.narayanenterprise.in), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services. We reserve the right to modify these terms at any time, and your continued use of the website constitutes acceptance of any changes.',
      ],
    },
    {
      heading: 'Eligibility',
      paragraphs: [
        'You must be of legal age (18 years or older) to use this website and make purchases. By using our services, you represent that you are at least 18 years old and have the legal capacity to enter into binding agreements.',
      ],
    },
    {
      heading: 'User Obligations',
      paragraphs: ['When using our website, you agree to:'],
      bullets: [
        'Provide accurate and complete information',
        'Maintain the security of your account credentials',
        'Notify us immediately of any unauthorized account use',
        'Comply with all applicable laws and regulations',
        'Use the website only for lawful purposes',
      ],
    },
    {
      heading: 'Prohibited Activities',
      paragraphs: ['You are prohibited from:'],
      bullets: [
        'Using the site for any illegal purpose',
        'Harassing, abusing, or threatening others',
        'Discriminating against others based on any protected characteristics',
        'Transmitting viruses, malware, or malicious code',
        'Scraping, data mining, or unauthorized data collection',
        'Phishing or spamming',
        'Circumventing security features',
        'Reselling our services without permission',
        'Infringing on intellectual property rights',
      ],
    },
    {
      heading: 'Products and Pricing',
      paragraphs: [
        'All products are offered "as is" without warranties of merchantability or fitness for a particular purpose. We reserve the right to:',
      ],
      bullets: [
        'Refuse any order at our discretion',
        'Limit quantities of products sold',
        'Discontinue any product without notice',
        'Change prices without prior notice',
        'Correct pricing errors',
      ],
    },
    {
      heading: 'Order Acceptance',
      paragraphs: [
        'Your receipt of an order confirmation does not constitute acceptance of your order. We reserve the right to accept or decline your order for any reason, including product availability, errors in product or pricing information, or other reasons.',
      ],
    },
    {
      heading: 'Intellectual Property',
      paragraphs: [
        'All content on this website, including text, graphics, logos, images, and software, is the property of Narayan Enterprises and is protected by copyright and intellectual property laws. You may not reproduce, distribute, modify, or create derivative works without our express written consent.',
      ],
    },
    {
      heading: 'User Content',
      paragraphs: [
        'By submitting content (reviews, comments, feedback) to our website, you grant us a non-exclusive, royalty-free, perpetual right to use, reproduce, and publish such content. You warrant that:',
      ],
      bullets: [
        'Your content does not violate third-party rights',
        'Your content is truthful and accurate',
        'Your content does not contain illegal or harmful material',
      ],
    },
    {
      heading: 'Limitation of Liability',
      callout: {
        tone: 'gray',
        text: 'Narayan Enterprises shall have no liability arising from your use of any of the Service for damages including lost profits or data loss.',
      },
      paragraphs: ['We are not responsible for:'],
      bullets: [
        'Service interruptions or errors',
        'Third-party links, products, or services',
        'Indirect, incidental, or consequential damages',
        'Loss of data or profits',
        'Damages resulting from unauthorized access',
      ],
    },
    {
      heading: 'Indemnification',
      paragraphs: [
        'You agree to indemnify and hold harmless Narayan Enterprises, its officers, directors, employees, and agents from any claims, damages, or expenses arising from your use of the website or violation of these terms.',
      ],
    },
    {
      heading: 'Termination',
      paragraphs: [
        'We may terminate or suspend your account and access to our services immediately, without prior notice, for any reason, including breach of these Terms of Service.',
      ],
    },
    {
      heading: 'Governing Law',
      paragraphs: [
        'These Terms of Service are governed by and construed in accordance with the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts in Delhi, India.',
      ],
    },
    {
      heading: 'Contact Information',
      paragraphs: ['For questions about these Terms of Service, please contact us:'],
      bullets: [`Email: ${CONTACT_EMAIL}`, 'Address: Dwarka, Sector 29, Delhi 110077'],
    },
  ],
};

export interface JobPosition {
  id: string;
  title: string;
  type: string;
  location: string;
  description: string;
  requirements: string[];
}

export const jobPositions: JobPosition[] = [
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

export const whyWorkWithUs = [
  { icon: 'trending-up-outline', title: 'Growth Opportunities', description: 'Advance your career with continuous learning and development.' },
  { icon: 'people-outline', title: 'Supportive Team', description: 'Work with passionate colleagues in a collaborative environment.' },
  { icon: 'cash-outline', title: 'Competitive Pay', description: 'Enjoy competitive salaries and performance incentives.' },
  { icon: 'sparkles-outline', title: 'Fashion Industry', description: 'Work with premium brands and stay ahead of fashion trends.' },
] as const;

export const whatWeOffer = [
  { icon: 'shirt-outline', title: "Men's Wear", description: 'T-shirts, shirts, bottom wear, sweatshirts, and more from renowned international brands.' },
  { icon: 'woman-outline', title: "Women's Clothing", description: 'Trendy and elegant clothing and accessories for the modern woman.' },
  { icon: 'happy-outline', title: "Kids' Apparel", description: 'Comfortable and stylish clothing for children of all ages.' },
  { icon: 'footsteps-outline', title: 'Footwear', description: 'Casual and formal shoes for all occasions, ensuring comfort and style.' },
  { icon: 'diamond-outline', title: 'Luxury Items', description: 'Premium handbags, sunglasses, and luxury accessories from top brands.' },
  { icon: 'shield-checkmark-outline', title: '100% Authentic', description: 'We deal exclusively in genuine export and surplus articles from international brands.' },
] as const;

export const whyChooseUs = [
  { title: 'Authentic Products', description: '100% genuine branded merchandise, factory-direct quality.' },
  { title: 'Competitive Pricing', description: 'Best prices across India for premium fashion.' },
  { title: 'Quality Assurance', description: 'Every product meets the highest standards of craftsmanship.' },
  { title: 'Customer Service', description: 'Dedicated support team ready to assist you.' },
] as const;
