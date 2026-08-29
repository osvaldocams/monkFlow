## 📌 Summary
Implementation of the single movement detail view (`/movements/:movementId`), connecting the UI with the backend API for both reading specific movement metadata and performing movement deletion.

## 🚀 Key Changes

### 1. View & Routing Setup
- **`router.tsx`**: Registered route `/movements/:movementId` pointing to `MovementDetailView`.
- **`MovementDetailView.tsx`**: Created the detailed view scaffold applying the project's visual identity (badges, card layout, metadata fields).

### 2. API Integration & Querying
- **`MovementsAPI.ts`**:
  - Added `getMovementById` service with Zod schema validation.
  - Added `deleteMovement` service with proper error propagation.
- **`useMovements.ts` (Hooks)**:
  - Created `useMovementById` hook using dynamic `enabled: !!movementId` execution flag.
  - Created `useDeleteMovement` mutation hook with cross-query invalidation (`['movements']` and `['accounts']`) to keep balance data consistent upon deletion.

### 3. UX & State Control
- Implemented **Early Return pattern** in `MovementDetailView` to handle transitional UI states seamlessly (`isLoading`, `isError`, and `!movement`), removing `undefined` type safety issues across the view.
- Added confirmation dialog (`window.confirm`) and dynamic loading states (`isDeleting`) for the delete action trigger.

## 🧪 How to Test
1. Go to the movements list (`/movements`) and click on any individual movement item to navigate to `/movements/:movementId`.
2. Verify that the loading state is displayed correctly before the data populates.
3. Confirm movement details (amount, type badge, description, date) render matching the backend response.
4. Click the **Delete** button, confirm the modal prompt, and verify:
   - Request fires successfully.
   - User is redirected back to `/movements`.
   - The deleted item is removed from the list and account balances refresh.

