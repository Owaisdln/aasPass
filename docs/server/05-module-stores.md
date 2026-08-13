# Module — Stores

> [← Back to Server Index](./README.md)

---

## Purpose

The `StoresModule` exposes **store owner self-management endpoints**. A single authenticated user owns at most one store. The module covers four sub-domains:

1. **Core store** — create, read, and update store profile (`POST /stores`, `GET /stores/me`, `PATCH /stores/me`)
2. **Operating hours** — read and bulk-replace weekly schedule (`GET /stores/me/hours`, `PUT /stores/me/hours`)
3. **Delivery settings** — read and upsert delivery configuration (`GET /stores/me/delivery-settings`, `PATCH /stores/me/delivery-settings`)
4. **Gallery images** — full CRUD on the store image gallery (`GET /stores/me/images`, `POST /stores/me/images`, `PATCH /stores/me/images/:imageId/order`, `DELETE /stores/me/images/:imageId`)

All routes in this module are protected by `SupabaseAuthGuard` — an unauthenticated request receives `401 Unauthorized` before reaching the service layer.

---

## Module Structure

```
src/modules/stores/
├── stores.module.ts
├── controllers/
│   ├── stores.controller.ts
│   ├── hours/
│   │   └── store-hours.controller.ts
│   ├── delivery-settings/
│   │   └── store-delivery-settings.controller.ts
│   └── images/
│       └── store-images.controller.ts
├── dto/
│   ├── create-store.dto.ts
│   ├── update-store.dto.ts
│   ├── store-response.dto.ts
│   ├── hours/
│   │   ├── store-hour-response.dto.ts
│   │   └── update-store-hours.dto.ts      (contains StoreHourInputDto)
│   ├── delivery-settings/
│   │   ├── store-delivery-settings-response.dto.ts
│   │   └── update-store-delivery-settings.dto.ts
│   └── images/
│       ├── create-store-image.dto.ts
│       ├── update-store-image-order.dto.ts
│       └── store-image-response.dto.ts
├── mappers/
│   └── store.mapper.ts
├── services/
│   ├── stores.service.ts
│   ├── hours/
│   │   └── store-hours.service.ts
│   ├── delivery-settings/
│   │   └── store-delivery-settings.service.ts
│   └── images/
│       └── store-images.service.ts
└── types/
    └── store.types.ts
```

---

## Module Registration (`stores.module.ts`)

| Property | Value |
|---|---|
| **Imports** | `PrismaModule`, `AuthModule` |
| **Controllers** | `StoresController`, `StoreHoursController`, `StoreDeliverySettingsController`, `StoreImagesController` |
| **Providers** | `StoresService`, `StoreHoursService`, `StoreDeliverySettingsService`, `StoreImagesService`, `StoreMapper` |
| **Exports** | *(none)* |

`AuthModule` is imported to get access to `SupabaseAuthGuard` and the `@AuthenticatedUser()` decorator used across all controllers.

---

## 1. Prisma Type Utilities (`src/modules/stores/types/store.types.ts`)

### `STORE_WITH_RELATIONS_INCLUDE`

```typescript
export const STORE_WITH_RELATIONS_INCLUDE = {
  images: true,
  hours: true,
  deliverySetting: true,
} as const satisfies Prisma.StoreInclude;
```

A constant Prisma `include` object using `as const satisfies` to enforce compile-time correctness. Includes `images[]`, `hours[]`, and `deliverySetting` on every full store query.

### `StoreWithRelations`

```typescript
export type StoreWithRelations = Prisma.StoreGetPayload<{
  include: typeof STORE_WITH_RELATIONS_INCLUDE;
}>;
```

Derived TypeScript type representing a `Store` record with all three relations loaded. Used as the return type of `StoresService.resolveOwnStore()` and the parameter type of `StoreMapper.toResponse()`.

---

## 2. Data Transfer Objects

### `CreateStoreDto` (`src/modules/stores/dto/create-store.dto.ts`)

The request body for `POST /stores`. All fields without `@IsOptional` are **required**.

