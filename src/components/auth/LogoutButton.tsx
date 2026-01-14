import { Pressable, Text, StyleSheet } from "react-native";
import { supabase } from "../../lib/supabase";
import React from "react";
import { router } from "expo-router";

export default function LogoutButton() {
  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/"); // let index guard route from here
  }

  return (
    <Pressable onPress={handleLogout} style={styles.button}>
      <Text style={styles.text}>Log Out</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#EF4444",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  text: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
