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
        backgroundColor: "#e74c3c",
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
        backgroundColor: "#3498db",
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
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
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
