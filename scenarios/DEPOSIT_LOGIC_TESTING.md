# Deposit Logic Manual Testing Scenarios

## Overview

This document outlines comprehensive manual testing scenarios for the deposit functionality in the ZeroLedger application. The deposit logic involves a three-step process: form submission, parameters review, and meta transaction signing.

## Prerequisites

- User has a connected wallet (Privy)
- User has sufficient on-chain balance for deposit and tokens to cover approve transaction gas
- Application is synced with the blockchain
- TES service is operational

## Test Environment Setup

1. **Network**: Optimism Sepolia testnet
2. **Token**: [Testnet USD token](https://sepolia-optimism.etherscan.io/token/0x6af5c33c20ca6169b3d98a2bcc94bdd0f4f68ffd)
3. **Vault**: Deployed vault contract
4. **TES Service**: Running and accessible

## Deposit Flow Overview

1. **Form Step** → User enters deposit amount
2. **Parameters Review** → User reviews vault address and amounts + approves
3. **Meta Transaction** → User reviews and signs the transaction

## Test Scenarios

### 1. Basic Deposit Flow - Happy Path

**Objective**: Verify successful deposit transaction from start to finish

**Steps**:

1. **Navigate to Menu Tab**
   - Open the application
   - Connect wallet via Privy
   - Wait for sync to complete
   - Navigate to "Menu" tab

2. **Verify Initial State**
   - Check that "Deposit" button is visible and enabled
   - Confirm no modals are open
   - Verify user has sufficient on-chain balance

3. **Open Deposit Modal**
   - Click "Deposit" button
   - Verify modal opens with form step
   - Check that form fields are empty
   - Confirm back button is visible

4. **Fill Deposit Form**
   - Enter amount: `50.00`
   - Verify amount validation works (decimal input)
   - Check that "Confirm Deposit" button is enabled

5. **Submit Form**
   - Click "Confirm Deposit" button
   - Verify loading state appears
   - Wait for deposit parameters preparation

6. **Review Parameters**
   - Verify modal transitions to parameters step
   - Check deposit parameters are displayed:
     - Vault Address (shortened format)
     - Amount to deposit: 50.00 USD
     - Fee amount
   - Verify "Approve Deposit" button is enabled

7. **Approve Parameters**
   - Click "Approve Deposit" button
   - Verify loading state appears
   - Wait for meta transaction preparation

8. **Review Meta Transaction**
   - Verify modal transitions to preview step
   - Check transaction details are displayed:
     - From address (user's address)
     - To address (vault address)
     - Amount (50.00 USD)
     - Fee amount
     - Gas coverage
   - Verify "Sign & Deposit" button is enabled

9. **Sign Transaction**
   - Click "Sign & Deposit" button
   - Verify wallet signing prompt appears
   - Approve transaction in wallet
   - Wait for transaction submission

10. **Verify Success**
    - Check success message appears: "Deposit Successful!"
    - Verify modal auto-closes after delay
    - Confirm private balance updates
    - Check transaction appears in activity tab

**Expected Results**:

- ✅ Modal opens and closes correctly
- ✅ Form validation works
- ✅ Parameters preparation succeeds
- ✅ Parameter approval works
- ✅ Meta transaction preparation succeeds
- ✅ Wallet signing works
- ✅ Transaction submission succeeds
- ✅ Balance updates correctly
- ✅ Success state displays properly

---

### 2. Form Validation Testing

**Objective**: Verify all form validation rules work correctly

**Test Cases**:

#### 2.1 Empty Amount

**Steps**:

1. Open deposit modal
2. Leave amount field empty
3. Click "Confirm Deposit"

**Expected**: Error message "Amount is required" appears

#### 2.2 Zero Amount

**Steps**:

1. Open deposit modal
2. Enter amount: `0`
3. Click "Confirm Deposit"

**Expected**: Error message "Amount must be greater than 0" appears

#### 2.3 Negative Amount

**Steps**:

1. Open deposit modal
2. Enter amount: `-10`
3. Click "Confirm Deposit"

**Expected**: Error message "Amount must be greater than 0" appears

#### 2.4 Invalid Amount Format

**Steps**:

1. Open deposit modal
2. Enter invalid amount: `abc`
3. Click "Confirm Deposit"

**Expected**: Error message appears, form validation prevents submission

**Note**: HTML5 number input prevents most invalid characters, but form validation still catches edge cases.

#### 2.5 Decimal Input Testing

**Steps**:

1. Open deposit modal
2. Test decimal inputs:
   - `1.` (should be allowed)
   - `1.2` (should be allowed)
   - `1.23` (should be allowed)
   - `.5` (should be allowed)

**Expected**: All decimal inputs work correctly

#### 2.6 Large Amount

**Steps**:

1. Open deposit modal
2. Enter very large amount: `999999.99`
3. Click "Confirm Deposit"

**Expected**: Form accepts large amounts if user has sufficient balance

---

### 3. Insufficient Balance Testing

**Objective**: Verify behavior when user tries to deposit more than available balance

**Steps**:

1. **Check Current Balance**
   - Note current on-chain balance
   - Calculate amount higher than balance

2. **Attempt Overspend**
   - Open deposit modal
   - Enter amount higher than balance
   - Click "Confirm Deposit"

**Expected Results**:

- ✅ Form allows input but may show warning
- ✅ Parameters preparation fails
- ✅ Error state is displayed
- ✅ Modal shows appropriate error message
- ✅ Modal auto-closes after error

**Note**: Current implementation does not validate balance before form submission. Balance validation occurs during the simulateContract approve transaction, which fail if insufficient balance.

---

### 4. Network Error Handling

**Objective**: Verify application handles network/API failures gracefully

**Test Cases**:

#### 4.1 TES Service Unavailable

**Steps**:

1. Simulate TES service down (if possible)
2. Open deposit modal
3. Fill form with valid data
4. Click "Confirm Deposit"

**Expected**: Error message appears, modal handles failure gracefully

#### 4.2 Blockchain Network Issues

**Steps**:

1. Simulate network connectivity issues
2. Attempt deposit transaction
3. Monitor error handling

**Expected**: Appropriate error messages, no app crashes

#### 4.3 RPC Endpoint Issues

**Steps**:

1. Simulate RPC endpoint failures
2. Attempt to prepare deposit parameters
3. Monitor error handling

**Expected**: Clear error messages, retry mechanisms

---

### 5. Modal Navigation Testing

**Objective**: Verify modal navigation works correctly in all scenarios

**Test Cases**:

#### 5.1 Back Button - Form Step

**Steps**:

1. Open deposit modal
2. Fill form partially
3. Click back button

**Expected**: Modal closes, form resets

#### 5.2 Back Button - Parameters Step

**Steps**:

1. Complete form submission
2. Reach parameters step
3. Click back button

**Expected**: Returns to form step, form data preserved

#### 5.3 Back Button - Preview Step

**Steps**:

1. Complete parameters approval
2. Reach preview step
3. Click back button

**Expected**: Returns to parameters step, data preserved

#### 5.4 Modal Close During Loading

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
   - Open deposit modal
   - Enter known amount: `25.00`
   - Submit form and approve parameters

2. **Verify Transaction Details**
   - Check "From" address matches user's address
   - Check "To" address matches vault address
   - Verify amount matches entered value
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

1. Open deposit modal
2. Try to open another modal (withdraw/spend)
3. Verify behavior

**Expected**: Only one modal should be open at a time

#### 7.2 Rapid Form Submissions

**Steps**:

1. Fill form quickly
2. Submit multiple times rapidly
3. Verify no duplicate transactions

**Expected**: Only one transaction should be processed

**Note**: Current implementation uses `asyncOperationPromise` to prevent concurrent operations, ensuring only one transaction is processed at a time.

#### 7.3 Deposit During Other Operations

**Steps**:

1. Start a spend transaction
2. Try to open deposit modal
3. Verify behavior

**Expected**: Deposit modal should be disabled or show appropriate message

---

### 8. Mobile Responsiveness Testing

**Objective**: Verify deposit functionality works on mobile devices

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

#### 8.3 Mobile Transaction Review

**Steps**:

1. Test on mobile device
2. Complete deposit flow on mobile
3. Verify all steps work correctly

**Expected**: Complete deposit flow works on mobile

---

### 9. Error Recovery Testing

**Objective**: Verify application recovers gracefully from errors

**Test Cases**:

#### 9.1 Wallet Rejection

**Steps**:

1. Complete form submission and parameters approval
2. Reject transaction in wallet
3. Verify application state

**Expected**: Application returns to previous state, no stuck modals

#### 9.2 Transaction Failure

**Steps**:

1. Submit deposit transaction
2. Simulate transaction failure
3. Verify error handling

**Expected**: Clear error message, modal closes properly

#### 9.3 Parameters Preparation Failure

**Steps**:

1. Submit form with valid data
2. Simulate parameters preparation failure
3. Monitor error handling

**Expected**: Clear error message, option to retry

---

### 10. Performance Testing

**Objective**: Verify deposit operations perform well under various conditions

**Test Cases**:

#### 10.1 Large Amount Deposits

**Steps**:

1. Try to deposit large amounts
2. Monitor preparation time
3. Verify performance

**Expected**: Reasonable preparation time even for large amounts

#### 10.2 Multiple Rapid Deposits

**Steps**:

1. Perform multiple deposit transactions quickly
2. Monitor application responsiveness
3. Verify no performance degradation

**Expected**: Application remains responsive

#### 10.3 Slow Network Conditions

**Steps**:

1. Simulate slow network connection
2. Attempt deposit transaction
3. Monitor loading states and timeouts

**Expected**: Appropriate loading states, reasonable timeouts

---

### 11. Security Testing

**Objective**: Verify security aspects of the deposit process

**Test Cases**:

#### 11.1 Transaction Data Verification

**Steps**:

1. Complete deposit flow
2. Verify transaction data is accurate
3. Check for any data exposure

**Expected**: Transaction data is secure and accurate

#### 11.2 Wallet Address Verification

**Steps**:

1. Complete deposit flow
2. Verify displayed addresses are correct
3. Check address format validation

**Expected**: Address verification works correctly

#### 11.3 Fee Calculation Security

**Steps**:

1. Complete multiple deposits
2. Verify fee calculations are consistent
3. Check for any fee manipulation

**Expected**: Fee calculations are secure and consistent

---

### 12. Browser Compatibility Testing

**Objective**: Verify deposit functionality works across different browsers

**Test Cases**:

#### 12.1 Chrome Testing

**Steps**:

1. Test complete deposit flow in Chrome
2. Verify all features work correctly

**Expected**: Full functionality in Chrome

#### 12.2 Firefox Testing

**Steps**:

1. Test complete deposit flow in Firefox
2. Verify all features work correctly

**Expected**: Full functionality in Firefox

#### 12.3 Safari Testing

**Steps**:

1. Test complete deposit flow in Safari
2. Verify all features work correctly

**Expected**: Full functionality in Safari

#### 12.4 Edge Testing

**Steps**:

1. Test complete deposit flow in Edge
2. Verify all features work correctly

**Expected**: Full functionality in Edge

---

## Test Data

### Valid Test Amounts

- Small: `0.01`, `1.00`, `10.50`
- Medium: `100.00`, `500.00`
- Large: `1000.00`, `5000.00`

### Invalid Test Data

- Invalid amounts: `-1`, `0`, `abc`, `1.2.3`
- Empty amounts: ``
- Very large amounts: `999999999.99`

---

## Success Criteria

A test is considered **PASSED** if:

1. ✅ All expected behaviors occur
2. ✅ No unexpected errors or crashes
3. ✅ UI responds appropriately
4. ✅ Data is handled correctly
5. ✅ User experience is smooth
6. ✅ Error handling is graceful

A test is considered **FAILED** if:

1. ❌ Expected behavior doesn't occur
2. ❌ Application crashes or freezes
3. ❌ UI becomes unresponsive
4. ❌ Data is corrupted or lost
5. ❌ User experience is poor
6. ❌ Error handling is inadequate

---

## Reporting

For each test scenario:

1. **Test ID**: Unique identifier (e.g., DEPOSIT-001)
2. **Test Name**: Descriptive name
3. **Status**: PASSED/FAILED
4. **Notes**: Any observations or issues
5. **Screenshots**: If applicable
6. **Environment**: Device, browser, network conditions
7. **Amount Tested**: Deposit amount used in test

---

## Regression Testing

After any changes to deposit logic:

1. Run all test scenarios
2. Focus on affected functionality
3. Verify no regressions in other areas
4. Document any new issues found
5. Test with multiple amount ranges
6. Verify cross-browser compatibility
