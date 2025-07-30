# Login Logic Manual Testing Scenarios

## Overview

This document outlines comprehensive manual testing scenarios for the login functionality in the ZeroLedger application. The login logic involves a multi-step process: wallet connection, password setup, view account creation/decryption, and view account authorization.

## Prerequisites

- User has a web3 wallet (MetaMask, Coinbase Wallet, etc.)
- User has access to Optimism Sepolia testnet
- Application is accessible via browser
- TES service is operational

## Test Environment Setup

1. **Network**: Optimism Sepolia testnet
2. **Supported Wallets**: MetaMask, Coinbase Wallet, Base Account, Rainbow, Uniswap, Safe, WalletConnect
3. **Browser**: Chrome, Firefox, Safari, Edge
4. **Device**: Desktop, Mobile (responsive testing)

## Authentication Flow Overview

1. **Initial State** → User lands on `/` (Auth route)
2. **Wallet Connection** → User connects wallet via Privy
3. **Password Setup** → User sets password for view account
4. **View Account Creation/Decryption** → System creates or decrypts view account
5. **View Account Authorization** → User authorizes view account usage (one time)
6. **Application Access** → User reaches main application (`/panel/wallet`)

## Test Scenarios

### 1. New User Registration - Happy Path

**Objective**: Verify complete registration flow for a new user

**Steps**:

1. **Access Application**
   - Open browser and navigate to application URL
   - Verify landing page loads with main banner
   - Check that password form is visible

2. **Set Password & Connect**
   - Enter a strong password: `MySecurePassword123!`
   - Click "Open" button
   - Verify password field accepts input
   - Verify Privy modal opens with wallet options
   - Select a supported wallet (e.g., MetaMask)
   - Approve connection in wallet
   - Verify wallet connection succeeds

3. **View Account Creation**
   - Wait for view account creation process
   - Verify loading state is displayed
   - Confirm view account is created successfully

4. **View Account Authorization**
   - Verify authorization page loads
   - Check authorization details are displayed:
     - Protocol: "zeroledger"
     - Main Address: User's wallet address
     - View Address: Generated view account address
   - Click "Authorize" button
   - Approve authorization in wallet
   - Verify authorization succeeds

5. **Access Application**
   - Verify redirect to `/panel/wallet`
   - Check that wallet tab is active
   - Verify private balance is displayed
   - Confirm user can access all application features

**Expected Results**:

- ✅ Landing page loads correctly
- ✅ Wallet connection works
- ✅ Password setup succeeds
- ✅ View account creation works
- ✅ Authorization process completes
- ✅ User reaches main application
- ✅ All application features are accessible

---

### 2. Returning User Login - Happy Path

**Objective**: Verify login flow for existing user with encrypted view account

**Steps**:

1. **Access Application**
   - Open browser and navigate to application URL
   - Verify landing page loads

2. **Set Password & Connect**
   - Enter the same password used during registration
   - Verify password field accepts input
   - Click "Open"
   - Connect the same wallet used previously
   - Verify wallet connection succeeds

3. **View Account Decryption**
   - Wait for view account decryption process
   - Verify loading state is displayed
   - Confirm view account is decrypted successfully

4. **Direct Access**
   - Verify user is redirected directly to `/panel/wallet`
   - Check that no authorization step is required
   - Confirm all application features are accessible

**Expected Results**:

- ✅ Existing view account is found
- ✅ Password decryption works
- ✅ User bypasses authorization step
- ✅ Direct access to application
- ✅ All features work correctly

---

### 3. Password Validation Testing

**Objective**: Verify password validation rules work correctly

**Test Cases**:

#### 3.1 Empty Password

**Steps**:

1. Connect wallet
2. Leave password field empty
3. Try to submit

**Expected**: Form validation prevents submission, "Password is required" message appears

#### 3.2 Weak Password

**Steps**:

1. Connect wallet
2. Enter weak password: `12`
3. Try to submit

**Expected**: Form validation prevents submission, "Invalid password" message appears

#### 3.3 Special Characters

**Steps**:

1. Connect wallet
2. Enter password with special characters: `MyPass@123!`
3. Submit password

**Expected**: Password is accepted and processed correctly

#### 3.4 Long Password

**Steps**:

1. Connect wallet
2. Enter very long password (50+ characters)
3. Submit password

**Expected**: Password is accepted and processed correctly

---

### 4. Wallet Connection Testing

