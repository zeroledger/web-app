# EvmClients Dual Wallet Support

## Overview

Extended `EvmClients` to support both **embedded wallet** and **primary/external wallet** simultaneously, enabling proper separation of concerns between ViewAccount creation and transaction signing.

## Motivation

Previously, `EvmClients` only had one client (the "external" client), which was based on the primary wallet. This created a problem:

- **Embedded wallet** must always sign the ViewAccount creation typed data
- **Primary wallet** (external or embedded) signs transactions and authorization
- We needed both clients available at the same time

## Architecture Changes

### EvmClients Class

**Before:**
```typescript
class EvmClients {
  public readonly readClient: PublicClient;
  private _externalClient?: CustomClient;

  constructor(
    wsUrls, httpUrls, pollingInterval, chain,
    externalClientOptions: ExternalClientOptions
  )
}
```

**After:**
```typescript
class EvmClients {
  public readonly readClient: PublicClient;
  private _externalClient?: CustomClient;
  private _embeddedClient?: CustomClient;

  constructor(
    wsUrls, httpUrls, pollingInterval, chain,
    externalClientOptions: ExternalClientOptions,
    embeddedClientOptions?: ExternalClientOptions  // NEW!
  )

  embeddedClient() { ... }  // NEW!
}
```

### Client Responsibilities

**1. Public Client (readClient)**
- Purpose: Read-only blockchain queries
- Use: No wallet needed
- Example: Reading balances, events, contract state

**2. External Client (externalClient)**
- Purpose: Transaction signing with primary wallet
- Wallet: Primary wallet (external if linked, else embedded)
- Use: Transactions, authorization signing
- Example: `viewAccount.authorize()` uses this

**3. Embedded Client (embeddedClient)**
- Purpose: ViewAccount creation signing
- Wallet: Always the embedded wallet (created by Privy)
- Use: Signing ViewAccount creation typed data
- Example: `viewAccount.signViewAccountCreation()` uses this
- Fallback: If no embedded client options provided, uses external client options

## Key Features

### 1. Optional Embedded Client

```typescript
const evmClients = new EvmClients(
  wsUrls, httpUrls, pollingInterval, chain,
  {
    account: primaryAccount,
    provider: primaryProvider,
  },
  {  // OPTIONAL - if not provided, embeddedClient() returns externalClient
    account: embeddedAccount,
    provider: embeddedProvider,
  }
);
```

### 2. Fallback Behavior

If `embeddedClientOptions` is not provided, `embeddedClient()` returns the same instance as `primaryClient()`. This maintains backward compatibility when user hasn't linked an external wallet.

```typescript
_initEmbeddedClient() {
  // If no embedded client options provided, use external client options
  const options = this.embeddedClientOptions || this.externalClientOptions;
  // ...
}
```

### 3. Clean Separation

```typescript
// ViewAccount creation - always uses embedded wallet
const signature = await viewAccount.signViewAccountCreation(
  evmClients,  // Uses evmClients.embeddedClient() internally
  primaryWalletAddress,
  VAULT_ADDRESS
);

// Authorization - uses primary wallet
await viewAccount.authorize(
  evmClients  // Uses evmClients.primaryClient() internally
);
```

## Implementation Details

### 1. useRegister.tsx

**Before:**
```typescript
// Created two separate EvmClients instances
const primaryEvmClients = new EvmClients(..., { account, provider });
const embeddedEvmClients = new EvmClients(..., { account: embedded, provider: embeddedProvider });

await viewAccount.signViewAccountCreation(embeddedEvmClients, ...);
```

**After:**
```typescript
// Single EvmClients with both providers
const evmClients = new EvmClients(
  wsUrls, httpUrls, pollingInterval, chain,
  {
    account: primaryAccount,
    provider: primaryProvider,
  },
  {
    account: embeddedWallet.address,
    provider: embeddedProvider,
  }
);

await viewAccount.signViewAccountCreation(evmClients, ...);
```

