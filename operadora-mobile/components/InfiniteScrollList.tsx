import React from 'react'
import { FlatList, RefreshControl, ActivityIndicator, View, StyleSheet, FlatListProps } from 'react-native'
import { Colors, Spacing } from '../constants/theme'
import { Text } from 'react-native-paper'

interface InfiniteScrollListProps<T> extends Omit<FlatListProps<T>, 'data' | 'renderItem'> {
    data: T[]
    renderItem: ({ item }: { item: T }) => React.ReactElement
    onLoadMore: () => void
    onRefresh: () => void
    hasMore: boolean
    loading: boolean
    emptyText?: string
}

export default function InfiniteScrollList<T>({
    data,
    renderItem,
    onLoadMore,
    onRefresh,
    hasMore,
    loading,
    emptyText = 'No se encontraron resultados',
    ...props
}: InfiniteScrollListProps<T>) {

    const renderFooter = () => {
        if (!loading || !hasMore) return null
        return (
            <View style={styles.footer}>
                <ActivityIndicator size="small" color={Colors.primary} />
            </View>
        )
    }

    const renderEmpty = () => {
        if (loading && data.length === 0) {
            return (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            )
        }
        return (
            <View style={styles.center}>
                <Text>{emptyText}</Text>
            </View>
        )
    }

    return (
        <FlatList
            data={data}
            renderItem={renderItem}
            onEndReached={hasMore ? onLoadMore : null}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            refreshControl={
                <RefreshControl
                    refreshing={loading && data.length > 0}
                    onRefresh={onRefresh}
                    colors={[Colors.primary]}
                    tintColor={Colors.primary}
                />
            }
            contentContainerStyle={[
                styles.listContent,
                data.length === 0 && styles.emptyList
            ]}
            {...props}
        />
    )
}

const styles = StyleSheet.create({
    listContent: {
        paddingBottom: Spacing.xl,
    },
    emptyList: {
        flex: 1,
        justifyContent: 'center',
    },
    footer: {
        paddingVertical: Spacing.md,
        alignItems: 'center',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
})
