import { Redirect, Tabs } from "expo-router";
import { ClipboardList, Package, Store } from "lucide-react-native";
import { useSession } from "../../src/features/vendor/session";
import { Loading, palette } from "../../src/native/ui";

export default function VendorTabs() {
  const { hydrated, session } = useSession();
  if (!hydrated) return <Loading />;
  if (!session) return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: {
          height: 64,
          paddingTop: 6,
          paddingBottom: 8,
          borderTopColor: palette.border,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
      }}
    >
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: "My store",
          tabBarIcon: ({ color, size }) => <Store color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
