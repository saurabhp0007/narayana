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
  const [relatedProductsModalVisible, setRelatedProductsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [notification, setNotification] = useState<{ visible: boolean; message: string; type: 'success' | 'error' }>({
    visible: false,
    message: '',
    type: 'success',
  });
  const [formData, setFormData] = useState<CreateProductDto>({
    name: '',
    sku: '',
    familySKU: '',
    description: '',
    genderId: '',
    categoryId: '',
    subcategoryId: '',
    sizes: [],
    stock: 0,
    price: 0,
    discountPrice: undefined,
    relatedProductIds: [],
    underPriceAmount: undefined,
    images: [],
    videos: [],
    sliders: [],
    isActive: true,
  });
  const [sizeInput, setSizeInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [videoInput, setVideoInput] = useState('');
  const [sliderInput, setSliderInput] = useState('');

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ visible: true, message, type });
    setTimeout(() => {
      setNotification({ visible: false, message: '', type: 'success' });
    }, 3000);
  };

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
        sku: product.sku,
        familySKU: product.familySKU,
        description: product.description,
        genderId: product.genderId,
        categoryId: product.categoryId,
        subcategoryId: product.subcategoryId,
        sizes: product.sizes || [],
        stock: product.stock,
        price: product.price,
        discountPrice: product.discountPrice,
        relatedProductIds: product.relatedProductIds || [],
        underPriceAmount: product.underPriceAmount,
        images: product.images || [],
        videos: product.videos || [],
        sliders: product.sliders || [],
        isActive: product.isActive,
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        sku: '',
        familySKU: '',
        description: '',
        genderId: '',
        categoryId: '',
        subcategoryId: '',
        sizes: [],
        stock: 0,
        price: 0,
        discountPrice: undefined,
        relatedProductIds: [],
        underPriceAmount: undefined,
        images: [],
        videos: [],
        sliders: [],
        isActive: true,
      });
    }
    setSizeInput('');
    setImageInput('');
    setVideoInput('');
    setSliderInput('');
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }
    if (!formData.genderId || !formData.categoryId || !formData.subcategoryId) {
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
      console.error('Product submit error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = (product: Product) => {
    if (Platform.OS === 'web') {
      setDeleteTarget(product);
      setConfirmDeleteVisible(true);
    } else {
      Alert.alert('Delete Product', `Are you sure you want to delete "${product.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteProduct(product._id),
        },
      ]);
    }
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteProduct(deleteTarget._id);
      setConfirmDeleteVisible(false);
      setDeleteTarget(null);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      console.log('Deleting product:', id);
      await productService.delete(id);
      if (Platform.OS === 'web') {
        showNotification('Product deleted successfully', 'success');
      } else {
        Alert.alert('Success', 'Product deleted successfully');
      }
      loadData();
    } catch (error: any) {
      console.error('Delete product error:', error);
      if (Platform.OS === 'web') {
        showNotification(error.response?.data?.message || 'Failed to delete product', 'error');
      } else {
        Alert.alert('Error', error.response?.data?.message || 'Failed to delete product');
      }
    }
  };

  const addSize = () => {
    if (sizeInput.trim() && !formData.sizes?.includes(sizeInput.trim())) {
      setFormData({
        ...formData,
        sizes: [...(formData.sizes || []), sizeInput.trim()],
      });
      setSizeInput('');
    }
  };

  const removeSize = (size: string) => {
    setFormData({
      ...formData,
      sizes: formData.sizes?.filter((s) => s !== size) || [],
    });
  };

  const addImage = () => {
    if (imageInput.trim() && !formData.images?.includes(imageInput.trim())) {
      setFormData({
        ...formData,
        images: [...(formData.images || []), imageInput.trim()],
      });
      setImageInput('');
    }
  };

  const removeImage = (image: string) => {
    setFormData({
      ...formData,
      images: formData.images?.filter((img) => img !== image) || [],
    });
  };

  const addVideo = () => {
    if (videoInput.trim() && !formData.videos?.includes(videoInput.trim())) {
      setFormData({
        ...formData,
        videos: [...(formData.videos || []), videoInput.trim()],
      });
      setVideoInput('');
    }
  };

  const removeVideo = (video: string) => {
    setFormData({
      ...formData,
      videos: formData.videos?.filter((v) => v !== video) || [],
    });
  };

  const addSlider = () => {
    if (sliderInput.trim() && !formData.sliders?.includes(sliderInput.trim())) {
      setFormData({
        ...formData,
        sliders: [...(formData.sliders || []), sliderInput.trim()],
      });
      setSliderInput('');
    }
  };

  const removeSlider = (slider: string) => {
    setFormData({
      ...formData,
      sliders: formData.sliders?.filter((s) => s !== slider) || [],
    });
  };

  const toggleRelatedProduct = (productId: string) => {
    const relatedIds = formData.relatedProductIds || [];
    if (relatedIds.includes(productId)) {
      setFormData({
        ...formData,
        relatedProductIds: relatedIds.filter((id) => id !== productId),
      });
    } else {
      setFormData({
        ...formData,
        relatedProductIds: [...relatedIds, productId],
      });
    }
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

              <Text style={styles.label}>SKU</Text>
              <TextInput
                style={styles.input}
                value={formData.sku}
                onChangeText={(value) => setFormData({ ...formData, sku: value })}
                placeholder="Enter SKU"
              />

              <Text style={styles.label}>Family SKU</Text>
              <TextInput
                style={styles.input}
                value={formData.familySKU}
                onChangeText={(value) => setFormData({ ...formData, familySKU: value })}
                placeholder="Enter Family SKU"
              />

              <Text style={styles.label}>Description</Text>
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
                <Text style={formData.genderId ? styles.selectorButtonText : styles.selectorButtonPlaceholder}>
                  {formData.genderId ? genders.find(g => g._id === formData.genderId)?.name : 'Select Gender'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>

              <Text style={styles.label}>Category *</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setCategoryModalVisible(true)}
              >
                <Text style={formData.categoryId ? styles.selectorButtonText : styles.selectorButtonPlaceholder}>
                  {formData.categoryId ? categories.find(c => c._id === formData.categoryId)?.name : 'Select Category'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>

              <Text style={styles.label}>Subcategory *</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setSubcategoryModalVisible(true)}
              >
                <Text style={formData.subcategoryId ? styles.selectorButtonText : styles.selectorButtonPlaceholder}>
                  {formData.subcategoryId ? subcategories.find(s => s._id === formData.subcategoryId)?.name : 'Select Subcategory'}
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

              <Text style={styles.label}>Discount Price</Text>
              <TextInput
                style={styles.input}
                value={formData.discountPrice?.toString() || ''}
                onChangeText={(value) => setFormData({ ...formData, discountPrice: parseFloat(value) || undefined })}
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

              <Text style={styles.label}>Under Price Amount</Text>
              <TextInput
                style={styles.input}
                value={formData.underPriceAmount?.toString() || ''}
                onChangeText={(value) => setFormData({ ...formData, underPriceAmount: parseFloat(value) || undefined })}
                placeholder="0.00"
                keyboardType="decimal-pad"
              />

              <Text style={styles.label}>Sizes</Text>
              <View style={styles.arrayInputContainer}>
                <TextInput
                  style={styles.arrayInput}
                  value={sizeInput}
                  onChangeText={setSizeInput}
                  placeholder="Enter size (e.g. S, M, L)"
                />
                <TouchableOpacity style={styles.addButton} onPress={addSize}>
                  <Ionicons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>
              <View style={styles.arrayItemsContainer}>
                {formData.sizes?.map((size, index) => (
                  <View key={index} style={styles.arrayItem}>
                    <Text style={styles.arrayItemText}>{size}</Text>
                    <TouchableOpacity onPress={() => removeSize(size)}>
                      <Ionicons name="close-circle" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <Text style={styles.label}>Related Products</Text>
              <TouchableOpacity
                style={styles.selectorButton}
                onPress={() => setRelatedProductsModalVisible(true)}
              >
                <Text style={formData.relatedProductIds && formData.relatedProductIds.length > 0 ? styles.selectorButtonText : styles.selectorButtonPlaceholder}>
                  {formData.relatedProductIds && formData.relatedProductIds.length > 0
                    ? `${formData.relatedProductIds.length} products selected`
                    : 'Select Related Products'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>

              <Text style={styles.label}>Images (URLs)</Text>
              <View style={styles.arrayInputContainer}>
                <TextInput
                  style={styles.arrayInput}
                  value={imageInput}
                  onChangeText={setImageInput}
                  placeholder="Enter image URL"
                />
                <TouchableOpacity style={styles.addButton} onPress={addImage}>
                  <Ionicons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>
              <View style={styles.arrayItemsContainer}>
                {formData.images?.map((image, index) => (
                  <View key={index} style={styles.arrayItem}>
                    <Text style={styles.arrayItemText} numberOfLines={1}>{image}</Text>
                    <TouchableOpacity onPress={() => removeImage(image)}>
                      <Ionicons name="close-circle" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <Text style={styles.label}>Videos (URLs)</Text>
              <View style={styles.arrayInputContainer}>
                <TextInput
                  style={styles.arrayInput}
                  value={videoInput}
                  onChangeText={setVideoInput}
                  placeholder="Enter video URL"
                />
                <TouchableOpacity style={styles.addButton} onPress={addVideo}>
                  <Ionicons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>
              <View style={styles.arrayItemsContainer}>
                {formData.videos?.map((video, index) => (
                  <View key={index} style={styles.arrayItem}>
                    <Text style={styles.arrayItemText} numberOfLines={1}>{video}</Text>
                    <TouchableOpacity onPress={() => removeVideo(video)}>
                      <Ionicons name="close-circle" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <Text style={styles.label}>Sliders (URLs)</Text>
              <View style={styles.arrayInputContainer}>
                <TextInput
                  style={styles.arrayInput}
                  value={sliderInput}
                  onChangeText={setSliderInput}
                  placeholder="Enter slider URL"
                />
                <TouchableOpacity style={styles.addButton} onPress={addSlider}>
                  <Ionicons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>
              <View style={styles.arrayItemsContainer}>
                {formData.sliders?.map((slider, index) => (
                  <View key={index} style={styles.arrayItem}>
                    <Text style={styles.arrayItemText} numberOfLines={1}>{slider}</Text>
                    <TouchableOpacity onPress={() => removeSlider(slider)}>
                      <Ionicons name="close-circle" size={16} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
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
                    setFormData({ ...formData, genderId: gender._id });
                    setGenderModalVisible(false);
                  }}
                >
                  <View style={styles.selectorModalItemContent}>
                    <Ionicons name="transgender" size={20} color="#6200ee" />
                    <Text style={styles.selectorModalItemText}>{gender.name}</Text>
                  </View>
                  {formData.genderId === gender._id && (
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
                    setFormData({ ...formData, categoryId: category._id });
                    setCategoryModalVisible(false);
                  }}
                >
                  <View style={styles.selectorModalItemContent}>
                    <Ionicons name="grid-outline" size={20} color="#6200ee" />
                    <Text style={styles.selectorModalItemText}>{category.name}</Text>
                  </View>
                  {formData.categoryId === category._id && (
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
                    setFormData({ ...formData, subcategoryId: subcategory._id });
                    setSubcategoryModalVisible(false);
                  }}
                >
                  <View style={styles.selectorModalItemContent}>
                    <Ionicons name="list-outline" size={20} color="#6200ee" />
                    <Text style={styles.selectorModalItemText}>{subcategory.name}</Text>
                  </View>
                  {formData.subcategoryId === subcategory._id && (
                    <Ionicons name="checkmark" size={24} color="#6200ee" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={relatedProductsModalVisible} animationType="slide" transparent onRequestClose={() => setRelatedProductsModalVisible(false)}>
        <View style={styles.selectorModalOverlay}>
          <View style={[styles.selectorModalContent, Platform.OS === 'web' && styles.selectorModalContentWeb]}>
            <View style={styles.selectorModalHeader}>
              <Text style={styles.selectorModalTitle}>Select Related Products</Text>
              <TouchableOpacity onPress={() => setRelatedProductsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.selectorModalList}>
              {products.filter(p => !editingProduct || p._id !== editingProduct._id).map((product) => (
                <TouchableOpacity
                  key={product._id}
                  style={styles.selectorModalItem}
                  onPress={() => toggleRelatedProduct(product._id)}
                >
                  <View style={styles.selectorModalItemContent}>
                    <Ionicons name="cube-outline" size={20} color="#6200ee" />
                    <Text style={styles.selectorModalItemText}>{product.name}</Text>
                  </View>
                  {formData.relatedProductIds?.includes(product._id) && (
                    <Ionicons name="checkmark" size={24} color="#6200ee" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={confirmDeleteVisible} transparent animationType="fade">
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmHeader}>
              <Ionicons name="warning" size={32} color="#f44336" />
            </View>
            <Text style={styles.confirmTitle}>Delete Product</Text>
            <Text style={styles.confirmMessage}>
              Are you sure you want to delete "{deleteTarget?.name}"?
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={() => {
                  setConfirmDeleteVisible(false);
                  setDeleteTarget(null);
                }}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDeleteButton} onPress={confirmDelete}>
                <Text style={styles.confirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notification Modal */}
      <Modal visible={notification.visible} transparent animationType="fade">
        <View style={styles.notificationOverlay}>
          <View style={[styles.notificationCard, notification.type === 'error' ? styles.notificationError : styles.notificationSuccess]}>
            <Ionicons
              name={notification.type === 'error' ? 'close-circle' : 'checkmark-circle'}
              size={24}
              color="white"
            />
            <Text style={styles.notificationText}>{notification.message}</Text>
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
  arrayInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  arrayInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  addButton: {
    backgroundColor: '#6200ee',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrayItemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  arrayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  arrayItemText: {
    fontSize: 14,
    color: '#333',
    maxWidth: 200,
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
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  confirmCancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  confirmCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmDeleteButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f44336',
    alignItems: 'center',
  },
  confirmDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  notificationOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    minWidth: 300,
    maxWidth: '90%',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  notificationSuccess: {
    backgroundColor: '#4caf50',
  },
  notificationError: {
    backgroundColor: '#f44336',
  },
  notificationText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
    flex: 1,
  },
});

export default ProductManagementScreen;
