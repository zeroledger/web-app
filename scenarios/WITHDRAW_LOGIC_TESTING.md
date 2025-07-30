# Withdraw Logic Manual Testing Scenarios

## Overview
This document outlines comprehensive manual testing scenarios for the withdraw functionality in the ZeroLedger application. The withdraw logic involves a two-step process: form submission and transaction signing.

## Prerequisites
- User has a connected wallet (Privy)
- User has sufficient private balance for withdrawal
- Application is synced with the blockchain
- TES service is operational

## Test Environment Setup
1. **Network**: Optimism Sepolia testnet
2. **Token**: USD token (specified in constants)
3. **Vault**: Deployed vault contract
4. **TES Service**: Running and accessible

## Withdraw Flow Overview

1. **Form Step** → User enters withdrawal amount and recipient address
2. **Meta Transaction** → User reviews and signs the transaction

## Test Scenarios

### 1. Basic Withdraw Flow - Happy Path

**Objective**: Verify successful withdraw transaction from start to finish


**Steps**:

1. **Navigate to Menu Tab**
   - Open the application
   - Connect wallet via Privy
   - Wait for sync to complete
   - Navigate to "Menu" tab

2. **Verify Initial State**
   - Check that "Withdraw" button is visible and enabled
   - Confirm no modals are open
   - Verify user has sufficient private balance

3. **Open Withdraw Modal**
   - Click "Withdraw" button
   - Verify modal opens with form step
   - Check that form fields are empty
   - Confirm back button is visible

4. **Fill Withdraw Form**
   - Enter valid recipient address: `0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6`
   - Enter amount: `25.00`
   - Verify amount validation works (decimal input)
   - Check that "Review Withdraw" button is enabled

5. **Submit Form**
   - Click "Review Withdraw" button
   - Verify loading state appears
   - Wait for transaction preparation

