import React from "react";
import { useLocalSearchParams } from "expo-router";
import { ProductDetailScreen } from "../../src/screens/ProductDetailScreen";

export default function ProductRoute() {
  const { productId } = useLocalSearchParams<{ productId: string }>();
  return <ProductDetailScreen productId={productId ?? ""} />;
}
