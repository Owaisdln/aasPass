# Module — Catalog

> [← Back to Server Index](./README.md)

---

## Purpose

The `CatalogModule` manages the **product catalog master data** — the global, store-agnostic reference tables that define what products exist and how they are classified. Implemented sub-domains:

1. **Categories** — hierarchical product taxonomy (`catalog/categories`)
2. **Brands** — product brand registry (`catalog/brands`)
3. **Units** — units of measure (`catalog/units`)
4. **Master Products** — global product definitions (`catalog/master-products`)
5. **Product Images** — image metadata attached to master products (`catalog/product-images`)
6. **Store Products** — per-store listings that map master products into a store's inventory (`catalog/store-products`)

All routes are protected by `SupabaseAuthGuard` at the controller class level — every request requires a valid Supabase JWT.

---

## Module Structure

```
src/modules/catalog/
├── catalog.module.ts
├── categories/
│   ├── controllers/
│   │   └── categories.controller.ts
│   ├── dto/
│   │   ├── create-category.dto.ts
│   │   ├── update-category.dto.ts
│   │   └── category-response.dto.ts
│   ├── mappers/
│   │   └── category.mapper.ts
│   ├── services/
│   │   └── categories.service.ts
│   └── types/
│       └── category.types.ts
├── brands/
│   ├── controllers/
│   │   └── brands.controller.ts
│   ├── dto/
│   │   ├── create-brand.dto.ts
│   │   ├── update-brand.dto.ts
│   │   └── brand-response.dto.ts
│   ├── mappers/
│   │   └── brand.mapper.ts
│   ├── services/
│   │   └── brands.service.ts
│   └── types/
│       └── brand.types.ts
├── units/
│   ├── controllers/
│   │   └── units.controller.ts
│   ├── dto/
│   │   ├── create-unit.dto.ts
│   │   ├── update-unit.dto.ts
│   │   └── unit-response.dto.ts
│   ├── mappers/
│   │   └── unit.mapper.ts
│   ├── services/
│   │   └── units.service.ts
│   └── types/
│       └── unit.types.ts
├── master-products/
│   ├── controllers/
│   │   └── master-products.controller.ts
│   ├── dto/
│   │   ├── create-master-product.dto.ts
│   │   ├── update-master-product.dto.ts
│   │   └── master-product-response.dto.ts
│   ├── mappers/
│   │   └── master-product.mapper.ts
│   ├── services/
│   │   └── master-products.service.ts
│   └── types/
│       └── master-product.types.ts
├── product-images/
│   ├── controllers/
│   │   └── product-images.controller.ts
│   ├── dto/
│   │   ├── create-product-image.dto.ts
│   │   ├── update-product-image.dto.ts
│   │   └── product-image-response.dto.ts
│   ├── mappers/
│   │   └── product-image.mapper.ts
│   ├── services/
│   │   └── product-images.service.ts
│   └── types/
│       └── product-image.types.ts
└── store-products/
    ├── controllers/
    │   └── store-products.controller.ts
    ├── dto/
    │   ├── create-store-product.dto.ts
    │   ├── update-store-product.dto.ts
    │   └── store-product-response.dto.ts
    ├── mappers/
    │   └── store-product.mapper.ts
    ├── services/
    │   └── store-products.service.ts
    └── types/
        └── store-product.types.ts
```

---

## Module Registration (`catalog.module.ts`)

| Property | Value |
|---|---|
| **Imports** | `PrismaModule`, `AuthModule` |
| **Controllers** | `CategoriesController`, `BrandsController`, `UnitsController`, `MasterProductsController`, `ProductImagesController`, `StoreProductsController` |
| **Providers** | `CategoriesService`, `CategoryMapper`, `BrandsService`, `BrandMapper`, `UnitsService`, `UnitMapper`, `MasterProductsService`, `MasterProductMapper`, `ProductImagesService`, `ProductImageMapper`, `StoreProductsService`, `StoreProductMapper` |
| **Exports** | *(none)* |

`AuthModule` is imported to provide `SupabaseAuthGuard` and the `@AuthenticatedUser()` decorator to all controllers.

---

## Part 1 — Categories

### Prisma Type Utilities (`src/modules/catalog/categories/types/category.types.ts`)

#### `CATEGORY_WITH_PARENT_INCLUDE`

```typescript
export const CATEGORY_WITH_PARENT_INCLUDE = {
  parentCategory: true,
} as const satisfies Prisma.CategoryInclude;
```

Includes the `parentCategory` relation on every full category query. Typed with `as const satisfies` for compile-time correctness.

#### `CategoryWithParent`

```typescript
export type CategoryWithParent = Prisma.CategoryGetPayload<{
  include: typeof CATEGORY_WITH_PARENT_INCLUDE;
}>;
```

Derived type representing a `Category` record with its `parentCategory` relation loaded. Used as the parameter type for `CategoryMapper.toResponseDto()` and the return type of service methods that query with the full include.

---

### Data Transfer Objects

#### `CreateCategoryDto` (`src/modules/catalog/categories/dto/create-category.dto.ts`)

| Field | Type | Validations |
|---|---|---|
| `name` | `string` | `@IsString`, `@MaxLength(150)` |
| `parentCategoryId` | `string` (optional) | `@IsOptional`, `@IsUUID` |
| `description` | `string` (optional) | `@IsOptional`, `@IsString`, `@MaxLength(2000)` |
| `imageKey` | `string` (optional) | `@IsOptional`, `@IsString`, `@MaxLength(500)` |
| `iconKey` | `string` (optional) | `@IsOptional`, `@IsString`, `@MaxLength(500)` |
| `sortOrder` | `number` (optional) | `@IsOptional`, `@IsInt`, `@Min(0)` — defaults to `0` |
| `isActive` | `boolean` (optional) | `@IsOptional` — defaults to `true` |

#### `UpdateCategoryDto` (`src/modules/catalog/categories/dto/update-category.dto.ts`)

All fields optional — same fields as `CreateCategoryDto` but every field is wrapped with `@IsOptional`.

> **Disconnecting a parent:** Sending `parentCategoryId: null` (or omitting it with `undefined`) during update disconnects the parent. The service uses a Prisma `disconnect: true` relation write when `dto.parentCategoryId` is an empty/falsy value.

