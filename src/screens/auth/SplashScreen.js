import React, { useEffect, useState } from "react";
import { StyleSheet, StatusBar, View, Animated } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";

const videoSource = require("../../assets/JobritoSplashAnimation.mp4");

export default function SplashScreen({ onVideoEnd }) {
  const [opacity] = useState(new Animated.Value(0));

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.play();
  });

  useEffect(() => {
    const subscription = player.addListener("playToEnd", () => {
      if (onVideoEnd) {
        onVideoEnd();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [player, onVideoEnd]);

  const handleReadyForDisplay = () => {
    // Fade in the video once it's ready — eliminates white flash & blink
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

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
          onReadyForDisplay={handleReadyForDisplay}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000", // black bg shown while video loads — prevents white flash
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
