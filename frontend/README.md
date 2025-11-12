# eCommerce Frontend - React Native

A comprehensive eCommerce mobile and web application built with React Native, Expo, and NativeWind (Tailwind CSS).

## Features

### Admin Panel (Web - /admin route)
- **Authentication**: Secure login for admin users
- **Dashboard**: Overview with quick access to all management sections
- **Gender Management**: CRUD operations for gender categories
- **Category Management**: Manage product categories with gender relationships
- **Subcategory Management**: Organize products with subcategories
- **Product Management**:
  - Full CRUD operations
  - Image upload with ImageKit integration
  - SKU management
  - Stock tracking
  - Pricing and discounts
  - Tags and attributes
- **Order Management**:
  - View all orders
  - Update order status
  - Order details with customer information
- **Offer Management**:
  - Multiple offer types (Buy X Get Y, Bundle Discount, Percentage Off, Fixed Amount Off)
  - Usage limits and priority system
  - Active/inactive status

### User App (iOS, Android, Web)
- **Home Screen**:
  - Featured products
  - Category navigation
  - Gender-based shopping
  - Search functionality
- **Product Listing**:
  - Advanced filters (gender, category, subcategory, price range, stock)
  - Search products
  - Breadcrumb navigation
  - Grid layout with product cards
- **Product Detail**:
  - Image gallery
  - Price and discount information
  - Stock availability
  - Add to cart with quantity selection
  - Wishlist functionality
  - Product specifications and tags
- **Cart**:
  - View all cart items
  - Update quantities
  - Remove items
  - Price summary
- **Wishlist**:
  - Save favorite products
  - Move to cart
  - Remove items
- **Checkout**:
  - Customer information form
  - Shipping address
  - Order summary
  - Place order (payment integration coming soon)
- **Order Success**:
  - Order confirmation
  - Order details
  - Shipping information

## Tech Stack

### Core
- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform and tooling
- **TypeScript** - Type-safe development
- **React Native Web** - Web support

### Styling
- **NativeWind** - Tailwind CSS for React Native
- **React Native Paper** - Material Design components

### State Management
- **Redux Toolkit** - State management with modern Redux
- **Redux Thunks** - Async actions

### Navigation
- **React Navigation** - Native Stack and Bottom Tabs
- **Deep Linking** - Web URL support for admin routes

### API & Storage
- **Axios** - HTTP client
- **AsyncStorage** - Local storage for tokens
- **ImageKit** - CDN for media management

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── admin/          # Admin-specific components
│   │   ├── user/           # User-specific components
│   │   └── common/         # Shared components
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── AdminNavigator.tsx
│   │   └── UserNavigator.tsx
│   ├── screens/
│   │   ├── admin/          # Admin screens
│   │   │   ├── AdminLoginScreen.tsx
│   │   │   ├── AdminDashboardScreen.tsx
│   │   │   ├── GenderManagementScreen.tsx
│   │   │   ├── CategoryManagementScreen.tsx
│   │   │   ├── SubcategoryManagementScreen.tsx
│   │   │   ├── ProductManagementScreen.tsx
│   │   │   ├── OrderManagementScreen.tsx
│   │   │   └── OfferManagementScreen.tsx
│   │   └── user/           # User screens
│   │       ├── HomeScreen.tsx
│   │       ├── ProductListScreen.tsx
│   │       ├── ProductDetailScreen.tsx
│   │       ├── CartScreen.tsx
│   │       ├── WishlistScreen.tsx
│   │       ├── CheckoutScreen.tsx
│   │       └── OrderSuccessScreen.tsx
│   ├── services/           # API services
│   │   ├── api.ts
│   │   ├── auth.service.ts
│   │   ├── gender.service.ts
│   │   ├── category.service.ts
│   │   ├── subcategory.service.ts
│   │   ├── product.service.ts
│   │   ├── cart.service.ts
│   │   ├── wishlist.service.ts
│   │   ├── order.service.ts
│   │   ├── offer.service.ts
│   │   └── media.service.ts
│   ├── store/
│   │   ├── slices/
│   │   │   ├── authSlice.ts
│   │   │   ├── productSlice.ts
│   │   │   ├── cartSlice.ts
│   │   │   └── wishlistSlice.ts
│   │   └── store.ts
│   ├── types/
│   │   └── index.ts        # TypeScript type definitions
│   ├── config/
│   │   └── api.config.ts   # API endpoints and configuration
│   └── utils/              # Utility functions
├── App.tsx                 # App entry point
├── tailwind.config.js      # Tailwind configuration
├── babel.config.js         # Babel configuration
└── tsconfig.json          # TypeScript configuration
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or later)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Backend API running on `http://localhost:3000`