#### `CategoryResponseDto` (`src/modules/catalog/categories/dto/category-response.dto.ts`)

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID |
| `parentCategoryId` | `string \| null` | `null` for root categories |
| `name` | `string` | |
| `slug` | `string` | URL-safe, auto-generated from `name` |
| `description` | `string \| null` | |
| `imageKey` | `string \| null` | S3/storage object key |
| `iconKey` | `string \| null` | S3/storage object key |
| `sortOrder` | `number` | Integer, default `0` |
| `isActive` | `boolean` | |
| `createdAt` | `Date` | |
| `updatedAt` | `Date` | |

---

### Mapper (`src/modules/catalog/categories/mappers/category.mapper.ts`)

An `@Injectable()` class with two methods:

#### `toResponseDto(category: CategoryWithParent): CategoryResponseDto`

Maps a fully-included Prisma entity (with `parentCategory` relation loaded) to the response DTO.

#### `toResponseDtoWithoutRelation(category: { ... }): CategoryResponseDto`

Maps a plain Prisma entity without the relation include. Accepts an inline-typed object matching the flat `Category` shape. Used in contexts where the relation is not needed to avoid unnecessary DB joins.

---

### `CategoriesService` (`src/modules/catalog/categories/services/categories.service.ts`)

Injected dependencies: `PrismaService`, `CategoryMapper`.

All read/write queries filter by `deletedAt: null` — soft-deleted categories are invisible to all public methods.

#### `create(userId: string, dto: CreateCategoryDto): Promise<CategoryResponseDto>`

| Step | Action | Error |
|---|---|---|
| 1 | Trims `dto.name`; throws if empty after trim | `ConflictException` |
| 2 | `generateUniqueSlug(name)` | — |
| 3 | If `dto.parentCategoryId` provided → `assertParentCategoryExists(parentCategoryId)` | `NotFoundException` |
| 4 | `prisma.category.create(...)` with `CATEGORY_WITH_PARENT_INCLUDE` | — |
| 5 | `categoryMapper.toResponseDto(category)` | — |
| catch | `handlePrismaError(error)` — P2002 → `ConflictException`, P2025 → `NotFoundException` | — |

Defaults: `sortOrder = 0`, `isActive = true`, `description/imageKey/iconKey = null` if not provided.

#### `findAll(): Promise<CategoryResponseDto[]>`

Returns all non-deleted categories, ordered by `sortOrder asc, name asc`, with `parentCategory` included.

#### `findById(id: string): Promise<CategoryResponseDto>`

Finds a single non-deleted category by `id`. Throws `NotFoundException('Category not found.')` if absent.

#### `update(userId: string, id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto>`

| Step | Action | Error |
|---|---|---|
| 1 | `findCategoryRecord(id)` — fetches the existing category | `NotFoundException` |
| 2 | If `dto.parentCategoryId !== undefined` → `validateParentChange(categoryId, dto.parentCategoryId)` | `ConflictException` (self-reference or circular) |
| 3 | Builds `updateData: Prisma.CategoryUpdateInput` with spread-guard pattern | — |
| 4 | If `dto.name` changed (case-insensitive compare) → `generateUniqueSlug(name, id)` | — |
| 5 | `prisma.category.update(...)` with `CATEGORY_WITH_PARENT_INCLUDE` | — |
| 6 | `categoryMapper.toResponseDto(category)` | — |
| catch | `handlePrismaError(error)` | — |

Parent update uses Prisma relation writes: `{ connect: { id } }` to set a new parent, `{ disconnect: true }` to unset it.

#### `remove(userId: string, id: string): Promise<void>`

Soft-delete with two guard checks:

| Check | Query | Error |
|---|---|---|
| Has active subcategories? | `prisma.category.count({ where: { parentCategoryId, deletedAt: null } })` | `ConflictException('Cannot delete a category that has active subcategories.')` |
| Has active products? | `prisma.masterProduct.count({ where: { categoryId, deletedAt: null } })` | `ConflictException('Cannot delete a category that has active products.')` |

On success: sets `deletedAt = new Date()`, `isActive = false`, `updatedBy = userId`.

#### Private Helpers

| Method | Purpose |
|---|---|
| `findCategoryRecord(id)` | Fetches raw `Category` (no relations); throws `NotFoundException` if soft-deleted or absent |
| `assertParentCategoryExists(parentCategoryId)` | Verifies parent exists and is not soft-deleted |
| `validateParentChange(categoryId, parentCategoryId)` | Rejects self-reference (`A cannot be its own parent`) and circular ancestry (walks the parent chain upward until `null` or cycle detected) |
| `generateUniqueSlug(name, excludeCategoryId?)` | `slugify(name)` → loop checking uniqueness; appends `-2`, `-3`, … on collision; `excludeCategoryId` excludes current record on update |
| `slugify(value)` | NFKD normalise → strip diacritics → lowercase → replace non-alphanumeric with `-` → trim leading/trailing hyphens; throws `ConflictException` if result is empty |
| `handlePrismaError(error)` | Maps P2002 → `ConflictException`, P2025 → `NotFoundException`; re-throws all others |

---

### Categories Endpoints

#### `POST /catalog/categories`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Request Body** | `CreateCategoryDto` |
| **Response** | `CategoryResponseDto` |

Creates a new category. Slug is auto-generated from `name` with collision resolution.

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | `parentCategoryId` does not exist |
| `409 Conflict` | Name produces an empty slug; or slug uniqueness DB error |

---

#### `GET /catalog/categories`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Response** | `CategoryResponseDto[]` |

Returns all active (non-deleted) categories ordered by `sortOrder asc, name asc`.

---

#### `GET /catalog/categories/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the category |
| **Response** | `CategoryResponseDto` |

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Category not found or soft-deleted |

---

#### `PATCH /catalog/categories/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the category |
| **Request Body** | `UpdateCategoryDto` |
| **Response** | `CategoryResponseDto` (updated) |

Partial update with spread-guard pattern. Slug is only regenerated if `name` changes (case-insensitive comparison). Parent changes are validated for circular relationships.

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Category not found; or new `parentCategoryId` not found |
| `409 Conflict` | Self-reference or circular parent hierarchy detected |

---

#### `DELETE /catalog/categories/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the category |
| **Response** | `204 No Content` (void) |

Soft-delete — sets `deletedAt` and `isActive = false`. Blocked if the category has active subcategories or active products.

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Category not found or already deleted |
| `409 Conflict` | Category has active subcategories or active products |

---

## Part 2 — Brands

### Type Alias (`src/modules/catalog/brands/types/brand.types.ts`)

