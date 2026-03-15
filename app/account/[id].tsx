import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  RefreshControl,
} from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { getAccount, getTransactions } from "../../src/db/repository";
import { calculateInterest } from "../../src/services/interest";
import TransactionForm from "../../src/components/TransactionForm";
import TransactionList from "../../src/components/TransactionList";
import { COLORS } from "../../src/lib/constants";
import type { Account, Transaction } from "../../src/lib/types";

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const accountId = parseInt(id, 10);

  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(() => {
    try {
      const acc = getAccount(accountId);
      setAccount(acc);
      if (acc) {
        const txs = getTransactions(accountId);
        setTransactions(txs);
      }
    } catch (err) {
      console.error("Failed to load account:", err);
    }
  }, [accountId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleInterest = () => {
    const result = calculateInterest(accountId);
    Alert.alert(
      result.success ? "Interest Applied" : "Interest",
      result.message
    );
    if (result.success) {
      loadData();
    }
  };

  if (!account) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Account not found</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Balance Header */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceAmount}>
          $
          {account.balance.toLocaleString(undefined, {
            minimumFractionDigits: 2,
          })}
        </Text>
        <Text style={styles.accountName}>{account.name}</Text>
      </View>

      {/* Interest Card */}
      <View style={styles.interestCard}>
        <View style={styles.interestInfo}>
          <Text style={styles.interestLabel}>Auto-Compounding</Text>
          <Text style={styles.interestRate}>
            {(account.interest_rate * 100).toFixed(1)}% APY
          </Text>
          <Text style={styles.interestPeriod}>
            Compounded {account.compounding_period}
          </Text>
        </View>
        <Pressable
          onPress={handleInterest}
          style={({ pressed }) => [
            styles.interestButton,
            pressed && styles.interestButtonPressed,
          ]}
        >
          <Text style={styles.interestButtonText}>Check & Pay Interest</Text>
        </Pressable>
      </View>

      {/* Transaction Form */}
      <TransactionForm accountId={accountId} onSuccess={loadData} />

      {/* Spacer */}
      <View style={{ height: 16 }} />

      {/* Transaction List */}
      <TransactionList transactions={transactions} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate50,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 16,
    color: COLORS.slate500,
  },
  balanceCard: {
    backgroundColor: COLORS.indigo,
    borderRadius: 24,
    padding: 24,
    shadowColor: COLORS.indigo,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
    textTransform: "uppercase",
    letterSpacing: 2,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: "900",
    color: COLORS.white,
    marginBottom: 4,
  },
  accountName: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
  },
  interestCard: {
    backgroundColor: COLORS.slate900,
    borderRadius: 24,
    padding: 20,
  },
  interestInfo: {
    marginBottom: 16,
  },
  interestLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.slate400,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  interestRate: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.white,
  },
  interestPeriod: {
    fontSize: 13,
    color: COLORS.slate500,
    marginTop: 2,
  },
  interestButton: {
    backgroundColor: COLORS.indigo,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  interestButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  interestButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "800",
  },
});
