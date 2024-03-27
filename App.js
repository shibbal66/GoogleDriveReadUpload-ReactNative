import React, { useEffect } from "react";
import { StyleSheet, View, Button } from "react-native";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import axios from "axios";
import RNFS from "react-native-fs";

GoogleSignin.configure({
  webClientId: "",
  offlineAccess: true, // This is required to get a refresh token
  scopes: ["https://www.googleapis.com/auth/drive.file"], // Request file-level access
});

export default function App() {
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: "",
      offlineAccess: true,
      scopes: ["https://www.googleapis.com/auth/drive.file"],
    });
  }, []);

  const signInAsync = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      console.log(userInfo);
      // Store the refresh token securely
      const refreshToken = userInfo.refreshToken;
      // Use the refresh token to obtain a new access token when needed
      const newAccessToken = await refreshAccessToken(refreshToken);
      // Use the new access token for subsequent requests
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("User cancelled the login flow");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("Sign in is in progress already");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.log("Play services not available or outdated");
      } else {
        console.log("Something went wrong:", error);
      }
    }
  };

  const uploadFileToGoogleDrive = async (accessToken, filePath) => {
    try {
      const fileInfo = await RNFS.stat(filePath);
      const fileData = await RNFS.readFile(filePath, "base64");

      const response = await axios.post(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
        {
          name: fileInfo.name,
          mimeType: "text/plain",
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json; boundary=foo_bar_baz",
          },
          data: fileData,
        }
      );

      console.log("File uploaded successfully:", response.data);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const readFileFromGoogleDrive = async (accessToken, fileId) => {
    try {
      const response = await axios.get(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          responseType: "text",
        }
      );

      console.log("File content:", response.data);
    } catch (error) {
      console.error("Error reading file:", error);
    }
  };

  const refreshAccessToken = async (refreshToken) => {
    try {
      const response = await axios.post(
        "https://oauth2.googleapis.com/token",
        new URLSearchParams({
          client_id: "YOUR_ACTUAL_CLIENT_ID", // Replace with your actual client ID
          client_secret: "YOUR_ACTUAL_CLIENT_SECRET", // Replace with your actual client secret
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      const newAccessToken = response.data.access_token;
      console.log("New access token:", newAccessToken);
      // Store the new access token and use it for subsequent requests
      return newAccessToken;
    } catch (error) {
      console.error("Error refreshing access token:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Sign in with Google" onPress={signInAsync} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
