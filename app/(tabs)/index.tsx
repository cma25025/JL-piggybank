import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { getAllAccounts } from "../../src/db/repository";
import AccountCard from "../../src/components/AccountCard";
import { COLORS } from "../../src/lib/constants";
import type { Account } from "../../src/lib/types";

export default function DashboardScreen() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadAccounts = useCallback(() => {
    try {
      const data = getAllAccounts();
      setAccounts(data);
    } catch (err) {
      console.error("Failed to load accounts:", err);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAccounts();
    }, [loadAccounts])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadAccounts();
    setRefreshing(false);
  }, [loadAccounts]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Accounts</Text>
        <Pressable
          onPress={() => router.push("/create-account")}
          style={styles.addButton}
        >
          <Text style={styles.addButtonText}>+</Text>
        </Pressable>
      </View>

      {accounts.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No accounts yet</Text>
          <Text style={styles.emptySubtext}>
            Create your first piggybank to get started!
          </Text>
          <Pressable
            onPress={() => router.push("/create-account")}
            style={styles.emptyButton}
          >
            <Text style={styles.emptyButtonText}>Create Account</Text>
          </Pressable>
        </View>
      ) : (
        accounts.map((account) => (
          <AccountCard
            key={account.id}
            account={account}
            onPress={() => router.push(`/account/${account.id}`)}
          />
        ))
      )}
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: COLORS.slate900,
    letterSpacing: -0.5,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: COLORS.indigo,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.indigo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: "700",
    marginTop: -2,
  },
  empty: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.slate200,
    padding: 48,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.slate800,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: COLORS.slate400,
    marginBottom: 24,
    textAlign: "center",
  },
  emptyButton: {
    backgroundColor: COLORS.indigo,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: "700",
  },
});
