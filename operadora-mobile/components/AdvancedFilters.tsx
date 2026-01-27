import React, { useState } from 'react'
import { View, StyleSheet, ScrollView } from 'react-native'
import { Text, Button, Checkbox, Divider, IconButton } from 'react-native-paper'
import { Colors, Spacing, FontSizes, BorderRadius } from '../constants/theme'
import { SafeAreaView } from 'react-native-safe-area-context'

interface FilterOption {
    id: string | number
    label: string
    value: any
    type: 'checkbox' | 'radio'
}

interface FilterSection {
    id: string
    title: string
    options: FilterOption[]
}

interface AdvancedFiltersProps {
    filters: FilterSection[]
    selectedFilters: { [key: string]: any[] }
    onFilterChange: (sectionId: string, value: any[]) => void
    onApply: () => void
    onClear: () => void
}

export default function AdvancedFilters({
    filters,
    selectedFilters,
    onFilterChange,
    onApply,
    onClear
}: AdvancedFiltersProps) {

    const toggleFilter = (sectionId: string, value: any, type: 'checkbox' | 'radio') => {
        const currentSelection = selectedFilters[sectionId] || []

        if (type === 'checkbox') {
            const exists = currentSelection.includes(value)
            let newSelection

            if (exists) {
                newSelection = currentSelection.filter(item => item !== value)
            } else {
                newSelection = [...currentSelection, value]
            }
            onFilterChange(sectionId, newSelection)
        } else {
            // Radio logic if needed (single selection)
            onFilterChange(sectionId, [value])
        }
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <IconButton icon="close" onPress={onApply} />
                <Text style={styles.title}>Filtros</Text>
                <Button onPress={onClear}>Limpiar</Button>
            </View>

            <ScrollView style={styles.scroll}>
                {filters.map((section, index) => (
                    <View key={section.id} style={styles.section}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>

                        {section.options.map((option) => {
                            const isSelected = selectedFilters[section.id]?.includes(option.value)

                            return (
                                <View key={option.id} style={styles.optionRow}>
                                    <View style={styles.optionLabel}>
                                        <Text>{option.label}</Text>
                                    </View>
                                    <Checkbox.Android
                                        status={isSelected ? 'checked' : 'unchecked'}
                                        onPress={() => toggleFilter(section.id, option.value, option.type)}
                                        color={Colors.primary}
                                    />
                                </View>
                            )
                        })}

                        {index < filters.length - 1 && <Divider style={styles.divider} />}
                    </View>
                ))}
            </ScrollView>

            <View style={styles.footer}>
                <Button mode="contained" onPress={onApply} style={styles.applyButton}>
                    Ver Resultados
                </Button>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
        height: 56,
    },
    title: {
        fontSize: FontSizes.lg,
        fontWeight: 'bold',
    },
    scroll: {
        flex: 1,
    },
    section: {
        padding: Spacing.md,
    },
    sectionTitle: {
        fontSize: FontSizes.md,
        fontWeight: 'bold',
        marginBottom: Spacing.sm,
        color: Colors.text,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    optionLabel: {
        flex: 1,
    },
    divider: {
        marginTop: Spacing.md,
    },
    footer: {
        padding: Spacing.md,
        borderTopWidth: 1,
        borderTopColor: Colors.border,
    },
    applyButton: {
        backgroundColor: Colors.primary,
    }
})
