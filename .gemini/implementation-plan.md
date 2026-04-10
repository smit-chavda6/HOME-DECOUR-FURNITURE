# Product System Reset & Rebuild - Implementation Plan

## Overview
Complete overhaul of the product system: new schema, admin panel redesign, 3D support, and modern frontend.

## Phase 1: Database Schema Upgrade (server.js)
- [x] New Product Schema with all fields (slug, SKU, dimensions, colors, gallery images, 3D fields, SEO, featured/trending/new flags)
- [x] Update seed data function (empty - no default products)
- [x] Update product API routes (CRUD) to handle new fields
- [x] Add 3D model upload route
- [x] Add multi-image upload route
- [x] Update category list

## Phase 2: Admin Panel Redesign
- [ ] New admin-products.html with tabbed layout
- [ ] New CSS for admin products page
- [ ] New admin-products.js (external file)

## Phase 3: Frontend Product Cards & Gallery
- [ ] Update gallery.js to render new product cards
- [ ] Update gallery.css for new card design
- [ ] Add "View in 3D" badge, wishlist, quick view

## Phase 4: Product Detail Page
- [ ] Update product-details.html with 3D viewer support
- [ ] Update product-details.js
- [ ] Update product-details.css

## Phase 5: Polish & Testing
- [ ] Responsive design check
- [ ] Dark mode support
- [ ] Performance optimization