| Field | Type | Validations |
|---|---|---|
| `name` | `string` | `@IsString`, `@MaxLength(255)` |
| `description` | `string` (optional) | `@IsOptional`, `@IsString`, `@MaxLength(2000)` |
| `phone` | `string` | `@IsString`, `@MaxLength(15)` |
| `email` | `string` (optional) | `@IsOptional`, `@IsEmail`, `@MaxLength(255)` |
| `gstNumber` | `string` (optional) | `@IsOptional`, `@IsString`, `@MaxLength(50)` |
| `businessRegistrationNumber` | `string` (optional) | `@IsOptional`, `@IsString`, `@MaxLength(100)` |
| `addressLine1` | `string` | `@IsString`, `@MaxLength(255)` |
| `addressLine2` | `string` (optional) | `@IsOptional`, `@IsString`, `@MaxLength(255)` |
| `city` | `string` | `@IsString`, `@MaxLength(100)` |
| `state` | `string` | `@IsString`, `@MaxLength(100)` |
| `country` | `string` | `@IsString`, `@MaxLength(100)` |
| `pincode` | `string` | `@IsString`, `@MaxLength(20)` |
| `latitude` | `number` | `@IsLatitude` |
| `longitude` | `number` | `@IsLongitude` |
| `timezone` | `string` (optional) | `@IsOptional`, `@IsString`, `@MaxLength(100)` — defaults to `'Asia/Kolkata'` if omitted |

### `UpdateStoreDto` (`src/modules/stores/dto/update-store.dto.ts`)

The request body for `PATCH /stores/me`. All fields are **optional**. Extends the fields from `CreateStoreDto` (all made optional) and adds two extra fields:

| Field | Type | Validations |
|---|---|---|
| *(all CreateStoreDto fields, made optional)* | — | — |
| `logoKey` | `string` (optional) | `@IsOptional`, `@IsString`, `@MaxLength(500)` |
| `bannerKey` | `string` (optional) | `@IsOptional`, `@IsString`, `@MaxLength(500)` |

> **Note:** Only fields explicitly provided in the request body are updated. Undefined fields are spread-guarded (`dto.field !== undefined`) before being passed to Prisma — omitting a field is a true no-op.

### `StoreResponseDto` (`src/modules/stores/dto/store-response.dto.ts`)

The shape returned for all core store endpoints.

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID |
| `name` | `string` | |
| `slug` | `string` | URL-safe, auto-generated from `name` |
| `description` | `string \| null` | |
| `phone` | `string` | |
| `email` | `string \| null` | |
| `gstNumber` | `string \| null` | |
| `businessRegistrationNumber` | `string \| null` | |
| `addressLine1` | `string` | |
| `addressLine2` | `string \| null` | |
| `city` | `string` | |
| `state` | `string` | |
| `country` | `string` | |
| `pincode` | `string` | |
| `latitude` | `number` | Cast via `Number()` — Prisma returns `Decimal` |
| `longitude` | `number` | Cast via `Number()` — Prisma returns `Decimal` |
| `timezone` | `string` | |
| `status` | `StoreStatus` | Prisma enum (`ACTIVE`, `INACTIVE`, etc.) |
| `verificationStatus` | `VerificationStatus` | Prisma enum (`PENDING`, `VERIFIED`, `REJECTED`) |
| `verifiedAt` | `Date \| null` | |
| `isOpen` | `boolean` | |
| `logoKey` | `string \| null` | S3/storage object key |
| `bannerKey` | `string \| null` | S3/storage object key |
| `createdAt` | `Date` | |
| `updatedAt` | `Date` | |

### `StoreHourResponseDto` (`src/modules/stores/dto/hours/store-hour-response.dto.ts`)

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID |
| `weekDay` | `WeekDay` | Prisma enum (`MONDAY` … `SUNDAY`) |
| `openingTime` | `Date \| null` | Stored as `Date(1970, 0, 1, HH, mm)` — `null` when `isClosed = true` |
| `closingTime` | `Date \| null` | Same storage convention as `openingTime` |
| `isClosed` | `boolean` | |
| `createdAt` | `Date` | |
| `updatedAt` | `Date` | |

### `StoreHourInputDto` / `UpdateStoreHoursDto` (`src/modules/stores/dto/hours/update-store-hours.dto.ts`)

`UpdateStoreHoursDto` wraps an array of `StoreHourInputDto` entries.

**`StoreHourInputDto`:**

