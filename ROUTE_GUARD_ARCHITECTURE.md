# Route Guard Architecture

## Overview

The authentication and routing logic now follows best practices using **Route Guards** and **Custom Hooks** for separation of concerns.

## Architecture Principles

### ✅ What We Implemented

1. **Separation of Concerns**
   - Routes handle routing logic
   - Components handle UI rendering
   - Hooks handle business logic

2. **Route Guard Pattern**
   - Guards are components that wrap protected routes
   - They check conditions and redirect if needed
   - They use `<Outlet />` to render child routes

3. **Single Responsibility**
   - Each component/hook has one clear purpose
   - Easy to test and maintain

4. **Declarative Routing**
   - Router configuration clearly shows protection hierarchy
   - Easy to understand flow at a glance

## Route Structure

```
/ (Root)
├─ No wallets → Show SignIn
└─ Has wallets → Navigate to /initializing

/link-wallet (LinkWalletRoute)
└─ User chooses to link or skip

/initializing (InitializingRoute)
└─ Protected by RequireLinkWalletChoice guard
└─ Auto-initializes ViewAccount
└─ Navigates to /authorization or /panel/wallet

/authorization (Authorization)
└─ Protected by PrivateRoutes guard
└─ User authorizes ViewAccount

/panel/* (PanelRoute)
└─ Protected by PrivateRoutes guard
└─ Protected by AuthorizedRoutes guard
```

## Components & Responsibilities

### Route Guards

**1. RequireLinkWalletChoice** (`src/routes/RequireLinkWalletChoice.tsx`)
- **Purpose**: Ensures user has made a decision about linking external wallet
- **Logic**: 
  - If embedded wallet exists
  - AND no external wallet
  - AND preference is null
  - → Redirect to `/link-wallet`
- **Pattern**: Guard component using `<Outlet />`

**2. PrivateRoutes** (`src/routes/PrivateRoutes.tsx`)
- **Purpose**: Ensures ViewAccount exists in memory
- **Logic**: Check if `viewAccount.getViewAccount()` exists
- **Pattern**: Guard component using `<Outlet />`

**3. AuthorizedRoutes** (`src/routes/AuthorizedRoutes.tsx`)
- **Purpose**: Ensures ViewAccount is authorized
- **Logic**: Check if `authorized` state is true
- **Pattern**: Guard component using `<Outlet />`

### Route Components

**1. Root** (`src/routes/Root.tsx`)
- **Responsibility**: Entry point router
- **Logic**:
  - No wallets → Show `<SignIn />`
  - Has wallets → Navigate to `/initializing`
- **Size**: ~25 lines (was ~112 lines)

**2. InitializingRoute** (`src/routes/InitializingRoute.tsx`)
- **Responsibility**: Show loading state during ViewAccount initialization
- **Logic**:
  - Uses `useAutoInitialize` hook
  - Shows loading spinner or error
  - User can retry on error

**3. LinkWalletRoute** (`src/routes/LinkWalletRoute.tsx`)
- **Responsibility**: Simple wrapper for LinkWallet component
- **Logic**: None (just renders component)

### Hooks

**useAutoInitialize** (`src/hooks/useAutoInitialize.ts`)
- **Purpose**: Automatically initialize ViewAccount when conditions are met
- **Logic**:
  - Checks if wallets exist, preference set, wallet address available
  - If ViewAccount doesn't exist → Call `onInit()` callback
  - If exists and authorized → Navigate to `/panel/wallet`
  - If exists but not authorized → Navigate to `/authorization`
- **Benefits**: 
  - Reusable across components
  - Testable in isolation
  - Single source of truth for initialization logic

## Flow Diagrams

### Sign Up Flow

```
User → / (Root)
  ↓ No wallets
  Show SignIn
  ↓ User signs in
  Privy creates embedded wallet
  ↓ Page refreshes
  / (Root) detects wallets
  ↓
  Navigate to /initializing
  ↓
  RequireLinkWalletChoice Guard
  ↓ Preference is null
  Redirect to /link-wallet
  ↓
  User links or skips
  ↓ Set preference
  Navigate back to /initializing
  ↓
  RequireLinkWalletChoice passes
  ↓
  InitializingRoute renders
  ↓
  useAutoInitialize hook triggers
  ↓
  Call open() → ViewAccount created
  ↓
  Navigate to /authorization
  ↓
  User authorizes
  ↓
  Navigate to /panel/wallet
```

### Login/Refresh Flow

```
User → / (Root)
  ↓ Has wallets
  Navigate to /initializing
  ↓
  RequireLinkWalletChoice Guard
  ↓ Preference exists
  Pass through
  ↓
  InitializingRoute renders
  ↓
  useAutoInitialize hook triggers
  ↓
  ViewAccount regenerated from signature
  ↓ Already authorized
  Navigate to /panel/wallet
```

## Comparison: Before vs After

### Before (Anti-pattern)