6. **Review Transaction**
   - Verify modal transitions to preview step
   - Check transaction details are displayed:
     - From address (user's address)
     - To address (recipient)
     - Amount (25.00 USD)
     - Fee amount
     - Gas coverage
   - Verify "Sign & Withdraw" button is enabled

7. **Sign Transaction**
   - Click "Sign & Withdraw" button
   - Verify wallet signing prompt appears
   - Approve transaction in wallet
   - Wait for transaction submission

8. **Verify Success**
   - Check success message appears: "Withdraw Successful!"
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

1. Open withdraw modal
2. Enter invalid address: `0x123`
3. Enter valid amount: `10.00`
4. Click "Review Withdraw"

**Expected**: Error message "Invalid Ethereum address" appears

#### 2.2 Empty Recipient Address

**Steps**:

1. Open withdraw modal
2. Leave recipient field empty
3. Enter valid amount: `10.00`
4. Click "Review Withdraw"

**Expected**: Error message "Recipient address is required" appears

#### 2.3 Invalid Amount Format

**Steps**:

1. Open withdraw modal
2. Enter valid recipient address
3. Enter invalid amount: `abc`
4. Click "Review Withdraw"

**Expected**: Error message "Amount must be a positive number" appears

#### 2.4 Zero Amount

**Steps**:

1. Open withdraw modal
2. Enter valid recipient address
3. Enter amount: `0`
4. Click "Review Withdraw"

**Expected**: Error message "Amount must be a positive number" appears

#### 2.5 Negative Amount

**Steps**:

1. Open withdraw modal
2. Enter valid recipient address
3. Enter amount: `-10`
4. Click "Review Withdraw"

**Expected**: Error message "Amount must be a positive number" appears

#### 2.6 Decimal Input Testing

**Steps**:

1. Open withdraw modal
2. Enter valid recipient address
3. Test decimal inputs:
   - `1.` (should be allowed)
   - `1.2` (should be allowed)
   - `1.23` (should be allowed)
   - `.5` (should be allowed)

**Expected**: All decimal inputs work correctly

---

### 3. Insufficient Balance Testing

**Objective**: Verify behavior when user tries to withdraw more than available balance


**Steps**:

1. **Check Current Balance**
   - Note current private balance
   - Calculate amount higher than balance

2. **Attempt Overwithdraw**
   - Open withdraw modal
   - Enter valid recipient address
   - Enter amount higher than balance
   - Click "Review Withdraw"

**Expected Results**:
- ✅ Form allows input but may show warning
- ✅ Transaction preparation fails
- ✅ Error state is displayed
- ✅ Modal shows appropriate error message
- ✅ Modal auto-closes after error

---

### 4. Network Error Handling

**Objective**: Verify application handles network/API failures gracefully

**Test Cases**:

#### 4.1 TES Service Unavailable

**Steps**:

1. Simulate TES service down (if possible)
2. Open withdraw modal
3. Fill form with valid data
4. Click "Review Withdraw"

**Expected**: Error message appears, modal handles failure gracefully

#### 4.2 Blockchain Network Issues

**Steps**:

1. Simulate network connectivity issues
2. Attempt withdraw transaction
3. Monitor error handling

**Expected**: Appropriate error messages, no app crashes

#### 4.3 RPC Endpoint Issues

**Steps**:

1. Simulate RPC endpoint failures
2. Attempt to prepare withdraw transaction
3. Monitor error handling

**Expected**: Clear error messages, retry mechanisms

---

### 5. Modal Navigation Testing

**Objective**: Verify modal navigation works correctly in all scenarios

**Test Cases**:

#### 5.1 Back Button - Form Step

**Steps**:

1. Open withdraw modal
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
   - Open withdraw modal
   - Enter known values: recipient `0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6`, amount `15.00`
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

1. Open withdraw modal
2. Try to open another modal (deposit/spend)
3. Verify behavior

**Expected**: Only one modal should be open at a time

#### 7.2 Rapid Form Submissions

**Steps**:

1. Fill form quickly
2. Submit multiple times rapidly
3. Verify no duplicate transactions

**Expected**: Only one transaction should be processed

#### 7.3 Withdraw During Other Operations

**Steps**:

1. Start a deposit transaction
2. Try to open withdraw modal
3. Verify behavior

**Expected**: Withdraw modal should be disabled or show appropriate message

---

### 8. Mobile Responsiveness Testing

**Objective**: Verify withdraw functionality works on mobile devices

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
2. Complete withdraw flow on mobile
3. Verify all steps work correctly

**Expected**: Complete withdraw flow works on mobile

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

1. Submit withdraw transaction
2. Simulate transaction failure
3. Verify error handling

**Expected**: Clear error message, modal closes properly

#### 9.3 Transaction Preparation Failure

**Steps**:

1. Submit form with valid data
2. Simulate transaction preparation failure
3. Monitor error handling

**Expected**: Clear error message, option to retry

---

### 10. Performance Testing

**Objective**: Verify withdraw operations perform well under various conditions

**Test Cases**:

#### 10.1 Large Amount Withdrawals

**Steps**:

1. Try to withdraw large amounts
2. Monitor preparation time
3. Verify performance

**Expected**: Reasonable preparation time even for large amounts

#### 10.2 Multiple Rapid Withdrawals

**Steps**:

1. Perform multiple withdraw transactions quickly
2. Monitor application responsiveness
3. Verify no performance degradation

**Expected**: Application remains responsive

#### 10.3 Slow Network Conditions

**Steps**:

1. Simulate slow network connection
2. Attempt withdraw transaction
3. Monitor loading states and timeouts

**Expected**: Appropriate loading states, reasonable timeouts

---

### 11. Security Testing

**Objective**: Verify security aspects of the withdraw process

**Test Cases**:

#### 11.1 Transaction Data Verification

**Steps**:

1. Complete withdraw flow
2. Verify transaction data is accurate
3. Check for any data exposure

**Expected**: Transaction data is secure and accurate

#### 11.2 Wallet Address Verification

**Steps**:

1. Complete withdraw flow
2. Verify displayed addresses are correct
3. Check address format validation

**Expected**: Address verification works correctly

#### 11.3 Fee Calculation Security

**Steps**:

1. Complete multiple withdrawals
2. Verify fee calculations are consistent
3. Check for any fee manipulation

**Expected**: Fee calculations are secure and consistent

---

### 12. Browser Compatibility Testing

**Objective**: Verify withdraw functionality works across different browsers

**Test Cases**:

#### 12.1 Chrome Testing

**Steps**:

1. Test complete withdraw flow in Chrome
2. Verify all features work correctly

**Expected**: Full functionality in Chrome

#### 12.2 Firefox Testing

**Steps**:

1. Test complete withdraw flow in Firefox
2. Verify all features work correctly

**Expected**: Full functionality in Firefox

#### 12.3 Safari Testing

**Steps**:

1. Test complete withdraw flow in Safari
2. Verify all features work correctly

**Expected**: Full functionality in Safari

#### 12.4 Edge Testing

**Steps**:

1. Test complete withdraw flow in Edge
2. Verify all features work correctly

**Expected**: Full functionality in Edge

---

## Test Data

### Valid Test Addresses
- `0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6`
- `0x1234567890123456789012345678901234567890`

### Valid Test Amounts
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
1. **Test ID**: Unique identifier (e.g., WITHDRAW-001)
2. **Test Name**: Descriptive name
3. **Status**: PASSED/FAILED
4. **Notes**: Any observations or issues
5. **Screenshots**: If applicable
6. **Environment**: Device, browser, network conditions
7. **Amount Tested**: Withdraw amount used in test

---

## Regression Testing

After any changes to withdraw logic:
1. Run all test scenarios
2. Focus on affected functionality
3. Verify no regressions in other areas
4. Document any new issues found
5. Test with multiple amount ranges
6. Verify cross-browser compatibility

---

*Last Updated: [Current Date]*
*Version: 1.0* 