| Field | Type | Validations |
|---|---|---|
| `weekDay` | `WeekDay` | `@IsEnum(WeekDay)` |
| `openingTime` | `string` (optional) | `@IsOptional`, `@IsString`, `@Matches(/^([01]\d|2[0-3]):[0-5]\d$/)` — must be `HH:mm` |
| `closingTime` | `string` (optional) | `@IsOptional`, `@IsString`, `@Matches(/^([01]\d|2[0-3]):[0-5]\d$/)` — must be `HH:mm` |
| `isClosed` | `boolean` | `@IsBoolean` |

**`UpdateStoreHoursDto`:**

| Field | Type | Validations |
|---|---|---|
| `hours` | `StoreHourInputDto[]` | `@IsArray`, `@ArrayMinSize(1)`, `@ValidateNested({ each: true })` |

### `StoreDeliverySettingsResponseDto` (`src/modules/stores/dto/delivery-settings/store-delivery-settings-response.dto.ts`)

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID |
| `isDeliveryAvailable` | `boolean` | |
| `isPickupAvailable` | `boolean` | |
| `minimumOrderAmount` | `number` | Cast via `Number()` — Prisma returns `Decimal` |
| `deliveryRadiusKm` | `number` | Cast via `Number()` — Prisma returns `Decimal` |
| `deliveryCharge` | `number` | Cast via `Number()` — Prisma returns `Decimal` |
| `freeDeliveryAbove` | `number \| null` | `null` means free delivery threshold is not set |
| `estimatedDeliveryTime` | `number` | Integer (minutes) |
| `createdAt` | `Date` | |
| `updatedAt` | `Date` | |

### `UpdateStoreDeliverySettingsDto` (`src/modules/stores/dto/delivery-settings/update-store-delivery-settings.dto.ts`)

All fields optional:

| Field | Type | Validations |
|---|---|---|
| `isDeliveryAvailable` | `boolean` (optional) | `@IsOptional`, `@IsBoolean` |
| `isPickupAvailable` | `boolean` (optional) | `@IsOptional`, `@IsBoolean` |
| `minimumOrderAmount` | `number` (optional) | `@IsOptional`, `@IsNumber`, `@Min(0)` |
| `deliveryRadiusKm` | `number` (optional) | `@IsOptional`, `@IsNumber`, `@Min(0)` |
| `deliveryCharge` | `number` (optional) | `@IsOptional`, `@IsNumber`, `@Min(0)` |
| `freeDeliveryAbove` | `number` (optional) | `@IsOptional`, `@IsNumber`, `@Min(0)` |
| `estimatedDeliveryTime` | `number` (optional) | `@IsOptional`, `@IsNumber`, `@Min(1)` |

### `CreateStoreImageDto` (`src/modules/stores/dto/images/create-store-image.dto.ts`)

| Field | Type | Validations |
|---|---|---|
| `objectKey` | `string` | `@IsString`, `@IsNotEmpty`, `@MaxLength(500)` |
| `displayOrder` | `number` (optional) | `@IsOptional`, `@IsInt`, `@Min(1)` — auto-assigned if omitted (next available) |

### `UpdateStoreImageOrderDto` (`src/modules/stores/dto/images/update-store-image-order.dto.ts`)

| Field | Type | Validations |
|---|---|---|
| `displayOrder` | `number` | `@IsInt`, `@Min(1)` |

### `StoreImageResponseDto` (`src/modules/stores/dto/images/store-image-response.dto.ts`)

| Field | Type | Notes |
|---|---|---|
| `id` | `string` | UUID |
| `objectKey` | `string` | S3/storage object key |
| `displayOrder` | `number` | Sort position (1-based integer) |
| `createdAt` | `Date` | |
| `updatedAt` | `Date` | |

---

## 3. Mapper

### `StoreMapper` (`src/modules/stores/mappers/store.mapper.ts`)

An `@Injectable()` class responsible for transforming a `StoreWithRelations` entity into a `StoreResponseDto`.

#### `toResponse(store: StoreWithRelations): StoreResponseDto`

Key transformations:

| DTO Field | Source | Reason |
|---|---|---|
| `latitude` | `Number(store.latitude)` | Converts Prisma `Decimal` to JS `number` |
| `longitude` | `Number(store.longitude)` | Converts Prisma `Decimal` to JS `number` |

All other fields are mapped directly from the Prisma entity.