### 2. panel.provider.tsx

Updated `accountSwitch()` to pass both providers:

```typescript
const [account, provider, embeddedProvider] = await Promise.all([
  getAccount(),
  getProvider(),
  embeddedWallet?.getEthereumProvider(),
]);

const evmClients = new EvmClients(
  wsUrls, httpUrls, pollingInterval, chain,
  { account, provider },
  embeddedWallet && embeddedProvider ? {
    account: embeddedWallet.address,
    provider: embeddedProvider,
  } : undefined
);
```

### 3. ViewAccount.ts

Updated to use the correct client:

```typescript
// ViewAccount creation - uses embedded wallet
async signViewAccountCreation(evmClients, primaryWalletAddress, vaultAddress) {
  const embeddedClient = evmClients.embeddedClient();  // ✅
  // Sign with embedded wallet
}

// Authorization - uses primary wallet  
async authorize(evmClients) {
  const externalClient = evmClients.primaryClient();  // ✅
  // Sign with primary wallet
}
```

## Files Modified

1. ✅ `src/services/Clients.ts`
   - Added `embeddedClientOptions` parameter
   - Added `_embeddedClient` field
   - Added `embeddedClient()` method
   - Updated `close()` to clear both clients

2. ✅ `src/components/Onboarding/useRegister.tsx`
   - Pass both primary and embedded providers
   - Removed separate embedded EvmClients instance

3. ✅ `src/services/Account.ts`
   - Updated `signViewAccountCreation()` to use `embeddedClient()`

4. ✅ `src/components/Panel/context/panel/panel.provider.tsx`
   - Get embedded wallet provider
   - Pass to EvmClients constructor
   - Removed password reference

## Benefits

### 1. Separation of Concerns
- ✅ Embedded wallet only for ViewAccount creation
- ✅ Primary wallet for all other operations
- ✅ Clear distinction in code

### 2. Flexibility
- ✅ Works when external wallet is linked
- ✅ Works when only embedded wallet exists
- ✅ Backward compatible

### 3. Maintainability
- ✅ Single EvmClients instance per context
- ✅ No duplicate client creation
- ✅ Consistent interface

### 4. Type Safety
- ✅ Proper TypeScript types
- ✅ Optional embedded client options
- ✅ No casting needed

## Testing Scenarios

### Scenario 1: User with Embedded Wallet Only
```
embeddedWallet: 0x123...
primaryWallet: 0x123... (same as embedded)

primaryClient() → signs with 0x123...
embeddedClient() → signs with 0x123... (same instance)
```

### Scenario 2: User with Linked External Wallet
```
embeddedWallet: 0x123...
externalWallet: 0x456...
primaryWallet: 0x456...

primaryClient() → signs with 0x456...
embeddedClient() → signs with 0x123...
```

## Migration Notes

### For Existing Code

If you're creating EvmClients and want to add embedded wallet support:

**Old:**
```typescript
const evmClients = new EvmClients(
  wsUrls, httpUrls, pollingInterval, chain,
  { account, provider }
);
```

**New (with embedded wallet):**
```typescript
const evmClients = new EvmClients(
  wsUrls, httpUrls, pollingInterval, chain,
  { account: primaryAccount, provider: primaryProvider },
  { account: embeddedAccount, provider: embeddedProvider }
);
```

**New (backward compatible - no embedded wallet):**
```typescript
const evmClients = new EvmClients(
  wsUrls, httpUrls, pollingInterval, chain,
  { account, provider }
  // No embedded client options - embeddedClient() will use external
);
```

## Summary

✅ **Single EvmClients instance** with support for both wallets
✅ **Clean separation** between ViewAccount creation and transaction signing  
✅ **Backward compatible** - embedded client is optional  
✅ **Type safe** - proper TypeScript support  
✅ **Flexible** - works with or without external wallet  

This architecture properly reflects the dual-wallet authentication model and ensures the right wallet signs the right operations.

