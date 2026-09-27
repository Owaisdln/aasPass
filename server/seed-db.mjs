/**
 * seed-db.mjs
 * ============================================================
 * Seeds the Prisma/PostgreSQL database with:
 *   - 5 test users (using real Supabase UUIDs)
 *   - 1 test store
 *   - Categories, Brands, Units
 *   - 12 Master Products with StoreProducts & Inventory
 *   - 1 default address per user
 *
 * Run from:  c:\Users\OWAIS KHAN\Desktop\aasPass\server
 *   node seed-db.mjs
 *
 * Requirements:
 *   - DATABASE_URL must be in server/.env
 *   - Supabase users must already exist (run seed-test-users.mjs first)
 * ============================================================
 */

import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
const { Pool } = pg;
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, ".env") });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SUPABASE_URL = "https://tbyolrpqisqahinsuoof.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRieW9scnBxaXNxYWhpbnN1b29mIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTEzMjE2NCwiZXhwIjoyMTAwNzA4MTY0fQ.0FnBmd0lXTi59ZwXNf4_h2hIYdFfX7606MOwdrVD2LM";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Test Users ────────────────────────────────────────────────────────────────
const TEST_USERS = [
  { email: "fardeen@aaspass.test", firstName: "Fardeen", lastName: "Khan" },
  { email: "ayesha@aaspass.test",  firstName: "Ayesha",  lastName: "Siddiqui" },
  { email: "rahul@aaspass.test",   firstName: "Rahul",   lastName: "Sharma" },
  { email: "priya@aaspass.test",   firstName: "Priya",   lastName: "Verma" },
  { email: "arjun@aaspass.test",   firstName: "Arjun",   lastName: "Mehta" },
];

// ─── Store owner email ────────────────────────────────────────────────────────
const STORE_OWNER_EMAIL = "fardeen@aaspass.test"; // Fardeen owns the store for demo

