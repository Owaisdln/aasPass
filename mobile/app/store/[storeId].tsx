import React from "react";
import { useLocalSearchParams } from "expo-router";
import { StoreDetailScreen } from "../../src/screens/StoreDetailScreen";

export default function StoreRoute() {
  const { storeId } = useLocalSearchParams<{ storeId: string }>();
  return <StoreDetailScreen storeId={storeId ?? ""} />;
}
