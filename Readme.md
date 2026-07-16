# Furniture & Lifestyle Store Management System

## Vision, Requirements & Development Progress

# Project Vision

The goal of this project is to build a modern web application that serves two purposes:

1. A beautiful online product catalog where customers can browse products without creating an account.
2. A complete business management system for the shop owner to manage inventory, sales, suppliers, customers, analytics, and future business growth.

The website is **not** intended to be an e-commerce platform initially. Instead, it acts as a digital showroom where customers can explore products and contact the shop through WhatsApp.

The long-term vision is to gradually evolve the application into a lightweight ERP (Enterprise Resource Planning) system specifically designed for furniture and lifestyle stores.

---

# Business Type

The shop sells products such as:

* Sofas
* Beds
* Dining Tables
* Coffee Tables
* TV Units
* Chairs
* Home Decor Items
* Ladies Handbags
* Travel Trolley Bags
* Future categories added by the admin

---

# Customer Website

## Purpose

The customer website is only for browsing products and sending enquiries.

Customers do NOT need an account.

There is:

* No cart
* No checkout
* No online payment
* No order tracking

---

## Features

### Homepage

* Hero Banner
* Featured Categories
* Featured Products
* New Arrivals
* Offer Banner
* Contact Information
* WhatsApp Button

---

### Product Catalog

Customers can:

* Browse products
* Search products
* View categories
* View product details
* View product images
* Send enquiry via WhatsApp

---

### Product Details

Each product contains:

* Product Name
* Auto Generated SKU
* Brand
* Category
* Description
* Material
* Dimensions
* Color
* Dynamic Attributes
* Up to 5 Images
* Availability Status

Price visibility is configurable per product.

Possible display options:

* Show Price
* Contact for Price
* Starting From Price

---

### WhatsApp Enquiry

Clicking "Enquire" opens WhatsApp with a pre-filled message containing:

* Product Name
* SKU
* Category
* Product Link
* Request for Price & Availability

---

### Out of Stock Behaviour

When stock reaches zero, the admin chooses:

* Show product as "Out of Stock"
  OR
* Hide the product completely

---

# Admin Panel

Only administrators can log in.

There are currently no customer accounts.

---

## Dashboard

The dashboard will display:

* Total Sales
* Revenue
* Pending Payments
* Stock Value
* Low Stock Products
* Out of Stock Products
* Best Selling Products
* Best Selling Categories
* Top Customers
* Monthly Sales
* Estimated Profit
* Custom Date Range Reports

---

# Product Management

Admin can:

* Add Product
* Edit Product
* Delete Product
* Activate / Deactivate Product

Each product stores:

* Name
* SKU
* Slug
* Category
* Brand
* Description
* Purchase Price
* Selling Price
* Negotiation Settings
* Supplier
* Stock
* Images
* Dynamic Attributes

---

# Dynamic Categories

One of the most important features.

The admin can create unlimited categories.

Examples:

* Sofa
* Bed
* Chair
* Mattress
* Handbag
* Trolley Bag

No code changes are required to create new categories.

---

## Category Fields

Each category can define its own fields.

Example:

Sofa

* Material
* Seating Capacity
* Cushion Type
* Frame Material

Bed

* Storage
* Size
* Material

Handbag

* Material
* Compartments
* Closure Type

Trolley Bag

* Wheels
* Weight
* Size

The admin creates these fields through the dashboard.

---

# Dynamic Product Attributes

Products do not have fixed schemas for category-specific information.

Instead, each product stores an attribute map.

Example:

Sofa

Material → Leather

Seats → 3

Color → Grey

Example:

Handbag

Material → PU Leather

Compartments → 4

Closure → Zip

This makes the application scalable.

---

# Inventory Management

Each product stores:

* Purchase Cost
* Selling Price
* Current Stock
* Supplier
* Low Stock Alert

Stock automatically decreases after every sale.

---

# Supplier Management

Every product belongs to a supplier.

Supplier details include:

