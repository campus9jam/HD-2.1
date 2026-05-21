# Security Specification: House of Daraja

## 1. Data Invariants

1. **User Invariant**: A user's role can only be 'citizen', 'contributor', or 'admin'. Only an admin can upgrade a user's role.
2. **Product Invariant**: Products must have a vendorId, title, price, and status. Only a vendor or admin can create/modify products.
3. **Order Invariant**: Orders must have a customerId, vendorId, amount, and status. A customer can only create 'pending' orders. Transition to 'paid' must be handled by a secure system handler (admin).
4. **Governance Invariant**: A citizen can only vote once per proposal. Vote weight is determined by citizenship status.
5. **PII Invariant**: User PII (email, address) must be protected and only accessible by the owner or admin.

## 2. The "Dirty Dozen" Payloads

1. **Identity Spoofing**: Attempt to create a user profile with `role: 'admin'`.
   - Result: `PERMISSION_DENIED` (Guard: `incoming().role == 'citizen'`)
2. **Resource Poisoning**: Attempt to create a product with a 1MB string as `productId`.
   - Result: `PERMISSION_DENIED` (Guard: `isValidId(productId)`)
3. **Escalation Attack**: Authenticated user attempts to list the `/users` collection.
   - Result: `PERMISSION_DENIED` (Guard: `allow list: if isAdmin()`)
4. **Price Manipulation**: Attempt to update a product price to `0.01` without being the vendor.
   - Result: `PERMISSION_DENIED` (Guard: `isOwner(existing().vendorId)`)
5. **State Skipping**: Attempt to create an order with `status: 'completed'`.
   - Result: `PERMISSION_DENIED` (Guard: `incoming().status == 'pending'`)
6. **Double Voting**: Attempt to create two votes for the same `proposalId` and `userId`.
   - Result: `PERMISSION_DENIED` (Guard: `voteId == incoming().proposalId + '_' + request.auth.uid`)
7. **Shadow Field Injection**: Attempt to update a user profile with an extra `isVerified: true` field.
   - Result: `PERMISSION_DENIED` (Guard: `affectedKeys().hasOnly([...])`)
8. **PII Breach**: Authenticated user attempts to `get` another user's profile which contains an email.
   - Result: `PERMISSION_DENIED` (Guard: `allow read: if isSignedIn() && (isOwner(userId) || isAdmin())` -- Note: current rules allow `get: if isSignedIn()`, needs review for PII isolation)
9. **Unverified Write**: User with `email_verified: false` attempts to create a high-status artifact.
   - Result: `PERMISSION_DENIED` (Guard: `isVerified()`)
10. **Historical Tampering**: Attempt to update a feed item's `timestamp`.
    - Result: `PERMISSION_DENIED` (Guard: `allow update: if isAdmin()`)
11. **Atelier Hijack**: User A attempts to create an `AtelierClient` with User B's email.
    - Result: `PERMISSION_DENIED` (Guard: `incoming().email == request.auth.token.email`)
12. **Proposal Sabotage**: Non-admin attempts to `delete` a governance proposal.
    - Result: `PERMISSION_DENIED` (Guard: `allow delete: if isAdmin()`)

## 3. Vulnerability Analysis & Delta Report

| Collection | Vulnerability Found | Mitigation |
|------------|---------------------|------------|
| `/users` | PII Leak: `get` is allowed for any signed-in user. | Restrict `get` to `isOwner(userId) \|\| isAdmin()`. |
| `/atlier_orders` | Broad list: `allow list: if isSignedIn()` | Change to relational check: `resource.data.clientEmail == auth.token.email`. |
| `/products` | Vendor bypass: `allow create: if isVerified() && (request.auth.token.role == 'vendor' || isAdmin())` | Ensure vendor role is read from a secure admin-only document, not client token. |

## 4. Conflict Report: Conflict between current rules and app requirements

| Requirement | Rule | Conflict | Resolution |
|-------------|------|----------|------------|
| Marketplace browsing | `allow read: if true` | No conflict. | Publicly viewable. |
| User Profile Setup | `allow create: if isOwner(userId)` | No conflict. | Required for onboarding. |
| Chat History | `allow list: if resource.data.userId == request.auth.uid` | No conflict. | Private history. |