```typescript
export type BrandEntity = Brand;
```

A simple re-export alias for the Prisma `Brand` type. `BrandsService` uses the native `Brand` type directly since brands have no relations to include.

---

### Data Transfer Objects

#### `CreateBrandDto` (`src/modules/catalog/brands/dto/create-brand.dto.ts`)

| Field | Type | Validations |
|---|---|---|
| `name` | `string` | `@IsString`, `@IsNotEmpty`, `@MaxLength(150)` |
| `logoKey` | `string` (optional) | `@IsOptional`, `@IsString`, `@MaxLength(500)` |

#### `UpdateBrandDto` (`src/modules/catalog/brands/dto/update-brand.dto.ts`)

| Field | Type | Validations |
|---|---|---|
| `name` | `string` (optional) | `@IsOptional`, `@IsString`, `@IsNotEmpty`, `@MaxLength(150)` |
| `logoKey` | `string \| null` (optional) | `@IsOptional`, `@IsString`, `@MaxLength(500)` — send `null` to clear |
| `isActive` | `boolean` (optional) | `@IsOptional`, `@IsBoolean` |

#### `BrandResponseDto` (`src/modules/catalog/brands/dto/brand-response.dto.ts`)

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID |
| `name` | `string` | |
| `slug` | `string` | URL-safe, auto-generated from `name` |
| `logoKey` | `string \| null` | S3/storage object key |
| `isActive` | `boolean` | |
| `createdAt` | `Date` | |
| `updatedAt` | `Date` | |

---

### Mapper (`src/modules/catalog/brands/mappers/brand.mapper.ts`)

A **static** class (not `@Injectable()`) — all methods are called as `BrandMapper.toResponse(brand)`.

#### `static toResponse(brand: Brand): BrandResponseDto`

Direct field mapping from the Prisma `Brand` entity. No Decimal conversions required.

> **Design note:** `BrandMapper` is static (unlike `CategoryMapper` which is injectable) because `BrandsService` uses no DI-required dependencies in the mapper and the mapping logic is trivially flat. `BrandMapper` is still registered as a provider in `CatalogModule` for future flexibility.

---

### `BrandsService` (`src/modules/catalog/brands/services/brands.service.ts`)

Injected dependencies: `PrismaService` only (mapper is called statically).

All read/write queries filter by `deletedAt: null` — soft-deleted brands are invisible to all public methods.

#### `create(userId: string, dto: CreateBrandDto): Promise<BrandResponseDto>`

| Step | Action | Error |
|---|---|---|
| 1 | Trims `dto.name`; case-insensitive duplicate check across non-deleted brands | `ConflictException('A brand with this name already exists')` |
| 2 | `generateUniqueSlug(name)` | — |
| 3 | `prisma.brand.create(...)` — `logoKey` trimmed or `null`; `isActive` starts as `true` | — |
| 4 | `BrandMapper.toResponse(brand)` | — |
| catch | `handlePrismaError(error)` | — |

#### `findAll(): Promise<BrandResponseDto[]>`

Returns all non-deleted brands ordered by `name asc`.

#### `findById(id: string): Promise<BrandResponseDto>`

Delegates to `findActiveBrand(id)` then maps. Throws `NotFoundException('Brand not found')` if absent or soft-deleted.

#### `update(userId: string, id: string, dto: UpdateBrandDto): Promise<BrandResponseDto>`

| Step | Action | Error |
|---|---|---|
| 1 | `findActiveBrand(id)` | `NotFoundException` |
| 2 | Builds `data: Prisma.BrandUpdateInput` with spread-guard pattern | — |
| 3 | If `dto.name` provided and differs (case-insensitive) → check for duplicate name (excluding current ID) | `ConflictException` |
| 4 | If name changed → `generateUniqueSlug(name, id)` | — |
| 5 | `prisma.brand.update(...)` | — |
| 6 | `BrandMapper.toResponse(brand)` | — |
| catch | `handlePrismaError(error)` | — |

#### `remove(userId: string, id: string): Promise<void>`

Guard check: counts active (non-deleted) `MasterProduct` records linked to this brand. Blocks deletion if `productCount > 0`.

On success: sets `deletedAt = new Date()`, `isActive = false`, `updatedBy = userId`.

**Error Responses:**

| Status | Condition |
|---|---|
| `409 Conflict` | Brand has active products |

#### Private Helpers

| Method | Purpose |
|---|---|
| `findActiveBrand(id)` | `prisma.brand.findFirst({ where: { id, deletedAt: null } })`; throws `NotFoundException` if absent |
| `generateUniqueSlug(name, excludeId?)` | `slugify(name)` → loop with uniqueness check; appends `-2`, `-3`, … on collision; `excludeId` excludes self on update |
| `slugify(value)` | Lowercase → replace non-alphanumeric with `-` → trim hyphens; falls back to `'brand'` |
| `handlePrismaError(error)` | Maps P2002 → `ConflictException`, P2025 → `NotFoundException`; re-throws all others |

---

### Brands Endpoints

#### `POST /catalog/brands`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Request Body** | `CreateBrandDto` |
| **Response** | `BrandResponseDto` |

Creates a new brand. Name is checked case-insensitively for duplicates. Slug is auto-generated with collision resolution.

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `409 Conflict` | Brand with the same name already exists |

---

#### `GET /catalog/brands`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Response** | `BrandResponseDto[]` |

Returns all active (non-deleted) brands ordered by `name asc`.

---

#### `GET /catalog/brands/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the brand |
| **Response** | `BrandResponseDto` |

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Brand not found or soft-deleted |

---

#### `PATCH /catalog/brands/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the brand |
| **Request Body** | `UpdateBrandDto` |
| **Response** | `BrandResponseDto` (updated) |

Partial update. Slug is only regenerated if `name` changes (case-insensitive). Duplicate name check excludes the current brand.

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Brand not found |
| `409 Conflict` | Another brand with the same name already exists |

---

#### `DELETE /catalog/brands/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the brand |
| **Response** | `204 No Content` (void) |

Soft-delete — sets `deletedAt` and `isActive = false`. Blocked if the brand has active products.

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Brand not found or already deleted |
| `409 Conflict` | Brand is associated with active products |

---

## Part 3 — Units

### Type Alias (`src/modules/catalog/units/types/unit.types.ts`)

```typescript
export type UnitEntity = Unit;
```

A simple re-export alias for the Prisma `Unit` type. Units have no relations to include.

