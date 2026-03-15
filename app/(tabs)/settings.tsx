import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../src/lib/constants";

export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>
          Parental PIN and preferences coming soon.
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Storage</Text>
          <Text style={styles.infoValue}>On-device SQLite</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Privacy</Text>
          <Text style={styles.infoValue}>No data collection</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.slate50,
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.slate100,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: COLORS.slate900,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.slate500,
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
  },
  infoLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.slate600,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.slate800,
  },
});
