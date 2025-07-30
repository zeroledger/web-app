# Activity Tab (History) Manual Testing Scenarios

## Overview

This document outlines comprehensive manual testing scenarios for the Activity Tab functionality in the ZeroLedger application. The Activity Tab displays transaction history, grouped by transaction hash, with incoming and outgoing commitments.

## Prerequisites

- User has a connected wallet (Privy)
- User has completed at least one transaction (deposit, withdraw, spend, or faucet)
- Application is synced with the blockchain
- TES service is operational

## Test Environment Setup

1. **Network**: Optimism Sepolia testnet
2. **Token**: [Testnet USD token](https://sepolia-optimism.etherscan.io/token/0x6af5c33c20ca6169b3d98a2bcc94bdd0f4f68ffd)
3. **TES Service**: Running and accessible
4. **Transaction History**: Available in local storage

## Activity Tab Flow Overview

1. **Tab Navigation** → User navigates to Activity tab
2. **Data Loading** → Application loads transaction history
3. **Transaction Display** → Input and Output Commitments are grouped per Transaction
4. **Interaction** → User can expand/collapse transaction details

## Test Scenarios

### 1. Basic Activity Tab Flow - Happy Path

**Objective**: Verify successful loading and display of transaction history

**Steps**:

1. **Navigate to Activity Tab**
   - Open the application
   - Connect wallet via Privy
   - Wait for sync to complete
   - Navigate to "Activity" tab

2. **Verify Initial State**
   - Check that Activity tab is accessible
   - Verify loading state appears initially
   - Confirm skeleton loading animation is displayed

3. **Monitor Data Loading**
   - Wait for transaction history to load
   - Verify loading animation disappears
   - Check that transactions are displayed

4. **Verify Transaction Display**
   - Check that inputs and outputs are grouped by transaction hash
   - Verify transaction details are displayed:
     - Transaction hash (shortened format)
     - Total amount for the transaction
     - Incoming/outgoing commitments counts
   - Confirm transaction groups are clickable

5. **Test Transaction Details**
   - Click on a transaction group
   - Verify incoming/outgoing sections expand
   - Check that individual transaction details are shown:
     - Amount with +/- prefix
     - Poseidon commitment hash
   - Test collapse functionality

**Expected Results**:

- ✅ Activity tab loads correctly
- ✅ Loading states work properly
- ✅ Transactions are grouped correctly
- ✅ Transaction details are accurate
- ✅ Expand/collapse functionality works
- ✅ UI is responsive and smooth

---

### 2. Transaction History Testing

**Objective**: Verify transaction history is displayed correctly

**Test Cases**:

#### 2.1 Empty Transaction History

**Steps**:

1. Navigate to Activity tab with no transactions
2. Verify empty state message
3. Check that "No transactions yet" is displayed

**Expected**: Clear empty state message is shown

#### 2.2 Single Transaction Display

**Steps**:

1. Complete one transaction (deposit/withdraw/spend)
2. Navigate to Activity tab
3. Verify transaction appears correctly

**Expected**: Single transaction displays with correct details

#### 2.3 Multiple Transactions Display

**Steps**:

1. Complete multiple transactions
2. Navigate to Activity tab
3. Verify all transactions are displayed

**Expected**: All transactions appear in chronological order

#### 2.4 Transaction Commitments Grouping

**Steps**:

1. Complete transactions that uses consumes and produces multiple commitments
2. Navigate to Activity tab
3. Verify transactions are grouped correctly

**Expected**: Related transactions are grouped under same hash

---

### 3. Transaction Details Testing

**Objective**: Verify transaction details are accurate and complete

**Test Cases**:

#### 3.1 Transaction Hash Display

**Steps**:

1. Navigate to Activity tab
2. Check transaction hash format
3. Verify hash is shortened appropriately
4. Test hash link to Etherscan

**Expected**: Hash displays correctly and links to Etherscan

#### 3.2 Amount Formatting

**Steps**:

1. Check transaction amounts
2. Verify +/- prefixes are correct. "-" for outgoing tx, "+" for incoming.
3. Test decimal formatting
4. Verify currency symbol

**Expected**: Amounts are formatted correctly with proper prefixes

#### 3.3 Poseidon Commitment Display

**Steps**:

1. Expand transaction details
2. Check Poseidon commitment format
3. Verify commitment hash is shortened

**Expected**: Commitment hashes display correctly

#### 3.4 Unknown Transaction Handling

**Steps**:

1. Check for unknown transactions
2. Verify "Unknown Transaction" label
3. Test unknown transaction display

**Expected**: Unknown transactions are handled gracefully

#### 3.5 Timestamp Validation

**Steps**:

1. Check transaction timestamps
2. Verify chronological order
3. Test date formatting

**Expected**: Timestamps are accurate and properly formatted

---

### 4. UI Interaction Testing

**Objective**: Verify user interactions work correctly

**Test Cases**:

#### 4.1 Expand/Collapse Functionality

**Steps**:

1. Click on transaction group
2. Verify incoming section expands
3. Click on incoming section
4. Verify individual transactions show
5. Test collapse functionality

**Expected**: Expand/collapse works smoothly

#### 4.2 Multiple Section Expansion

**Steps**:

1. Expand incoming section
2. Expand outgoing section
3. Verify both sections can be opened independently
4. Verify both sections can be collapsed independently

**Expected**: Multiple sections can be expanded independently

#### 4.3 Animation Testing

**Steps**:

1. Click expand/collapse buttons
2. Verify smooth animations

**Expected**: Animations are smooth and responsive

---

### 5. Data Loading Testing

**Objective**: Verify data loading states work correctly

**Test Cases**:

#### 5.1 Initial Loading State

**Steps**:

1. Navigate to Activity tab
2. Verify skeleton loading appears
3. Check loading animation

**Expected**: Loading state displays correctly

#### 5.2 Loading Error Handling

**Steps**:

1. Simulate loading error
2. Verify error message appears
3. Test error state display

**Expected**: Error states are handled gracefully

### 6. Performance Testing

**Objective**: Verify activity tab performs well with various data loads

**Test Cases**:

#### 6.1 Large Transaction History

**Steps**:

1. Generate many transactions
2. Navigate to Activity tab
3. Monitor loading performance
4. Test scrolling performance

**Expected**: Performance remains good with large datasets

#### 6.2 Rapid Tab Switching

**Steps**:

1. Switch between tabs rapidly
2. Monitor for performance issues
3. Verify no memory leaks

**Expected**: Tab switching remains smooth

---

### 7. Mobile Responsiveness Testing

**Objective**: Verify activity tab works on mobile devices

**Test Cases**:

#### 7.1 Mobile Navigation

**Steps**:

1. Test on mobile device
2. Navigate to Activity tab
3. Verify tab switching works

**Expected**: Mobile navigation works correctly

#### 7.2 Mobile Transaction Display

**Steps**:

1. Test on mobile device
2. Check transaction display
3. Test expand/collapse on mobile

**Expected**: Mobile display works correctly

#### 7.3 Mobile Touch Interactions

**Steps**:

1. Test touch interactions
2. Verify tap targets are appropriate
3. Test scrolling on mobile

**Expected**: Touch interactions work well

---

### 8. Error Recovery Testing

**Objective**: Verify activity tab recovers gracefully from errors

**Test Cases**:

#### 8.1 Network Error Handling

**Steps**:

1. Simulate network error
2. Navigate to Activity tab
3. Monitor error handling

**Expected**: Clear error message, option to retry

#### 8.2 Data Corruption Handling

**Steps**:

1. Simulate corrupted transaction data
2. Navigate to Activity tab
3. Monitor error handling

**Expected**: Graceful error handling, no crashes

---

### 9. Browser Compatibility Testing

**Objective**: Verify activity tab works across different browsers

**Test Cases**:

#### 9.1 Chrome Testing

**Steps**:

1. Test Activity tab in Chrome
2. Verify all features work correctly

**Expected**: Full functionality in Chrome

#### 9.2 Firefox Testing

**Steps**:

1. Test Activity tab in Firefox
2. Verify all features work correctly

**Expected**: Full functionality in Firefox

#### 9.3 Safari Testing

**Steps**:

1. Test Activity tab in Safari
2. Verify all features work correctly

**Expected**: Full functionality in Safari

#### 9.4 Edge Testing

**Steps**:

1. Test Activity tab in Edge
2. Verify all features work correctly

**Expected**: Full functionality in Edge

---

### 10. Integration Testing

**Objective**: Verify activity tab integrates correctly with other features

**Test Cases**:

#### 10.1 Transaction Creation Integration

**Steps**:

1. Complete a new transaction
2. Navigate to Activity tab
3. Verify new transaction appears

**Expected**: New transactions appear immediately

#### 10.2 Balance Integration

**Steps**:

1. Check transaction amounts
2. Verify amounts match balance changes
3. Test consistency

**Expected**: Transaction amounts are consistent with balance changes

#### 10.3 Tab Integration

**Steps**:

1. Switch between tabs
2. Verify Activity tab state is preserved
3. Test tab synchronization

**Expected**: Tab state is preserved correctly

---

### 12. Edge Case Testing

**Objective**: Verify activity tab handles edge cases correctly

**Test Cases**:

#### 12.1 Very Long Transaction Lists

**Steps**:

1. Generate many transactions
2. Test scrolling performance
3. Verify all transactions are accessible

**Expected**: Performance remains good with long lists

#### 12.2 Malformed Transaction Data

**Steps**:

1. Simulate malformed data
2. Monitor error handling
3. Verify graceful degradation

**Expected**: Malformed data is handled gracefully

#### 12.3 Concurrent Data Updates

**Steps**:

1. Perform transactions while viewing Activity tab
2. Monitor for data consistency
3. Verify updates are reflected

**Expected**: Data updates are reflected correctly

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

1. **Test ID**: Unique identifier (e.g., ACTIVITY-001)
2. **Test Name**: Descriptive name
3. **Status**: PASSED/FAILED
4. **Notes**: Any observations or issues
5. **Screenshots**: If applicable
6. **Environment**: Device, browser, network conditions
7. **Transaction Count**: Number of transactions in test

---

## Regression Testing

After any changes to activity tab logic:

1. Run all test scenarios
2. Focus on affected functionality
3. Verify no regressions in other areas
4. Document any new issues found