---

### Data Transfer Objects

#### `CreateUnitDto` (`src/modules/catalog/units/dto/create-unit.dto.ts`)

| Field | Type | Validations |
|---|---|---|
| `name` | `string` | `@IsString`, `@IsNotEmpty`, `@MaxLength(100)` |
| `symbol` | `string` | `@IsString`, `@IsNotEmpty`, `@MaxLength(20)` |
| `description` | `string` (optional) | `@IsOptional`, `@IsString` |

#### `UpdateUnitDto` (`src/modules/catalog/units/dto/update-unit.dto.ts`)

| Field | Type | Validations |
|---|---|---|
| `name` | `string` (optional) | `@IsOptional`, `@IsString`, `@IsNotEmpty`, `@MaxLength(100)` |
| `symbol` | `string` (optional) | `@IsOptional`, `@IsString`, `@IsNotEmpty`, `@MaxLength(20)` |
| `description` | `string \| null` (optional) | `@IsOptional`, `@IsString` — send `null` to clear |
| `isActive` | `boolean` (optional) | `@IsOptional`, `@IsBoolean` |

#### `UnitResponseDto` (`src/modules/catalog/units/dto/unit-response.dto.ts`)

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID |
| `name` | `string` | |
| `symbol` | `string` | Short abbreviation, e.g. `kg`, `ml` |
| `description` | `string \| null` | |
| `isActive` | `boolean` | |
| `createdAt` | `Date` | |
| `updatedAt` | `Date` | |

---

### Mapper (`src/modules/catalog/units/mappers/unit.mapper.ts`)

A **static** class — all methods are called as `UnitMapper.toResponse(unit)`.

#### `static toResponse(unit: Unit): UnitResponseDto`

Direct field mapping from the Prisma `Unit` entity.

---

### `UnitsService` (`src/modules/catalog/units/services/units.service.ts`)

Injected dependencies: `PrismaService` only (mapper is called statically).

All read/write queries filter by `deletedAt: null` — soft-deleted units are invisible to all public methods.

#### `create(userId: string, dto: CreateUnitDto): Promise<UnitResponseDto>`

| Step | Action | Error |
|---|---|---|
| 1 | Trims `dto.name` and `dto.symbol`; performs case-insensitive `OR` duplicate check on both fields across non-deleted units | `ConflictException('A unit with this name or symbol already exists')` |
| 2 | `prisma.unit.create(...)` — `description` trimmed or `null`; `isActive` starts as `true` | — |
| 3 | `UnitMapper.toResponse(unit)` | — |
| catch | `handlePrismaError(error)` | — |

#### `findAll(): Promise<UnitResponseDto[]>`

Returns all non-deleted units ordered by `name asc`.

#### `findById(id: string): Promise<UnitResponseDto>`

Delegates to `findActiveUnit(id)` then maps. Throws `NotFoundException('Unit not found')` if absent or soft-deleted.

#### `update(userId: string, id: string, dto: UpdateUnitDto): Promise<UnitResponseDto>`

| Step | Action | Error |
|---|---|---|
| 1 | `findActiveUnit(id)` | `NotFoundException` |
| 2 | Trims `name`/`symbol` if provided; throws if either becomes empty after trim | `ConflictException` |
| 3 | If `name` or `symbol` changed (case-insensitive) → `OR` duplicate check excluding current ID | `ConflictException('A unit with this name or symbol already exists')` |
| 4 | Builds `data: Prisma.UnitUpdateInput` with spread-guard pattern | — |
| 5 | `prisma.unit.update(...)` | — |
| 6 | `UnitMapper.toResponse(unit)` | — |
| catch | `handlePrismaError(error)` | — |

#### `remove(userId: string, id: string): Promise<void>`

Guard check: counts active (non-deleted) `MasterProduct` records with `unitId` matching this unit. Blocks deletion if `productCount > 0`.

On success: sets `deletedAt = new Date()`, `isActive = false`, `updatedBy = userId`.

#### Private Helpers

| Method | Purpose |
|---|---|
| `findActiveUnit(id)` | `prisma.unit.findFirst({ where: { id, deletedAt: null } })`; throws `NotFoundException('Unit not found')` if absent |
| `handlePrismaError(error)` | Maps P2002 → `ConflictException('A unit with the provided unique value already exists')`, P2025 → `NotFoundException('Unit not found')`; re-throws all others |

---

### Units Endpoints

#### `POST /catalog/units`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Request Body** | `CreateUnitDto` |
| **Response** | `UnitResponseDto` |

Creates a new unit of measure. Both `name` and `symbol` are checked case-insensitively for duplicates in a single `OR` query.

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `409 Conflict` | Unit with the same name or symbol already exists |

---

#### `GET /catalog/units`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Response** | `UnitResponseDto[]` |

Returns all active (non-deleted) units ordered by `name asc`.

---

#### `GET /catalog/units/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the unit |
| **Response** | `UnitResponseDto` |

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Unit not found or soft-deleted |

---

#### `PATCH /catalog/units/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the unit |
| **Request Body** | `UpdateUnitDto` |
| **Response** | `UnitResponseDto` (updated) |

Partial update. Duplicate check is only performed when `name` or `symbol` actually changes (case-insensitive). The check excludes the current unit.

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Unit not found |
| `409 Conflict` | Another unit with the same name or symbol already exists; or name/symbol is empty after trim |

---

#### `DELETE /catalog/units/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the unit |
| **Response** | `204 No Content` (void) |

Soft-delete — sets `deletedAt` and `isActive = false`. Blocked if the unit is referenced by active master products.

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Unit not found or already deleted |
| `409 Conflict` | Unit is associated with active products |

---

## Part 4 — Master Products

### Type Alias (`src/modules/catalog/master-products/types/master-product.types.ts`)

```typescript
export type MasterProductEntity = MasterProduct;
```

A simple re-export alias for the Prisma `MasterProduct` type. Master products have no relation includes at the service level.

---

### Data Transfer Objects

#### `CreateMasterProductDto` (`src/modules/catalog/master-products/dto/create-master-product.dto.ts`)

