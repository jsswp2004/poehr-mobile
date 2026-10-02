import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface LogoPlaceholderProps {
  organization?: string;
  size?: number;
}

export const LogoPlaceholder: React.FC<LogoPlaceholderProps> = ({
  organization = "POWER IT",
  size = 120,
}) => {
  const getLogoStyle = () => {
    const org = organization.toLowerCase();

    if (org.includes("hospital") || org.includes("medical center")) {
      return {
        backgroundColor: "#c62828",
        icon: "🏥",
        text: organization,
      };
    } else if (org.includes("clinic") || org.includes("health")) {
      return {
        backgroundColor: "#27ae60",
        icon: "🏥",
        text: organization,
      };
    } else {
      return {
        backgroundColor: "#1976d2",
        icon: "⚡",
        text: "POWER IT",
      };
    }
  };

  const logoStyle = getLogoStyle();

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor: logoStyle.backgroundColor,
        },
      ]}
    >
      <Text style={[styles.icon, { fontSize: size * 0.3 }]}>
        {logoStyle.icon}
      </Text>
      <Text style={[styles.text, { fontSize: size * 0.12 }]} numberOfLines={2}>
        {logoStyle.text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
  },
  icon: {
    color: "white",
    fontWeight: "bold",
    marginBottom: 5,
  },
  text: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    textTransform: "uppercase",
  },
});
