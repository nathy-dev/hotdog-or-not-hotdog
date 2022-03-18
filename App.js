import React, { Component } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image
} from 'react-native'
import { Header, Icon, Button } from 'react-native-elements'
import * as Permissions from 'expo-permissions'
import * as ImagePicker from 'expo-image-picker'
import uuid from 'uuid'
import UploadingOverlay from './components/UploadingOverlay'
import GOOGLE_VISION_API_KEY from './config/Api'
import FIREBASE_CONFIG from './config/Firebase'
import { getApps, initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const API_KEY = GOOGLE_VISION_API_KEY;

if (!getApps().length) {
  initializeApp(FIREBASE_CONFIG);
}

async function uploadImageAsync(uri) {
  // Why are we using XMLHttpRequest? See:
  // https://github.com/expo/expo/issues/2402#issuecomment-443726662
  const blob = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function () {
      resolve(xhr.response);
    };
    xhr.onerror = function (e) {
      console.log(e);
      reject(new TypeError("Network request failed"));
    };
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });

  const fileRef = ref(getStorage(), uuid.v4());
  const result = await uploadBytes(fileRef, blob);

  // We're done with the blob, close and release it
  blob.close();

  return await getDownloadURL(fileRef);
}
class App extends Component {
  state = {
    hasGrantedCameraPermission: false,
    hasGrantedCameraRollPermission: false,
    image: null,
    uploading: false,
    googleResponse: false
  }

  async componentDidMount() {
    this.cameraRollAccess()
    this.cameraAccess()
  }

  cameraRollAccess = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL)
    if (status === 'granted') {
      this.setState({ hasGrantedCameraRollPermission: true })
    }
  }

  cameraAccess = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA)
    if (status === 'granted') {
      this.setState({ hasGrantedCameraPermission: true })
    }
  }


  takePhoto = async () => {
    let pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
    });

    this.handleImagePicked(pickerResult);
  };

  pickImage = async () => {
    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [4, 3],
    });

    console.log({ pickerResult });

    this.handleImagePicked(pickerResult);
  };

  handleImagePicked = async (pickerResult) => {
    try {
      this.setState({ uploading: true });

      if (!pickerResult.cancelled) {
        const uploadUrl = await uploadImageAsync(pickerResult.uri);
        this.setState({ image: uploadUrl });
      }
    } catch (e) {
      console.log(e);
      alert("Upload failed, sorry :(");
    } finally {
      this.setState({ uploading: false });
    }
  };

  submitToGoogle = async () => {
    try {
      this.setState({ uploading: true })
      let { image } = this.state
      let body = JSON.stringify({
        requests: [
          {
            features: [{ type: 'LABEL_DETECTION', maxResults: 7 }],
            image: {
              source: {
                imageUri: image
              }
            }
          }
        ]
      })
      let response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          method: 'POST',
          body: body
        }
      )
      let responseJson = await response.json()
      const getLabel = responseJson.responses[0].labelAnnotations.map(
        obj => obj.description
      )

      let result =
        getLabel.includes('Hot dog') ||
        getLabel.includes('hot dog') ||
        getLabel.includes('Hot dog bun')

      this.setState({
        googleResponse: result,
        uploading: false
      })
    } catch (error) {
      console.log(error)
    }
  }

  renderImage = () => {
    let { image, googleResponse } = this.state
    if (!image) {
      return (
        <View style={styles.renderImageContainer}>
          <Button
            buttonStyle={styles.button}
            onPress={() => this.submitToGoogle()}
            title='Check'
            titleStyle={styles.buttonTitle}
            disabled
          />
          <View style={styles.imageContainer}>
            <Text style={styles.title}>
              Our state of the art AI will confirm if hot dog
            </Text>
            <Text style={styles.hotdogEmoji}>🌭</Text>
          </View>
        </View>
      )
    }

    return (
      <View style={styles.renderImageContainer}>
        <Button
          buttonStyle={styles.button}
          onPress={() => this.submitToGoogle()}
          title='Check'
          titleStyle={styles.buttonTitle}
        />

        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.imageDisplay} />
        </View>

        {googleResponse ? (
          <Text style={styles.hotdogEmoji}>🌭 HOTDOG ALERT 🌭</Text>
        ) : (
          <Text style={styles.hotdogEmoji}>❌ NOT HOTDOG ❌</Text>
        )}
      </View>
    )
  }

  render() {
    const {
      hasGrantedCameraPermission,
      hasGrantedCameraRollPermission,
      uploading
    } = this.state

    if (
      hasGrantedCameraPermission === false &&
      hasGrantedCameraRollPermission === false
    ) {
      return (
        <View style={{ flex: 1, marginTop: 100 }}>
          <Text>No access to Camera or Gallery!</Text>
        </View>
      )
    } else {
      return (
        <View style={styles.container}>
          <Header
            statusBarProps={{ barStyle: 'light-content' }}
            backgroundColor='#55bcc9'
            leftComponent={
              <TouchableOpacity onPress={this.pickImage}>
                <Icon name='photo-album' color='#fff' />
              </TouchableOpacity>
            }
            centerComponent={{
              text: 'Hot Dog or Not Hot Dog?',
              style: styles.headerCenter
            }}
            rightComponent={
              <TouchableOpacity onPress={this.takePhoto}>
                <Icon name='camera-alt' color='#fff' />
              </TouchableOpacity>
            }
          />
          {this.renderImage()}
          {uploading ? <UploadingOverlay /> : null}
        </View>
      )
    }
  }
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffc266'
  },
  headerCenter: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  renderImageContainer: {
    marginTop: 20,
    alignItems: 'center'
  },
  button: {
    backgroundColor: '#ff9900',
    borderRadius: 10,
    width: 150,
    height: 50
  },
  buttonTitle: {
    fontWeight: '600'
  },
  imageContainer: {
    margin: 25,
    alignItems: 'center'
  },
  imageDisplay: {
    width: 300,
    height: 300
  },
  title: {
    fontSize: 36
  },
  hotdogEmoji: {
    marginTop: 20,
    fontSize: 90
  }
})

export default App