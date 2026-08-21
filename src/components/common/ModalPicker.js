import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
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
 * ModalPicker — iOS/Android safe dropdown picker using a Modal overlay.
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
      <Pressable style={styles.backdropOverlay} onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1, justifyContent: "flex-end", width: "100%" }}
          pointerEvents="box-none"
        >
          <Pressable style={[styles.sheet, searchable && { maxHeight: "80%" }]} onPress={(e) => e.stopPropagation()}>
            <SafeAreaView edges={["bottom"]}>
              {/* Handle bar */}
              <View style={styles.handleBar} />

              {/* Header */}
              {(() => {
                const hasSelected = multiSelect && Array.isArray(selectedValue) && selectedValue.length > 0;
                return (
                  <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>{title}</Text>
                    <TouchableOpacity onPress={onClose} style={[styles.closeBtn, hasSelected && styles.doneBtn]}>
                      {hasSelected ? (
                        <Text style={styles.doneBtnText}>Done</Text>
                      ) : (
                        <Ionicons name="close" size={22} color="rgba(10,5,4,0.6)" />
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })()}

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
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

/**
 * ModalPickerTrigger — the touchable row that opens the ModalPicker.
 */
export function ModalPickerTrigger({
  onPress,
  label,
  placeholder = "Select...",
  disabled = false,
  isOpen = false,
  style,
  leftIcon,
}) {
  return (
    <TouchableOpacity
      style={[
        triggerStyles.container,
        isOpen && triggerStyles.containerOpen,
        disabled && triggerStyles.containerDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
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
  backdropOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 0,
    paddingBottom: Platform.OS === "android" ? 20 : 10,
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
    marginBottom: 8,
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
  doneBtn: {
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  doneBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 42,
    fontSize: 14,
    color: "#0a0504",
  },
  emptyContainer: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "rgba(10,5,4,0.5)",
  },
  list: {
    paddingHorizontal: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginVertical: 2,
  },
  optionRowSelected: {
    backgroundColor: "rgba(21, 62, 105, 0.08)",
  },
  optionText: {
    fontSize: 15,
    color: "#0a0504",
    flex: 1,
  },
  optionTextSelected: {
    fontWeight: "700",
    color: PRIMARY_GREEN,
  },
});

const triggerStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
  },
  containerOpen: {
    borderColor: PRIMARY_GREEN,
    borderWidth: 1.5,
  },
  containerDisabled: {
    backgroundColor: "#f1f5f9",
    borderColor: "#e2e8f0",
    opacity: 0.7,
  },
  text: {
    fontSize: 14,
    color: "#0a0504",
    flex: 1,
  },
});