**Objective**: Verify wallet connection works with all supported wallets

**Test Cases**:

#### 4.1 MetaMask Connection

**Steps**:

1. Open application
2. Click "Connect Wallet"
3. Select MetaMask from wallet list
4. Approve connection in MetaMask

**Expected**: Connection succeeds, wallet address is displayed

#### 4.2 Coinbase Wallet Connection

**Steps**:

1. Open application
2. Click "Connect Wallet"
3. Select Coinbase Wallet from wallet list
4. Approve connection in Coinbase Wallet

**Expected**: Connection succeeds, wallet address is displayed

#### 4.3 WalletConnect Connection

**Steps**:

1. Open application
2. Click "Connect Wallet"
3. Select WalletConnect from wallet list
4. Scan QR code with mobile wallet

**Expected**: Connection succeeds, wallet address is displayed

#### 4.4 Multiple Wallet Attempts

**Steps**:

1. Connect one wallet
2. Disconnect wallet
3. Connect different wallet
4. Verify state is reset correctly

**Expected**: Application handles wallet switching correctly

---

### 5. Network Error Handling

**Objective**: Verify application handles network/API failures gracefully

**Test Cases**:

#### 5.1 TES Service Unavailable

**Steps**:

1. Simulate TES service down (if possible)
2. Attempt to set/enter pass and connect wallet
3. Monitor error handling

**Expected**: Appropriate error messages, no app crashes

#### 5.2 Blockchain Network Issues

**Steps**:

1. Simulate network connectivity issues
2. Attempt wallet connection
3. Try to authorize view account
4. Monitor error handling

**Expected**: Appropriate error messages, graceful degradation

#### 5.3 RPC Endpoint Issues

**Steps**:

1. Simulate RPC endpoint failures
2. Attempt to connect wallet
3. Monitor error handling

**Expected**: Clear error messages, retry mechanisms

---

### 6. View Account Authorization Testing

**Objective**: Verify view account authorization process works correctly

**Test Cases**:

#### 6.1 Authorization Details Verification

**Steps**:

1. Complete wallet connection and password setup
2. Reach authorization page
3. Verify displayed information:
   - Protocol name is correct
   - Main address matches connected wallet
   - View address is generated correctly
4. Check warning text is displayed

**Expected**: All details are accurate and complete

#### 6.2 Authorization Rejection

**Steps**:

1. Complete setup to authorization step
2. Reject authorization in wallet
3. Verify application state

**Expected**: Application returns to previous state, no stuck screens

#### 6.3 Authorization Success

**Steps**:

1. Complete setup to authorization step
2. Approve authorization in wallet
3. Verify redirect to application

**Expected**: Successful authorization, proper redirect

---

### 7. Error Recovery Testing

**Objective**: Verify application recovers gracefully from various errors

**Test Cases**:

#### 7.1 Wrong Password for Existing User

**Steps**:

1. Connect existing wallet
2. Enter incorrect password
3. Submit form
4. Verify error handling

**Expected**: Clear error message, form resets, user can retry

#### 7.2 Wallet Connection Failure

**Steps**:

1. Attempt to connect wallet
2. Reject connection in wallet
3. Verify application state

**Expected**: Application returns to initial state, no stuck modals

#### 7.3 View Account Decryption Failure

**Steps**:

1. Connect existing wallet
2. Enter correct password
3. Simulate decryption failure (modify localhost)
4. Monitor error handling

**Expected**: Clear error message, option to retry

---

### 8. Concurrent Session Testing

**Objective**: Verify application handles multiple sessions correctly

**Test Cases**:

#### 8.1 Multiple Browser Tabs

**Steps**:

1. Open application in multiple browser tabs
2. Connect wallet in one tab
3. Attempt operations in other tabs
4. Verify behavior

**Expected**: Consistent state across tabs, no conflicts

#### 8.2 Browser Refresh During Process

**Steps**:

1. Start login process
2. Refresh browser during wallet connection
3. Verify application state

**Expected**: Application resets to initial state gracefully

#### 8.3 Browser Back/Forward Navigation

**Steps**:

1. Complete login process
2. Use browser back button
3. Use browser forward button
4. Verify application behavior

**Expected**: Proper navigation handling, no broken states

---

### 9. Mobile Responsiveness Testing

**Objective**: Verify login functionality works on mobile devices

**Test Cases**:

#### 9.1 Mobile Wallet Connection