> **Note:** `StoreHoursService` and `StoreImagesService` use inline private `toResponse` helpers instead of a shared mapper class, since they operate on flat Prisma entities with no Decimal conversion complexity beyond delivery settings (which is also handled inline in its service).

---

## 4. Services

### `StoresService` (`src/modules/stores/services/stores.service.ts`)

Injected dependencies: `PrismaService`, `StoreMapper`.

#### `createStore(userId: string, dto: CreateStoreDto): Promise<StoreResponseDto>`

| Step | Action | Error |
|---|---|---|
| 1 | `prisma.store.findUnique({ where: { ownerId: userId } })` — check for existing store | — |
| 2 | If found → throw | `ConflictException('You already have a store.')` |
| 3 | `generateUniqueSlug(dto.name)` — derives collision-free URL slug | — |
| 4 | `prisma.store.create(...)` with `STORE_WITH_RELATIONS_INCLUDE` — `timezone` defaults to `'Asia/Kolkata'` if not provided | — |
| 5 | `storeMapper.toResponse(store)` | — |

#### `getMyStore(userId: string): Promise<StoreResponseDto>`

| Step | Action |
|---|---|
| 1 | `resolveOwnStore(userId)` — loads store with relations |
| 2 | `storeMapper.toResponse(store)` |

#### `updateStore(userId: string, dto: UpdateStoreDto): Promise<StoreResponseDto>`

| Step | Action |
|---|---|
| 1 | `resolveOwnStore(userId)` — validates ownership |
| 2 | `prisma.store.update(...)` — only fields where `dto.field !== undefined` are spread into the `data` object |
| 3 | `storeMapper.toResponse(updatedStore)` |

#### `resolveOwnStore(userId: string): Promise<StoreWithRelations>` (private)

| Step | Action | Error |
|---|---|---|
| 1 | `prisma.store.findUnique({ where: { ownerId: userId }, include: STORE_WITH_RELATIONS_INCLUDE })` | — |
| 2 | If `null` → throw | `NotFoundException('Store not found.')` |

#### `generateUniqueSlug(name: string): Promise<string>` (private)

1. Calls `slugify(name)` to produce a base slug
2. Loops: if a store with that slug already exists, appends `-N` (counter starts at 1) until a unique slug is found

#### `slugify(value: string): string` (private)

Lowercases → trims → removes non-alphanumeric/space/hyphen characters → replaces whitespace with `-` → collapses consecutive hyphens → falls back to `'store'` if the result is empty.

---

### `StoreHoursService` (`src/modules/stores/services/hours/store-hours.service.ts`)

Injected dependencies: `PrismaService`.

#### `getMyHours(userId: string): Promise<StoreHourResponseDto[]>`

| Step | Action | Error |
|---|---|---|
| 1 | `prisma.store.findUnique({ where: { ownerId: userId }, select: { id: true } })` | — |
| 2 | If not found → throw | `NotFoundException('Store not found.')` |
| 3 | `prisma.storeHour.findMany({ where: { storeId }, orderBy: { weekDay: 'asc' } })` | — |
| 4 | Maps each record to `StoreHourResponseDto` inline | — |

#### `updateMyHours(userId: string, dto: UpdateStoreHoursDto): Promise<StoreHourResponseDto[]>`

| Step | Action | Error |
|---|---|---|
| 1 | Resolve store (same as `getMyHours` steps 1–2) | `NotFoundException` |
| 2 | `validateHours(dto.hours)` — checks for duplicates and missing times | `BadRequestException` |
| 3 | `prisma.$transaction(async tx => ...)` — loops over `dto.hours` and calls `tx.storeHour.upsert` on composite key `(storeId, weekDay)` | — |
| 4 | Calls `getMyHours(userId)` to return the freshly persisted state | — |

> **Upsert logic:** When `isClosed = true`, `openingTime` and `closingTime` are set to `null`. When open, times are converted from `HH:mm` strings to `Date(1970, 0, 1, HH, mm)` via the private `timeToDate` helper.

#### `validateHours(hours: StoreHourInputDto[]): void` (private)

- Throws `BadRequestException` if a `weekDay` appears more than once in the input
- Throws `BadRequestException` if `isClosed = false` but either `openingTime` or `closingTime` is missing

#### `timeToDate(time: string): Date` (private)