```tsx
// Root.tsx - 112 lines, doing too much
export default function Root() {
  // Multiple hooks
  const { wallets, embeddedWallet, externalWallet, wallet } = useWalletAdapter();
  const { ensProfile, isEnsLoading, viewAccount } = useContext(LedgerContext);
  const { open, isConnecting, error } = useRegister();
  const navigate = useNavigate();
  
  // Routing logic
  useEffect(() => {
    if (embeddedWallet && !externalWallet && linkWalletPref === null) {
      navigate("/link-wallet");
    }
  }, [embeddedWallet, externalWallet, linkWalletPref, navigate]);

  // Business logic
  useEffect(() => {
    if (wallets.length > 0 && linkWalletPref !== null && !isConnecting && wallet) {
      const hasAuthorization = viewAccount?.hasAuthorization(wallet.address);
      if (!viewAccount?.getViewAccount() && !hasAuthorization) {
        open();
      }
    }
  }, [wallets, linkWalletPref, wallet, viewAccount, isConnecting, open]);

  // Conditional rendering logic
  if (wallets.length === 0) {
    return <PageContainer><SignIn /></PageContainer>;
  }

  // Complex UI rendering
  return (
    <PageContainer>
      {/* 50+ lines of rendering logic */}
    </PageContainer>
  );
}
```

**Problems:**
- ❌ Violates Single Responsibility Principle
- ❌ Hard to test (multiple concerns mixed)
- ❌ Hard to understand (routing + business logic + UI)
- ❌ Tight coupling between concerns

### After (Best Practice)

```tsx
// Root.tsx - 25 lines, single responsibility
export default function Root() {
  const { wallets } = useWalletAdapter();

  if (wallets.length === 0) {
    return (
      <PageContainer>
        <SignIn />
      </PageContainer>
    );
  }

  return <Navigate to="/initializing" replace />;
}
```

```tsx
// RequireLinkWalletChoice.tsx - Route guard
export default function RequireLinkWalletChoice() {
  const { embeddedWallet, externalWallet } = useWalletAdapter();
  const linkWalletPref = getLinkWalletPreference();

  if (embeddedWallet && !externalWallet && linkWalletPref === null) {
    return <Navigate to="/link-wallet" replace />;
  }

  return <Outlet />;
}
```

```tsx
// useAutoInitialize.ts - Business logic hook
export const useAutoInitialize = (onInit, isInitializing) => {
  // All initialization logic here
  // Clean, testable, reusable
};
```

**Benefits:**
- ✅ Single Responsibility Principle
- ✅ Easy to test each piece independently
- ✅ Clear separation: routing vs business logic vs UI
- ✅ Reusable hooks
- ✅ Declarative route configuration

## Router Configuration

```tsx
const Router = createBrowserRouter([
  { path: "/", element: <Root /> },
  { path: "/link-wallet", element: <LinkWalletRoute /> },
  
  // Route guard hierarchy clearly visible
  {
    element: <RequireLinkWalletChoice />, // Guard 1
    children: [
      { path: "/initializing", element: <InitializingRoute /> },
    ],
  },
  
  {
    element: <PrivateRoutes />, // Guard 2
    children: [
      { path: "/authorization", element: <Authorization /> },
      {
        element: <AuthorizedRoutes />, // Guard 3
        children: [
          { path: "/panel", element: <PanelRoute /> },
          { path: "/panel/:tab", element: <PanelRoute /> },
        ],
      },
    ],
  },
]);
```

**Benefits:**
- Route protection hierarchy is immediately visible
- Guards are composed in a declarative way
- Easy to add/remove guards
- Easy to understand the flow

## Testing Strategy

### Route Guards
```tsx
// Easy to test in isolation
describe('RequireLinkWalletChoice', () => {
  it('redirects when preference is null', () => {
    render(<RequireLinkWalletChoice />, {
      embeddedWallet: mockWallet,
      externalWallet: null,
      linkWalletPref: null,
    });
    expect(mockNavigate).toHaveBeenCalledWith('/link-wallet');
  });
});
```

### Hooks
```tsx
// Easy to test in isolation
describe('useAutoInitialize', () => {
  it('calls onInit when conditions are met', () => {
    const onInit = jest.fn();
    renderHook(() => useAutoInitialize(onInit, false), {
      wallets: [mockWallet],
      linkWalletPref: false,
    });
    expect(onInit).toHaveBeenCalled();
  });
});
```

## Files

**New:**
- `src/routes/RequireLinkWalletChoice.tsx` - Route guard
- `src/routes/InitializingRoute.tsx` - Loading state route
- `src/hooks/useAutoInitialize.ts` - Initialization logic

**Modified:**
- `src/routes/Root.tsx` - Simplified to 25 lines
- `src/router.tsx` - Declarative guard hierarchy

## Summary

✅ **Separation of Concerns**: Each piece has one clear job  
✅ **Route Guard Pattern**: Industry-standard approach  
✅ **Testability**: Each piece can be tested independently  
✅ **Maintainability**: Easy to understand and modify  
✅ **Scalability**: Easy to add new guards or routes  
✅ **Readability**: Clear, declarative routing configuration  

This architecture follows React Router best practices and common patterns used in production applications like NextAuth, Clerk, and other authentication libraries.

