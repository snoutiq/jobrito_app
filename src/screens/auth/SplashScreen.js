import React, { useEffect, useRef } from "react";
import { StyleSheet, StatusBar, View, Animated } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";

const videoSource = require("../../assets/JobritoSplashAnimation.mp4");

export default function SplashScreen({ onVideoEnd }) {
  const opacity = useRef(new Animated.Value(0)).current;

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = false;
    p.play();
  });

  useEffect(() => {
    // Listen for playback status — fade in as soon as video starts playing
    const statusSub = player.addListener("statusChange", ({ status }) => {
      if (status === "readyToPlay") {
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    });

    // Listen for video end
    const endSub = player.addListener("playToEnd", () => {
      if (onVideoEnd) {
        onVideoEnd();
      }
    });

    return () => {
      statusSub.remove();
      endSub.remove();
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
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
