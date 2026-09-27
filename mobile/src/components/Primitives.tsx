import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  type ViewStyle,
} from "react-native";
import { ChevronRight, Package, type LucideIcon } from "lucide-react-native";
import { useRouter } from "expo-router";
import { colors, radius, spacing } from "../theme";
import { products } from "../data";
import { isInStock } from "../model";
import { MiniProductCard } from "./ProductCard";

export function Section({
  title,
  children,
  style,
}: {
  title?: string;
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.section, style]}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function Choice({
  value,
  selectedValue,
  onSelect,
  label,
  detail,
  icon: Icon,
  disabled = false,
}: {
  value: string;
  selectedValue: string;
  onSelect: (val: string) => void;
  label: string;
  detail: string;
  icon: LucideIcon;
  disabled?: boolean;
}) {
  const isSelected = selectedValue === value;

  return (
    <Pressable
      onPress={() => !disabled && onSelect(value)}
      disabled={disabled}
      style={({ pressed }) => [
        styles.choiceCard,
        isSelected && styles.choiceSelected,
        disabled && styles.choiceDisabled,
        pressed && styles.pressed,
      ]}
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected }}
    >
      <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
        {isSelected && <View style={styles.radioDot} />}
      </View>
      <Icon size={20} color={colors.primary} />
      <View style={styles.choiceTextContainer}>
        <Text style={styles.choiceLabel}>{label}</Text>
        <Text style={styles.choiceDetail}>{detail}</Text>
      </View>
    </Pressable>
  );
}

export function Timeline({ cancelled }: { cancelled: boolean }) {
  const steps = [
    { label: "Placed", live: true },
    { label: cancelled ? "Cancelled" : "Confirmed", live: cancelled },
    { label: "Preparing", live: false },
    { label: "On the way", live: false },
  ];

  return (
    <View style={styles.timelineContainer}>
      {steps.map((step, index) => {
        const isCancelledStep = cancelled && index === 1;
        return (
          <View key={step.label} style={styles.timelineRow}>
            <View style={styles.timelineTracker}>
              <View
                style={[
                  styles.timelineDot,
                  step.live
                    ? isCancelledStep
                      ? styles.timelineDotDestructive
                      : styles.timelineDotActive
                    : styles.timelineDotInactive,
                ]}
              />
              {index < steps.length - 1 && <View style={styles.timelineLine} />}
            </View>
            <View style={styles.timelineContent}>
              <Text
                style={[
                  styles.timelineStepLabel,
                  !step.live && styles.timelineStepLabelInactive,
                ]}
              >
                {step.label}
              </Text>
              {!step.live && (
                <Text style={styles.timelineStepSub}>
                  Updates when the store supports this status
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

export function AccountRow({
  icon: Icon,
  label,
  detail,
  onClick,
  to,
}: {
  icon: LucideIcon;
  label: string;
  detail: string;
  onClick?: () => void;
  to?: string;
}) {
  const router = useRouter();

  const handlePress = () => {
    if (to) {
      router.push(to as any);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [styles.accountRow, pressed && styles.pressed]}
    >
      <View style={styles.accountRowIcon}>
        <Icon size={20} color={colors.primary} />
      </View>
      <View style={styles.accountRowText}>
        <Text style={styles.accountRowLabel}>{label}</Text>
        <Text style={styles.accountRowDetail} numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

export function Empty({
  icon: Icon,
  title,
  text,
  action,
  suggest = false,
}: {
  icon?: LucideIcon;
  title: string;
  text: string;
  action?: React.ReactNode;
  suggest?: boolean;
}) {
  const Glyph = Icon ?? Package;

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyContent}>
        <View style={styles.emptyIconCircle}>
          <Glyph size={32} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>{title}</Text>
        <Text style={styles.emptyText}>{text}</Text>
        {action ? <View style={styles.emptyAction}>{action}</View> : null}
      </View>
      {suggest ? <Recommendations /> : null}
    </View>
  );
}

export function Recommendations() {
  const picks = products.filter(isInStock).slice(0, 8);

  return (
    <View style={styles.recContainer}>
      <Text style={styles.recTitle}>Popular near you</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recScrollContent}
      >
        {picks.map((product) => (
          <MiniProductCard key={product.id} product={product} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderBottomWidth: 8,
    borderBottomColor: colors.muted,
    padding: spacing.lg,
    backgroundColor: colors.card,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
  },
  statLabel: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  choiceCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  choiceSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.freshSoft,
  },
  choiceDisabled: {
    opacity: 0.5,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  choiceTextContainer: {
    flex: 1,
  },
  choiceLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
  },
  choiceDetail: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  // Timeline
  timelineContainer: {
    paddingVertical: spacing.xs,
  },
  timelineRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  timelineTracker: {
    alignItems: "center",
    width: 18,
  },
  timelineDot: {
    width: 14,
    height: 14,
    borderRadius: radius.full,
    marginTop: 2,
  },
  timelineDotActive: {
    backgroundColor: colors.primary,
  },
  timelineDotDestructive: {
    backgroundColor: colors.destructive,
  },
  timelineDotInactive: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.border,
  },
  timelineLine: {
    width: 2,
    height: 36,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: spacing.lg,
  },
  timelineStepLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.foreground,
  },
  timelineStepLabelInactive: {
    color: colors.mutedForeground,
  },
  timelineStepSub: {
    fontSize: 11,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  // AccountRow
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  accountRowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  accountRowText: {
    flex: 1,
  },
  accountRowLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.foreground,
  },
  accountRowDetail: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  // Empty
  emptyContainer: {
    flex: 1,
  },
  emptyContent: {
    minHeight: 280,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing["2xl"],
    textAlign: "center",
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.foreground,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: "center",
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  emptyAction: {
    marginTop: spacing.lg,
  },
  // Recommendations
  recContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  recTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: colors.mutedForeground,
    marginBottom: spacing.md,
  },
  recScrollContent: {
    paddingRight: spacing.lg,
  },
  pressed: {
    opacity: 0.8,
  },
});
