import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/common/Button';
import COLORS from '../../constants/colors';
import { recognizeFood } from '../../services/mlService';
import Loading from '../../components/common/Loading';

const ScanFoodScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef(null);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setCapturedImage(photo.uri);
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture');
      }
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const selectedImage = result.assets[0];
        setCapturedImage(selectedImage.uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const processImage = async () => {
  setIsProcessing(true);
  
  try {
    console.log('🔍 Calling ML service...');
    const response = await recognizeFood(capturedImage);
    
    console.log('✅ ML Response:', response);
    
    // Check if we got valid data
    if (!response || !response.food_name || !response.nutrition) {
      throw new Error('Invalid response from ML service');
    }

    // Navigate to result screen with proper data structure
    navigation.navigate('FoodResult', {
      result: {
        food_name: response.food_name,
        confidence: response.confidence || 0.5,
        source: response.source || 'clarifai',
        alternatives: response.alternatives || [],
        nutrition: {
          calories: response.nutrition.calories || 0,
          protein: response.nutrition.protein || 0,
          carbs: response.nutrition.carbs || 0,
          fats: response.nutrition.fats || 0,
        }
      },
      imageUri: capturedImage
    });
    
  } catch (error) {
    console.error('❌ Recognition error:', error);
    
    Alert.alert(
      'Recognition Failed',
      'Could not recognize the food. Would you like to enter it manually?',
      [
        { 
          text: 'Try Again', 
          onPress: () => setCapturedImage(null) 
        },
        { 
          text: 'Manual Entry', 
          onPress: () => navigation.navigate('Search') 
        }
      ]
    );
  } finally {
    setIsProcessing(false);
  }
};

  // Add loading overlay
  if (isProcessing) {
    return <Loading text="Analyzing food..." />;
  }

  const retake = () => {
    setCapturedImage(null);
  };

  if (!permission) {
    return (
      <View style={styles.centered}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <Ionicons name="camera-off-outline" size={64} color={COLORS.textLight} />
        <Text style={styles.noPermissionText}>Camera permission required</Text>
        <Button
          title="Grant Permission"
          onPress={requestPermission}
          style={styles.settingsButton}
        />
      </View>
    );
  }

  if (capturedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          
          <View style={styles.previewActions}>
            <Button
              title="Retake"
              variant="outline"
              onPress={retake}
              style={styles.actionButton}
            />
            <Button
              title="Analyze Food"
              onPress={processImage}
              loading={isProcessing}
              style={styles.actionButton}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        ref={cameraRef}
      >
        <SafeAreaView style={styles.cameraContent}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="close" size={32} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          <View style={styles.overlay}>
            <View style={styles.focusBox} />
            <Text style={styles.instructionText}>
              Position food in the frame
            </Text>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
              <Ionicons name="images-outline" size={32} color={COLORS.white} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <View style={styles.placeholder} />
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noPermissionText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  settingsButton: {
    marginTop: 16,
  },
  camera: {
    flex: 1,
  },
  cameraContent: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'flex-end',
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusBox: {
    width: 280,
    height: 280,
    borderWidth: 3,
    borderColor: COLORS.white,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  instructionText: {
    marginTop: 24,
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  galleryButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primary,
  },
  placeholder: {
    width: 56,
    height: 56,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  previewImage: {
    flex: 1,
    resizeMode: 'contain',
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: COLORS.white,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 8,
  },
});

export default ScanFoodScreen;