Parses a `HH:mm` string into `new Date(1970, 0, 1, HH, mm, 0, 0)` — the epoch date anchors time values for consistent DB storage.

---

### `StoreDeliverySettingsService` (`src/modules/stores/services/delivery-settings/store-delivery-settings.service.ts`)

Injected dependencies: `PrismaService`.

#### `getMyDeliverySettings(userId: string): Promise<StoreDeliverySettingsResponseDto>`

| Step | Action | Error |
|---|---|---|
| 1 | `prisma.store.findUnique({ where: { ownerId: userId }, select: { id: true } })` | — |
| 2 | If not found → throw | `NotFoundException('Store not found.')` |
| 3 | `prisma.storeDeliverySetting.findUnique({ where: { storeId } })` | — |
| 4 | If not found → throw | `NotFoundException('Store delivery settings not found.')` |
| 5 | `toResponse(settings)` — converts `Decimal` fields to `number` | — |

#### `updateMyDeliverySettings(userId: string, dto: UpdateStoreDeliverySettingsDto): Promise<StoreDeliverySettingsResponseDto>`

| Step | Action | Error |
|---|---|---|
| 1 | Resolve store (same as `getMyDeliverySettings` steps 1–2) | `NotFoundException` |
| 2 | `prisma.storeDeliverySetting.upsert(...)` — `create` and `update` both spread only defined DTO fields | — |
| 3 | `toResponse(settings)` | — |

> **Note:** `upsert` allows updating delivery settings on first creation in a single call — no separate `create` endpoint is needed.

#### `toResponse(settings): StoreDeliverySettingsResponseDto` (private)

Converts all `Decimal` fields (`minimumOrderAmount`, `deliveryRadiusKm`, `deliveryCharge`, `freeDeliveryAbove`) to JavaScript `number` via `Number()`. `freeDeliveryAbove` preserves `null` if the DB value is `null`.

---

### `StoreImagesService` (`src/modules/stores/services/images/store-images.service.ts`)

Injected dependencies: `PrismaService`.

#### `getMyImages(userId: string): Promise<StoreImageResponseDto[]>`

Resolves the store, then fetches all `StoreImage` records ordered by `displayOrder asc, createdAt asc`.

#### `addImage(userId: string, dto: CreateStoreImageDto): Promise<StoreImageResponseDto>`

| Step | Action |
|---|---|
| 1 | Resolve store |
| 2 | If `dto.displayOrder` is absent → calls `getNextDisplayOrder(storeId)` (max + 1, starts at 1) |
| 3 | `prisma.storeImage.create(...)` |
| 4 | Inline `toResponse(image)` |

#### `updateImageOrder(userId: string, imageId: string, dto: UpdateStoreImageOrderDto): Promise<StoreImageResponseDto>`

| Step | Action | Error |
|---|---|---|
| 1 | Resolve store | `NotFoundException('Store not found.')` |
| 2 | `prisma.storeImage.findFirst({ where: { id: imageId, storeId } })` — ownership-scoped | — |
| 3 | If not found → throw | `NotFoundException('Store image not found.')` |
| 4 | Check for conflict: another image in same store with same `displayOrder` | `BadRequestException('Another store image already uses this display order.')` |
| 5 | `prisma.storeImage.update({ data: { displayOrder } })` | — |

#### `deleteImage(userId: string, imageId: string): Promise<void>`

| Step | Action | Error |
|---|---|---|
| 1 | Resolve store | `NotFoundException('Store not found.')` |
| 2 | `prisma.storeImage.findFirst({ where: { id: imageId, storeId }, select: { id: true } })` | — |
| 3 | If not found → throw | `NotFoundException('Store image not found.')` |
| 4 | `prisma.storeImage.delete({ where: { id } })` | — |

#### `resolveOwnStore(userId: string): Promise<{ id: string }>` (private)

Lightweight store lookup selecting only `id`. Used by all four public methods.

#### `getNextDisplayOrder(storeId: string): Promise<number>` (private)

Finds the highest existing `displayOrder` for the store and returns `max + 1`. Returns `1` if no images exist yet.

---

## 5. Endpoints

### `POST /stores`

| Property | Value |
|---|---|
| **Controller** | `StoresController` |
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Request Body** | `CreateStoreDto` |
| **Response** | `StoreResponseDto` |

