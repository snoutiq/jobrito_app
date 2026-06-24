import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import ScreenWrapper from "../../components/common/ScreenWrapper";
import ChefCard from "../../components/cards/ChefCard";
import colors from "../../constants/colors";
import { fetchChefProfiles } from "../../redux/slices/chefSlice";

export default function ChefConnectScreen({ navigation }) {
  const dispatch = useDispatch();
  const { chefs } = useSelector((state) => state.chef);

  useEffect(() => {
    dispatch(fetchChefProfiles());
  }, [dispatch]);

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Text style={styles.title}>ChefConnect Directory</Text>
        <Text style={styles.subtitle}>Discover chef profiles and specialty expertise.</Text>
      </View>

      <View style={{ gap: 12 }}>
        {chefs.map((chef) => (
          <ChefCard
            key={chef.id}
            chef={chef}
            onPress={() => navigation.navigate("ChefProfile", { chef })}
          />
        ))}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.mutedText,
    fontSize: 14,
  },
});
