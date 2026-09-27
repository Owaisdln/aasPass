import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(rootDir, ".env") });

const bucketName = process.env.SUPABASE_CATALOG_BUCKET || "aaspass-catalog";
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey || !process.env.DATABASE_URL) {
  throw new Error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and DATABASE_URL are required");
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const assets = [
  "fresh-basket.jpg",
  "milk.jpg",
  "bread.jpg",
  "pharmacy-kit.jpg",
  "snacks.jpg",
  "beverage.jpg",
  "personal-care.jpg",
  "household.jpg",
];

const categoryAssets = [
  ["fruits-vegetables", "Fruits & Vegetables", 1, "fresh-basket.jpg"],
  ["dairy-eggs", "Dairy & Eggs", 2, "milk.jpg"],
  ["snacks-beverages", "Snacks & Beverages", 3, "snacks.jpg"],
  ["staples-grains", "Staples & Grains", 4, "household.jpg"],
  ["personal-care", "Personal Care", 5, "personal-care.jpg"],
  ["bakery", "Bakery", 6, "bread.jpg"],
  ["health", "Health", 7, "pharmacy-kit.jpg"],
];

const imageForProduct = (product) => {
  const details = `${product.category.slug} ${product.category.name} ${product.name}`;
  if (/fruit|veget|produce/i.test(details)) return "fresh-basket.jpg";
  if (/dairy|milk|breakfast|egg/i.test(details)) return "milk.jpg";
  if (/bakery|bread|bake/i.test(details)) return "bread.jpg";
  if (/personal.?care|beauty|hygiene/i.test(details)) return "personal-care.jpg";
  if (/health|pharmacy|medical|first.?aid/i.test(details)) return "pharmacy-kit.jpg";
  if (/staple|grain|household|home.?care/i.test(details)) return "household.jpg";
  if (/tea|juice|drink|beverage|soda/i.test(details)) return "beverage.jpg";
  return "snacks.jpg";
};

async function ensureBucket() {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;
  if (buckets.some((bucket) => bucket.name === bucketName)) return;
  const { error } = await supabase.storage.createBucket(bucketName, { public: true });
  if (error) throw error;
}

async function uploadAsset(file) {
  const objectKey = `catalog/${file}`;
  const body = await readFile(join(rootDir, "..", "mobile", "assets", file));
  const { error } = await supabase.storage.from(bucketName).upload(objectKey, body, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (error) throw error;
  return objectKey;
}

async function main() {
  await ensureBucket();
  const uploaded = new Map();
  for (const file of assets) uploaded.set(file, await uploadAsset(file));

  for (const [slug, name, sortOrder, file] of categoryAssets) {
    await prisma.category.upsert({
      where: { slug },
      update: { imageKey: uploaded.get(file) },
      create: { slug, name, sortOrder, isActive: true, imageKey: uploaded.get(file) },
    });
  }

  const products = await prisma.masterProduct.findMany({
    where: { status: "ACTIVE" },
    include: { category: true },
  });
  for (const product of products) {
    const objectKey = uploaded.get(imageForProduct(product));
    const existing = await prisma.productImage.findFirst({
      where: { masterProductId: product.id, imageType: "PRIMARY" },
    });
    if (existing) {
      await prisma.productImage.update({ where: { id: existing.id }, data: { objectKey, isPrimary: true, displayOrder: 1 } });
    } else {
      await prisma.productImage.create({
        data: { masterProductId: product.id, objectKey, imageType: "PRIMARY", isPrimary: true, displayOrder: 1 },
      });
    }
  }

  console.log(`Uploaded ${assets.length} catalog images and linked ${products.length} active products in bucket ${bucketName}.`);
}

main()
  .catch((error) => {
    console.error("Catalog asset seeding failed:", error instanceof Error ? error.message : "Unknown error");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
