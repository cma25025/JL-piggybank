import React from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { COLORS } from "../lib/constants";
import type { Transaction } from "../lib/types";

interface TransactionListProps {
  transactions: Transaction[];
}

function TransactionRow({ item }: { item: Transaction }) {
  const isWithdrawal = item.type === "withdrawal";
  const isInterest = item.type === "interest";

  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <View
          style={[
            styles.dot,
            isWithdrawal
              ? styles.dotRose
              : isInterest
                ? styles.dotIndigo
                : styles.dotEmerald,
          ]}
        />
        <View style={styles.rowInfo}>
          <Text style={styles.category}>{item.category}</Text>
          <Text style={styles.date}>
            {new Date(item.transaction_date).toLocaleDateString()}
          </Text>
          {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
        </View>
      </View>
      <View style={styles.rowRight}>
        <Text
          style={[
            styles.amount,
            isWithdrawal ? styles.amountRose : styles.amountEmerald,
          ]}
        >
          {isWithdrawal ? "-" : "+"}${Number(item.amount).toFixed(2)}
        </Text>
        <Text style={styles.balanceAfter}>
          ${Number(item.balance_after).toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

export default function TransactionList({
  transactions,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No transactions yet.</Text>
        <Text style={styles.emptySubtext}>
          Record a deposit or withdrawal to get started.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transaction Ledger</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <TransactionRow item={item} />}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    overflow: "hidden",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.slate700,
    padding: 20,
    paddingBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  dotEmerald: { backgroundColor: COLORS.emerald },
  dotRose: { backgroundColor: COLORS.rose },
  dotIndigo: { backgroundColor: COLORS.indigo },
  rowInfo: {
    flex: 1,
  },
  category: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.slate800,
  },
  date: {
    fontSize: 12,
    color: COLORS.slate400,
    marginTop: 2,
  },
  note: {
    fontSize: 12,
    color: COLORS.slate500,
    marginTop: 2,
  },
  rowRight: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 15,
    fontWeight: "900",
  },
  amountEmerald: { color: COLORS.emerald },
  amountRose: { color: COLORS.rose },
  balanceAfter: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.slate400,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.slate50,
  },
  empty: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.slate800,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.slate400,
    textAlign: "center",
  },
});