**Steps**:

1. Test on mobile device
2. Connect mobile wallet (MetaMask mobile, etc.)
3. Verify connection process

**Expected**: Mobile wallet connection works correctly

#### 9.2 Mobile Password Input

**Steps**:

1. Test on mobile device
2. Enter password using mobile keyboard
3. Verify input handling

**Expected**: Password input works correctly on mobile

#### 9.3 Mobile Authorization

**Steps**:

1. Test on mobile device
2. Complete authorization process
3. Verify mobile wallet integration

**Expected**: Authorization works correctly on mobile

---

### 10. Security Testing

**Objective**: Verify security aspects of the login process

**Test Cases**:

#### 10.1 Password Security

**Steps**:

1. Check if password is transmitted securely
2. Verify password is not stored in plain text
3. Test password strength requirements

**Expected**: Passwords are handled securely

#### 10.2 Wallet Address Verification

**Steps**:

1. Connect wallet
2. Verify displayed address matches connected wallet
3. Check address format validation

**Expected**: Address verification works correctly

#### 10.3 Session Management

**Steps**:

1. Complete login process
2. Close browser
3. Reopen browser and navigate to app
4. Verify session handling

**Expected**: Proper session management, secure re-authentication

---

### 11. Performance Testing

**Objective**: Verify login operations perform well under various conditions

**Test Cases**:

#### 11.1 Large Password Handling

**Steps**:

1. Enter very long password (100+ characters)
2. Monitor processing time
3. Verify performance

**Expected**: Reasonable processing time even for large passwords

#### 11.2 Slow Network Conditions

**Steps**:

1. Simulate slow network connection
2. Attempt login process
3. Monitor loading states and timeouts

**Expected**: Appropriate loading states, reasonable timeouts

#### 11.3 Multiple Rapid Login Attempts

**Steps**:

1. Perform multiple login attempts quickly
2. Monitor application responsiveness
3. Verify no performance degradation

**Expected**: Application remains responsive

---

### 12. Browser Compatibility Testing

**Objective**: Verify login functionality works across different browsers

**Test Cases**:

#### 12.1 Chrome Testing

**Steps**:

1. Test complete login flow in Chrome
2. Verify all features work correctly

**Expected**: Full functionality in Chrome

#### 12.2 Firefox Testing

**Steps**:

1. Test complete login flow in Firefox
2. Verify all features work correctly

**Expected**: Full functionality in Firefox

#### 12.3 Safari Testing

**Steps**:

1. Test complete login flow in Safari
2. Verify all features work correctly

**Expected**: Full functionality in Safari

#### 12.4 Edge Testing

**Steps**:

1. Test complete login flow in Edge
2. Verify all features work correctly

**Expected**: Full functionality in Edge

---

## Test Data

### Valid Test Passwords

- Simple: `password123`
- Complex: `MySecurePassword123!`
- Special chars: `P@ssw0rd#2024`
- Long: `ThisIsAVeryLongPasswordWithSpecialCharacters123!@#`

### Invalid Test Passwords

- Empty: ``
- Too short: `123`
- Common: `password`, `123456`

### Test Wallet Addresses

- Valid: `0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6`
- Valid: `0x1234567890123456789012345678901234567890`

---

## Success Criteria

A test is considered **PASSED** if:

1. ✅ All expected behaviors occur
2. ✅ No unexpected errors or crashes
3. ✅ UI responds appropriately
4. ✅ Security measures work correctly
5. ✅ User experience is smooth
6. ✅ Error handling is graceful

A test is considered **FAILED** if:

1. ❌ Expected behavior doesn't occur
2. ❌ Application crashes or freezes
3. ❌ UI becomes unresponsive
4. ❌ Security vulnerabilities are exposed
5. ❌ User experience is poor
6. ❌ Error handling is inadequate

---

## Regression Testing

After any changes to login logic:

1. Run all test scenarios
2. Focus on affected functionality
3. Verify no regressions in other areas
4. Document any new issues found
5. Test with multiple wallet types
6. Verify cross-browser compatibility

---

## Security Considerations

During testing, pay special attention to:

1. **Password handling**: Ensure passwords are not logged or exposed
2. **Wallet security**: Verify wallet connections are secure
3. **Session management**: Check for proper session handling
4. **Data encryption**: Verify sensitive data is encrypted
5. **Error messages**: Ensure error messages don't expose sensitive information
