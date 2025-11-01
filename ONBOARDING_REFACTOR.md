# Onboarding Flow Refactor

## Summary

The onboarding flow has been simplified with a cleaner, router-based architecture. The logic is now distributed across routes rather than nested in component hierarchies.

## New Architecture

### Routes

1. **`/` (Root)**
   - Shows `SignIn` if no wallets
   - Redirects to `/link-wallet` if preference not set and no external wallet
   - Auto-triggers ViewAccount creation when ready
   - Shows loading state during registration

2. **`/link-wallet` (LinkWalletRoute)**
   - Shows `LinkWallet` component
   - User can link external wallet or skip
   - Stores preference in localStorage
   - Redirects back to `/` on completion

3. **`/authorization` (Authorization)**
   - Existing authorization flow (unchanged)

4. **`/panel/...` (Panel)**
   - Existing wallet interface (unchanged)

### Components

1. **SignIn** (renamed from Connect)
   - Simple email sign-in button
   - Shown when user has no wallets

2. **LinkWallet**
   - Wallet linking UI with skip option
   - Stores preference and navigates back to Root

3. **Root**
   - Handles all onboarding logic
   - Shows appropriate UI based on state
   - Auto-triggers registration when conditions are met

### Removed Components

- ❌ `Onboarding.tsx` - Logic moved to Root
- ❌ `RegisterForm.tsx` - Logic moved to Root

## Flow Diagrams

### Sign Up (New User)

```
1. User lands on / 
   → No wallets → Show SignIn

2. User signs in with email
   → Embedded wallet created by Privy
   → Refresh → Root detects wallets

3. Root checks linkExternalWallet preference
   → null (not set) → Redirect to /link-wallet

4. User on /link-wallet
   → Link external wallet → set pref = true → navigate to /
   → Skip → set pref = false → navigate to /

5. Back on / with preference set
   → Auto-trigger ViewAccount creation
   → Show loading state
   → Navigate to /authorization (if new) or /panel/wallet (if returning)
```

### Login/Refresh (Returning User)

```
1. User lands on /
   → Has wallets → Check preference

2. Preference exists (true or false)
   → Auto-trigger ViewAccount regeneration
   → Check authorization

3. Has authorization
   → Navigate to /panel/wallet

4. No authorization
   → Navigate to /authorization
```

## localStorage Key

- **Key**: `${APP_PREFIX_KEY}.linkExternalWallet`
- **Values**:
  - `null` - Not set (first time user after sign-in)
  - `"true"` - User linked external wallet
  - `"false"` - User skipped linking

## File Changes

### New Files
- ✨ `src/components/Onboarding/SignIn.tsx` (renamed from Connect.tsx)
- ✨ `src/components/Onboarding/linkWalletPreference.ts`
- ✨ `src/routes/LinkWalletRoute.tsx`

### Modified Files
- 📝 `src/components/Onboarding/LinkWallet.tsx` - Added localStorage and navigation
- 📝 `src/routes/Root.tsx` - Complete rewrite with logic from Onboarding/RegisterForm
- 📝 `src/router.tsx` - Added /link-wallet route
- 📝 `src/context/ledger/useWalletAdapter.ts` - Minor null-safety fixes

### Deleted Files
- ❌ `src/components/Onboarding/Onboarding.tsx`
- ❌ `src/components/Onboarding/RegisterForm.tsx`

## Benefits

1. **Cleaner Separation**: Routes handle routing logic, components handle UI
2. **Simpler State**: Preference stored in localStorage, not component state
3. **Better UX**: Direct URLs for each step (can bookmark /link-wallet)
4. **Less Nesting**: No deeply nested component hierarchies
5. **Easier Testing**: Each route is independent
6. **Clearer Flow**: Linear progression through routes

## Implementation Details

### Root Component Logic

```typescript
// 1. Check if should redirect to link-wallet
useEffect(() => {
  if (embeddedWallet && !externalWallet && linkWalletPref === null) {
    navigate("/link-wallet");
  }
}, [embeddedWallet, externalWallet, linkWalletPref, navigate]);

// 2. Auto-trigger registration when ready
useEffect(() => {
  if (wallets.length > 0 && linkWalletPref !== null && !isConnecting && wallet) {
    const hasAuthorization = viewAccount?.hasAuthorization(wallet.address);
    if (!viewAccount?.getViewAccount() && !hasAuthorization) {
      open(); // Trigger ViewAccount creation
    }
  }
}, [wallets, linkWalletPref, wallet, viewAccount, isConnecting, open]);
```

### LinkWallet Component Actions

```typescript
// Link external wallet
const handleLink = async () => {
  await linkExternalWallet();
  setLinkWalletPreference(true);
  navigate("/");
};

// Skip linking
const handleSkip = () => {
  setLinkWalletPreference(false);
  navigate("/");
};
```

## Testing Checklist

- [ ] Fresh user sign-in → redirects to /link-wallet
- [ ] Link wallet → returns to / and creates ViewAccount
- [ ] Skip linking → returns to / and creates ViewAccount
- [ ] Refresh after linking → skips /link-wallet, goes to wallet
- [ ] Refresh after skipping → skips /link-wallet, goes to wallet
- [ ] Direct navigation to /link-wallet works
- [ ] Preference persists across sessions
- [ ] Authorization flow triggers correctly
- [ ] Login after sign-up goes directly to wallet

