# Flat Routes Architecture

## Overview

Refactored from nested route guards to **flat routes** where each route checks its own requirements and redirects appropriately. This is the correct pattern for routes with absolute paths.

## Why Flat Routes?

### ❌ Problem with Nested Routes (Before)

```tsx
// ANTI-PATTERN for absolute paths
{
  path: "/",
  children: [
    {
      path: "/sign-in",  // Absolute path nested - WRONG!
      children: [
        { path: "/link-wallet" },  // Can't navigate directly
        { path: "/panel" },        // Guards don't work properly
      ]
    }
  ]
}
```

**Issues:**
- Can't navigate directly to `/panel` from anywhere
- Guards don't apply to direct navigation
- Confusing hierarchy for absolute paths
- URL structure doesn't match route structure

### ✅ Solution: Flat Routes (After)

```tsx
// CORRECT pattern for absolute paths
[
  { path: "/", element: <RootRoute /> },
  { path: "/link-wallet", element: <LinkWalletRoute /> },
  { path: "/authorization", element: <AuthorizationRoute /> },
  { path: "/panel", element: <PanelRoute /> },
  { path: "/panel/:tab", element: <PanelRoute /> },
]
```

**Benefits:**
- Each route is independent
- Direct navigation works correctly
- Clear, flat structure
- Each route validates its own requirements

## Route Requirements & Redirects

### 1. `/` (RootRoute)
**Requirements:** None (always accessible)

**Logic:**
```typescript
if (initializing) return <DumpLoadingScreen />;
if (!evmClients) return <SignIn />;           // Not signed in
if (linkWalletPref === null) return → /link-wallet;
if (!authorized) return → /authorization;
return → /panel/wallet;
```

### 2. `/link-wallet` (LinkWalletRoute)
**Requirements:** 
- ✅ User signed in (evmClients exists)
- ✅ No linking preference set yet

**Logic:**
```typescript
if (initializing) return <DumpLoadingScreen />;
if (!evmClients) return → /;                  // Not signed in
if (linkWalletPref !== null) return → /authorization;  // Already chose
return <LinkWallet />;
```

### 3. `/authorization` (AuthorizationRoute)
**Requirements:**
- ✅ User signed in (evmClients exists)
- ✅ Has linking preference
- ✅ NOT yet authorized

**Logic:**
```typescript
if (initializing) return <DumpLoadingScreen />;
if (!evmClients) return → /;                  // Not signed in
if (linkWalletPref === null) return → /link-wallet;  // No pref
if (authorized) return → /panel/wallet;       // Already authorized
return <ViewAccountAuthorization />;
```

### 4. `/panel` (PanelRoute)
**Requirements:**
- ✅ User signed in (evmClients exists)
- ✅ Has linking preference
- ✅ Authorized

**Logic:**
```typescript
if (initializing) return <DumpLoadingScreen />;
if (!evmClients) return → /;                  // Not signed in
if (linkWalletPref === null) return → /link-wallet;  // No pref
if (!authorized) return → /authorization;     // Not authorized
return <Panel />;
```

## Flow Diagrams

### Sign Up Flow

```
User → /
  ↓ No evmClients
  Show SignIn
  ↓ User signs in
  Initialization starts
  ↓ evmClients created
  Redirect → /link-wallet
  ↓ linkWalletPref === null
  Show LinkWallet
  ↓ User chooses (link or skip)
  Redirect → /authorization
  ↓ !authorized
  Show Authorization
  ↓ User authorizes
  Redirect → /panel/wallet
```

### Login/Refresh Flow

```
User → /
  ↓ Initialization runs
  ↓ evmClients created, linkWalletPref exists, authorized = true
  Redirect → /panel/wallet
```

### Direct Navigation Examples

**User navigates to `/panel` before signing in:**
```
/panel → !evmClients → / → Show SignIn
```

