import { Camera, CameraType } from "expo-camera";
import React, { useRef, useState } from "react";
import { Button, Dimensions, Image, Platform, StyleSheet, TouchableOpacity, View, Text } from "react-native";
import GenericPressableIcon from "./components/GenericPressableIcon";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const phoneScreenWidth = Dimensions.get("window").width;
const phoneScreenHeight = Dimensions.get("screen").height; // CAREFULL THIS IS NOT ACTUALLY THE REAL SCREEN SIZE (but close to it)

function convertRatioToNumber(ratio) {
  // Convert a ratio string to a number, input example : "4:3", output example : 4/3
  const [numerator, denominator] = ratio.split(":").map(Number);
  return numerator / denominator;
}

function extractFirstNumberFromResolution(resolutionString) {
  // extract the first number from a resolution string, input example : "1920x1440", output example : 1920
  const [firstNumber] = resolutionString.split("x").map(Number);
  return firstNumber;
}
export default function App() {
  const [type, setType] = useState(CameraType.back);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const cameraRef = useRef(null);
  const [cameraRatio, setCameraRatio] = useState("4:3");
  const [selectedPictureSize, setSelectedPictureSize] = useState(null);
  const [imageUri, setImageUri] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet, so we need to request them
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "black" }}>
        <Text style={{ textAlign: "center", fontSize: 17, color: "white", marginBottom: 15 }}>
          Nous avons besoin d'accéder à la caméra
        </Text>
        <Button color={"#5C0272"} onPress={requestPermission} title="Autoriser" />
        <Text style={{ textAlign: "center", fontSize: 12, marginTop: 15, maxWidth: "80%" }}>
          Si le bouton ne fonctionne pas, veuillez autoriser l'application à utiliser la caméra dans les réglages de
          votre téléphone
        </Text>
      </View>
    );
  }

  const onCameraReady = async () => {
    console.log("onCameraReady");
    //inspired by https://stackoverflow.com/questions/77827700/oncameraready-function-is-triggered-on-camera-close
    if (Platform.OS === "android") {
      // Get a list of supported ratios for the camera device (specific to each android phone model and camera sensor)
      const cameraRatios = await cameraRef.current?.getSupportedRatiosAsync();

      //find compatible ratios for the camera and chose the one closest to 4:3 (because usually phone camera sensors are 4:3)
      const chosenRatio = findBestCameraRatio(cameraRatios);

      setCameraRatio((prevState) => chosenRatio ?? prevState); // If chosenRatio is null, keep the previous state which is "4:3" by default (note : the expo camera "ratio" prop only accepts strings like "4:3" or "16:9" etc. and not numbers like 4/3 or 16/9, so that why we use a strings)

      //Get a list of available pictures resolutions for the selected ratio, example : ["1920x1440", "2048x1536", "2560x1920", "3264x2448", "4000x3000", "4032x3024"]
      const availablePicturesSizes = await cameraRef.current?.getAvailablePictureSizesAsync(chosenRatio);

      // selected the best resolution of availablePicturesSizes (best resolution = good quality/photo size ratio )
      const bestPhotoResolution = findBestPhotoResolution(availablePicturesSizes);

      setSelectedPictureSize((prevState) => bestPhotoResolution ?? prevState); // LOG  availablePicturesSizes ["1920x1440", "2048x1536", "2560x1920", "3264x2448", "4000x3000", "4032x3024"]

      console.log("cameraRatios", cameraRatios);
      console.log("chosenRatio", chosenRatio);
      console.log("availablePicturesSizes", availablePicturesSizes);
      console.log("chosenPictureResolution", bestPhotoResolution, typeof bestPhotoResolution);

      setIsLoading(false);
    }
  };
  console.log("selected", selectedPictureSize);
  function findBestCameraRatio(cameraRatios) {
    //Chose the ratio closest to 4:3 (because usually phone camera sensors are 4:3)

    // if the cameraRatios array is empty, return null, the code will later chose 4:3 as default
    if (!cameraRatios || cameraRatios.length === 0) {
      return null;
    }
    // Convert each ratio to a number and calculate its difference from 4/3
    const targetRatio = 4 / 3;
    let closestRatio = cameraRatios[0]; // Initialize with the first ratio

    let smallestDifference = Math.abs(convertRatioToNumber(cameraRatios[0]) - targetRatio); // find the difference between the first ratio and 4:3

    cameraRatios.forEach((ratio) => {
      // for each ratio, calculate the difference between it and 4:3
      const [width, height] = ratio.split(":").map(Number);
      const currentRatio = width / height;
      const currentDifference = Math.abs(currentRatio - targetRatio);

      // if the current difference is smaller than the preview smallest difference, update the smallest difference and the closest ratio
      if (currentDifference < smallestDifference) {
        closestRatio = ratio;
        smallestDifference = currentDifference;
      }
    });
    return closestRatio;
  }
  function findBestPhotoResolution(availablePicturesSizes) {
    //Chose the photo resolution who's pixel height is the closest to 1920 but still bigger. This is because SnapChat uses a  1,080 pixels wide by 1,920 pixels tall ratio so we are aiming for that. (Should be a good ratio between picture size and quality)
    // input example :["1920x1440", "2048x1536", "2560x1920", "3264x2448", "4000x3000", "4032x3024"]
    // output : "1920x1440"

    // if the cameraRatios array is empty, return null, the code will later chose 4:3 as default
    if (!availablePicturesSizes || availablePicturesSizes.length === 0) {
      return null;
    }
    // Extrat the first number of each ratio and compare its difference to 1920
    const targetPixelHeight = 1920;
    let closestDifference = availablePicturesSizes[0]; // Initialize with the first ratio

    let smallestDifference = extractFirstNumberFromResolution(availablePicturesSizes[0]) - targetPixelHeight; // find the difference between the first ratio and 4:3

    availablePicturesSizes.forEach((ratio) => {
      // for each ratio, calculate the difference between it and 4:3
      const currentDifference = extractFirstNumberFromResolution(ratio) - targetPixelHeight;

      // if the current difference is smaller than the preview smallest difference, update the smallest difference and the closest ratio
      if (smallestDifference < 0) {
        smallestDifference = currentDifference;
      } else if (currentDifference < smallestDifference && currentDifference >= 0) {
        closestDifference = ratio;
        smallestDifference = currentDifference;
      }
    });
    return closestDifference;
  }
  function toggleCameraType() {
    setType((current) => (current === CameraType.back ? CameraType.front : CameraType.back));
  }

  const takePicture = () => {
    const startIf = Date.now();

    if (cameraRef.current) {
      console.log(" if (cameraRef.curr time:", Date.now() - startIf);

      const takePictureAsync = Date.now();

      cameraRef.current
        ?.takePictureAsync({
          //quality: 1, // Adjust this value (0.0 - 1.0) for picture quality
          //exif: true, // Set to true to include EXIF data (like location) in the picture
          skipProcessing: true, // Set to true to skip processing
          // onPictureSaved: this.onPictureSaved,
        })
        .then((photoData) => {
          console.log(" takePictureAsync time:", Date.now() - takePictureAsync);

          console.log("picture saved", photoData.uri);
          console.log("and exif", photoData.exif);

          setImageUri(photoData.uri);
        });
    }
  };

  // onPictureSaved = ({ uri, width, height, exif, base64 }) => {
  //   // console.log(" if (cameraRef.curr time:", Date.now() - takePictureAsync);

  //   console.log("picture saved", uri);
  //   console.log("and exif", exif);

  //   setImageUri(uri);
  // };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "black" }}>
      {imageUri && (
        <View
          style={[
            styles.imagePreviewAndButtonsContainer,
            {
              width: phoneScreenWidth,
              height: phoneScreenWidth * convertRatioToNumber(cameraRatio),
              top: phoneScreenHeight / 2 - (phoneScreenWidth * convertRatioToNumber(cameraRatio)) / 2,
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
          style={[
            styles.camera,
            { width: phoneScreenWidth, height: phoneScreenWidth * convertRatioToNumber(cameraRatio) },
          ]}
          type={type}
          ratio={cameraRatio}
          ref={cameraRef}
          useCamera2Api={false}
          // autoFocus={Camera.Constants.AutoFocus.off}

          onCameraReady={onCameraReady}
          {...(selectedPictureSize ? { pictureSize: selectedPictureSize } : {})}
        >
          <TouchableOpacity
            onPress={takePicture}
            hitSlop={{ top: 25, bottom: 4, left: 25, right: 25 }}
            style={styles.takePhotoBtn}
            disabled={isLoading ? true : false}
          />
          <TouchableOpacity onPress={toggleCameraType} style={styles.switchCameras}>
            <Image
              source={require("./images/PNG/swtich_cameras.png")} // Replace with the actual path to your logo image
              style={{ width: 50, height: 50 }}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} style={styles.flashButton}>
            {
              <Image
                source={"on" === "on" ? require("./images/PNG/eclat.png") : require("./images/PNG/flash_off.png")}
                style={styles.logoImage}
              />
            }
          </TouchableOpacity>
        </Camera>
      </View>
    </GestureHandlerRootView>
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
    // flex: 1,
    // height: phoneScreenWidth * (4 / 3),
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
  flashButton: {
    position: "absolute",
    bottom: 40,
    left: "10%",
    padding: 7,
    borderRadius: 20,
    backgroundColor: "white",
    borderStyle: "solid",
    alignItems: "center",
    justifyContent: "center",
  },
  logoImage: {
    width: 25, // Adjust as per your logo dimensions
    height: 25, // Adjust as per your logo dimensions
  },
  imagePreviewAndButtonsContainer: {
    position: "absolute",
    // top: 10,
    // flex:1,
    zIndex: 1000,
    backgroundColor: "pink",
    alignContent: "center",
    justifyContent: "flex-end",
  },
  imagePreview: {
    // position: "absolute",
    width: "100%", // Full width of the container
    height: "100%", // Full height of the container
    resizeMode: "cover", // Cover the entire area without stretching
    zIndex: 100,
  },
});
