import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { COLORS, DEPOSIT_CATEGORIES, WITHDRAWAL_CATEGORIES } from "../lib/constants";
import { createTransaction } from "../db/repository";
import { validateTransactionAmount, validateCategory } from "../services/validation";

interface TransactionFormProps {
  accountId: number;
  onSuccess: () => void;
}

export default function TransactionForm({
  accountId,
  onSuccess,
}: TransactionFormProps) {
  const [type, setType] = useState<"deposit" | "withdrawal">("deposit");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories =
    type === "deposit" ? DEPOSIT_CATEGORIES : WITHDRAWAL_CATEGORIES;

  const handleSubmit = () => {
    const parsedAmount = parseFloat(amount);
    const amountError = validateTransactionAmount(parsedAmount);
    if (amountError) {
      setError(amountError);
      return;
    }

    const selectedCategory = category || (categories[0] as string);
    const categoryError = validateCategory(type, selectedCategory);
    if (categoryError) {
      setError(categoryError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      createTransaction({
        accountId,
        type,
        category: selectedCategory,
        amount: parsedAmount,
        note: note || undefined,
      });
      setAmount("");
      setNote("");
      setCategory("");
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Transaction</Text>

      <View style={styles.typeToggle}>
        {(["deposit", "withdrawal"] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => {
              setType(t);
              setCategory("");
            }}
            style={[styles.typeButton, type === t && styles.typeButtonActive]}
          >
            <Text
              style={[styles.typeText, type === t && styles.typeTextActive]}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.amountRow}>
        <Text style={styles.dollarSign}>$</Text>
        <TextInput
          style={styles.amountInput}
          placeholder="0.00"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          placeholderTextColor={COLORS.slate400}
        />
      </View>

      <Text style={styles.label}>Category</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
      >
        {categories.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCategory(c)}
            style={[
              styles.categoryChip,
              (category === c || (!category && c === categories[0])) &&
                styles.categoryChipActive,
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                (category === c || (!category && c === categories[0])) &&
                  styles.categoryTextActive,
              ]}
            >
              {c}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <TextInput
        style={styles.noteInput}
        placeholder="Note (optional)"
        value={note}
        onChangeText={setNote}
        placeholderTextColor={COLORS.slate400}
        maxLength={200}
      />

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <Pressable
        onPress={handleSubmit}
        disabled={loading}
        style={[
          styles.submitButton,
          type === "deposit" ? styles.depositButton : styles.withdrawalButton,
          loading && styles.submitDisabled,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.submitText}>
            Post {type.charAt(0).toUpperCase() + type.slice(1)}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.slate100,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.slate800,
    marginBottom: 16,
  },
  typeToggle: {
    flexDirection: "row",
    backgroundColor: COLORS.slate100,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  typeButtonActive: {
    backgroundColor: COLORS.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  typeText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.slate500,
  },
  typeTextActive: {
    color: COLORS.indigo,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.slate50,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  dollarSign: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.slate400,
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.slate800,
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.slate400,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    backgroundColor: COLORS.white,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: COLORS.indigoLight,
    borderColor: "#C7D2FE",
  },
  categoryText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.slate500,
  },
  categoryTextActive: {
    color: COLORS.indigo,
  },
  noteInput: {
    backgroundColor: COLORS.slate50,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.slate800,
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: COLORS.roseLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.rose,
    fontSize: 13,
    fontWeight: "700",
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  depositButton: {
    backgroundColor: COLORS.emerald,
  },
  withdrawalButton: {
    backgroundColor: COLORS.rose,
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "900",
  },
});
