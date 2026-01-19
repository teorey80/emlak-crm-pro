-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Properties Table
create table if not exists "properties" (
  "id" text primary key,
  "title" text,
  "price" numeric,
  "currency" text,
  "location" text,
  "type" text,
  "status" text,
  "rooms" text,
  "area" numeric,
  "bathrooms" numeric,
  "heating" text,
  "site" text,
  "images" jsonb default '[]',
  "description" text,
  "coordinates" jsonb,
  "grossArea" numeric,
  "netArea" numeric,
  "openArea" numeric,
  "buildingAge" numeric,
  "floorCount" numeric,
  "kitchenType" text,
  "parking" text,
  "furnished" text,
  "usageStatus" text,
  "deedStatus" text,
  "ownerId" text,
  "ownerName" text,
  "city" text,
  "district" text,
  "neighborhood" text,
  "address" text,
  "dues" numeric,
  "deposit" numeric,
  "listingDate" text,
  "isInSite" boolean,
  "publishedOnMarketplace" boolean,
  "publishedOnPersonalSite" boolean,
  "currentFloor" numeric,
  "balkon" text,
  "asansor" text,
  "kimden" text,
  "krediyeUygunluk" text,
  "takas" text,
  "imarDurumu" text,
  "adaNo" text,
  "parselNo" text,
  "paftaNo" text,
  "kaks" numeric,
  "gabari" numeric,
  "created_at" timestamp with time zone default timezone('utc'::text, now())
);

-- Customers Table
create table if not exists "customers" (
  "id" text primary key,
  "name" text,
  "email" text,
  "phone" text,
  "status" text,
  "customerType" text,
  "source" text,
  "createdAt" text,
  "interactions" jsonb default '[]',
  "avatar" text,
  "notes" text,
  "created_at" timestamp with time zone default timezone('utc'::text, now())
);

-- Sites Table
create table if not exists "sites" (
  "id" text primary key,
  "name" text,
  "region" text,
  "address" text,
  "status" text,
  "createdAt" text,
  "created_at" timestamp with time zone default timezone('utc'::text, now())
);

-- Activities Table
create table if not exists "activities" (
  "id" text primary key,
  "type" text,
  "customerId" text,
  "customerName" text,
  "propertyId" text,
  "propertyTitle" text,
  "date" text,
  "description" text,
  "status" text,
  "created_at" timestamp with time zone default timezone('utc'::text, now())
);

-- Requests Table
create table if not exists "requests" (
  "id" text primary key,
  "customerId" text,
  "customerName" text,
  "type" text,
  "requestType" text, -- Satılık / Kiralık
  "status" text,
  "minPrice" numeric,
  "maxPrice" numeric,
  "currency" text,
  "city" text,
  "district" text,
  "minRooms" text,
  "date" text,
  "notes" text,
  "minRooms" text,
  "siteId" text, -- Added for Site based filtering
  "created_at" timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS) - Optional but recommended
alter table "properties" enable row level security;
alter table "customers" enable row level security;
alter table "sites" enable row level security;
alter table "activities" enable row level security;
alter table "requests" enable row level security;

-- Create policy to allow public access (for development simplicity, should be restricted in production)
create policy "Public Access Properties" on "properties" for all using (true);
create policy "Public Access Customers" on "customers" for all using (true);
create policy "Public Access Sites" on "sites" for all using (true);
create policy "Public Access Activities" on "activities" for all using (true);
create policy "Public Access Requests" on "requests" for all using (true);

-- Add new columns to customers table for enhanced details (Added: 2025-12-14)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS "hasPets" boolean DEFAULT false;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS "petDetails" text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS "currentHousingStatus" text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS "currentRegion" text;
