-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "ReceivingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ItemGrade" AS ENUM ('UNTESTED', 'LN', 'VG', 'G', 'PO', 'SA', 'PARTS_ONLY');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('RECEIVED', 'TESTING', 'GRADED', 'IN_LOT', 'LISTED', 'SOLD', 'SHIPPED', 'REFURBISHING', 'RECYCLED', 'DISPOSED');

-- CreateEnum
CREATE TYPE "LotStatus" AS ENUM ('BUILDING', 'READY', 'MANIFESTED', 'LISTED_FOR_SALE', 'SOLD', 'SHIPPED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SOLD', 'ENDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RefurbishmentStatus" AS ENUM ('QUEUED', 'IN_PROGRESS', 'QA_CHECK', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('PREPARING', 'LABEL_CREATED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'EXCEPTION');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "role" "Role" NOT NULL DEFAULT 'OPERATOR',
    "warehouse_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "receivings" (
    "id" TEXT NOT NULL,
    "receipt_number" TEXT NOT NULL,
    "warehouse_id" TEXT NOT NULL,
    "supplier" TEXT,
    "po_number" TEXT,
    "status" "ReceivingStatus" NOT NULL DEFAULT 'PENDING',
    "expected_units" INTEGER,
    "received_units" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "received_by" TEXT,
    "received_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receivings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "model" TEXT,
    "upc" TEXT,
    "category" TEXT,
    "condition" TEXT,
    "grade" "ItemGrade" NOT NULL DEFAULT 'UNTESTED',
    "status" "InventoryStatus" NOT NULL DEFAULT 'RECEIVED',
    "tested_by" TEXT,
    "tested_at" TIMESTAMP(3),
    "test_notes" TEXT,
    "functional" BOOLEAN,
    "cosmetic" TEXT,
    "missing_parts" TEXT,
    "battery_health" INTEGER,
    "retail_price" DECIMAL(10,2),
    "cost_basis" DECIMAL(10,2),
    "selling_price" DECIMAL(10,2),
    "warehouse_id" TEXT NOT NULL,
    "bin" TEXT,
    "shelf" TEXT,
    "zone" TEXT,
    "receiving_id" TEXT,
    "lot_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lots" (
    "id" TEXT NOT NULL,
    "lot_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lot_type" TEXT NOT NULL,
    "status" "LotStatus" NOT NULL DEFAULT 'BUILDING',
    "warehouse_id" TEXT NOT NULL,
    "category" TEXT,
    "condition" TEXT,
    "target_items" INTEGER,
    "weight" DECIMAL(10,2),
    "asking_price" DECIMAL(10,2),
    "retail_value" DECIMAL(10,2),
    "cost_basis" DECIMAL(10,2),
    "manifest_generated" BOOLEAN NOT NULL DEFAULT false,
    "manifest_url" TEXT,
    "published_to_store" BOOLEAN NOT NULL DEFAULT false,
    "store_product_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "photos" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "alt" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "photo_type" TEXT NOT NULL DEFAULT 'item',
    "inventory_item_id" TEXT,
    "lot_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "external_id" TEXT,
    "listing_url" TEXT,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "listed_at" TIMESTAMP(3),
    "sold_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refurbishment_jobs" (
    "id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "status" "RefurbishmentStatus" NOT NULL DEFAULT 'QUEUED',
    "job_type" TEXT,
    "assigned_to" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "issue_description" TEXT,
    "work_performed" TEXT,
    "parts_used" TEXT,
    "parts_cost" DECIMAL(10,2),
    "labor_minutes" INTEGER,
    "grade_before" TEXT,
    "grade_after" TEXT,
    "value_before" DECIMAL(10,2),
    "value_after" DECIMAL(10,2),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refurbishment_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "labels" (
    "id" TEXT NOT NULL,
    "inventory_item_id" TEXT NOT NULL,
    "label_type" TEXT NOT NULL,
    "barcode_data" TEXT NOT NULL,
    "printed_at" TIMESTAMP(3),
    "printed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "labels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" TEXT NOT NULL,
    "shipment_number" TEXT NOT NULL,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'PREPARING',
    "carrier" TEXT,
    "service" TEXT,
    "tracking_number" TEXT,
    "tracking_url" TEXT,
    "ship_from" TEXT,
    "ship_to" TEXT,
    "weight" DECIMAL(10,2),
    "dimensions" TEXT,
    "shipping_cost" DECIMAL(10,2),
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "steps" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_instances" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "current_step" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "step_data" JSONB,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "receivings_receipt_number_key" ON "receivings"("receipt_number");

-- CreateIndex
CREATE INDEX "receivings_warehouse_id_idx" ON "receivings"("warehouse_id");

-- CreateIndex
CREATE INDEX "receivings_status_idx" ON "receivings"("status");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_sku_key" ON "inventory_items"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_barcode_key" ON "inventory_items"("barcode");

-- CreateIndex
CREATE INDEX "inventory_items_warehouse_id_idx" ON "inventory_items"("warehouse_id");

-- CreateIndex
CREATE INDEX "inventory_items_status_idx" ON "inventory_items"("status");

-- CreateIndex
CREATE INDEX "inventory_items_grade_idx" ON "inventory_items"("grade");

-- CreateIndex
CREATE INDEX "inventory_items_lot_id_idx" ON "inventory_items"("lot_id");

-- CreateIndex
CREATE UNIQUE INDEX "lots_lot_number_key" ON "lots"("lot_number");

-- CreateIndex
CREATE INDEX "lots_warehouse_id_idx" ON "lots"("warehouse_id");

-- CreateIndex
CREATE INDEX "lots_status_idx" ON "lots"("status");

-- CreateIndex
CREATE INDEX "listings_inventory_item_id_idx" ON "listings"("inventory_item_id");

-- CreateIndex
CREATE INDEX "listings_channel_idx" ON "listings"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "refurbishment_jobs_inventory_item_id_key" ON "refurbishment_jobs"("inventory_item_id");

-- CreateIndex
CREATE INDEX "refurbishment_jobs_status_idx" ON "refurbishment_jobs"("status");

-- CreateIndex
CREATE INDEX "labels_inventory_item_id_idx" ON "labels"("inventory_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_shipment_number_key" ON "shipments"("shipment_number");

-- CreateIndex
CREATE INDEX "shipments_status_idx" ON "shipments"("status");

-- CreateIndex
CREATE INDEX "workflow_instances_template_id_idx" ON "workflow_instances"("template_id");

-- CreateIndex
CREATE INDEX "activity_log_entity_type_entity_id_idx" ON "activity_log"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "activity_log_action_idx" ON "activity_log"("action");

-- CreateIndex
CREATE INDEX "activity_log_created_at_idx" ON "activity_log"("created_at");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "receivings" ADD CONSTRAINT "receivings_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_receiving_id_fkey" FOREIGN KEY ("receiving_id") REFERENCES "receivings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lots" ADD CONSTRAINT "lots_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_lot_id_fkey" FOREIGN KEY ("lot_id") REFERENCES "lots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refurbishment_jobs" ADD CONSTRAINT "refurbishment_jobs_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "labels" ADD CONSTRAINT "labels_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "workflow_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_log" ADD CONSTRAINT "activity_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
