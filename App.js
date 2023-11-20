import React, { useState, useRef } from "react";
import { StyleSheet, View, Text, TouchableOpacity, Image } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { captureRef } from "react-native-view-shot";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";
export default function App() {
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 0,
    longitude: 0,
  });

  const [capturedImage, setCapturedImage] = useState(null);

  const mapRef = useRef();

  const handleLocationSelect = (event) => {
    const { coordinate } = event.nativeEvent;
    setSelectedLocation({
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
    });
  };

  const handleCapture = async () => {
    try {
      const uri = await captureRef(mapRef, {
        format: "jpg",
        quality: 0.9,
      });

      setCapturedImage(uri);
    } catch (error) {
      console.error("Error capturing map:", error);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      if (!capturedImage) {
        console.warn("Please capture an image first");
        return;
      }

      // Convert the image to base64
      const base64Image = await fetch(capturedImage).then((response) =>
        response.blob()
      );

      const base64ImageString = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(base64Image);
      });

      const htmlContent = `
      <div style="padding: 10%">
      <h1>User Information</h1>
      <p>Username: YourUsername</p>
      <p>Email: YourEmail@example.com</p>
      <p>Phone Number: YourPhoneNumber</p>
      <p>Location: Latitude: ${selectedLocation.latitude}, Longitude: ${selectedLocation.longitude}</p>
      <img style="width: 50vw; height: 50vh" src="${base64ImageString}" />
      </div>
    `;

      let pdfFile = await Print.printAsync({
        html: htmlContent,
        base64: false,
      });
      if (pdfFile) {
        await shareAsync(pdfFile.uri);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onPress={handleLocationSelect}>
        <Marker
          coordinate={{
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          }}
          title="Selected Location"
          description={`Latitude: ${selectedLocation.latitude}, Longitude: ${selectedLocation.longitude}`}
        />
      </MapView>

      <TouchableOpacity style={styles.captureButton} onPress={handleCapture}>
        <Text style={styles.captureButtonText}>Capture Map</Text>
      </TouchableOpacity>

      {capturedImage && (
        <View style={styles.capturedImageContainer}>
          <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
        </View>
      )}

      <TouchableOpacity
        style={styles.generatePDFButton}
        onPress={handleGeneratePDF}>
        <Text style={styles.captureButtonText}>Generate PDF</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  captureButton: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    backgroundColor: "blue",
    padding: 10,
    borderRadius: 8,
  },
  capturedImageContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  capturedImage: {
    width: 200,
    height: 200,
    resizeMode: "cover",
  },
  generatePDFButton: {
    position: "absolute",
    bottom: 80,
    alignSelf: "center",
    backgroundColor: "green",
    padding: 10,
    borderRadius: 8,
  },
  captureButtonText: {
    color: "white",
    fontSize: 16,
  },
});
