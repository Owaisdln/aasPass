import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Pressable,
} from "react-native";
import { Search, X } from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing } from "../theme";
import { Empty, FloatingCartBar, ProductCard } from "../components";
import { productsQuery } from "../queries";

export function SearchScreen({ initialQuery = "" }: { initialQuery?: string }) {
  const { data: allProducts = [] } = useQuery(productsQuery);
  const [query, setQuery] = useState(initialQuery);

  const filtered = allProducts.filter((product) =>
    `${product.name} ${product.category} ${product.brand}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
        <View style={styles.inputWrapper}>
          <Search size={18} color={colors.mutedForeground} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Search nearby products"
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            autoFocus={!initialQuery}
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery("")} hitSlop={10} style={styles.clearBtn}>
              <X size={16} color={colors.mutedForeground} />
            </Pressable>
          ) : null}
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.resultsCount}>
          {query ? `${filtered.length} results near you` : "Popular nearby"}
        </Text>

        {filtered.length > 0 ? (
          <View style={styles.grid}>
            {filtered.map((product) => (
              <View key={product.id} style={styles.gridCol}>
                <ProductCard product={product} />
              </View>
            ))}
          </View>
        ) : (
          <Empty
            icon={Search}
            title="Nothing nearby"
            text="Try a different product or category."
          />
        )}
      </ScrollView>

      <FloatingCartBar bottomOffset={20} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.muted,
    borderRadius: radius.lg,
    height: 44,
    paddingHorizontal: spacing.md,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.foreground,
    height: "100%",
  },
  clearBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 90,
  },
  resultsCount: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginBottom: spacing.md,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -spacing.xs,
    rowGap: spacing.md,
  },
  gridCol: {
    width: "50%",
    paddingHorizontal: spacing.xs,
  },
});
