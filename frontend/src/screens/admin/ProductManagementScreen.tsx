import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  ScrollView,
  Image,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import productService from '../../services/product.service';
import genderService from '../../services/gender.service';
import categoryService from '../../services/category.service';
import subcategoryService from '../../services/subcategory.service';
import { Product, CreateProductDto, Gender, Category, Subcategory } from '../../types';

const ProductManagementScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [genders, setGenders] = useState<Gender[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [genderModalVisible, setGenderModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [subcategoryModalVisible, setSubcategoryModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<CreateProductDto>({
    name: '',
    description: '',
    gender: '',
    category: '',
    subcategory: '',
    price: 0,
    discountedPrice: 0,
    stock: 0,
    lowStockThreshold: 10,
    tags: [],
    isActive: true,
    isFeatured: false,
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, gendersData, categoriesData, subcategoriesData] = await Promise.all([
        productService.getAll(),
        genderService.getAll(),
        categoryService.getAll(),
        subcategoryService.getAll(),
      ]);
      setProducts(productsData.data);
      setGenders(gendersData.filter((g) => g.isActive));
      setCategories(categoriesData.filter((c) => c.isActive));
      setSubcategories(subcategoriesData.filter((s) => s.isActive));
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description,
        gender: typeof product.gender === 'string' ? product.gender : product.gender._id,
        category: typeof product.category === 'string' ? product.category : product.category._id,
        subcategory: typeof product.subcategory === 'string' ? product.subcategory : product.subcategory._id,
        price: product.price,
        discountedPrice: product.discountedPrice,
        stock: product.stock,
        lowStockThreshold: product.lowStockThreshold,
        tags: product.tags,
        isActive: product.isActive,
        isFeatured: product.isFeatured,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        gender: '',
        category: '',
        subcategory: '',
        price: 0,
        discountedPrice: 0,
        stock: 0,
        lowStockThreshold: 10,
        tags: [],
        isActive: true,
        isFeatured: false,
      });
    }
    setTagInput('');
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    if (!formData.gender || !formData.category || !formData.subcategory) {
      Alert.alert('Error', 'Please select gender, category, and subcategory');
      return;
    }
    if (formData.price <= 0) {
      Alert.alert('Error', 'Price must be greater than 0');
      return;
    }

    try {
      if (editingProduct) {
        await productService.update(editingProduct._id, formData);
        Alert.alert('Success', 'Product updated successfully');
      } else {
        await productService.create(formData);
        Alert.alert('Success', 'Product created successfully');
      }
      setModalVisible(false);
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = (product: Product) => {
    Alert.alert('Delete Product', `Are you sure you want to delete "${product.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await productService.delete(product._id);
            Alert.alert('Success', 'Product deleted successfully');
            loadData();
          } catch (error: any) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to delete product');
          }
        },
      },
    ]);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag) || [],
    });
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.itemCard}>
      <View style={styles.productRow}>
        {item.images && item.images.length > 0 ? (
          <Image source={{ uri: item.images[0] }} style={styles.productImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons name="image-outline" size={32} color="#ccc" />
          </View>
        )}
        <View style={styles.productInfo}>
          <View style={styles.productHeader}>
            <Text style={styles.productName}>{item.name}</Text>
            {item.isFeatured && (
              <Ionicons name="star" size={16} color="#ffc107" />
            )}
          </View>
          <Text style={styles.productPrice}>
            ${item.discountedPrice || item.price}
            {item.discountedPrice && <Text style={styles.originalPrice}> ${item.price}</Text>}
          </Text>
          <Text style={styles.productStock}>Stock: {item.stock}</Text>
          <View style={[styles.statusBadge, item.isActive ? styles.statusActive : styles.statusInactive]}>
            <Text style={[styles.statusText, item.isActive ? styles.statusTextActive : styles.statusTextInactive]}>
              {item.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.itemActions}>
        <TouchableOpacity style={styles.editButton} onPress={() => openModal(item)}>
          <Ionicons name="create-outline" size={20} color="#2196f3" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(item)}>
          <Ionicons name="trash-outline" size={20} color="#f44336" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => openModal()}>
        <Ionicons name="add" size={24} color="white" />
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingProduct ? 'Edit Product' : 'Add Product'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(value) => setFormData({ ...formData, name: value })}
                placeholder="Enter product name"
              />

              <Text style={styles.label}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => setFormData({ ...formData, description: value })}
                placeholder="Enter description"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Gender *</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setGenderModalVisible(true)}
              >
                <Text style={formData.gender ? styles.selectorButtonText : styles.selectorButtonPlaceholder}>
                  {formData.gender ? genders.find(g => g._id === formData.gender)?.name : 'Select Gender'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>

              <Text style={styles.label}>Category *</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setCategoryModalVisible(true)}
              >
                <Text style={formData.category ? styles.selectorButtonText : styles.selectorButtonPlaceholder}>
                  {formData.category ? categories.find(c => c._id === formData.category)?.name : 'Select Category'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>

              <Text style={styles.label}>Subcategory *</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setSubcategoryModalVisible(true)}
              >
                <Text style={formData.subcategory ? styles.selectorButtonText : styles.selectorButtonPlaceholder}>
                  {formData.subcategory ? subcategories.find(s => s._id === formData.subcategory)?.name : 'Select Subcategory'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>

              <Text style={styles.label}>Price *</Text>
              <TextInput
                style={styles.input}
                value={formData.price.toString()}
                onChangeText={(value) => setFormData({ ...formData, price: parseFloat(value) || 0 })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Discounted Price</Text>
              <TextInput
                style={styles.input}
                value={formData.discountedPrice?.toString() || ''}
                onChangeText={(value) => setFormData({ ...formData, discountedPrice: parseFloat(value) || undefined })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Stock *</Text>
              <TextInput
                style={styles.input}
                value={formData.stock.toString()}
                onChangeText={(value) => setFormData({ ...formData, stock: parseInt(value) || 0 })}
                placeholder="0"
                keyboardType="number-pad"
              />

              <Text style={styles.label}>Low Stock Threshold</Text>
              <TextInput
                style={styles.input}
                value={formData.lowStockThreshold?.toString() || '10'}
                onChangeText={(value) => setFormData({ ...formData, lowStockThreshold: parseInt(value) || 10 })}
                placeholder="10"
                keyboardType="number-pad"
              />

              <Text style={styles.label}>Tags</Text>
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder="Enter tag"
                />
                <TouchableOpacity style={styles.addTagButton} onPress={addTag}>
                  <Ionicons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>
              <View style={styles.tagsContainer}>
                {formData.tags?.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity onPress={() => removeTag(tag)}>
                      <Ionicons name="close-circle" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.label}>Featured</Text>
                <Switch
                  value={formData.isFeatured}
                  onValueChange={(value) => setFormData({ ...formData, isFeatured: value })}
                  trackColor={{ false: '#ccc', true: '#b39ddb' }}
                  thumbColor={formData.isFeatured ? '#6200ee' : '#f4f3f4'}
                />
              </View>

              <View style={styles.switchRow}>
                <Text style={styles.label}>Active</Text>
                <Switch
                  value={formData.isActive}
                  onValueChange={(value) => setFormData({ ...formData, isActive: value })}
                  trackColor={{ false: '#ccc', true: '#b39ddb' }}
                  thumbColor={formData.isActive ? '#6200ee' : '#f4f3f4'}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={genderModalVisible} animationType="slide" transparent onRequestClose={() => setGenderModalVisible(false)}>
        <View style={styles.selectorModalOverlay}>
          <View style={[styles.selectorModalContent, Platform.OS === 'web' && styles.selectorModalContentWeb]}>
            <View style={styles.selectorModalHeader}>
              <Text style={styles.selectorModalTitle}>Select Gender</Text>
              <TouchableOpacity onPress={() => setGenderModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.selectorModalList}>
              {genders.map((gender) => (
                <TouchableOpacity
                  key={gender._id}
                  style={styles.selectorModalItem}
                  onPress={() => {
                    setFormData({ ...formData, gender: gender._id });
                    setGenderModalVisible(false);
                  }}
                >
                  <View style={styles.selectorModalItemContent}>
                    <Ionicons name="transgender" size={20} color="#6200ee" />
                    <Text style={styles.selectorModalItemText}>{gender.name}</Text>
                  </View>
                  {formData.gender === gender._id && (
                    <Ionicons name="checkmark" size={24} color="#6200ee" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={categoryModalVisible} animationType="slide" transparent onRequestClose={() => setCategoryModalVisible(false)}>
        <View style={styles.selectorModalOverlay}>
          <View style={[styles.selectorModalContent, Platform.OS === 'web' && styles.selectorModalContentWeb]}>
            <View style={styles.selectorModalHeader}>
              <Text style={styles.selectorModalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.selectorModalList}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category._id}
                  style={styles.selectorModalItem}
                  onPress={() => {
                    setFormData({ ...formData, category: category._id });
                    setCategoryModalVisible(false);
                  }}
                >
                  <View style={styles.selectorModalItemContent}>
                    <Ionicons name="grid-outline" size={20} color="#6200ee" />
                    <Text style={styles.selectorModalItemText}>{category.name}</Text>
                  </View>
                  {formData.category === category._id && (
                    <Ionicons name="checkmark" size={24} color="#6200ee" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={subcategoryModalVisible} animationType="slide" transparent onRequestClose={() => setSubcategoryModalVisible(false)}>
        <View style={styles.selectorModalOverlay}>
          <View style={[styles.selectorModalContent, Platform.OS === 'web' && styles.selectorModalContentWeb]}>
            <View style={styles.selectorModalHeader}>
              <Text style={styles.selectorModalTitle}>Select Subcategory</Text>
              <TouchableOpacity onPress={() => setSubcategoryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.selectorModalList}>
              {subcategories.map((subcategory) => (
                <TouchableOpacity
                  key={subcategory._id}
                  style={styles.selectorModalItem}
                  onPress={() => {
                    setFormData({ ...formData, subcategory: subcategory._id });
                    setSubcategoryModalVisible(false);
                  }}
                >
                  <View style={styles.selectorModalItemContent}>
                    <Ionicons name="list-outline" size={20} color="#6200ee" />
                    <Text style={styles.selectorModalItemText}>{subcategory.name}</Text>
                  </View>
                  {formData.subcategory === subcategory._id && (
                    <Ionicons name="checkmark" size={24} color="#6200ee" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  itemCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  productStock: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusActive: {
    backgroundColor: '#e8f5e9',
  },
  statusInactive: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextActive: {
    color: '#4caf50',
  },
  statusTextInactive: {
    color: '#f44336',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  editButtonText: {
    color: '#2196f3',
    fontWeight: '600',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  deleteButtonText: {
    color: '#f44336',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  selectorButtonText: {
    fontSize: 16,
    color: '#333',
  },
  selectorButtonPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  selectorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  selectorModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  selectorModalContentWeb: {
    alignSelf: 'center',
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    marginVertical: 'auto',
  },
  selectorModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectorModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  selectorModalList: {
    padding: 8,
  },
  selectorModalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
  },
  selectorModalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectorModalItemText: {
    fontSize: 16,
    color: '#333',
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  addTagButton: {
    backgroundColor: '#6200ee',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  tagText: {
    fontSize: 14,
    color: '#333',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#6200ee',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default ProductManagementScreen;
