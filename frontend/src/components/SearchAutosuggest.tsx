import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Text,
  Image,
  Modal,
  ActivityIndicator,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import productService from '../services/product.service';

interface AutosuggestResult {
  _id: string;
  name: string;
  type: 'product' | 'category' | 'subcategory';
  sku?: string;
  price?: number;
  discountPrice?: number;
  image?: string | null;
  slug?: string;
}

interface SearchAutosuggestProps {
  onSelectProduct?: (productId: string) => void;
  onSelectCategory?: (categoryId: string, categoryName: string) => void;
  onSelectSubcategory?: (subcategoryId: string, subcategoryName: string) => void;
  onSearchSubmit?: (query: string) => void;
  placeholder?: string;
  containerStyle?: any;
}

const SearchAutosuggest: React.FC<SearchAutosuggestProps> = ({
  onSelectProduct,
  onSelectCategory,
  onSelectSubcategory,
  onSearchSubmit,
  placeholder = 'Search products, categories...',
  containerStyle,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    products: AutosuggestResult[];
    categories: AutosuggestResult[];
    subcategories: AutosuggestResult[];
  }>({
    products: [],
    categories: [],
    subcategories: [],
  });
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (query.trim().length >= 2) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        fetchSuggestions(query);
      }, 300);
    } else {
      setResults({ products: [], categories: [], subcategories: [] });
      setShowResults(false);
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const fetchSuggestions = async (searchQuery: string) => {
    try {
      setLoading(true);
      const response = await productService.autosuggest(searchQuery, 5);
      setResults(response);
      setShowResults(true);
    } catch (error) {
      console.error('Autosuggest error:', error);
      setResults({ products: [], categories: [], subcategories: [] });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: AutosuggestResult) => {
    setQuery(item.name);
    setShowResults(false);

    if (item.type === 'product' && onSelectProduct) {
      onSelectProduct(item._id);
    } else if (item.type === 'category' && onSelectCategory) {
      onSelectCategory(item._id, item.name);
    } else if (item.type === 'subcategory' && onSelectSubcategory) {
      onSelectSubcategory(item._id, item.name);
    }
  };

  const handleSearchSubmit = () => {
    setShowResults(false);
    if (onSearchSubmit) {
      onSearchSubmit(query);
    }
  };

  const renderProduct = (item: AutosuggestResult) => (
    <TouchableOpacity key={item._id} style={styles.resultItem} onPress={() => handleSelect(item)}>
      {item.image ? (
        <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
      ) : (
        <View style={[styles.productImage, styles.productImagePlaceholder]}>
          <Ionicons name="image-outline" size={20} color="#999" />
        </View>
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.productSKU}>{item.sku}</Text>
        <View style={styles.priceRow}>
          {item.discountPrice ? (
            <>
              <Text style={styles.discountPrice}>₹{item.discountPrice}</Text>
              <Text style={styles.originalPrice}>₹{item.price}</Text>
            </>
          ) : (
            <Text style={styles.discountPrice}>₹{item.price}</Text>
          )}
        </View>
      </View>
      <Ionicons name="arrow-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  const renderCategory = (item: AutosuggestResult) => (
    <TouchableOpacity key={item._id} style={styles.resultItem} onPress={() => handleSelect(item)}>
      <View style={[styles.categoryIcon, { backgroundColor: '#e3f2fd' }]}>
        <Ionicons name="grid-outline" size={20} color="#2196f3" />
      </View>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryType}>Category</Text>
      </View>
      <Ionicons name="arrow-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  const renderSubcategory = (item: AutosuggestResult) => (
    <TouchableOpacity key={item._id} style={styles.resultItem} onPress={() => handleSelect(item)}>
      <View style={[styles.categoryIcon, { backgroundColor: '#f3e5f5' }]}>
        <Ionicons name="list-outline" size={20} color="#9c27b0" />
      </View>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryType}>Subcategory</Text>
      </View>
      <Ionicons name="arrow-forward" size={20} color="#999" />
    </TouchableOpacity>
  );

  const allResults = [
    ...results.categories,
    ...results.subcategories,
    ...results.products,
  ];

  const hasResults = allResults.length > 0;

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearchSubmit}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {loading && <ActivityIndicator size="small" color="#6200ee" style={styles.loadingIndicator} />}
        {query.length > 0 && !loading && (
          <TouchableOpacity onPress={() => {
            setQuery('');
            setShowResults(false);
          }}>
            <Ionicons name="close-circle" size={20} color="#999" style={styles.clearIcon} />
          </TouchableOpacity>
        )}
      </View>

      {showResults && hasResults && (
        <View style={[styles.resultsContainer, Platform.OS === 'web' && styles.resultsContainerWeb]}>
          <FlatList
            data={allResults}
            keyExtractor={(item) => `${item.type}-${item._id}`}
            renderItem={({ item }) => {
              if (item.type === 'product') return renderProduct(item);
              if (item.type === 'category') return renderCategory(item);
              if (item.type === 'subcategory') return renderSubcategory(item);
              return null;
            }}
            style={styles.resultsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      {showResults && !hasResults && !loading && query.length >= 2 && (
        <View style={[styles.resultsContainer, Platform.OS === 'web' && styles.resultsContainerWeb]}>
          <View style={styles.noResults}>
            <Ionicons name="search-outline" size={40} color="#ccc" />
            <Text style={styles.noResultsText}>No results found for "{query}"</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  clearIcon: {
    marginLeft: 8,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    marginTop: 4,
    borderRadius: 8,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  resultsContainerWeb: {
    maxHeight: 500,
  },
  resultsList: {
    maxHeight: 400,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 12,
  },
  productImagePlaceholder: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  productSKU: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discountPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4caf50',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  categoryType: {
    fontSize: 12,
    color: '#999',
  },
  noResults: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResultsText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default SearchAutosuggest;