| Field | Type | Validations |
|---|---|---|
| `categoryId` | `string` | `@IsUUID` |
| `brandId` | `string \| null` (optional) | `@IsOptional`, `@IsUUID` |
| `unitId` | `string` | `@IsUUID` |
| `name` | `string` | `@IsString`, `@IsNotEmpty`, `@MaxLength(200)` |
| `description` | `string \| null` (optional) | `@IsOptional`, `@IsString` |
| `sku` | `string` | `@IsString`, `@IsNotEmpty`, `@MaxLength(100)` |
| `barcode` | `string \| null` (optional) | `@IsOptional`, `@IsString`, `@MaxLength(100)` |
| `hsnCode` | `string \| null` (optional) | `@IsOptional`, `@IsString`, `@MaxLength(20)` |
| `gstRate` | `number` | `@IsNumber({ maxDecimalPlaces: 2 })`, `@Min(0)`, `@Max(100)` |
| `unitValue` | `number` | `@IsNumber({ maxDecimalPlaces: 2 })`, `@Min(0)` |
| `isVeg` | `boolean \| null` (optional) | `@IsOptional`, `@IsBoolean` |
| `isFeatured` | `boolean` (optional) | `@IsOptional`, `@IsBoolean` — defaults to `false` |

#### `UpdateMasterProductDto` (`src/modules/catalog/master-products/dto/update-master-product.dto.ts`)

All fields optional — same fields as `CreateMasterProductDto` with every field wrapped in `@IsOptional`, plus:

| Field | Type | Validations |
|---|---|---|
| `status` | `'ACTIVE' \| 'INACTIVE' \| 'DISCONTINUED'` (optional) | `@IsOptional`, `@IsIn(['ACTIVE', 'INACTIVE', 'DISCONTINUED'])` |

> **Disconnecting a brand:** Send `brandId: null` to remove the brand association. The service uses Prisma `{ disconnect: true }` relation write.

#### `MasterProductResponseDto` (`src/modules/catalog/master-products/dto/master-product-response.dto.ts`)

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID |
| `categoryId` | `string` | UUID of the linked category |
| `brandId` | `string \| null` | UUID of the linked brand, or `null` |
| `unitId` | `string` | UUID of the linked unit |
| `name` | `string` | |
| `slug` | `string` | URL-safe, auto-generated from `name` |
| `description` | `string \| null` | |
| `sku` | `string` | Globally unique stock-keeping unit code |
| `barcode` | `string \| null` | |
| `hsnCode` | `string \| null` | Harmonised System nomenclature code |
| `gstRate` | `string` | Serialised from Prisma `Decimal` |
| `unitValue` | `string` | Serialised from Prisma `Decimal` |
| `isVeg` | `boolean \| null` | `null` = not applicable |
| `isFeatured` | `boolean` | |
| `status` | `'ACTIVE' \| 'INACTIVE' \| 'DISCONTINUED'` | |
| `createdAt` | `Date` | |
| `updatedAt` | `Date` | |

> **Decimal serialisation:** `gstRate` and `unitValue` are stored as `Decimal` in Prisma and serialised to `string` in the response DTO via `.toString()` to avoid floating-point precision loss.

---

### Mapper (`src/modules/catalog/master-products/mappers/master-product.mapper.ts`)

A **static** class — all methods are called as `MasterProductMapper.toResponse(product)`.

#### `static toResponse(product: MasterProduct): MasterProductResponseDto`

Direct field mapping from the Prisma `MasterProduct` entity. `gstRate` and `unitValue` are converted from `Decimal` to `string`.

---

### `MasterProductsService` (`src/modules/catalog/master-products/services/master-products.service.ts`)

Injected dependencies: `PrismaService` only (mapper is called statically).

All read/write queries filter by `deletedAt: null` — soft-deleted products are invisible to all public methods.

#### `create(userId: string, dto: CreateMasterProductDto): Promise<MasterProductResponseDto>`

| Step | Action | Error |
|---|---|---|
| 1 | Trims `name`, `sku`, `barcode`, `hsnCode` | — |
| 2 | `validateReferences(categoryId, brandId, unitId)` — asserts all FK targets are active and non-deleted | `NotFoundException` |
| 3 | `ensureSkuAvailable(sku)` — case-insensitive global uniqueness check | `ConflictException('A product with this SKU already exists')` |
| 4 | If `barcode` provided → `ensureBarcodeAvailable(barcode)` | `ConflictException('A product with this barcode already exists')` |
| 5 | `generateUniqueSlug(name)` | — |
| 6 | `prisma.masterProduct.create(...)` — `status` defaults to `ProductStatus.ACTIVE`; `isFeatured` defaults to `false` | — |
| 7 | `MasterProductMapper.toResponse(product)` | — |
| catch | `handlePrismaError(error)` | — |

#### `findAll(): Promise<MasterProductResponseDto[]>`

Returns all non-deleted master products ordered by `name asc`.

#### `findById(id: string): Promise<MasterProductResponseDto>`

Delegates to `findActiveProduct(id)` then maps. Throws `NotFoundException('Master product not found')` if absent or soft-deleted.

#### `update(userId: string, id: string, dto: UpdateMasterProductDto): Promise<MasterProductResponseDto>`

| Step | Action | Error |
|---|---|---|
| 1 | `findActiveProduct(id)` | `NotFoundException` |
| 2 | If any of `categoryId`, `brandId`, `unitId` provided → `validateReferences(...)` using existing values as fallback | `NotFoundException` |
| 3 | If `dto.name` provided and differs (case-insensitive) → `generateUniqueSlug(name, id)` | — |
| 4 | If `dto.sku` provided and differs (case-insensitive) → `ensureSkuAvailable(sku, id)` | `ConflictException` |
| 5 | If `dto.barcode` provided and non-null and differs → `ensureBarcodeAvailable(barcode, id)` | `ConflictException` |
| 6 | Builds `data: Prisma.MasterProductUpdateInput` with spread-guard and relation writes | — |
| 7 | `prisma.masterProduct.update(...)` | — |
| 8 | `MasterProductMapper.toResponse(product)` | — |
| catch | `handlePrismaError(error)` | — |

Brand uses Prisma relation writes: `{ connect: { id } }` to set a brand, `{ disconnect: true }` when `dto.brandId` is `null`.

#### `remove(userId: string, id: string): Promise<void>`

Guard check: counts active (non-deleted) `StoreProduct` records linked to this master product. Blocks deletion if `storeProductCount > 0`.

On success: sets `deletedAt = new Date()`, `status = ProductStatus.DISCONTINUED`, `updatedBy = userId`.

**Error Responses:**

| Status | Condition |
|---|---|
| `409 Conflict` | Product is associated with active store listings |

