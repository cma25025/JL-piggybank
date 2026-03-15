import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { COLORS } from "../lib/constants";
import type { Account } from "../lib/types";

interface AccountCardProps {
  account: Account;
  onPress: () => void;
}

export default function AccountCard({ account, onPress }: AccountCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {account.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.periodBadge}>
          <Text style={styles.periodText}>
            {account.compounding_period.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.name}>{account.name}</Text>
      <Text style={styles.balance}>
        ${account.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </Text>

      <View style={styles.footer}>
        <Text style={styles.rate}>
          {(account.interest_rate * 100).toFixed(1)}% APY
        </Text>
        <Text style={styles.chevron}>&rsaquo;</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    marginBottom: 16,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.indigoLight,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.indigo,
  },
  periodBadge: {
    backgroundColor: COLORS.slate50,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  periodText: {
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 1.5,
    color: COLORS.slate400,
  },
  name: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.slate800,
    marginBottom: 4,
  },
  balance: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.indigo,
    marginBottom: 20,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
  },
  rate: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.emerald,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.slate300,
  },
});