**User navigates to `/authorization` without linking preference:**
```
/authorization → linkWalletPref === null → /link-wallet
```

**User navigates to `/link-wallet` after already choosing:**
```
/link-wallet → linkWalletPref !== null → /authorization
```

## Comparison

### Before (Nested Routes)
```tsx
const Router = createBrowserRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      {
        element: <RequireWalletAdapter />,
        children: [
          { path: "/link-wallet" },  // ❌ Nested absolute path
          {
            element: <RequireLinkWalletChoice />,
            children: [
              { path: "/initializing" },  // ❌ Nested absolute path
            ]
          }
        ]
      }
    ]
  }
]);
```

**Problems:**
- ❌ Mixing nested guards with absolute paths
- ❌ Can't navigate directly to routes
- ❌ Complex guard hierarchy
- ❌ Hard to understand flow

### After (Flat Routes)
```tsx
const Router = createBrowserRouter([
  { path: "/", element: <RootRoute /> },
  { path: "/link-wallet", element: <LinkWalletRoute /> },
  { path: "/authorization", element: <AuthorizationRoute /> },
  { path: "/panel", element: <PanelRoute /> },
  { path: "/panel/:tab", element: <PanelRoute /> },
]);
```

**Benefits:**
- ✅ Simple, flat structure
- ✅ Direct navigation works
- ✅ Each route is self-contained
- ✅ Easy to understand

## Route Component Pattern

Each route follows this pattern:

```typescript
export default function SomeRoute() {
  const { evmClients, initializing, authorized } = useContext(LedgerContext);
  const linkWalletPref = getLinkWalletPreference();

  // 1. Check loading state
  if (initializing) return <DumpLoadingScreen />;

  // 2. Check requirements in order (from least to most restrictive)
  if (!evmClients) return <Navigate to="/" />;
  if (linkWalletPref === null) return <Navigate to="/link-wallet" />;
  if (!authorized) return <Navigate to="/authorization" />;

  // 3. All requirements met - show the component
  return <YourComponent />;
}
```

## Benefits of This Architecture

1. **Separation of Concerns**
   - Each route manages its own requirements
   - No shared guard logic to maintain

2. **Direct Navigation**
   - User can bookmark any URL
   - Deep linking works correctly
   - Browser back/forward work as expected

3. **Predictable Behavior**
   - Clear redirect chain
   - Easy to debug (look at one file)
   - No mysterious nested guard behavior

4. **Maintainability**
   - Add/remove routes easily
   - Change requirements in one place
   - No complex guard hierarchies

5. **Type Safety**
   - Each route is a component
   - TypeScript catches errors
   - No runtime surprises

## Files

**Flat Route Structure:**
- `src/routes/RootRoute.tsx` - Entry point with sign in
- `src/routes/LinkWalletRoute.tsx` - Wallet linking choice
- `src/routes/AuthorizationRoute.tsx` - ViewAccount authorization
- `src/routes/PanelRoute.tsx` - Main wallet interface
- `src/router.tsx` - Simple flat configuration

**Deleted:**
- ❌ `src/routes/SignInRoute.tsx` - Logic moved to RootRoute
- ❌ `src/routes/Authorization.tsx` - Replaced by AuthorizationRoute.tsx
- ❌ `src/routes/RequireWalletAdapter.tsx` - No longer needed
- ❌ `src/routes/RequireLinkWalletChoice.tsx` - No longer needed
- ❌ `src/routes/PrivateRoutes.tsx` - No longer needed
- ❌ `src/routes/AuthorizedRoutes.tsx` - No longer needed

## Summary

✅ **Flat route structure** - All routes at root level  
✅ **Self-validating routes** - Each checks its own requirements  
✅ **Proper redirects** - Clear chain of navigation  
✅ **Direct navigation** - All URLs work correctly  
✅ **Maintainable** - Easy to understand and modify  

This is the industry-standard pattern for authentication routing with absolute paths!

