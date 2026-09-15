# E-Commerce Boilerplate

A modular full-stack e-commerce application built with **Next.js, TypeScript, PostgreSQL, Prisma, and Square**.

The goal of this project is not just to build a single online store. It is being developed as a reusable e-commerce foundation that can support different storefronts, payment providers, authentication systems, fulfillment workflows, and business requirements.

The project currently includes product catalog functionality, anonymous carts, inventory management, checkout reservations, order creation, and a working Square ACH Sandbox payment flow.

> **Project Status:** Active Development

---

## Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Next.js App Router

### Backend

- Next.js Route Handlers
- Server Actions
- TypeScript
- Prisma ORM

### Database

- PostgreSQL
- Prisma migrations

### Payments

- Square Payments API
- Square Web Payments SDK
- ACH / Bank Payments
- Modular payment-provider architecture

### Authentication

The database architecture includes models for:

- Users
- Sessions
- Accounts
- Email verification
- Two-factor authentication
- Passkeys / WebAuthn

The complete customer authentication flow is part of the upcoming development roadmap.

---

# Current Features

## Product Catalog

The application supports:

- Products
- Product variants
- SKUs
- Product images
- Categories
- Product status
- Product pricing
- Compare-at pricing
- Inventory per product variant

Example relationship:

```text
Product
   |
   +-- ProductVariant
   |       |
   |       +-- Inventory
   |
   +-- ProductImage
   |
   +-- Category
```

---

## Shopping Cart

Anonymous shopping carts are supported using a secure random cart token stored in an **HttpOnly cookie**.

Implemented functionality includes:

- Create cart
- Add product variants
- Update quantities
- Remove products
- Clear cart
- Stock validation
- Convert cart during checkout

The browser never receives the internal database cart ID.

Instead, it receives an opaque cart token.

```text
Browser
   |
   | HttpOnly Cookie
   v
Cart Token
   |
   v
Database Cart
```

---

# Checkout System

The checkout system creates an order and temporarily reserves inventory before payment.

The reservation window is currently:

```text
30 minutes
```

Checkout performs inventory reservation inside a database transaction.

This prevents two customers from purchasing the same last item at the same time.

Example:

```text
Customer
   |
   v
Shopping Cart
   |
   v
Checkout
   |
   +-- Create Order
   |
   +-- Create Reservation
   |
   +-- Reserve Inventory
   |
   v
Payment
```

---

# Inventory Reservation System

Inventory uses two quantities:

```text
quantityAvailable
quantityReserved
```

Available-to-purchase inventory is calculated conceptually as:

```text
quantityAvailable - quantityReserved
```

Inventory reservation uses an atomic database update similar to:

```sql
UPDATE inventory
SET "quantityReserved" =
    "quantityReserved" + quantity
WHERE
    "variantId" = variant
    AND (
        "quantityAvailable" -
        "quantityReserved"
    ) >= quantity;
```

This prevents overselling during concurrent checkout attempts.

---

## Reservation States

Reservations currently support:

```text
ACTIVE
COMPLETED
RELEASED
EXPIRED
```

Typical checkout lifecycle:

```text
ACTIVE
  |
  +---- Payment accepted ----> COMPLETED
  |
  +---- Customer cancels ----> RELEASED
  |
  +---- Reservation expires -> EXPIRED
```

---

# Reservation Expiration Worker

Expired checkout reservations can be cleaned up automatically.

A reservation worker:

- Finds expired active reservations
- Claims the reservation
- Releases reserved inventory
- Cancels unpaid pending orders

Run manually with:

```bash
npm run reservations:expire
```

This can later be executed by:

- Cron
- Scheduled server job
- Cloud job
- Worker service

---

# Order System

Orders contain historical snapshots of purchased products so previous orders remain accurate even if the product catalog changes later.

Order information includes:

- Order number
- Customer email
- Product snapshot
- Variant snapshot
- SKU
- Quantity
- Unit price
- Subtotal
- Discounts
- Tax
- Shipping
- Grand total
- Payment status
- Fulfillment status

---

## Order Status

Current order states include:

```text
PENDING
CONFIRMED
PROCESSING
SHIPPED
COMPLETED
CANCELLED
REFUNDED
```

Payment status is tracked independently:

```text
PENDING
PAID
FAILED
PARTIALLY_REFUNDED
REFUNDED
```

This separation allows payment and fulfillment workflows to evolve independently.

---

# Payment Architecture

The payment system is designed so payment methods and payment providers are separate concepts.

Example:

```text
Payment Method
    |
    +-- ACH
    |    |
    |    +-- Square
    |    +-- Future Provider
    |
    +-- Card
    |    |
    |    +-- Square
    |    +-- Stripe
    |
    +-- PayPal
    |
    +-- Google Pay
    |
    +-- Apple Pay
    |
    +-- Venmo
```

This allows providers to be replaced or added without rewriting the entire checkout system.

---

## Current Payment Methods

### ACH / Bank Payment

Current provider:

```text
Square
```

