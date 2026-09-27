import React from "react";
import { useLocalSearchParams } from "expo-router";
import { OrderDetailScreen } from "../../src/screens/OrderDetailScreen";

export default function OrderRoute() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  return <OrderDetailScreen orderId={orderId ?? ""} />;
}