* Name
* Phone
* Email (optional)
* Address (optional)

Future improvements may include supplier purchase history.

---

# Sales Management (Sell-Out)

When a customer purchases a product, the admin records:

* Product
* Quantity Sold
* Selling Price
* Amount Paid
* Pending Amount
* Customer Name
* Customer Phone
* Sale Date

The system automatically:

* Reduces stock
* Updates analytics
* Creates customer history
* Tracks pending balance

---

# Customer History

Customers do not create accounts.

Instead, the system builds customer records from sales.

Each customer profile includes:

* Name
* Phone Number
* Purchase History
* Total Purchases
* Total Spending
* Pending Balance
* Last Purchase Date

Future feature:

Receive Payment against pending balance.

---

# Offers System

The offer engine will support:

Product Offers

Category Offers

Brand Offers

Percentage Discount

Flat Discount

Festival Offers

Featured Products

New Arrivals

Offer Start Date

Offer End Date

Offer Priority

Offer Analytics

Future features:

* Bundle Offers
* Combo Offers
* Loyalty Discounts
* Customer Specific Discounts

---

# Analytics

Reports include:

Sales

Revenue

Pending Payments

Profit

Stock Value

Best Sellers

Category Performance

Top Customers

Monthly Sales

Date Range Reports

Offer Performance

---

# Authentication

Only Admin Login.

Current authentication:

* JWT Access Token
* JWT Refresh Token
* Password Hashing using bcrypt

---

# Database Design

Main Collections

Users

Categories

Products

Suppliers

Sales

Customers (generated from sales)

Offers

Future Collections

Invoices

Payments

Expenses

Notifications

---

# Product Architecture

Products contain:

Basic Information

Pricing

Inventory

Supplier

Media

SEO

Dynamic Attributes

---

# Category Architecture

Each category stores:

Category Name

Slug

Dynamic Field Definitions

Field Types

Validation Rules

Field Options

---

# Supported Dynamic Field Types

* Text
* Number
* Decimal
* Boolean
* Select
* Multi Select
* Date
* Textarea
* URL
* Color Picker

---

# Technical Stack

Frontend

* React
* Next.js
* Tailwind CSS

Backend

* Node.js
* Express.js

Database

* MongoDB
* Mongoose

Authentication

* JWT
* bcrypt

Image Storage

* Cloudinary

---

# Development Progress

## Completed Requirements

✔ Project vision defined

✔ Catalog-first architecture

✔ No e-commerce checkout

✔ Admin-only login

✔ Dynamic categories planned

✔ Dynamic product fields planned

✔ Inventory management planned

✔ Supplier management planned

✔ Sell-out workflow defined

✔ Customer history defined

✔ Pending payment tracking defined

✔ WhatsApp enquiry workflow defined

✔ Product image limit decided (5 images)

✔ Automatic SKU generation planned

✔ Slug generation planned

✔ Product visibility options defined

✔ Offer system concept planned

✔ Analytics requirements identified

---

# Future Roadmap

## Phase 1

* Authentication
* Category Management
* Product Management
* Supplier Management
* Inventory
* Customer Website
* WhatsApp Integration

---

## Phase 2

* Sales Module
* Customer History
* Pending Payments
* Analytics Dashboard
* Reports
* Offer Management

---

## Phase 3

* Invoice Generation
* Payment Collection
* QR Labels
* Barcode Support
* Expense Tracking
* Profit Analysis

---

## Phase 4

* Multi-user Roles
* Staff Accounts
* AI Product Descriptions
* AI Analytics
* Sales Forecasting
* Advanced Reporting
* Progressive Web App (PWA)

---

# Project Philosophy

The application should remain:

* Fast
* Simple to use
* Scalable
* Mobile Friendly
* Easy for non-technical staff
* Flexible enough to support new product categories without changing code
* Focused on improving showroom operations rather than becoming a full e-commerce platform

The end goal is to build a professional business management system that grows alongside the shop and can eventually serve as a complete ERP solution for furniture and lifestyle retail.