Status:

```text
Working in Square Sandbox
```

The current Square ACH flow:

```text
Customer selects ACH
        |
        v
Square Web Payments SDK
        |
        v
Bank authorization
        |
        v
Source Token
        |
        v
Next.js Payment API
        |
        v
Server validates Order
        |
        v
Square Payments API
        |
        v
Payment PROCESSING
        |
        v
Inventory reservation finalized
        |
        v
Order PROCESSING
```

Sensitive payment credentials are handled by Square and are never stored by the application.

---

# Payment Idempotency

Payment records include an idempotency key.

This helps prevent accidental duplicate payment creation if:

- The browser retries a request
- The network disconnects
- A server request is retried
- The user submits payment multiple times

Conceptually:

```text
Payment Attempt
      |
      v
Idempotency Key
      |
      +--- Already processed ---> reuse result
      |
      +--- New request ---------> create payment
```

---

# Square ACH Sandbox

Square ACH payments have successfully been tested in the Square Sandbox environment.

A successful ACH submission currently produces:

```text
Payment
provider = SQUARE
method = ACH
status = PROCESSING
```

The associated order moves to:

```text
status = PROCESSING
paymentStatus = PENDING
```

The inventory reservation becomes:

```text
COMPLETED
```

and reserved inventory is converted into purchased inventory.

---

# Square Webhook Support

The project contains the foundation for Square webhook handling.

The webhook endpoint preserves the raw HTTP body so Square webhook signatures can be validated securely.

Current webhook work includes:

- Square webhook endpoint
- Raw request-body handling
- HMAC signature validation
- Square webhook configuration structure
- `payment.updated` event preparation

Planned webhook processing will update local payment and order state when ACH settlement completes or fails.

---

# Webhook Idempotency

The database includes a `PaymentEvent` model.

Provider webhook event IDs are unique:

```text
providerEventId
```

This is designed to prevent the same webhook event from being processed more than once.

Future flow:

```text
Square Webhook
     |
     v
Verify Signature
     |
     v
Check providerEventId
     |
     +--- Already exists ---> Ignore duplicate
     |
     v
Store PaymentEvent
     |
     v
Process Payment State
```

---

# Security Design

Security has been considered as part of the architecture rather than being added only at the end.

Current security-related design includes:

- HttpOnly cart cookies
- HttpOnly checkout cookies
- SameSite cookie restrictions
- Secure cookies in production
- Opaque cart tokens
- Opaque checkout tokens
- Server-side price validation
- Server-side inventory validation
- Database transactions
- Serializable checkout transactions
- Atomic inventory updates
- Payment idempotency keys
- Webhook signature verification
- Webhook event idempotency
- Environment variables for secrets
- No raw bank credentials stored by the application

Sensitive credentials such as the following are excluded from Git:

```text
DATABASE_URL
SQUARE_ACCESS_TOKEN
SQUARE_WEBHOOK_SIGNATURE_KEY
```

---

# Current Project Structure

A simplified version of the architecture:

```text
src/
|
├── app/
│   |
│   ├── (store)/
│   │   ├── page.tsx
│   │   ├── products/
│   │   ├── cart/
│   │   └── checkout/
│   |
│   └── api/
│       ├── payments/
│       │   └── square/
│       │       ├── config/
│       │       └── ach/
│       |
│       └── webhooks/
│           └── square/
│
├── features/
│   |
│   ├── cart/
│   |
│   ├── checkout/
│   |
│   ├── products/
│   |
│   └── payments/
│       |
│       ├── core/
│       │   ├── payment.types.ts
│       │   ├── payment.gateway.ts
│       │   └── payment.registry.ts
│       |
│       ├── shared/
│       |
│       ├── providers/
│       │   └── square/
│       |
│       └── methods/
│           |
│           ├── ach/
│           │   └── providers/
│           │       └── square/
│           |
│           ├── card/
│           ├── google-pay/
│           ├── apple-pay/
│           ├── paypal/
│           └── venmo/
│
├── lib/
│   └── db/
│
└── generated/
    └── prisma/

prisma/
├── schema.prisma
└── migrations/

scripts/
├── expire-reservations.ts
└── test-square.ts
```

---

# Local Development

## Requirements

Install:

- Node.js
- PostgreSQL
- npm
- Git

---

## Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/ecommerce-boilerplate.git
```

Enter the project:

```bash
cd ecommerce-boilerplate
```

Install dependencies:

```bash
npm install
```

---

## Environment Variables

Create:

```text
.env
```

Use `.env.example` as a template.

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/ecommerce_dev"

SQUARE_ENVIRONMENT="sandbox"

SQUARE_APPLICATION_ID=""
SQUARE_ACCESS_TOKEN=""
SQUARE_LOCATION_ID=""

SQUARE_WEBHOOK_SIGNATURE_KEY=""
SQUARE_WEBHOOK_NOTIFICATION_URL=""
```

Never commit real credentials.

---

## Prisma

Generate Prisma Client:

```bash
npx prisma generate
```

