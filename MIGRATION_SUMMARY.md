# Authentication Migration Summary

## Implementation Complete ✅

The authentication flow has been successfully migrated from password-based to signature-based ViewAccount creation with embedded wallet + optional external wallet linking.

## What Changed

### 1. Privy Configuration
- **File**: `src/context/privy.context.tsx`
- **Change**: Updated `createOnLogin` from `"users-without-wallets"` to `"all-users"`
- **Effect**: All users now get an embedded wallet created automatically upon email sign-in

### 2. ViewAccount Class Refactor
- **File**: `src/services/Account.ts`
- **Changes**:
  - Removed all password-related methods and encryption
  - Added `createFromSignature(signature: Hex)` - creates ViewAccount from `keccak256(signature)`
  - Added `signViewAccountCreation()` - signs typed data with embedded wallet
  - Updated `authorize()` - now uses ViewAccount's public key for encryption (no password)
  - Updated `loadAuthorization()` - decrypts using ViewAccount's private key
  - Replaced `hasEncryptedViewAccount()` with `hasAuthorization()`
  - ViewAccount private key never persisted, regenerated each session

### 3. Wallet Adapter Enhancement
- **File**: `src/context/ledger/useWalletAdapter.ts`
- **Changes**:
  - Added `embeddedWallet` - tracks Privy-created wallet
  - Added `primaryWallet` - external wallet if linked, else embedded wallet
  - Added `externalWallet` - linked external wallet
  - Added `linkExternalWallet()` - triggers Privy's wallet linking
  - `wallet` now returns `primaryWallet` for backward compatibility

### 4. New Wallet Linking Component
- **File**: `src/components/Onboarding/LinkWallet.tsx` (NEW)
- **Purpose**: Allows users to optionally link an external wallet or skip

### 5. Updated Onboarding Flow
- **Files**: 
  - `src/components/Onboarding/Connect.tsx` - Now email-only sign in
  - `src/components/Onboarding/Onboarding.tsx` - Added LinkWallet step
  - `src/components/Onboarding/RegisterForm.tsx` - Removed password input, auto-triggers
  - `src/components/Onboarding/useRegister.tsx` - Implements signature-based flow

### 6. Context Updates
- **Files**:
  - `src/context/ledger/ledger.context.ts` - Removed password from context
  - `src/context/ledger/ledger.provider.tsx` - Removed password state
  - `src/context/ledger/useViewAccountAuthorization.ts` - Removed password

### 7. Authorization Flow
- **File**: `src/components/ViewAccountAuthorization/useViewAccountAuthorization.tsx`
- **Change**: Uses primary wallet for signing, ViewAccount's key for encryption

### 8. Route Guards
- **Files**:
  - `src/routes/PrivateRoutes.tsx` - Checks for ViewAccount in memory
  - `src/routes/AuthorizedRoutes.tsx` - Checks for ViewAccount + authorization

### 9. Panel Provider
- **File**: `src/components/Panel/context/panel/panel.provider.tsx`
- **Changes**: 
  - Removed password from account switching
  - Uses `loadAuthorization()` instead of `unlockViewAccount()`
  - Uses `hasAuthorization()` instead of `hasEncryptedViewAccount()`

## New User Flows

### Sign Up Flow
1. User signs in with email → embedded wallet created
2. LinkWallet screen appears:
   - Option A: Link external wallet (becomes primary)
   - Option B: Skip (embedded wallet becomes primary)
3. Embedded wallet signs typed data: `{ primaryWalletAddress, protocol, vaultAddress }`
4. ViewAccount created from `keccak256(signature)` (in-memory only)
5. Check if authorization exists in localStorage
6. If no authorization → navigate to /authorization
7. Primary wallet signs authorization → encrypted with ViewAccount's public key
8. Navigate to /panel/wallet

### Login/Refresh Flow
1. Embedded wallet signs typed data: `{ primaryWalletAddress, protocol, vaultAddress }`
2. ViewAccount regenerated from `keccak256(signature)` (in-memory)
3. Load and decrypt authorization from localStorage
4. If authorized → navigate to /panel/wallet
5. If not authorized → navigate to /authorization

