import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
} from 'react-native';
import { offerApi } from '../lib/api';
import { Offer } from '../types';
import { OfferCard } from '../components/offers/OfferCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ScreenHeader } from '../components/common/ScreenHeader';
import { colors } from '../lib/theme';

export const OffersScreen = ({ navigation }: any) => {
    const [offers, setOffers] = useState<Offer[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchOffers = async (refresh = false) => {
        if (refresh) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        setError(null);

        try {
            const response = await offerApi.getActive();
            const offersData = response.data.data || response.data;
            setOffers(offersData);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load offers');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    useEffect(() => {
        fetchOffers();
    }, []);

    const handleOfferPress = (offer: Offer) => {
        // Navigate to products screen with offer filter
        const productIds = offer.productIds.join(',');
        navigation.navigate('Products', {
            offerId: offer._id,
            productIds: productIds || undefined,
            title: offer.name,
        });
    };

    if (isLoading) {
        return <LoadingSpinner message="Loading offers..." />;
    }

    if (error) {
        return (
            <View style={styles.container}>
                <ScreenHeader title="Special Offers" />
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScreenHeader title="Special Offers" />
            <View style={styles.subtitleBar}>
                <Text style={styles.subtitle}>Exclusive deals just for you</Text>
            </View>

            {offers.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No active offers at the moment</Text>
                    <Text style={styles.emptySubtext}>Check back later for amazing deals!</Text>
                </View>
            ) : (
                <FlatList
                    data={offers}
                    keyExtractor={(item) => item._id}
                    numColumns={2}
                    contentContainerStyle={styles.listContent}
                    columnWrapperStyle={styles.row}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={() => fetchOffers(true)}
                            tintColor={colors.primary}
                        />
                    }
                    renderItem={({ item }) => (
                        <View style={styles.cardWrapper}>
                            <OfferCard offer={item} onPress={() => handleOfferPress(item)} />
                        </View>
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
    subtitleBar: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: colors.borderLight,
    },
    subtitle: {
        fontSize: 14,
        color: colors.secondary,
    },
    listContent: {
        padding: 16,
    },
    row: {
        justifyContent: 'space-between',
    },
    cardWrapper: {
        width: '48%',
        marginBottom: 16,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: 16,
        color: colors.danger,
        textAlign: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.primary,
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: colors.secondary,
        textAlign: 'center',
    },
});
