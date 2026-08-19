import { useState, useEffect, useRef, useCallback } from "react";
import { Keyboard, Platform, findNodeHandle, Dimensions, UIManager } from "react-native";

/**
 * Reusable hook for smooth, reliable keyboard-aware scrolling using React Native core UIManager APIs.
 *
 * @param {Object} [options]
 * @param {number} [options.extraOffset=40] - Extra offset padding above keyboard for focused input.
 * @returns {Object} { scrollViewRef, handleInputFocus, keyboardHeight, isKeyboardVisible }
 */
export function useKeyboardAwareScroll(options = {}) {
  const { extraOffset = 40 } = options;
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

      const scrollViewNode = findNodeHandle(scrollViewRef.current);
      if (!scrollViewNode) return;

      setTimeout(() => {
        try {
          if (UIManager && typeof UIManager.measureLayout === "function") {
            UIManager.measureLayout(
              targetNode,
              scrollViewNode,
              () => {
                // Fallback measureInWindow if measureLayout fails
                if (UIManager && typeof UIManager.measureInWindow === "function") {
                  UIManager.measureInWindow(targetNode, (_x, y, _w, h) => {
                    if (scrollViewRef.current) {
                      const windowHeight = Dimensions.get("window").height;
                      const targetBottom = y + h;
                      const keyboardH = keyboardHeight || 280;
                      const visibleScreenHeight = windowHeight - keyboardH;
                      if (targetBottom > visibleScreenHeight - extraOffset) {
                        const scrollAmount = targetBottom - visibleScreenHeight + extraOffset + 60;
                        scrollViewRef.current.scrollTo({ y: scrollAmount, animated: true });
                      }
                    }
                  });
                }
              },
              (_left, top, _width, _height) => {
                if (scrollViewRef.current) {
                  // Smoothly scroll the focused input into clear view above keyboard
                  const scrollY = Math.max(0, top - extraOffset);
                  scrollViewRef.current.scrollTo({ y: scrollY, animated: true });
                }
              }
            );
          }
        } catch (err) {
          // ignore layout measurement errors
        }
      }, 150);
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
