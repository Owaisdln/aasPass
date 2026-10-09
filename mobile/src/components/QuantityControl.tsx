import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Modal,
} from "react-native";
import { Minus, Plus, ShoppingBasket } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { colors, radius, spacing } from "../theme";
import { getProduct, getStore } from "../data";
import { getStockStatus } from "../model";
import { useAppStore } from "../store";

export function QuantityControl({
  productId,
  compact = false,
}: {
  productId: string;
  compact?: boolean;
}) {
  const quantity = useAppStore(
    (state) => state.cart.find((line) => line.productId === productId)?.quantity ?? 0
  );
  const setQuantity = useAppStore((state) => state.setQuantity);
  const addToCart = useAppStore((state) => state.addToCart);
  const [conflictOpen, setConflictOpen] = useState(false);

  const product = getProduct(productId);
  const stock = getStockStatus(product);
  const atLimit = quantity >= stock.quantity;

  const handleAdd = async () => {
    try {
      const result = await addToCart(productId);
      if (result === "conflict") {
        setConflictOpen(true);
      } else if (result === "stock-limit") {
        Toast.show({ type: "error", text1: `Only ${stock.quantity} left in stock` });
      } else if (result === "unavailable") {
        Toast.show({ type: "error", text1: "This product is out of stock" });
      } else {
        Toast.show({ type: "success", text1: "Added to cart" });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Could not add to cart",
        text2: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  if (!quantity) {
    return (
      <>
        {compact ? (
          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [styles.compactAddBtn, pressed && styles.pressed]}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel="Add to cart"
          >
            <Plus size={16} color={colors.card} />
          </Pressable>
        ) : (
          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [styles.fullAddBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Add to cart"
          >
            <Text style={styles.fullAddText}>ADD</Text>
          </Pressable>
        )}
        <CartConflictModal
          open={conflictOpen}
          onClose={() => setConflictOpen(false)}
          productId={productId}
        />
      </>
    );
  }

  return (
    <>
      <View style={[styles.stepper, compact ? styles.compactStepper : styles.fullStepper]}>
        <Pressable
          onPress={() => setQuantity(productId, quantity - 1)}
          style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Decrease quantity"
        >
          <Minus size={compact ? 12 : 14} color={colors.primaryForeground} />
        </Pressable>
        <Text style={styles.stepperQuantity}>{quantity}</Text>
        <Pressable
          onPress={handleAdd}
          disabled={atLimit}
          style={({ pressed }) => [
            styles.stepBtn,
            atLimit && styles.disabledStepBtn,
            pressed && styles.pressed,
          ]}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Increase quantity"
        >
          <Plus size={compact ? 12 : 14} color={colors.primaryForeground} />
        </Pressable>
      </View>
      <CartConflictModal
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
        productId={productId}
      />
    </>
  );
}

function CartConflictModal({
  open,
  onClose,
  productId,
}: {
  open: boolean;
  onClose: () => void;
  productId: string;
}) {
  const addToCart = useAppStore((state) => state.addToCart);
  const cart = useAppStore((state) => state.cart);
  const cartStoreId = useAppStore((state) => state.cartStoreId);
  const currentStore = cartStoreId ? getStore(cartStoreId) : undefined;
  const product = getProduct(productId);
  const newStore = product ? getStore(product.storeId) : undefined;
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  const handleDiscard = async () => {
    try {
      const result = await addToCart(productId, true);
      if (result === "unavailable") {
        Toast.show({ type: "error", text1: "This product is out of stock" });
        return;
      }
      onClose();
      Toast.show({ type: "success", text1: `Cart switched to ${newStore?.name ?? "this store"}` });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Could not add to cart",
        text2: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.iconCircle}>
            <ShoppingBasket size={28} color={colors.primary} />
          </View>
          <Text style={styles.modalTitle}>Start a new cart?</Text>
          <Text style={styles.modalDescription}>
            You already have {itemCount} {itemCount === 1 ? "item" : "items"} from{" "}
            <Text style={styles.boldText}>{currentStore?.name ?? "another store"}</Text>. Discard
            them and start shopping from{" "}
            <Text style={styles.boldText}>{newStore?.name ?? "this store"}</Text>?
          </Text>

          <View style={styles.modalButtons}>
            <Pressable
              onPress={handleDiscard}
              style={({ pressed }) => [styles.primaryModalBtn, pressed && styles.pressed]}
            >
              <Text style={styles.primaryModalBtnText}>Discard &amp; start new cart</Text>
            </Pressable>

            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.secondaryModalBtn, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryModalBtnText}>Keep current cart</Text>
            </Pressable>
          </View>
          <Text style={styles.modalFooterNote}>One order is fulfilled by one local store at a time.</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  compactAddBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.foreground,
    alignItems: "center",
    justifyContent: "center",
  },
  fullAddBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  fullAddText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.full,
  },
  compactStepper: {
    height: 32,
    paddingHorizontal: 4,
  },
  fullStepper: {
    height: 38,
    paddingHorizontal: 8,
  },
  stepBtn: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledStepBtn: {
    opacity: 0.4,
  },
  stepperQuantity: {
    width: 24,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "800",
    color: colors.primaryForeground,
  },
  pressed: {
    opacity: 0.8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: radius["2xl"],
    padding: spacing.xl,
    alignItems: "center",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.freshSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedForeground,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  boldText: {
    fontWeight: "700",
    color: colors.foreground,
  },
  modalButtons: {
    width: "100%",
    gap: spacing.sm,
  },
  primaryModalBtn: {
    backgroundColor: colors.primary,
    height: 46,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryModalBtnText: {
    color: colors.primaryForeground,
    fontSize: 14,
    fontWeight: "700",
  },
  secondaryModalBtn: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
    height: 46,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryModalBtnText: {
    color: colors.foreground,
    fontSize: 14,
    fontWeight: "600",
  },
  modalFooterNote: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: spacing.md,
    textAlign: "center",
  },
});