async function main() {
  console.log("🌱  Starting full DB seed...\n");

  // ── Step 1: Get CUSTOMER and STORE_OWNER role IDs ────────────────────────
  let customerRole = await prisma.role.findFirst({ where: { code: "CUSTOMER" } });
  if (!customerRole) {
    customerRole = await prisma.role.create({
      data: { code: "CUSTOMER", name: "Customer", isSystem: true },
    });
    console.log("  ✅ Created CUSTOMER role");
  }

  let storeOwnerRole = await prisma.role.findFirst({ where: { code: "STORE_OWNER" } });
  if (!storeOwnerRole) {
    storeOwnerRole = await prisma.role.create({
      data: { code: "STORE_OWNER", name: "Store Owner", isSystem: true },
    });
    console.log("  ✅ Created STORE_OWNER role");
  }

  // ── Step 2: Fetch Supabase UUIDs for all test users ──────────────────────
  console.log("\n👤  Syncing test users to Prisma DB...");
  const dbUsers = {};

  for (const u of TEST_USERS) {
    const { data } = await supabase.auth.admin.listUsers();
    const supabaseUser = data?.users?.find((su) => su.email === u.email);

    if (!supabaseUser) {
      console.log(`  ⚠️   ${u.email} not found in Supabase — run seed-test-users.mjs first`);
      continue;
    }

    const role = u.email === STORE_OWNER_EMAIL ? storeOwnerRole : customerRole;

    const dbUser = await prisma.user.upsert({
      where: { id: supabaseUser.id },
      update: { firstName: u.firstName, lastName: u.lastName },
      create: {
        id: supabaseUser.id,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        status: "ACTIVE",
        roleId: role.id,
        emailVerifiedAt: new Date(),
      },
    });

    dbUsers[u.email] = dbUser;
    console.log(`  ✅  ${u.email}  (${dbUser.id})`);
  }

  const storeOwner = dbUsers[STORE_OWNER_EMAIL];
  if (!storeOwner) {
    throw new Error("Store owner not found. Cannot continue.");
  }

  // ── Step 3: Create default addresses for each user ───────────────────────
  console.log("\n📍  Creating default addresses...");
  const addressData = [
    { email: "fardeen@aaspass.test", receiverName: "Fardeen Khan",    receiverPhone: "9876543210", houseNo: "42", area: "Bandra West", city: "Mumbai",    state: "Maharashtra", pincode: "400050" },
    { email: "ayesha@aaspass.test",  receiverName: "Ayesha Siddiqui", receiverPhone: "9876543211", houseNo: "15", area: "Koramangala",  city: "Bengaluru",  state: "Karnataka",   pincode: "560034" },
    { email: "rahul@aaspass.test",   receiverName: "Rahul Sharma",    receiverPhone: "9876543212", houseNo: "8",  area: "Connaught Place", city: "Delhi",   state: "Delhi",       pincode: "110001" },
    { email: "priya@aaspass.test",   receiverName: "Priya Verma",     receiverPhone: "9876543213", houseNo: "22", area: "Jubilee Hills", city: "Hyderabad", state: "Telangana",   pincode: "500033" },
    { email: "arjun@aaspass.test",   receiverName: "Arjun Mehta",     receiverPhone: "9876543214", houseNo: "5",  area: "Andheri East",  city: "Mumbai",    state: "Maharashtra", pincode: "400069" },
  ];

  for (const a of addressData) {
    const user = dbUsers[a.email];
    if (!user) continue;

    const existing = await prisma.address.findFirst({
      where: { userId: user.id, isDefault: true, deletedAt: null },
    });

    if (!existing) {
      await prisma.address.create({
        data: {
          userId: user.id,
          label: "Home",
          receiverName: a.receiverName,
          receiverPhone: a.receiverPhone,
          houseNo: a.houseNo,
          area: a.area,
          city: a.city,
          state: a.state,
          country: "India",
          pincode: a.pincode,
          isDefault: true,
          createdBy: user.id,
          updatedBy: user.id,
        },
      });
      console.log(`  ✅  Address for ${a.email}`);
    } else {
      console.log(`  ⚠️   Address for ${a.email} already exists`);
    }
  }

  // ── Step 4: Seed Categories ───────────────────────────────────────────────
  console.log("\n📂  Seeding categories...");
  const categories = [
    { name: "Fruits & Vegetables", slug: "fruits-vegetables", sortOrder: 1 },
    { name: "Dairy & Eggs",         slug: "dairy-eggs",         sortOrder: 2 },
    { name: "Snacks & Beverages",   slug: "snacks-beverages",   sortOrder: 3 },
    { name: "Staples & Grains",     slug: "staples-grains",     sortOrder: 4 },
    { name: "Personal Care",        slug: "personal-care",      sortOrder: 5 },
  ];

  const catMap = {};
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: { ...c, isActive: true },
    });
    catMap[c.slug] = cat;
    console.log(`  ✅  ${c.name}`);
  }

  // ── Step 5: Seed Brands ───────────────────────────────────────────────────
  console.log("\n🏷️   Seeding brands...");
  const brands = [
    { name: "Amul",    slug: "amul" },
    { name: "Haldiram's", slug: "haldirams" },
    { name: "Tata",    slug: "tata" },
    { name: "Generic", slug: "generic" },
  ];

  const brandMap = {};
  for (const b of brands) {
    const brand = await prisma.brand.upsert({
      where: { slug: b.slug },
      update: {},
      create: { ...b, isActive: true },
    });
    brandMap[b.slug] = brand;
    console.log(`  ✅  ${b.name}`);
  }

  // ── Step 6: Seed Units ────────────────────────────────────────────────────
  console.log("\n📏  Seeding units...");
  const units = [
    { name: "Kilogram",  symbol: "kg" },
    { name: "Gram",      symbol: "g"  },
    { name: "Litre",     symbol: "L"  },
    { name: "Millilitre",symbol: "ml" },
    { name: "Piece",     symbol: "pc" },
    { name: "Pack",      symbol: "pk" },
  ];

  const unitMap = {};
  for (const u of units) {
    const unit = await prisma.unit.upsert({
      where: { symbol: u.symbol },
      update: {},
      create: { ...u, isActive: true },
    });
    unitMap[u.symbol] = unit;
    console.log(`  ✅  ${u.name} (${u.symbol})`);
  }

  // ── Step 7: Seed Master Products ─────────────────────────────────────────
  console.log("\n📦  Seeding master products...");
  const masterProducts = [
    { name: "Fresh Tomatoes",        slug: "fresh-tomatoes",        sku: "FV-001", catSlug: "fruits-vegetables", brandSlug: "generic",    unitSymbol: "kg",  unitValue: 1,    gstRate: 0,  isVeg: true, isFeatured: true  },
    { name: "Baby Spinach",          slug: "baby-spinach",          sku: "FV-002", catSlug: "fruits-vegetables", brandSlug: "generic",    unitSymbol: "g",   unitValue: 250,  gstRate: 0,  isVeg: true, isFeatured: false },
    { name: "Banana (Dozen)",        slug: "banana-dozen",          sku: "FV-003", catSlug: "fruits-vegetables", brandSlug: "generic",    unitSymbol: "pc",  unitValue: 12,   gstRate: 0,  isVeg: true, isFeatured: true  },
    { name: "Amul Full Cream Milk",  slug: "amul-full-cream-milk",  sku: "DE-001", catSlug: "dairy-eggs",        brandSlug: "amul",       unitSymbol: "L",   unitValue: 1,    gstRate: 5,  isVeg: true, isFeatured: true  },
    { name: "Amul Butter",           slug: "amul-butter",           sku: "DE-002", catSlug: "dairy-eggs",        brandSlug: "amul",       unitSymbol: "g",   unitValue: 500,  gstRate: 12, isVeg: true, isFeatured: true  },
    { name: "Farm Fresh Eggs",       slug: "farm-fresh-eggs",       sku: "DE-003", catSlug: "dairy-eggs",        brandSlug: "generic",    unitSymbol: "pc",  unitValue: 12,   gstRate: 0,  isVeg: false,isFeatured: false },
    { name: "Haldiram Aloo Bhujia",  slug: "haldiram-aloo-bhujia",  sku: "SB-001", catSlug: "snacks-beverages",  brandSlug: "haldirams",  unitSymbol: "g",   unitValue: 400,  gstRate: 12, isVeg: true, isFeatured: true  },
    { name: "Tata Tea Gold",         slug: "tata-tea-gold",         sku: "SB-002", catSlug: "snacks-beverages",  brandSlug: "tata",       unitSymbol: "g",   unitValue: 500,  gstRate: 5,  isVeg: true, isFeatured: false },
    { name: "Basmati Rice Premium",  slug: "basmati-rice-premium",  sku: "SG-001", catSlug: "staples-grains",    brandSlug: "tata",       unitSymbol: "kg",  unitValue: 5,    gstRate: 5,  isVeg: true, isFeatured: true  },
    { name: "Toor Dal",              slug: "toor-dal",              sku: "SG-002", catSlug: "staples-grains",    brandSlug: "tata",       unitSymbol: "kg",  unitValue: 1,    gstRate: 5,  isVeg: true, isFeatured: false },
    { name: "Sunflower Oil",         slug: "sunflower-oil",         sku: "SG-003", catSlug: "staples-grains",    brandSlug: "generic",    unitSymbol: "L",   unitValue: 1,    gstRate: 5,  isVeg: true, isFeatured: false },
    { name: "Dove Soap",             slug: "dove-soap",             sku: "PC-001", catSlug: "personal-care",     brandSlug: "generic",    unitSymbol: "pk",  unitValue: 3,    gstRate: 18, isVeg: true, isFeatured: false },
  ];

  const masterProductMap = {};
  for (const p of masterProducts) {
    const mp = await prisma.masterProduct.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        name: p.name,
        slug: p.slug,
        sku: p.sku,
        categoryId: catMap[p.catSlug].id,
        brandId: brandMap[p.brandSlug].id,
        unitId: unitMap[p.unitSymbol].id,
        unitValue: p.unitValue,
        gstRate: p.gstRate,
        isVeg: p.isVeg,
        isFeatured: p.isFeatured,
        status: "ACTIVE",
      },
    });
    masterProductMap[p.slug] = mp;
    console.log(`  ✅  ${p.name}`);
  }

  // ── Step 8: Create Store ──────────────────────────────────────────────────
  console.log("\n🏪  Creating store...");
  let store = await prisma.store.findFirst({
    where: { ownerId: storeOwner.id, deletedAt: null },
  });

  if (!store) {
    store = await prisma.store.create({
      data: {
        ownerId: storeOwner.id,
        name: "aasPass Neighbourhood Store",
        slug: "aaspass-neighbourhood-store",
        description: "Your one-stop neighbourhood store for fresh produce, dairy, snacks and daily essentials.",
        phone: "9000000001",
        email: "store@aaspass.test",
        addressLine1: "Shop No. 1, Ground Floor",
        addressLine2: "Linking Road",
        city: "Mumbai",
        state: "Maharashtra",
        country: "India",
        pincode: "400050",
        latitude: 19.0596,
        longitude: 72.8295,
        status: "ACTIVE",
        verificationStatus: "VERIFIED",
        isOpen: true,
        createdBy: storeOwner.id,
        updatedBy: storeOwner.id,
      },
    });
    console.log(`  ✅  Store created: ${store.name} (${store.id})`);
  } else {
    console.log(`  ⚠️   Store already exists: ${store.name}`);
  }

  // Delivery settings
  const existingSettings = await prisma.storeDeliverySetting.findUnique({
    where: { storeId: store.id },
  });
  if (!existingSettings) {
    await prisma.storeDeliverySetting.create({
      data: {
        storeId: store.id,
        isDeliveryAvailable: true,
        isPickupAvailable: true,
        minimumOrderAmount: 100,
        deliveryCharge: 30,
        freeDeliveryAbove: 500,
        deliveryRadiusKm: 5,
        estimatedDeliveryTime: 30,
        createdBy: storeOwner.id,
        updatedBy: storeOwner.id,
      },
    });
    console.log("  ✅  Delivery settings created");
  }

  // ── Step 9: Create StoreProducts + Inventory ──────────────────────────────
  console.log("\n🛒  Seeding store products & inventory...");
  const storeProductPricing = {
    "fresh-tomatoes":       { mrp: 60,   sellingPrice: 45 },
    "baby-spinach":         { mrp: 40,   sellingPrice: 35 },
    "banana-dozen":         { mrp: 50,   sellingPrice: 45 },
    "amul-full-cream-milk": { mrp: 68,   sellingPrice: 65 },
    "amul-butter":          { mrp: 280,  sellingPrice: 265 },
    "farm-fresh-eggs":      { mrp: 90,   sellingPrice: 80 },
    "haldiram-aloo-bhujia": { mrp: 120,  sellingPrice: 105 },
    "tata-tea-gold":        { mrp: 290,  sellingPrice: 275 },
    "basmati-rice-premium": { mrp: 450,  sellingPrice: 420 },
    "toor-dal":             { mrp: 150,  sellingPrice: 140 },
    "sunflower-oil":        { mrp: 170,  sellingPrice: 160 },
    "dove-soap":            { mrp: 120,  sellingPrice: 110 },
  };

  const storeProductMap = {};
  for (const [slug, pricing] of Object.entries(storeProductPricing)) {
    const mp = masterProductMap[slug];
    if (!mp) continue;

    let sp = await prisma.storeProduct.findFirst({
      where: { storeId: store.id, masterProductId: mp.id, deletedAt: null },
    });

    if (!sp) {
      sp = await prisma.storeProduct.create({
        data: {
          storeId: store.id,
          masterProductId: mp.id,
          mrp: pricing.mrp,
          sellingPrice: pricing.sellingPrice,
          availabilityStatus: "AVAILABLE",
          trackInventory: true,
          isFeatured: mp.isFeatured,
          displayOrder: Object.keys(storeProductPricing).indexOf(slug),
          createdBy: storeOwner.id,
          updatedBy: storeOwner.id,
        },
      });
    }

    // Inventory
    const existingInventory = await prisma.inventory.findUnique({
      where: { storeProductId: sp.id },
    });

    if (!existingInventory) {
      await prisma.inventory.create({
        data: {
          storeProductId: sp.id,
          stockQuantity: 100,
          reservedQuantity: 0,
          lowStockThreshold: 5,
          reorderLevel: 10,
          createdBy: storeOwner.id,
          updatedBy: storeOwner.id,
        },
      });
    }

    storeProductMap[slug] = sp;
    console.log(`  ✅  ${slug} — ₹${pricing.sellingPrice} (stock: 100)`);
  }

  // ── Done ──────────────────────────────────────────────────────────────────
  console.log("\n🎉  DB Seed complete!\n");
  console.log("─────────────────────────────────────────────");
  console.log(`  Store ID:      ${store.id}`);
  console.log(`  Store Name:    ${store.name}`);
  console.log(`  Products:      ${Object.keys(storeProductMap).length}`);
  console.log(`  Test Users:    ${Object.keys(dbUsers).length}`);
  console.log("─────────────────────────────────────────────");
  console.log("\nStore Product IDs (copy these into mobile if needed):");
  for (const [slug, sp] of Object.entries(storeProductMap)) {
    console.log(`  ${slug.padEnd(30)} ${sp.id}`);
  }
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