Creates a new store owned by the authenticated user. One user can own at most one store — a second creation attempt returns `409 Conflict`.

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure on `CreateStoreDto` |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `409 Conflict` | Authenticated user already owns a store |

---

### `GET /stores/me`

| Property | Value |
|---|---|
| **Controller** | `StoresController` |
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Response** | `StoreResponseDto` |

Returns the full profile of the authenticated user's store.

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Authenticated user does not own a store |

---

### `PATCH /stores/me`

| Property | Value |
|---|---|
| **Controller** | `StoresController` |
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Request Body** | `UpdateStoreDto` |
| **Response** | `StoreResponseDto` (updated) |

Partially updates the authenticated user's store profile. Only supplied fields are written.

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure on `UpdateStoreDto` |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Authenticated user does not own a store |

---

### `GET /stores/me/hours`

| Property | Value |
|---|---|
| **Controller** | `StoreHoursController` |
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Response** | `StoreHourResponseDto[]` |

Returns the weekly operating schedule ordered by `weekDay` ascending.

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Authenticated user does not own a store |

---

### `PUT /stores/me/hours`

| Property | Value |
|---|---|
| **Controller** | `StoreHoursController` |
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Request Body** | `UpdateStoreHoursDto` |
| **Response** | `StoreHourResponseDto[]` (updated full schedule) |

Bulk-upserts operating hours. The body may contain 1–7 `StoreHourInputDto` entries — only supplied `weekDay` entries are touched. All upserts run inside a single Prisma transaction.

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure; duplicate `weekDay`; `openingTime`/`closingTime` missing for a non-closed day |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Authenticated user does not own a store |

---

### `GET /stores/me/delivery-settings`

| Property | Value |
|---|---|
| **Controller** | `StoreDeliverySettingsController` |
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Response** | `StoreDeliverySettingsResponseDto` |

Returns the delivery configuration for the authenticated user's store.

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Store not found, or delivery settings not yet initialised |

---

### `PATCH /stores/me/delivery-settings`

| Property | Value |
|---|---|
| **Controller** | `StoreDeliverySettingsController` |
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Request Body** | `UpdateStoreDeliverySettingsDto` |
| **Response** | `StoreDeliverySettingsResponseDto` (updated) |

Creates or updates delivery settings via Prisma `upsert`. Only supplied fields are written.

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Authenticated user does not own a store |

---

### `GET /stores/me/images`

| Property | Value |
|---|---|
| **Controller** | `StoreImagesController` |
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Response** | `StoreImageResponseDto[]` |

Returns gallery images ordered by `displayOrder asc, createdAt asc`.

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Authenticated user does not own a store |

---

### `POST /stores/me/images`

| Property | Value |
|---|---|
| **Controller** | `StoreImagesController` |
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Request Body** | `CreateStoreImageDto` |
| **Response** | `StoreImageResponseDto` |

Adds a new image to the store gallery. If `displayOrder` is omitted, it is auto-assigned as `max(existing) + 1` (starting from 1).

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Authenticated user does not own a store |

---

### `PATCH /stores/me/images/:imageId/order`

| Property | Value |
|---|---|
| **Controller** | `StoreImagesController` |
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `imageId` — UUID of the image to reorder |
| **Request Body** | `UpdateStoreImageOrderDto` |
| **Response** | `StoreImageResponseDto` (updated) |

Updates the `displayOrder` of a single gallery image. Returns `400` if another image in the same store already occupies the requested position.

**Error Responses:**

| Status | Condition |
|---|---|
| `400 Bad Request` | Validation failure; or `displayOrder` collision with another image |
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Store not found, or image not found / not owned by this store |

---

### `DELETE /stores/me/images/:imageId`

| Property | Value |
|---|---|
| **Controller** | `StoreImagesController` |
| **Guard** | `SupabaseAuthGuard` (class-level) |
| **Auth Required** | Yes |
| **Path Param** | `imageId` — UUID of the image to delete |
| **Response** | `204 No Content` (void) |

Permanently deletes a gallery image. The `storeId` scope ensures a user cannot delete images belonging to another store.

**Error Responses:**

| Status | Condition |
|---|---|
| `401 Unauthorized` | Missing or invalid Bearer token |
| `404 Not Found` | Store not found, or image not found / not owned by this store |

---

*End of Module — Stores*
