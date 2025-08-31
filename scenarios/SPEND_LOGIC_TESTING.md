# Spend Logic Manual Testing Scenarios

## Overview

This document outlines comprehensive manual testing scenarios for the spend functionality in the ZeroLedger application. The spend logic involves a two-step process: form submission and transaction signing.

## Prerequisites

- User has a connected wallet (Privy)
- User has sufficient private balance
- Application is synced with the blockchain
- TES service is operational

## Test Environment Setup

1. **Network**: Base Sepolia testnet
2. **Token**: USD token (specified in constants)
3. **Vault**: Deployed vault contract
4. **TES Service**: Running and accessible

## Test Scenarios

### 1. Basic Spend Flow - Happy Path

**Objective**: Verify successful spend transaction from start to finish

**Steps**:

1. **Navigate to Wallet Tab**
   - Open the application
   - Connect wallet via Privy
   - Wait for sync to complete
   - Navigate to "Wallet" tab

2. **Verify Initial State**
   - Check that private balance is displayed
   - Verify "Send" button is visible and enabled
   - Confirm no modals are open

3. **Open Spend Modal**
   - Click "Send" button
   - Verify modal opens with form step
   - Check that form fields are empty
   - Confirm back button is visible

4. **Fill Spend Form**
   - Enter valid recipient address: `0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6`
   - Enter amount: `10.50`
   - Verify amount validation works (decimal input)
   - Check that "Review Payment" button is enabled

5. **Submit Form**
   - Click "Review Payment" button
   - Verify loading state appears
   - Wait for transaction preparation

