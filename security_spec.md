# Security Specification: House of Daraja Sovereignty Layer

## Data Invariants
1. **Identity Immunity**: User status tiers (`Gold`, `Diamond`, etc) can ONLY be updated by the platform Admin node.
2. **Provenance Integrity**: Acquisitions are immutable after creation.
3. **Vendor Accreditation**: Only Admin can grant "Master" or "Platinum" statuses.
4. **Acquisition Atomicity**: A user can only create an acquisition where `buyerId` matches their authenticated UID.

## The "Dirty Dozen" (Attack Payloads)
1. **Self-Promotion**: Authenticated user tries to update their own `statusTier` to `Diamond Elite`.
2. **Shadow Artifact**: Non-admin user tries to create a `Product` in the archives.
3. **Provenance Forgery**: Authenticated user tries to create an `Acquisition` with `buyerId` pointing to another user.
4. **Stock Exhaustion**: Attackers trying to set negative `stock` or infinity values.
5. **ID Poisoning**: Injecting 1MB strings into a document ID to cause resource exhaustion.
6. **PII Leak**: Unauthorized user trying to read `email` fields in the `users` collection without ownership.
7. **Terminal State Reset**: Overwriting a `secured` acquisition back to `processing`.
8. **Vendor Spoofing**: User tries to update a `Vendor` profile they do not own.
9. **Spam Signals**: Flood the `feed` with 1,000 requests per minute from one UID.
10. **Shadow Key Injection**: Adding unknown fields (e.g., `isAdmin: true`) to a user profile during creation.
11. **Time Travel**: Client providing a manual `timestamp` in the future for an acquisition.
12. **Blanket Query Scraping**: Attempting a `list` query on `acquisitions` without a `where buyerId == currentAuth` clause.

## Test Matrix (Failing Expectations)
All payloads above MUST return `PERMISSION_DENIED` by the kernel.
