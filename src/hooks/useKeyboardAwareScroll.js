import { useState, useEffect, useRef, useCallback } from "react";
import { Keyboard, Platform, findNodeHandle, Dimensions } from "react-native";

/**
 * Reusable hook for smooth, reliable keyboard-aware scrolling using React Native core APIs.
 *
 * @param {Object} [options]
 * @param {number} [options.extraOffset=30] - Extra offset padding above keyboard for focused input.
 * @returns {Object} { scrollViewRef, handleInputFocus, keyboardHeight, isKeyboardVisible }
 */
export function useKeyboardAwareScroll(options = {}) {
  const { extraOffset = 30 } = options;
  const scrollViewRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const onKeyboardShow = (e) => {
      const height = e?.endCoordinates?.height ?? 0;
      setKeyboardHeight(height);
      setIsKeyboardVisible(true);
    };

    const onKeyboardHide = () => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);
    };

    const showSub = Keyboard.addListener(showEvent, onKeyboardShow);
    const hideSub = Keyboard.addListener(hideEvent, onKeyboardHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleInputFocus = useCallback(
    (event) => {
      const targetNode = event?.nativeEvent?.target || (event?.target ? findNodeHandle(event.target) : null);
      if (!targetNode || !scrollViewRef.current) return;

      setTimeout(() => {
        try {
          const scrollViewNode = findNodeHandle(scrollViewRef.current);
          if (!scrollViewNode || !targetNode) return;

          // measureLayout calculates element top position relative to ScrollView content
          targetNode.measureLayout(
            scrollViewNode,
            (_left, top) => {
              if (scrollViewRef.current) {
                const scrollY = Math.max(0, top - extraOffset);
                scrollViewRef.current.scrollTo({ y: scrollY, animated: true });
              }
            },
            () => {
              // Fallback measureInWindow if measureLayout fails
              if (targetNode && typeof targetNode.measureInWindow === "function") {
                targetNode.measureInWindow((_x, y, _w, h) => {
                  const windowHeight = Dimensions.get("window").height;
                  const targetBottom = y + h;
                  const visibleScreenHeight = windowHeight - (keyboardHeight || 300);
                  if (targetBottom > visibleScreenHeight && scrollViewRef.current) {
                    const scrollAmount = targetBottom - visibleScreenHeight + extraOffset;
                    scrollViewRef.current.scrollTo({ y: scrollAmount, animated: true });
                  }
                });
              }
            }
          );
        } catch (err) {
          // ignore layout measurement errors
        }
      }, 120);
    },
    [extraOffset, keyboardHeight]
  );

  return {
    scrollViewRef,
    handleInputFocus,
    keyboardHeight,
    isKeyboardVisible,
  };
}

export default useKeyboardAwareScroll;
