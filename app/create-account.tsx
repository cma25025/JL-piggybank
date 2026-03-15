import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { createAccount } from "../src/db/repository";
import {
  validateAccountName,
  validateInterestRate,
  validateCompoundingPeriod,
} from "../src/services/validation";
import { COLORS, COMPOUNDING_PERIODS } from "../src/lib/constants";
import type { CompoundingPeriod } from "../src/lib/types";

export default function CreateAccountScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [rateInput, setRateInput] = useState("5");
  const [period, setPeriod] = useState<CompoundingPeriod>("monthly");
  const [error, setError] = useState<string | null>(null);

  const handleCreate = () => {
    setError(null);

    const nameError = validateAccountName(name);
    if (nameError) {
      setError(nameError);
      return;
    }

    const ratePercent = parseFloat(rateInput);
    if (isNaN(ratePercent) || ratePercent < 0 || ratePercent > 100) {
      setError("Interest rate must be between 0% and 100%");
      return;
    }

    const rateDecimal = ratePercent / 100;
    const rateError = validateInterestRate(rateDecimal);
    if (rateError) {
      setError(rateError);
      return;
    }

    try {
      createAccount({
        name: name.trim(),
        interest_rate: rateDecimal,
        compounding_period: period,
        initial_balance: 0,
      });
      router.back();
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        <Text style={styles.title}>New Account</Text>

        <Text style={styles.label}>Child's Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Sam"
          value={name}
          onChangeText={setName}
          placeholderTextColor={COLORS.slate400}
          autoFocus
          maxLength={50}
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Interest APY %</Text>
            <TextInput
              style={styles.input}
              placeholder="5"
              keyboardType="decimal-pad"
              value={rateInput}
              onChangeText={setRateInput}
              placeholderTextColor={COLORS.slate400}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Compounding</Text>
            <View style={styles.periodList}>
              {COMPOUNDING_PERIODS.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setPeriod(p)}
                  style={[
                    styles.periodChip,
                    period === p && styles.periodChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.periodText,
                      period === p && styles.periodTextActive,
                    ]}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Pressable onPress={handleCreate} style={styles.createButton}>
          <Text style={styles.createButtonText}>Open Account</Text>
        </Pressable>
      </View>
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
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.slate100,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.slate900,
    marginBottom: 24,
  },
  label: {
    fontSize: 10,
    fontWeight: "800",
    color: COLORS.slate400,
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.slate50,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.slate800,
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  periodList: {
    gap: 6,
  },
  periodChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.slate50,
  },
  periodChipActive: {
    backgroundColor: COLORS.indigoLight,
  },
  periodText: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.slate500,
    textTransform: "capitalize",
  },
  periodTextActive: {
    color: COLORS.indigo,
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
  createButton: {
    backgroundColor: COLORS.indigo,
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    marginTop: 8,
    shadowColor: COLORS.indigo,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: "900",
  },
});
