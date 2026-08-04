import React, { Component, useEffect, useRef } from "react";
import { StyleSheet, StatusBar, View, Animated } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";

const videoSource = require("../../assets/JobritoSplashAnimation.mp4");

class SplashScreenErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn("SplashScreen VideoPlayer error caught:", error?.message);
    if (this.props.onVideoEnd) {
      this.props.onVideoEnd();
    }
  }

  render() {
    if (this.state.hasError) {
      return <View style={styles.container} />;
    }
    return this.props.children;
  }
}

function SplashScreenContent({ onVideoEnd }) {
  const opacity = useRef(new Animated.Value(0)).current;

  const player = useVideoPlayer(videoSource, (p) => {
    try {
      p.loop = false;
      p.play();
    } catch (e) {
      console.warn("Failed to start splash video playback:", e);
    }
  });

  useEffect(() => {
    // Fallback timer (3.5s) in case video fails or gets stuck
    const fallbackTimer = setTimeout(() => {
      if (onVideoEnd) onVideoEnd();
    }, 3500);

    const statusSub = player.addListener("statusChange", ({ status, error }) => {
      if (status === "readyToPlay") {
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
      if (error || status === "error") {
        if (onVideoEnd) onVideoEnd();
      }
    });

    const endSub = player.addListener("playToEnd", () => {
      if (onVideoEnd) {
        onVideoEnd();
      }
    });

    return () => {
      clearTimeout(fallbackTimer);
      statusSub?.remove?.();
      endSub?.remove?.();
    };
  }, [player, onVideoEnd]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Animated.View style={[styles.videoWrapper, { opacity }]}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />
      </Animated.View>
    </View>
  );
}

export default function SplashScreen(props) {
  return (
    <SplashScreenErrorBoundary onVideoEnd={props.onVideoEnd}>
      <SplashScreenContent {...props} />
    </SplashScreenErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#153e69",
  },
  videoWrapper: {
    flex: 1,
  },
  video: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
});