Run database migrations:

```bash
npx prisma migrate dev
```

---

## Start Development Server

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

# Development Roadmap

The project is still under active development.

The following features are planned.

## Phase 1 — Complete ACH Payments

- [x] Square SDK integration
- [x] Square Sandbox configuration
- [x] ACH authorization UI
- [x] Server-side payment creation
- [x] Payment persistence
- [x] Inventory finalization
- [x] Order processing state
- [x] Webhook signature verification foundation
- [ ] Persist webhook events
- [ ] Handle duplicate webhook events
- [ ] ACH settlement success handling
- [ ] ACH payment failure handling
- [ ] Inventory restoration after failed ACH
- [ ] Processing-page payment polling
- [ ] Payment success page
- [ ] Payment failure page

---

## Phase 2 — Card Payments

Add modular card-payment support.

Potential providers:

```text
Square
Stripe
```

Planned functionality:

- Card tokenization
- Payment authorization
- Capture
- Payment failure handling
- Refund support
- Webhook processing

---

## Phase 3 — Digital Wallets

Planned payment methods:

- Google Pay
- Apple Pay
- PayPal
- Venmo

Each payment method will remain isolated behind the common payment gateway interface.

---

## Phase 4 — Authentication

Planned authentication functionality:

- Customer registration
- Login
- Logout
- Email verification
- Password reset
- Session management
- Two-factor authentication
- Backup codes
- Passkeys / WebAuthn

---

## Phase 5 — Customer Accounts

Customer dashboard:

- Profile
- Saved addresses
- Order history
- Order details
- Payment history
- Saved preferences

---

## Phase 6 — Admin Dashboard

Administrative functionality:

- Product management
- Variant management
- Inventory management
- Category management
- Order management
- Payment management
- Customer management
- Refund processing
- Audit logs

---

## Phase 7 — Shipping

Planned functionality:

- Shipping addresses
- Shipping methods
- Shipping-rate calculation
- Tracking information
- Fulfillment workflow

Potential integrations may include:

- UPS
- FedEx
- USPS
- Shipping APIs

---

## Phase 8 — Tax

Planned functionality:

- Location-based tax calculation
- Tax-provider integration
- Tax snapshots stored with orders

---

## Phase 9 — Discounts and Promotions

Planned functionality:

- Coupon codes
- Percentage discounts
- Fixed discounts
- Product-specific promotions
- Expiration dates
- Usage limits

---

## Phase 10 — Production Readiness

Before production deployment:

- Automated testing
- Integration testing
- Payment tests
- Webhook tests
- Checkout concurrency tests
- Rate limiting
- Security headers
- Structured logging
- Monitoring
- Error tracking
- Background workers
- CI/CD pipeline
- Production database configuration
- Deployment documentation

---

# Testing Goals

The checkout and payment system will eventually include tests for scenarios such as:

```text
Two customers purchase the last item simultaneously
Duplicate payment request
Duplicate webhook delivery
Payment succeeds
Payment fails
ACH settlement fails later
Reservation expires
Customer cancels checkout
Inventory becomes unavailable
Network request is retried
Webhook arrives multiple times
```

These cases are important because payment systems must remain consistent even when external systems retry or fail.

---

# Architecture Goals

The long-term goals of this project are:

### Modular

Features should be replaceable without rewriting unrelated areas.

### Provider Independent

Business logic should not depend directly on Stripe, Square, PayPal, or another provider.

### Secure

Sensitive payment data should remain with payment providers whenever possible.

### Transaction Safe

Inventory and checkout operations should remain consistent under concurrent traffic.

### Idempotent

Repeated requests should not accidentally create multiple payments or process the same webhook multiple times.

### Reusable

The project should eventually be usable as a starting point for multiple e-commerce applications.

---

# Current Development Focus

The immediate development focus is:

```text
Square ACH
    |
    v
Webhook Event
    |
    v
Verify Signature
    |
    v
Store PaymentEvent
    |
    v
Update Payment
    |
    +-- COMPLETED
    |       |
    |       v
    |     Order PAID
    |
    +-- FAILED
            |
            v
       Restore Inventory
            |
            v
       Cancel Order
```

After the ACH lifecycle is complete, development will move to additional payment methods and customer authentication.

---

# Why This Project

This project is being built as a practical exercise in production-style full-stack architecture.

The primary areas being explored include:

- Relational database design
- PostgreSQL
- Prisma ORM
- Next.js architecture
- TypeScript
- Server-side application design
- REST-style APIs
- Payment integrations
- Webhooks
- Concurrency
- Database transactions
- Inventory management
- Authentication
- Security
- Idempotency
- Modular software architecture

Rather than building only the visible storefront, the project focuses heavily on the backend workflows required to safely operate an e-commerce application.

---

# Disclaimer

This project is currently a development and portfolio project.

Square integration currently uses the **Sandbox environment**.

It should not be used to process real customer payments until the remaining payment lifecycle, security, testing, monitoring, and production-hardening work has been completed.
