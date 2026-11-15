# SAIM CLOTHES Firestore Security Specification

## 1. Data Invariants
1. **Admin Authority**: Only verified admin (`saimrauf768@gmail.com` with `email_verified == true` or UID in `/admins/{uid}`) may create/edit/delete products, categories, coupons, or modify order statuses.
2. **Product Integrity**: Every product must pass `isValidProduct`, enforce `originalPrice >= discountPrice > 0`, bounded `sizes` (1–6), `colors` (1–10), `images` (1–6), and non-negative integer `stock`.
3. **Checkout Stock Atomicity**: Non-admin checkout updates to `/products/{productId}` may ONLY decrement `stock` (`incoming().stock < existing().stock && incoming().stock >= 0`) and update `updatedAt == request.time`, and MUST NOT alter price, name, category, or status.
4. **Order Isolation**: Orders are readable via `list` only by admins or the owning user (`resource.data.userId == request.auth.uid`). Guest orders (`isGuest == true`) can only be fetched individually by exact `orderId` (`get`), never listed.
5. **PII Isolation**: User private profiles (`/users/{userId}/private/info`) and customer records (`/customers/{customerId}`) are strictly readable only by the owner or verified admin.
6. **Review Authenticity**: Reviews under `/products/{productId}/reviews/{reviewId}` require an existing parent product, verified email auth, and `userId == request.auth.uid`.
7. **Temporal Integrity**: All `createdAt` and `updatedAt` timestamps must match `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Unverified Admin Email Spoof**: Request with `token.email == 'saimrauf768@gmail.com'` and `email_verified == false` writing to `/products/p1`.
2. **Shadow Field Injection on Product Create**: Admin or user creating a product with an extra undocumented key `isSponsored: true`.
3. **Price Tampering on Checkout**: Customer updating `/products/p1` with `affectedKeys: ['discountPrice', 'stock']` to set `discountPrice = 1`.
4. **Stock Inflation Attack**: Non-admin updating `/products/p1` with `stock: existing().stock + 100`.
5. **Cross-User Order Scraping**: Authenticated customer executing a `list` query on `/orders` without `where('userId', '==', uid)`.
6. **Order Status Escalation**: Customer updating their own `/orders/SC-1001` to `status: 'Delivered'`.
7. **PII Leak via Customer List**: Non-admin customer attempting `list` on `/customers`.
8. **Fake User Identity on Review**: Authenticated user A posting a review with `userId: 'user_B'`.
9. **Orphaned Review Injection**: Authenticated user posting a review under `/products/nonexistent_id/reviews/r1`.
10. **ID Poisoning**: Creating a document at `/orders/` with a 1500-char ID or invalid characters (`../admin`).
11. **Coupon Enumeration**: Non-admin attempting `list` on `/coupons` to scrape all private discount codes.
12. **Client Timestamp Forgery**: Creating an order or review with a backdated `createdAt` not equal to `request.time`.
