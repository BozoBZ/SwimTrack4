import { View, StyleSheet, Image } from "react-native";
import Button from "@/components/Button";

const PlaceholderImage = require("@/assets/images/LogoSportProNew_Transparent.png");

export default function Index() {
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={PlaceholderImage}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      <View style={styles.footerContainer}>
        <Button theme="primary" label="Attendance Calendar" />
        <Button theme="primary" label="Trainings" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff", // White background to match the logo
    alignItems: "center",
  },
  imageContainer: {
    flex: 1,
    paddingTop: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent", // Ensure transparent background
  },
  logo: {
    width: 280,
    height: 280,
    backgroundColor: "transparent",
  },
  footerContainer: {
    flex: 1 / 3,
    alignItems: "center",
  },
});