## TypedData Structures

### ViewAccount Creation (signed by embedded wallet)
```typescript
domain: { name: "View Account Creation", version: "0.0.1" }
types: {
  Create: [
    { name: "primaryWalletAddress", type: "address" },
    { name: "protocol", type: "string" },
    { name: "vaultAddress", type: "address" }
  ]
}
```

### Authorization (signed by primary wallet)
```typescript
domain: { name: "View Account Authorization", version: "0.0.1" }
types: {
  Authorize: [
    { name: "protocol", type: "string" },
    { name: "main_account", type: "address" },
    { name: "view_account", type: "address" }
  ]
}
```

## Testing Checklist

### Sign Up (New User)
- [ ] Email sign-in creates embedded wallet
- [ ] LinkWallet screen appears after email sign-in
- [ ] Can link external wallet successfully
- [ ] Can skip wallet linking (embedded wallet becomes primary)
- [ ] ViewAccount is created from signature
- [ ] Authorization flow works
- [ ] Successfully lands on wallet tab after authorization

### Login (Returning User)
- [ ] Embedded wallet signs typed data on page load
- [ ] ViewAccount is regenerated correctly
- [ ] Authorization is loaded from localStorage
- [ ] Lands on wallet tab directly (if authorized)
- [ ] Redirects to authorization if not authorized

### Refresh
- [ ] Page refresh regenerates ViewAccount
- [ ] Authorization persists across refresh
- [ ] User stays logged in
- [ ] No password prompt

### Wallet Linking
- [ ] Can link external wallet during signup
- [ ] External wallet becomes primary after linking
- [ ] Transactions use primary wallet
- [ ] Embedded wallet still used for ViewAccount creation

### Account Switching
- [ ] Switching chains works correctly
- [ ] ViewAccount authorization reloads properly
- [ ] No password required for switching

## Breaking Changes

### For Existing Users
⚠️ **IMPORTANT**: Existing users will need to re-authenticate as the password-based flow is completely removed.

- Old encrypted ViewAccount data in localStorage is no longer compatible
- Old authorization signatures encrypted with password are incompatible
- Users will go through fresh sign-up flow

### API Changes
- `ViewAccount.hasEncryptedViewAccount()` → `ViewAccount.hasAuthorization()`
- `ViewAccount.unlockViewAccount()` → `ViewAccount.loadAuthorization()`
- `ViewAccount.prepareViewAccount()` → `ViewAccount.createFromSignature()`
- `ViewAccount.authorize()` no longer requires password parameter

## Notes

- ViewAccount is **never stored** in localStorage (in-memory only)
- Authorization signature **is stored** in localStorage (encrypted with ViewAccount's public key)
- Embedded wallet **always** signs the ViewAccount creation typed data
- Primary wallet **always** signs the authorization typed data
- Primary wallet = external wallet (if linked) OR embedded wallet (if not linked)

## Files Modified

1. `src/context/privy.context.tsx`
2. `src/services/Account.ts`
3. `src/context/ledger/useWalletAdapter.ts`
4. `src/components/Onboarding/LinkWallet.tsx` ✨ NEW
5. `src/components/Onboarding/Connect.tsx`
6. `src/components/Onboarding/Onboarding.tsx`
7. `src/components/Onboarding/RegisterForm.tsx`
8. `src/components/Onboarding/useRegister.tsx`
9. `src/context/ledger/ledger.context.ts`
10. `src/context/ledger/ledger.provider.tsx`
11. `src/context/ledger/useViewAccountAuthorization.ts`
12. `src/components/ViewAccountAuthorization/useViewAccountAuthorization.tsx`
13. `src/routes/PrivateRoutes.tsx`
14. `src/routes/AuthorizedRoutes.tsx`
15. `src/components/Panel/context/panel/panel.provider.tsx`

## Next Steps

1. **Test the flows** according to the checklist above
2. **Verify TES compatibility** with new TypedData message structures
3. **Update documentation** if needed
4. **Consider migration strategy** for existing users

