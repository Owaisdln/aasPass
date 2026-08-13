# Module — Catalog

> [← Back to Server Index](./README.md)

---

## Purpose

The `CatalogModule` manages the **product catalog master data** — the global, store-agnostic reference tables that define what products exist and how they are classified. Currently implemented sub-domains:

1. **Categories** — hierarchical product taxonomy (`catalog/categories`)
2. **Brands** — product brand registry (`catalog/brands`)

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
└── brands/
    ├── controllers/
    │   └── brands.controller.ts
    ├── dto/
    │   ├── create-brand.dto.ts
    │   ├── update-brand.dto.ts
    │   └── brand-response.dto.ts
    ├── mappers/
    │   └── brand.mapper.ts
    ├── services/
    │   └── brands.service.ts
    └── types/
        └── brand.types.ts
```

---

## Module Registration (`catalog.module.ts`)

| Property | Value |
|---|---|
| **Imports** | `PrismaModule`, `AuthModule` |
| **Controllers** | `CategoriesController`, `BrandsController` |
| **Providers** | `CategoriesService`, `CategoryMapper`, `BrandsService`, `BrandMapper` |
| **Exports** | *(none)* |

`AuthModule` is imported to provide `SupabaseAuthGuard` and the `@AuthenticatedUser()` decorator to both controllers.

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

*End of Module — Catalog*