#### Private Helpers

| Method | Purpose |
|---|---|
| `findActiveProduct(id)` | `prisma.masterProduct.findFirst({ where: { id, deletedAt: null } })`; throws `NotFoundException('Master product not found')` if absent |
| `validateReferences(categoryId, brandId, unitId)` | Verifies category, unit (both `isActive: true, deletedAt: null`) and brand (if provided) exist; throws `NotFoundException` for each missing FK |
| `ensureSkuAvailable(sku, excludeId?)` | Case-insensitive global uniqueness check for SKU; `excludeId` excludes self on update |
| `ensureBarcodeAvailable(barcode, excludeId?)` | Case-insensitive global uniqueness check for barcode; `excludeId` excludes self on update |
| `generateUniqueSlug(name, excludeId?)` | `slugify(name)` → loop with uniqueness check; appends `-2`, `-3`, … on collision; `excludeId` excludes self on update; falls back to `'product'` |
| `slugify(value)` | Lowercase → trim → replace non-alphanumeric with `-` → trim hyphens; falls back to `'product'` |
| `handlePrismaError(error)` | Maps P2002 → `ConflictException('A product with the provided unique value already exists')`, P2025 → `NotFoundException('Master product not found')`; re-throws all others |

---

### Master Products Endpoints

#### `POST /catalog/master-products`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Request Body** | `CreateMasterProductDto` |
| **Response** | `MasterProductResponseDto` |

Creates a new master product. Validates that `categoryId`, `brandId`, and `unitId` reference active, non-deleted entities. SKU and barcode uniqueness are checked globally.

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Referenced category, brand, or unit not found or inactive |
| `409 Conflict` | Duplicate SKU or barcode |

---

#### `GET /catalog/master-products`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Response** | `MasterProductResponseDto[]` |

Returns all active (non-deleted) master products ordered by `name asc`.

---

#### `GET /catalog/master-products/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the master product |
| **Response** | `MasterProductResponseDto` |

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Master product not found or soft-deleted |

---

#### `PATCH /catalog/master-products/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the master product |
| **Request Body** | `UpdateMasterProductDto` |
| **Response** | `MasterProductResponseDto` (updated) |

Partial update with spread-guard pattern. All uniqueness and reference checks are conditional on which fields are provided.

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Master product not found; or referenced category/brand/unit not found or inactive |
| `409 Conflict` | Duplicate SKU, barcode, or empty name/SKU after trim |

---

#### `DELETE /catalog/master-products/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the master product |
| **Response** | `204 No Content` (void) |

Soft-delete — sets `deletedAt` and `status = DISCONTINUED`. Blocked if the product is referenced by active store listings.

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Master product not found or already deleted |
| `409 Conflict` | Product is associated with active store listings |

---

## Part 5 — Product Images

### Type Alias (`src/modules/catalog/product-images/types/product-image.types.ts`)

```typescript
export type ProductImageEntity = ProductImage;
```

A simple re-export alias for the Prisma `ProductImage` type.

---

### Data Transfer Objects

#### `CreateProductImageDto` (`src/modules/catalog/product-images/dto/create-product-image.dto.ts`)

| Field | Type | Validations |
|---|---|---|
| `masterProductId` | `string` | `@IsUUID` |
| `objectKey` | `string` | `@IsString`, `@IsNotEmpty`, `@MaxLength(500)` |
| `imageType` | `ProductImageType` | `@IsEnum(ProductImageType)` — `PRIMARY` or `GALLERY` |
| `displayOrder` | `number` | `@IsInt`, `@Min(1)` |

#### `UpdateProductImageDto` (`src/modules/catalog/product-images/dto/update-product-image.dto.ts`)

| Field | Type | Validations |
|---|---|---|
| `objectKey` | `string` (optional) | `@IsOptional`, `@IsString`, `@IsNotEmpty`, `@MaxLength(500)` |
| `imageType` | `ProductImageType` (optional) | `@IsOptional`, `@IsEnum(ProductImageType)` |
| `displayOrder` | `number` (optional) | `@IsOptional`, `@IsInt`, `@Min(1)` |

> **Note:** `masterProductId` cannot be changed after creation.

#### `ProductImageResponseDto` (`src/modules/catalog/product-images/dto/product-image-response.dto.ts`)

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID |
| `masterProductId` | `string` | UUID of the parent master product |
| `objectKey` | `string` | S3/storage object key |
| `imageType` | `ProductImageType` | `PRIMARY` or `GALLERY` |
| `isPrimary` | `boolean` | Derived from `imageType === PRIMARY`; always in sync |
| `displayOrder` | `number` | Positive integer |
| `createdAt` | `Date` | |
| `updatedAt` | `Date` | |

---

### Mapper (`src/modules/catalog/product-images/mappers/product-image.mapper.ts`)

A **static** class — all methods are called as `ProductImageMapper.toResponse(image)`.

#### `static toResponse(image: ProductImage): ProductImageResponseDto`

Direct field mapping from the Prisma `ProductImage` entity.

---

### `ProductImagesService` (`src/modules/catalog/product-images/services/product-images.service.ts`)

Injected dependencies: `PrismaService` only (mapper is called statically).

Product images are **hard-deleted** (not soft-deleted) — `remove` calls `prisma.productImage.delete(...)`.

#### `create(userId: string, dto: CreateProductImageDto): Promise<ProductImageResponseDto>`

| Step | Action | Error |
|---|---|---|
| 1 | Trims `objectKey`; throws if empty after trim | `ConflictException('Object key cannot be empty')` |
| 2 | `ensureMasterProductExists(masterProductId)` | `NotFoundException('Master product not found')` |
| 3 | Determines `isPrimary = dto.imageType === ProductImageType.PRIMARY` | — |
| 4 | Opens `$transaction`: if `isPrimary`, demotes all existing primary images for the same product to `GALLERY`/`isPrimary = false` | — |
| 5 | Creates the new `ProductImage` record within the transaction | — |
| 6 | `ProductImageMapper.toResponse(image)` | — |
| catch | `handlePrismaError(error)` | — |

> **Primary image promotion:** There can only be one primary image per master product. Uploading a new `PRIMARY` image automatically demotes the existing primary to `GALLERY` within the same transaction.

#### `findByProduct(masterProductId: string): Promise<ProductImageResponseDto[]>`

Returns all images for a given master product, ordered by `isPrimary desc, displayOrder asc, createdAt asc`. Validates that the master product exists first.

