import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PRIMARY_GREEN = "#153e69";

/**
 * ModalPicker — iOS-safe dropdown picker using a Modal overlay.
 *
 * Props:
 *   visible        {bool}     — whether picker modal is open
 *   onClose        {func}     — called when modal is dismissed
 *   options        {string[]} — list of option strings
 *   selectedValue  {string}   — currently selected value
 *   onSelect       {func}     — called with chosen option string
 *   title          {string}   — optional header title
 *   label          {string}   — trigger button label (current selection)
 *   placeholder    {string}   — placeholder text when nothing selected
 *   triggerStyle   {object}   — extra style for trigger button
 *   isOpen         {bool}     — controls chevron direction (same as visible)
 *   renderOption   {func}     — optional: (opt) => string for display
 */
export default function ModalPicker({
  visible,
  onClose,
  options = [],
  selectedValue,
  onSelect,
  title = "Select an option",
  placeholder = "Select...",
  renderOption,
}) {
  const getLabel = (opt) => (renderOption ? renderOption(opt) : opt);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.sheet}>
        <SafeAreaView edges={["bottom"]}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="rgba(10,5,4,0.6)" />
            </TouchableOpacity>
          </View>

          {/* Options list */}
          <FlatList
            data={options}
            keyExtractor={(item, idx) => `${item}-${idx}`}
            renderItem={({ item }) => {
              const isSelected = item === selectedValue;
              return (
                <TouchableOpacity
                  style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                    {getLabel(item)}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color={PRIMARY_GREEN} />
                  )}
                </TouchableOpacity>
              );
            }}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

/**
 * ModalPickerTrigger — the touchable row that opens the ModalPicker.
 *
 * Props:
 *   onPress        {func}     — opens the picker
 *   label          {string}   — text shown inside trigger
 *   placeholder    {string}   — shown when no selection
 *   isOpen         {bool}     — controls chevron icon direction
 *   style          {object}   — extra styles for wrapper
 *   leftIcon       {string}   — optional Ionicons name for left icon
 */
export function ModalPickerTrigger({
  onPress,
  label,
  placeholder,
  isOpen,
  style,
  leftIcon,
}) {
  return (
    <TouchableOpacity
      style={[triggerStyles.wrapper, isOpen && triggerStyles.wrapperActive, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {leftIcon && (
        <Ionicons
          name={leftIcon}
          size={20}
          color="rgba(10,5,4,0.6)"
          style={{ marginRight: 8 }}
        />
      )}
      <Text
        style={[
          triggerStyles.text,
          !label && { color: "rgba(10,5,4,0.4)" },
        ]}
        numberOfLines={1}
      >
        {label || placeholder}
      </Text>
      <Ionicons
        name={isOpen ? "chevron-up" : "chevron-down"}
        size={18}
        color="rgba(10,5,4,0.6)"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 0,
    maxHeight: "60%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(10,5,4,0.15)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(10,5,4,0.08)",
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0a0504",
  },
  closeBtn: {
    padding: 4,
  },
  list: {
    paddingBottom: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(10,5,4,0.08)",
  },
  optionRowSelected: {
    backgroundColor: "rgba(21,62,105,0.06)",
  },
  optionText: {
    fontSize: 15,
    color: "#0a0504",
    flex: 1,
  },
  optionTextSelected: {
    color: PRIMARY_GREEN,
    fontWeight: "700",
  },
});

const triggerStyles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f3",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(10,5,4,0.12)",
    paddingHorizontal: 14,
    height: 48,
    marginBottom: 4,
  },
  wrapperActive: {
    borderColor: "#153e69",
    backgroundColor: "#fff",
  },
  text: {
    flex: 1,
    fontSize: 14,
    color: "#0a0504",
    fontWeight: "500",
  },
});
