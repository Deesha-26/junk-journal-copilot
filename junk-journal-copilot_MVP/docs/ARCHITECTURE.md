# Architecture (MVP)

## Identity & isolation
- API sets an anonymous, httpOnly cookie `jj_token`.
- Every DB record is scoped by `ownerId` derived from that cookie.
- This provides isolation without a login UI.

## Data model
Owner → Journal → Entry → MediaAsset
Approvals create immutable EntryVersion records.

## Media processing
- On upload, originals are stored to `apps/api/storage/<owner>/<entry>/...`
- A derived enhanced image is generated in `_derived/` and referenced as `derivedUrl`.