#### `findById(id: string): Promise<ProductImageResponseDto>`

Finds a single image by `id`. Throws `NotFoundException('Product image not found')` if absent.

#### `update(userId: string, id: string, dto: UpdateProductImageDto): Promise<ProductImageResponseDto>`

| Step | Action | Error |
|---|---|---|
| 1 | `findImage(id)` | `NotFoundException` |
| 2 | Resolves effective `imageType` (dto value or existing); recalculates `isPrimary` | — |
| 3 | If `dto.objectKey` provided → trims and validates not empty | `ConflictException` |
| 4 | Builds `data: Prisma.ProductImageUpdateInput` | — |
| 5 | Opens `$transaction`: if result is `PRIMARY`, demotes all other primary images for the product | — |
| 6 | Updates the image record within the transaction | — |
| 7 | `ProductImageMapper.toResponse(image)` | — |
| catch | `handlePrismaError(error)` | — |

#### `remove(id: string): Promise<void>`

**Hard-delete** — permanently removes the `ProductImage` record from the database. No `updatedBy` is recorded.

#### Private Helpers

| Method | Purpose |
|---|---|
| `findImage(id)` | `prisma.productImage.findUnique({ where: { id } })`; throws `NotFoundException('Product image not found')` if absent |
| `ensureMasterProductExists(masterProductId)` | `prisma.masterProduct.findFirst({ where: { id, deletedAt: null }, select: { id } })`; throws `NotFoundException('Master product not found')` if absent |
| `handlePrismaError(error)` | Maps P2025 → `NotFoundException('Product image not found')`, P2003 → `ConflictException('Product image references an invalid product')`; re-throws all others |

---

### Product Images Endpoints

#### `POST /catalog/product-images`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Request Body** | `CreateProductImageDto` |
| **Response** | `ProductImageResponseDto` |

Creates a new product image record. If `imageType` is `PRIMARY`, the existing primary image (if any) is automatically demoted to `GALLERY` within the same transaction.

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Referenced master product not found or soft-deleted |
| `409 Conflict` | `objectKey` is empty after trim |

---

#### `GET /catalog/product-images/product/:masterProductId`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `masterProductId` — UUID of the master product |
| **Response** | `ProductImageResponseDto[]` |

Returns all images for a given master product. Ordered: primary first, then by `displayOrder asc`, then by `createdAt asc`.

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Master product not found or soft-deleted |

---

#### `GET /catalog/product-images/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the product image |
| **Response** | `ProductImageResponseDto` |

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Product image not found |

---

#### `PATCH /catalog/product-images/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the product image |
| **Request Body** | `UpdateProductImageDto` |
| **Response** | `ProductImageResponseDto` (updated) |

Partial update. If `imageType` is changed to `PRIMARY`, the previously primary image is demoted to `GALLERY` within the same transaction.

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Product image not found |
| `409 Conflict` | `objectKey` is empty after trim |

---

#### `DELETE /catalog/product-images/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the product image |
| **Response** | `204 No Content` (void) |

**Hard-delete** — permanently removes the record. Unlike other sub-domains, product images are not soft-deleted.

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Product image not found |

---

## Part 6 — Store Products

### Type Alias (`src/modules/catalog/store-products/types/store-product.types.ts`)

```typescript
export type StoreProductEntity = StoreProduct;
```

A simple re-export alias for the Prisma `StoreProduct` type. Store products have no relation includes at the service level.

---

### Data Transfer Objects

#### `CreateStoreProductDto` (`src/modules/catalog/store-products/dto/create-store-product.dto.ts`)

| Field | Type | Validations |
|---|---|---|
| `masterProductId` | `string` | `@IsUUID` |
| `mrp` | `number` | `@IsNumber({ maxDecimalPlaces: 2 })`, `@Min(0)` |
| `sellingPrice` | `number` | `@IsNumber({ maxDecimalPlaces: 2 })`, `@Min(0)` |
| `availabilityStatus` | `AvailabilityStatus` (optional) | `@IsOptional`, `@IsEnum(AvailabilityStatus)` — defaults to `AVAILABLE` |
| `trackInventory` | `boolean` (optional) | `@IsOptional`, `@IsBoolean` — defaults to `true` |
| `isFeatured` | `boolean` (optional) | `@IsOptional`, `@IsBoolean` — defaults to `false` |
| `displayOrder` | `number` (optional) | `@IsOptional`, `@IsInt`, `@Min(0)` — defaults to `0` |

#### `UpdateStoreProductDto` (`src/modules/catalog/store-products/dto/update-store-product.dto.ts`)

| Field | Type | Validations |
|---|---|---|
| `mrp` | `number` (optional) | `@IsOptional`, `@IsNumber({ maxDecimalPlaces: 2 })`, `@Min(0)` |
| `sellingPrice` | `number` (optional) | `@IsOptional`, `@IsNumber({ maxDecimalPlaces: 2 })`, `@Min(0)` |
| `availabilityStatus` | `AvailabilityStatus` (optional) | `@IsOptional`, `@IsEnum(AvailabilityStatus)` |
| `trackInventory` | `boolean` (optional) | `@IsOptional`, `@IsBoolean` |
| `isFeatured` | `boolean` (optional) | `@IsOptional`, `@IsBoolean` |
| `displayOrder` | `number` (optional) | `@IsOptional`, `@IsInt`, `@Min(0)` |

> **Pricing validation on update:** The service merges `dto.mrp`/`dto.sellingPrice` with the existing values before calling `validatePricing`. Partial price updates are always validated against the effective combined result.

#### `StoreProductResponseDto` (`src/modules/catalog/store-products/dto/store-product-response.dto.ts`)

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID |
| `storeId` | `string` | UUID of the owning store |
| `masterProductId` | `string` | UUID of the linked master product |
| `mrp` | `string` | Serialised from Prisma `Decimal` |
| `sellingPrice` | `string` | Serialised from Prisma `Decimal` |
| `availabilityStatus` | `AvailabilityStatus` | `AVAILABLE`, `OUT_OF_STOCK`, `HIDDEN`, or `DISCONTINUED` |
| `trackInventory` | `boolean` | Whether inventory is tracked for this listing |
| `isFeatured` | `boolean` | |
| `displayOrder` | `number` | Integer sort key |
| `createdAt` | `Date` | |
| `updatedAt` | `Date` | |

