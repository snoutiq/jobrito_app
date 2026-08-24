import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Pressable,
  FlatList,
  StyleSheet,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const scale = SCREEN_WIDTH / 390;
const normalize = (size) => Math.round(scale * size);

const PRIMARY_GREEN = "#047857";

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
  const insets = useSafeAreaInsets();

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
            <Ionicons name={multiSelect ? "checkbox" : "checkmark"} size={normalize(18)} color={PRIMARY_GREEN} />
          )}
          {!isSelected && multiSelect && (
            <Ionicons name="square-outline" size={normalize(18)} color="rgba(10,5,4,0.4)" />
          )}
        </TouchableOpacity>
      );
    },
    [multiSelect, selectedValue, onSelect, onClose, getLabel]
  );

  // Dynamic bottom inset to clear Android software navigation buttons (Back, Home, Recents)
  const androidBottomGap = Math.max(insets.bottom, normalize(40)) + normalize(20);
  const bottomSheetPadding = Platform.OS === "android" ? androidBottomGap : Math.max(insets.bottom, normalize(14));

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
          <Pressable
            style={[
              styles.sheet,
              { maxHeight: searchable ? "75%" : "70%", paddingBottom: bottomSheetPadding },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
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
                      <Ionicons name="close" size={normalize(20)} color="rgba(10,5,4,0.6)" />
                    )}
                  </TouchableOpacity>
                </View>
              );
            })()}

            {/* Search Input */}
            {searchable && (
              <View style={styles.searchContainer}>
                <Ionicons name="search-outline" size={normalize(16)} color="rgba(10,5,4,0.5)" style={styles.searchIcon} />
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
                    <Ionicons name="close-circle" size={normalize(16)} color="rgba(10,5,4,0.4)" />
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
              contentContainerStyle={{ paddingBottom: normalize(40) }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
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
          size={normalize(16)}
          color="rgba(10,5,4,0.6)"
          style={{ marginRight: normalize(6) }}
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
        size={normalize(16)}
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
    borderTopLeftRadius: normalize(20),
    borderTopRightRadius: normalize(20),
    paddingHorizontal: 0,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -3 },
    elevation: 10,
  },
  handleBar: {
    width: normalize(40),
    height: normalize(4),
    backgroundColor: "rgba(10,5,4,0.15)",
    borderRadius: normalize(2),
    alignSelf: "center",
    marginTop: normalize(10),
    marginBottom: normalize(8),
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(10),
    borderBottomWidth: 1,
    borderBottomColor: "rgba(10,5,4,0.08)",
  },
  sheetTitle: {
    fontSize: normalize(15),
    fontWeight: "700",
    color: "#0a0504",
  },
  closeBtn: {
    padding: normalize(4),
  },
  doneBtn: {
    backgroundColor: PRIMARY_GREEN,
    paddingHorizontal: normalize(12),
    paddingVertical: normalize(4),
    borderRadius: normalize(10),
  },
  doneBtnText: {
    color: "#fff",
    fontSize: normalize(12.5),
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: normalize(10),
    marginHorizontal: normalize(16),
    marginTop: normalize(10),
    marginBottom: normalize(4),
    paddingHorizontal: normalize(10),
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  searchIcon: {
    marginRight: normalize(6),
  },
  searchInput: {
    flex: 1,
    height: normalize(40),
    fontSize: normalize(13),
    color: "#0a0504",
  },
  emptyContainer: {
    padding: normalize(20),
    alignItems: "center",
  },
  emptyText: {
    fontSize: normalize(13),
    color: "rgba(10,5,4,0.5)",
  },
  list: {
    paddingHorizontal: normalize(6),
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: normalize(12),
    paddingHorizontal: normalize(14),
    borderRadius: normalize(8),
    marginVertical: normalize(2),
  },
  optionRowSelected: {
    backgroundColor: "#ecfdf5",
  },
  optionText: {
    fontSize: normalize(13.5),
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
    borderRadius: normalize(10),
    height: normalize(44),
    paddingHorizontal: normalize(12),
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
    fontSize: normalize(12.5),
    color: "#0a0504",
    flex: 1,
  },
});
