import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Platform,
  TextInput,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PRIMARY_GREEN = "#153e69";

/**
 * ModalPicker — iOS-safe dropdown picker using a Modal overlay.
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
  multiSelect = false,
  searchable = false,
  searchPlaceholder = "Search...",
}) {
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!visible) {
      setSearchQuery("");
    }
  }, [visible]);

  const getLabel = useCallback((opt) => (renderOption ? renderOption(opt) : opt), [renderOption]);

  const filteredOptions = useMemo(() => {
    if (searchable && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return options.filter((opt) => {
        const labelStr = String(getLabel(opt)).toLowerCase();
        return labelStr.includes(q);
      });
    }
    return options;
  }, [options, searchQuery, searchable, getLabel]);

  const renderItem = useCallback(
    ({ item }) => {
      const isSelected = multiSelect
        ? Array.isArray(selectedValue) && selectedValue.includes(item)
        : item === selectedValue;
      return (
        <TouchableOpacity
          style={[styles.optionRow, isSelected && styles.optionRowSelected]}
          activeOpacity={0.7}
          onPress={() => {
            if (!multiSelect) {
              onClose();
            }
            onSelect(item);
          }}
        >
          <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
            {getLabel(item)}
          </Text>
          {isSelected && (
            <Ionicons name={multiSelect ? "checkbox" : "checkmark"} size={18} color={PRIMARY_GREEN} />
          )}
          {!isSelected && multiSelect && (
            <Ionicons name="square-outline" size={18} color="rgba(10,5,4,0.4)" />
          )}
        </TouchableOpacity>
      );
    },
    [multiSelect, selectedValue, onSelect, onClose, getLabel]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, justifyContent: "flex-end" }}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.sheet, searchable && { maxHeight: "80%" }]}>
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

            {/* Search Input */}
            {searchable && (
              <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={18} color="rgba(10,5,4,0.5)" style={styles.searchIcon} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={searchPlaceholder}
                  placeholderTextColor="rgba(10,5,4,0.4)"
                  style={styles.searchInput}
                  autoCapitalize="none"
                  clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 && Platform.OS !== "ios" && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={18} color="rgba(10,5,4,0.4)" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Options list */}
            <FlatList
              data={filteredOptions}
              keyExtractor={(item, idx) => `${item}-${idx}`}
              renderItem={renderItem}
              initialNumToRender={15}
              maxToRenderPerBatch={20}
              windowSize={5}
              removeClippedSubviews={Platform.OS === "android"}
              ListEmptyComponent={
                searchable ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No results found</Text>
                  </View>
                ) : null
              }
              style={styles.list}
              contentContainerStyle={{ paddingBottom: Platform.OS === "android" ? 48 : 28 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
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
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 0,
    paddingBottom: Platform.OS === "android" ? 20 : 10,
    marginTop: "auto",
    width: "100%",
    maxHeight: "75%",
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f3",
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 6,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: "rgba(10,5,4,0.1)",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#0a0504",
    height: "100%",
    paddingVertical: 0,
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "rgba(10,5,4,0.4)",
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
