import { Camera, CameraType } from "expo-camera";
import React, { useRef, useState } from "react";
import { Dimensions, Image, StyleSheet, TouchableOpacity, View } from "react-native";
import GenericPressableIcon from "./components/GenericPressableIcon";

const phoneScreenWidth = Dimensions.get("window").width;
const phoneScreenHeight = Dimensions.get("screen").height;

export default function App() {
  const [type, setType] = useState(CameraType.back);
  const cameraRef = useRef(null);
  const [cameraRatio, setCameraRatio] = useState("4:3");
  const [imageUri, setImageUri] = useState(null);

  function toggleCameraType() {
    setType((current) => (current === CameraType.back ? CameraType.front : CameraType.back));
  }

  const takePicture = () => {
    if (cameraRef.current) {
      cameraRef.current
        ?.takePictureAsync({
          skipProcessing: true,
        })
        .then((photoData) => {
          setImageUri(photoData.uri);
        });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      {imageUri && (
        <View
          style={[
            styles.imagePreviewAndButtonsContainer,
            {
              width: phoneScreenWidth,
              height: phoneScreenWidth * (4 / 3),
              top: phoneScreenHeight / 2 - (phoneScreenWidth * (4 / 3)) / 2,
            },
          ]}
        >
          <View
            style={{
              width: "100%",
              backgroundColor: "blue",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-evenly",
            }}
          >
            <GenericPressableIcon
              hitSlop={{ top: 25, bottom: 4, left: 25, right: 25 }}
              onPress={() => {
                setImageUri(null);
              }}
              imagePath={require("./images/PNG/camerapreview-redo.png")}
              style={{}}
              tintColor={"white"}
              iconWidth={60}
              iconHeight={60}
            />

            <GenericPressableIcon
              hitSlop={{ top: 25, bottom: 4, left: 25, right: 25 }}
              onPress={() => {}}
              imagePath={require("./images/PNG/camerapreview-validate.png")}
              style={{}}
              tintColor={"white"}
              iconWidth={60}
              iconHeight={60}
            />
          </View>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        </View>
      )}
      <View style={styles.container}>
        <Camera
          autoFocus={false}
          style={[styles.camera, { width: phoneScreenWidth, height: phoneScreenWidth * (4 / 3) }]}
          type={type}
          ratio={cameraRatio}
          ref={cameraRef}
          useCamera2Api={false}
        >
          <TouchableOpacity
            onPress={takePicture}
            hitSlop={{ top: 25, bottom: 4, left: 25, right: 25 }}
            style={styles.takePhotoBtn}
          />
          <TouchableOpacity onPress={toggleCameraType} style={styles.switchCameras}>
            <Image source={require("./images/PNG/swtich_cameras.png")} style={{ width: 50, height: 50 }} />
          </TouchableOpacity>
        </Camera>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "purple",
  },
  camera: {
    zIndex: 1,
  },
  takePhotoBtn: {
    position: "absolute",
    bottom: 20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "white",

    alignSelf: "center",
    borderStyle: "solid",
    borderWidth: 5,
    borderColor: "purple",
  },
  switchCameras: {
    position: "absolute",
    bottom: 40,
    right: "10%",
    padding: 7,
    borderRadius: 20,
    backgroundColor: "white",
    marginLeft: "auto",
    alignSelf: "center",
    borderStyle: "solid",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePreviewAndButtonsContainer: {
    position: "absolute",
    zIndex: 1000,
    backgroundColor: "pink",
    alignContent: "center",
    justifyContent: "flex-end",
  },
  imagePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    zIndex: 100,
  },
});
