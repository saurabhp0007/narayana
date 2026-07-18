import { create } from 'zustand';
import { Gender, Category, Product } from '@/types';
import { genderApi, categoryApi, productApi } from '@/lib/api';

interface DataStore {
  // Data
  genders: Gender[];
  allCategories: Category[];
  featuredProducts: Product[];
  categoriesByGender: Record<string, Category[]>;

  // Loading states
  isLoadingGenders: boolean;
  isLoadingCategories: boolean;
  isLoadingProducts: boolean;

  // Timestamps for cache invalidation
  lastFetchTime: Record<string, number>;

  // Actions
  fetchGenders: () => Promise<Gender[]>;
  fetchAllCategories: () => Promise<Category[]>;
  fetchFeaturedProducts: (limit?: number) => Promise<Product[]>;
  fetchCategoriesByGender: (genderId: string) => Promise<Category[]>;

  // Preload all essential data
  preloadEssentialData: () => Promise<void>;

  // Clear cache
  clearCache: () => void;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

export const useDataStore = create<DataStore>((set, get) => ({
  // Initial state
  genders: [],
  allCategories: [],
  featuredProducts: [],
  categoriesByGender: {},

  isLoadingGenders: false,
  isLoadingCategories: false,
  isLoadingProducts: false,

  lastFetchTime: {},

  fetchGenders: async () => {
    const state = get();
    const cacheKey = 'genders';
    const now = Date.now();

    // Return cached data if fresh
    if (
      state.genders.length > 0 &&
      state.lastFetchTime[cacheKey] &&
      now - state.lastFetchTime[cacheKey] < CACHE_TTL
    ) {
      return state.genders;
    }

    // Prevent duplicate fetches
    if (state.isLoadingGenders) {
      // Wait for existing fetch to complete
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const currentState = get();
          if (!currentState.isLoadingGenders) {
            clearInterval(checkInterval);
            resolve(currentState.genders);
          }
        }, 50);
      });
    }

    set({ isLoadingGenders: true });

    try {
      const response = await genderApi.getAll({ isActive: true });
      const data = response.data.data || response.data || [];

      set({
        genders: data,
        isLoadingGenders: false,
        lastFetchTime: { ...get().lastFetchTime, [cacheKey]: now },
      });

      return data;
    } catch (error) {
      console.error('Failed to fetch genders:', error);
      set({ isLoadingGenders: false });
      return state.genders;
    }
  },

  fetchAllCategories: async () => {
    const state = get();
    const cacheKey = 'allCategories';
    const now = Date.now();

    if (
      state.allCategories.length > 0 &&
      state.lastFetchTime[cacheKey] &&
      now - state.lastFetchTime[cacheKey] < CACHE_TTL
    ) {
      return state.allCategories;
    }

    if (state.isLoadingCategories) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const currentState = get();
          if (!currentState.isLoadingCategories) {
            clearInterval(checkInterval);
            resolve(currentState.allCategories);
          }
        }, 50);
      });
    }

    set({ isLoadingCategories: true });

    try {
      const response = await categoryApi.getAll({ isActive: true, limit: 100 });
      const data = response.data.data || response.data || [];

      set({
        allCategories: data,
        isLoadingCategories: false,
        lastFetchTime: { ...get().lastFetchTime, [cacheKey]: now },
      });

      return data;
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      set({ isLoadingCategories: false });
      return state.allCategories;
    }
  },

  fetchFeaturedProducts: async (limit = 8) => {
    const state = get();
    const cacheKey = `featuredProducts:${limit}`;
    const now = Date.now();

    // Return cached data if fresh
    if (
      state.featuredProducts.length > 0 &&
      state.lastFetchTime[cacheKey] &&
      now - state.lastFetchTime[cacheKey] < CACHE_TTL
    ) {
      return state.featuredProducts;
    }

    // Prevent duplicate fetches
    if (state.isLoadingProducts) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const currentState = get();
          if (!currentState.isLoadingProducts) {
            clearInterval(checkInterval);
            resolve(currentState.featuredProducts);
          }
        }, 50);
      });
    }

    set({ isLoadingProducts: true });

    try {
      const response = await productApi.getAll({ limit, isActive: true });
      const data = response.data.data || response.data || [];

      set({
        featuredProducts: data,
        isLoadingProducts: false,
        lastFetchTime: { ...get().lastFetchTime, [cacheKey]: now },
      });

      return data;
    } catch (error) {
      console.error('Failed to fetch products:', error);
      set({ isLoadingProducts: false });
      return state.featuredProducts;
    }
  },

  fetchCategoriesByGender: async (genderId: string) => {
    const state = get();
    const cacheKey = `categories:${genderId}`;
    const now = Date.now();

    // Return cached data if fresh
    if (
      state.categoriesByGender[genderId] &&
      state.lastFetchTime[cacheKey] &&
      now - state.lastFetchTime[cacheKey] < CACHE_TTL
    ) {
      return state.categoriesByGender[genderId];
    }

    try {
      const response = await categoryApi.getByGender(genderId);
      const data = response.data || [];

      set({
        categoriesByGender: {
          ...get().categoriesByGender,
          [genderId]: data,
        },
        lastFetchTime: { ...get().lastFetchTime, [cacheKey]: now },
      });

      return data;
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      return state.categoriesByGender[genderId] || [];
    }
  },

  preloadEssentialData: async () => {
    const state = get();

    // Only preload if not already loaded
    const promises: Promise<unknown>[] = [];

    if (state.genders.length === 0) {
      promises.push(get().fetchGenders());
    }

    if (state.featuredProducts.length === 0) {
      promises.push(get().fetchFeaturedProducts());
    }

    await Promise.all(promises);
  },

  clearCache: () => {
    set({
      genders: [],
      featuredProducts: [],
      categoriesByGender: {},
      lastFetchTime: {},
    });
  },
}));