6. **Review Transaction**
   - Verify modal transitions to preview step
   - Check transaction details are displayed:
     - From address (user's address)
     - To address (recipient)
     - Amount (10.50 USD)
     - Fee amount
     - Gas coverage
   - Verify "Sign & Send" button is enabled

7. **Sign Transaction**
   - Click "Sign & Send" button
   - Verify wallet signing prompt appears
   - Approve transaction in wallet
   - Wait for transaction submission

8. **Verify Success**
   - Check success message appears: "Payment Successful!"
   - Verify modal auto-closes after delay
   - Confirm private balance updates
   - Check transaction appears in activity tab

**Expected Results**:

- ✅ Modal opens and closes correctly
- ✅ Form validation works
- ✅ Transaction preparation succeeds
- ✅ Wallet signing works
- ✅ Transaction submission succeeds
- ✅ Balance updates correctly
- ✅ Success state displays properly

---

### 2. Form Validation Testing

**Objective**: Verify all form validation rules work correctly

**Test Cases**:

#### 2.1 Invalid Recipient Address

**Steps**:

1. Open spend modal
2. Enter invalid address: `0x123`
3. Enter valid amount: `10.00`
4. Click "Review Payment"

**Expected**: Error message "Invalid Ethereum address" appears

#### 2.2 Empty Recipient Address

**Steps**:

1. Open spend modal
2. Leave recipient field empty
3. Enter valid amount: `10.00`
4. Click "Review Payment"

**Expected**: Error message "Recipient address is required" appears

#### 2.3 Invalid Amount Format

**Steps**:

1. Open spend modal
2. Enter valid recipient address
3. Enter invalid amount: `abc`
4. Click "Review Payment"

**Expected**: Error message "Amount must be a positive number" appears

#### 2.4 Zero Amount

**Steps**:

1. Open spend modal
2. Enter valid recipient address
3. Enter amount: `0`
4. Click "Review Payment"

**Expected**: Error message "Amount must be a positive number" appears

#### 2.5 Negative Amount

**Steps**:

1. Open spend modal
2. Enter valid recipient address
3. Enter amount: `-10`
4. Click "Review Payment"

**Expected**: Error message "Amount must be a positive number" appears

#### 2.6 Decimal Input Testing

**Steps**:

1. Open spend modal
2. Enter valid recipient address
3. Test decimal inputs:
   - `1.` (should be allowed)
   - `1.2` (should be allowed)
   - `1.23` (should be allowed)
   - `.5` (should be allowed)

**Expected**: All decimal inputs work correctly

---

### 3. Insufficient Balance Testing

**Objective**: Verify behavior when user tries to spend more than available balance

**Steps**:

1. **Check Current Balance**
   - Note current private balance
   - Calculate amount slightly higher than balance

2. **Attempt Overspend**
   - Open spend modal
   - Enter valid recipient address
   - Enter amount higher than balance
   - Click "Review Payment"

**Expected Results**:

- ✅ Form allows input but may show warning
- ✅ Transaction preparation fails
- ✅ Error state is displayed
- ✅ Modal shows appropriate error message
- ✅ Modal auto-closes after error

**Note**: Current implementation uses `getMaxFormattedValue` to automatically cap the input amount to the available balance, preventing users from entering amounts higher than their balance.

---

### 4. Network Error Handling

**Objective**: Verify application handles network/API failures gracefully

**Test Cases**:

#### 4.1 TES Service Unavailable

**Steps**:

1. Simulate TES service down (if possible)
2. Open spend modal
3. Fill form with valid data
4. Click "Review Payment"

**Expected**: Error message appears, modal handles failure gracefully

#### 4.2 Blockchain Network Issues

**Steps**:

1. Simulate network connectivity issues
2. Attempt spend transaction
3. Monitor error handling

**Expected**: Appropriate error messages, no app crashes

---

### 5. Modal Navigation Testing

**Objective**: Verify modal navigation works correctly in all scenarios

**Test Cases**:

#### 5.1 Back Button - Form Step

**Steps**:

1. Open spend modal
2. Fill form partially
3. Click back button

**Expected**: Modal closes, form resets

#### 5.2 Back Button - Preview Step

**Steps**:

1. Complete form submission
2. Reach preview step
3. Click back button

**Expected**: Returns to form step, form data preserved

#### 5.3 Modal Close During Loading

**Steps**:

1. Start form submission
2. During loading state, try to close modal
3. Verify behavior

**Expected**: Modal should prevent closing during critical operations

---

### 6. Transaction Details Verification

**Objective**: Verify transaction details are accurate and complete

**Steps**:

1. **Prepare Transaction**
   - Open spend modal
   - Enter known values: recipient `0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6`, amount `25.00`
   - Submit form

2. **Verify Transaction Details**
   - Check "From" address matches user's address
   - Check "To" address matches entered recipient
   - Verify amount matches entered value (minus fee)
   - Confirm fee amount is reasonable
   - Verify gas coverage is displayed

3. **Test Transaction Details Toggle**
   - Click "Transaction Details" toggle
   - Verify details expand/collapse smoothly
   - Check all transaction parameters are visible

**Expected Results**:

- ✅ All transaction details are accurate
- ✅ Fee calculation is correct
- ✅ Gas estimation is reasonable
- ✅ Toggle animation works smoothly

---

### 7. Concurrent Operation Testing

**Objective**: Verify application handles multiple operations correctly

**Test Cases**:

#### 7.1 Multiple Modal Opens

**Steps**:

1. Open spend modal
2. Try to open another modal (deposit/withdraw)
3. Verify behavior

**Expected**: Only one modal should be open at a time

#### 7.2 Rapid Form Submissions

**Steps**:

1. Fill form quickly
2. Submit multiple times rapidly
3. Verify no duplicate transactions

**Expected**: Only one transaction should be processed

---

### 8. Mobile Responsiveness Testing

**Objective**: Verify spend functionality works on mobile devices

**Test Cases**:

#### 8.1 Mobile Form Input

**Steps**:

1. Test on mobile device
2. Verify form inputs work with mobile keyboard
3. Test decimal input on mobile

**Expected**: All form inputs work correctly on mobile

#### 8.2 Mobile Modal Navigation

**Steps**:

1. Test modal opening/closing on mobile
2. Verify back button works
3. Test transaction signing on mobile wallet

**Expected**: Modal navigation works smoothly on mobile

---

### 9. Error Recovery Testing

**Objective**: Verify application recovers gracefully from errors

**Test Cases**:

#### 9.1 Wallet Rejection

**Steps**:

1. Complete form submission
2. Reject transaction in wallet
3. Verify application state

**Expected**: Application returns to previous state, no stuck modals

#### 9.2 Transaction Failure

**Steps**:

1. Submit transaction
2. Simulate transaction failure
3. Verify error handling

**Expected**: Clear error message, modal closes properly

---

### 10. Performance Testing

**Objective**: Verify spend operations perform well under various conditions

**Test Cases**:

#### 10.1 Large Amount Transactions

**Steps**:

1. Try to spend large amounts
2. Monitor preparation time
3. Verify performance

**Expected**: Reasonable preparation time even for large amounts

#### 10.2 Multiple Rapid Transactions

**Steps**:

1. Perform multiple spend transactions quickly
2. Monitor application responsiveness
3. Verify no performance degradation

**Expected**: Application remains responsive

---

## Test Data

### Valid Test Addresses

- `0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6`
- `0x1234567890123456789012345678901234567890`

### Test Amounts

- Small: `0.01`, `1.00`, `10.50`
- Medium: `100.00`, `500.00`
- Large: `1000.00`, `5000.00`

### Invalid Test Data

- Invalid addresses: `0x123`, `invalid`, ``
- Invalid amounts: `-1`, `0`, `abc`, `1.2.3`

---

## Success Criteria

A test is considered **PASSED** if:

1. ✅ All expected behaviors occur
2. ✅ No unexpected errors or crashes
3. ✅ UI responds appropriately
4. ✅ Data is handled correctly
5. ✅ User experience is smooth

A test is considered **FAILED** if:

1. ❌ Expected behavior doesn't occur
2. ❌ Application crashes or freezes
3. ❌ UI becomes unresponsive
4. ❌ Data is corrupted or lost
5. ❌ User experience is poor

---

## Regression Testing

After any changes to spend logic:

1. Run all test scenarios
2. Focus on affected functionality
3. Verify no regressions in other areas
4. Document any new issues found

---

*Last Updated: [Current Date]*
*Version: 1.0*
