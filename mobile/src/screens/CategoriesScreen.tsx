import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { useDataStore } from '../store/dataStore';
import { Gender, Subcategory } from '../types';
import { CategoryCard } from '../components/common/CategoryCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { colors } from '../lib/theme';

export const CategoriesScreen = ({ navigation }: any) => {
    const {
        genders,
        allSubcategories,
        fetchGenders,
        fetchAllSubcategories,
        isLoadingGenders,
        isLoadingSubcategories,
    } = useDataStore();

    const [selectedGenderId, setSelectedGenderId] = useState<string | null>(null);

    useEffect(() => {
        fetchGenders();
        fetchAllSubcategories();
    }, []);

    useEffect(() => {
        if (genders.length > 0 && !selectedGenderId) {
            setSelectedGenderId(genders[0]._id);
        }
    }, [genders]);

    const handleCategoryPress = (subcategory: Subcategory) => {
        navigation.navigate('Products', {
            subcategoryId: subcategory._id,
            title: subcategory.name,
        });
    };

    const filteredSubcategories = allSubcategories.filter((sub) => {
        if (!selectedGenderId) return true;

        // Check if the subcategory's category belongs to the selected gender
        if (typeof sub.categoryId === 'object' && sub.categoryId !== null) {
            const category = sub.categoryId;
            if (typeof category.genderId === 'object' && category.genderId !== null) {
                return category.genderId._id === selectedGenderId;
            } else if (typeof category.genderId === 'string') {
                return category.genderId === selectedGenderId;
            }
        }
        return false;
    });

    if (isLoadingGenders || isLoadingSubcategories) {
        return <LoadingSpinner message="Loading categories..." />;
    }

    return (
        <View style={styles.container}>
            <ScreenHeader title="Browse Categories" />

            {/* Gender Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabsContainer}
                contentContainerStyle={styles.tabsContent}
            >
                {genders.map((gender) => (
                    <TouchableOpacity
                        key={gender._id}
                        style={[
                            styles.tab,
                            selectedGenderId === gender._id && styles.tabActive,
                        ]}
                        onPress={() => setSelectedGenderId(gender._id)}
                    >
                        <Text
                            style={[
                                styles.tabText,
                                selectedGenderId === gender._id && styles.tabTextActive,
                            ]}
                        >
                            {gender.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Categories Grid */}
            {filteredSubcategories.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No categories available</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredSubcategories}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.row}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <CategoryCard
                            category={item}
                            onPress={() => handleCategoryPress(item)}
                        />
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    tabsContainer: {
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    tabsContent: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
    },
    tab: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.borderLight,
        backgroundColor: '#fff',
        marginRight: 8,
    },
    tabActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
    tabTextActive: {
        color: '#fff',
    },
    listContent: {
        padding: 16,
    },
    row: {
        justifyContent: 'space-between',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 16,
        color: colors.secondary,
        textAlign: 'center',
    },
});