> **Decimal serialisation:** `mrp` and `sellingPrice` are stored as `Decimal` in Prisma and serialised to `string` via `.toString()` to avoid floating-point precision loss.

---

### Mapper (`src/modules/catalog/store-products/mappers/store-product.mapper.ts`)

A **static** class — all methods are called as `StoreProductMapper.toResponse(storeProduct)`.

#### `static toResponse(storeProduct: StoreProduct): StoreProductResponseDto`

Direct field mapping. `mrp` and `sellingPrice` converted from Prisma `Decimal` to `string`.

---

### `StoreProductsService` (`src/modules/catalog/store-products/services/store-products.service.ts`)

Injected dependencies: `PrismaService` only (mapper is called statically).

All read/write queries filter by `deletedAt: null`. All operations are scoped to the authenticated user's own store via `resolveOwnStore(userId)`.

#### `create(userId: string, dto: CreateStoreProductDto): Promise<StoreProductResponseDto>`

| Step | Action | Error |
|---|---|---|
| 1 | `resolveOwnStore(userId)` — finds the store owned by the user | `NotFoundException('Store not found for the current user')` |
| 2 | `ensureMasterProductExists(masterProductId)` — verifies master product exists and is not soft-deleted | `NotFoundException('Master product not found')` |
| 3 | `ensureStoreProductDoesNotExist(storeId, masterProductId)` — checks `@@unique([storeId, masterProductId])`; distinguishes active vs previously-deleted records | `ConflictException` |
| 4 | `validatePricing(mrp, sellingPrice)` — rejects if `sellingPrice > mrp` | `ConflictException('Selling price cannot be greater than MRP')` |
| 5 | `prisma.storeProduct.create(...)` — `availabilityStatus` defaults to `AVAILABLE`, `trackInventory` to `true`, `isFeatured` to `false`, `displayOrder` to `0` | — |
| 6 | `StoreProductMapper.toResponse(storeProduct)` | — |
| catch | `handlePrismaError(error)` | — |

> **Previously-deleted guard:** `ensureStoreProductDoesNotExist` queries with no `deletedAt` filter. If the record exists and is soft-deleted, it throws a distinct message: *"This product has previously been removed from the store and cannot be recreated with the same store-product relationship"*.

#### `findMine(userId: string): Promise<StoreProductResponseDto[]>`

Returns all non-deleted store products for the current user's store, ordered by `displayOrder asc, createdAt desc`.

#### `findMineById(userId: string, id: string): Promise<StoreProductResponseDto>`

Returns a single store product scoped to the current user's store. Throws `NotFoundException('Store product not found')` if absent or belonging to another store.

#### `update(userId: string, id: string, dto: UpdateStoreProductDto): Promise<StoreProductResponseDto>`

| Step | Action | Error |
|---|---|---|
| 1 | `resolveOwnStore(userId)` | `NotFoundException` |
| 2 | `findStoreProduct(id, storeId)` | `NotFoundException` |
| 3 | Merges `dto.mrp`/`dto.sellingPrice` with existing values; `validatePricing(effectiveMrp, effectiveSellingPrice)` | `ConflictException` |
| 4 | Builds `data: Prisma.StoreProductUpdateInput` with spread-guard pattern | — |
| 5 | `prisma.storeProduct.update(...)` | — |
| 6 | `StoreProductMapper.toResponse(updated)` | — |
| catch | `handlePrismaError(error)` | — |

#### `remove(userId: string, id: string): Promise<void>`

Soft-delete — sets `deletedAt = new Date()`, `isFeatured = false`, `availabilityStatus = HIDDEN`, `updatedBy = userId`. No guard checks on dependent records at this level.

#### Private Helpers

| Method | Purpose |
|---|---|
| `resolveOwnStore(userId)` | `prisma.store.findUnique({ where: { ownerId: userId } })`; throws `NotFoundException('Store not found for the current user')` if absent |
| `ensureMasterProductExists(masterProductId)` | `prisma.masterProduct.findFirst({ where: { id, deletedAt: null } })`; throws `NotFoundException('Master product not found')` |
| `ensureStoreProductDoesNotExist(storeId, masterProductId)` | Queries by `@@unique` composite key (no `deletedAt` filter); throws `ConflictException` with context-specific message |
| `findStoreProduct(id, storeId)` | `prisma.storeProduct.findFirst({ where: { id, storeId, deletedAt: null } })`; throws `NotFoundException('Store product not found')` |
| `validatePricing(mrp, sellingPrice)` | Throws `ConflictException('Selling price cannot be greater than MRP')` if `sellingPrice > mrp` |
| `handlePrismaError(error)` | Maps P2002 → `ConflictException('This product is already listed in the store')`, P2025 → `NotFoundException('Store product not found')`, P2003 → `ConflictException('Store product references an invalid record')`; re-throws all others |

---

### Store Products Endpoints

#### `POST /catalog/store-products/me`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Request Body** | `CreateStoreProductDto` |
| **Response** | `StoreProductResponseDto` |

Adds a master product to the authenticated user's store. Validates master product existence, enforces uniqueness of `(storeId, masterProductId)`, and validates pricing (`sellingPrice ≤ mrp`).

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Authenticated user has no store; or master product not found |
| `409 Conflict` | Product already listed in the store; or previously removed; or `sellingPrice > mrp` |

---

#### `GET /catalog/store-products/me`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Response** | `StoreProductResponseDto[]` |

Returns all active (non-deleted) store product listings for the current user's store, ordered by `displayOrder asc, createdAt desc`.

---

#### `GET /catalog/store-products/me/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the store product |
| **Response** | `StoreProductResponseDto` |

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Store product not found, soft-deleted, or belongs to a different store |

---

#### `PATCH /catalog/store-products/me/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the store product |
| **Request Body** | `UpdateStoreProductDto` |
| **Response** | `StoreProductResponseDto` (updated) |

Partial update with spread-guard pattern. Pricing is re-validated against the effective combined `mrp`/`sellingPrice` after merging dto values with existing values.

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Store product not found or belongs to a different store |
| `409 Conflict` | `sellingPrice > mrp` (effective combined values) |

---

#### `DELETE /catalog/store-products/me/:id`

| Property | Value |
|---|---|
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `id` — UUID of the store product |
| **Response** | `204 No Content` (void) |

Soft-delete — sets `deletedAt`, `isFeatured = false`, `availabilityStatus = HIDDEN`.

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Store product not found or belongs to a different store |

---

*End of Module — Catalog*
