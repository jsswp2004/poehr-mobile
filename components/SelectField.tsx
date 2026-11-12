import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export interface SelectOption {
  label: string;
  value: string | number;
}

interface Props {
  title: string;
  value: string | number | null | undefined;
  options: SelectOption[];
  onChange: (value: string | number) => void;
  placeholder?: string;
}

/**
 * Tap-to-open bottom sheet that replaces the iOS spinning wheel picker.
 * Same look as the pickers on the Availability screen.
 */
export default function SelectField({
  title,
  value,
  options,
  onChange,
  placeholder = "Select...",
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <>
      <TouchableOpacity
        style={styles.field}
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={title}
      >
        <Text
          style={[styles.fieldText, !selected && styles.placeholder]}
          numberOfLines={1}
        >
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.overlay}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setOpen(false)}
          />
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.title}>{title}</Text>
            <ScrollView style={styles.options}>
              {options.map((o) => {
                const on = o.value === value;
                return (
                  <TouchableOpacity
                    key={String(o.value)}
                    style={[styles.option, on && styles.optionOn]}
                    onPress={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.optionText, on && styles.optionTextOn]}>
                      {o.label}
                    </Text>
                    {on && <Text style={styles.check}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.cancel} onPress={() => setOpen(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#c5ccd4",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  fieldText: { flex: 1, fontSize: 16, color: "#11181C" },
  placeholder: { color: "#8b95a0" },
  arrow: { fontSize: 11, color: "#5b6670", marginLeft: 8 },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(17,24,28,0.45)" },
  backdrop: { flex: 1 },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    paddingBottom: 28,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#d5dae0",
    marginTop: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#11181C",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 12,
  },
  options: { maxHeight: 360 },
  option: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#eef1f4",
  },
  optionOn: { backgroundColor: "#e8f1fb" },
  optionText: { fontSize: 16, color: "#11181C" },
  optionTextOn: { color: "#0d5cab", fontWeight: "700" },
  check: { color: "#0d5cab", fontSize: 16, fontWeight: "700" },
  cancel: {
    marginHorizontal: 20,
    marginTop: 12,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#f5f7fa",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { fontSize: 16, fontWeight: "600", color: "#3d4852" },
});