### Installation

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Configure API endpoint:
Edit `src/config/api.config.ts` and update the `BASE_URL`:
```typescript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:3000', // Update this to your backend URL
  API_PREFIX: '/api',
  TIMEOUT: 30000,
};
```

### Running the App

#### For iOS (Mac only):
```bash
npm run ios
```

#### For Android:
```bash
npm run android
```

#### For Web:
```bash
npm run web
```

The web version will be available at `http://localhost:19006`

- User app: `http://localhost:19006`
- Admin panel: `http://localhost:19006/admin`

#### Development Mode:
```bash
npm start
```

This will start Expo DevTools where you can choose the platform.

## Admin Access

To access the admin panel:

### On Web:
Navigate to `http://localhost:19006/admin/login`

### On Mobile:
The app automatically detects `/admin` routes on web. For mobile development, you can temporarily modify the RootNavigator to always show admin screens.

### Admin Credentials:
Use the admin credentials you created in the backend:
- Email: `admin@example.com` (or your created admin email)
- Password: Your admin password

## Key Features Implementation

### 1. Cross-Platform Routing
- **Web**: Uses URL-based routing with `/admin` prefix for admin panel
- **Mobile**: Tab-based navigation for user app

### 2. State Management
- Redux Toolkit for global state
- Separate slices for auth, products, cart, and wishlist
- Async thunks for API calls

### 3. Styling with NativeWind
- Utility-first CSS with Tailwind classes
- Responsive design
- Consistent theming across platforms

### 4. Image Upload
- Expo Image Picker for selecting images
- Integration with ImageKit CDN
- Support for multiple images per product

### 5. Filters and Search
- Multi-level taxonomy filtering (Gender → Category → Subcategory)
- Price range filters
- Stock availability filters
- Search by product name

### 6. Cart & Wishlist
- Real-time updates
- Persistent storage via backend API
- Quantity management
- Price calculations

### 7. Checkout Flow
- Form validation
- Customer information collection
- Shipping address
- Order placement without payment (payment gateway pending)

## Environment Configuration

For production, update the `API_CONFIG` in `src/config/api.config.ts`:

```typescript
export const API_CONFIG = {
  BASE_URL: __DEV__
    ? 'http://localhost:3000'
    : 'https://your-production-api.com',
  // ...
};
```

## Building for Production

### Android APK:
```bash
expo build:android
```

### iOS:
```bash
expo build:ios
```

### Web:
```bash
expo build:web
```

The web build will be in the `web-build` directory and can be deployed to any static hosting service.

## Troubleshooting

### Metro Bundler Issues:
```bash
npx expo start --clear
```

### Cache Issues:
```bash
rm -rf node_modules
npm install
npx expo start --clear
```

### iOS Simulator Not Opening:
```bash
npx expo start --ios
```

### Android Emulator Issues:
Ensure Android Studio is properly configured and an emulator is running.

## API Integration

All API endpoints are configured in `src/config/api.config.ts`. The app uses Axios with interceptors for:
- Adding auth tokens to requests
- Handling 401 unauthorized errors
- Request/response logging

## Future Enhancements

- [ ] Payment gateway integration (Razorpay/Stripe)
- [ ] User authentication and profiles
- [ ] Order tracking
- [ ] Push notifications
- [ ] Social media sharing
- [ ] Product reviews and ratings
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Dark mode

## License

MIT

## Support

For issues or questions, please create an issue in the repository.
