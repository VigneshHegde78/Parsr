import { CameraView, useCameraPermissions } from "expo-camera";
import { useState, useRef } from "react";
import {
	Button,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	Image,
	ScrollView,
	ActivityIndicator,
} from "react-native";
import TextRecognition from "@react-native-ml-kit/text-recognition"; // <--- THE BRAIN

export default function App() {
	const [permission, requestPermission] = useCameraPermissions();
	const [photo, setPhoto] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [extractedText, setExtractedText] = useState(""); // Store the AI result
	const cameraRef = useRef<CameraView>(null);

	if (!permission) return <View />;
	if (!permission.granted) {
		return (
			<View style={styles.container}>
				<Text style={{ textAlign: "center" }}>Permission required</Text>
				<Button onPress={requestPermission} title="Grant Permission" />
			</View>
		);
	}

	const takePicture = async () => {
		if (cameraRef.current) {
			const photoData = await cameraRef.current.takePictureAsync({
				quality: 0.7,
				base64: true,
			});
			setPhoto(photoData?.uri || null);
		}
	};

	// --- THE AI FUNCTION ---
	const analyzeReceipt = async () => {
		if (!photo) return;

		setLoading(true);
		try {
			// 1. Pass the image path to ML Kit
			const result = await TextRecognition.recognize(photo);

			// 2. Save the raw text found
			setExtractedText(result.text);
		} catch (error) {
			console.error(error);
			setExtractedText("Error analyzing receipt.");
		} finally {
			setLoading(false);
		}
	};

	// --- PREVIEW SCREEN ---
	if (photo) {
		return (
			<View style={styles.container}>
				<Image source={{ uri: photo }} style={styles.preview} />

				{/* If we have text, show it. Otherwise show buttons */}
				{extractedText ? (
					<View style={styles.resultContainer}>
						<Text style={styles.header}>Raw AI Output:</Text>
						<ScrollView style={styles.scroll}>
							<Text style={styles.rawText}>{extractedText}</Text>
						</ScrollView>
						<Button
							title="Scan Another"
							onPress={() => {
								setPhoto(null);
								setExtractedText("");
							}}
						/>
					</View>
				) : (
					<View style={styles.buttonContainer}>
						{loading ? (
							<ActivityIndicator size="large" color="white" />
						) : (
							<>
								<Button
									title="Retake"
									color="red"
									onPress={() => setPhoto(null)}
								/>
								{/* Run the AI */}
								<Button title="Analyze Receipt" onPress={analyzeReceipt} />
							</>
						)}
					</View>
				)}
			</View>
		);
	}

	// --- CAMERA SCREEN ---
	return (
		<View style={styles.container}>
			<CameraView style={styles.camera} ref={cameraRef}>
				<View style={styles.buttonContainer}>
					<TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
						<View style={styles.captureBtnInner} />
					</TouchableOpacity>
				</View>
			</CameraView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "black" },
	camera: { flex: 1 },
	preview: { flex: 1, resizeMode: "contain", opacity: 0.6 },
	buttonContainer: {
		flex: 1,
		flexDirection: "row",
		backgroundColor: "transparent",
		margin: 64,
		justifyContent: "space-around",
		alignItems: "flex-end",
	},
	captureBtn: {
		width: 70,
		height: 70,
		borderRadius: 35,
		backgroundColor: "rgba(255,255,255,0.3)",
		justifyContent: "center",
		alignItems: "center",
	},
	captureBtnInner: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: "white",
	},
	resultContainer: {
		position: "absolute",
		top: 50,
		left: 20,
		right: 20,
		bottom: 50,
		backgroundColor: "white",
		borderRadius: 20,
		padding: 20,
		elevation: 5,
	},
	header: {
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 10,
		color: "black",
	},
	scroll: {
		flex: 1,
		marginBottom: 20,
		backgroundColor: "#f0f0f0",
		padding: 10,
		borderRadius: 10,
	},
	rawText: { fontFamily: "monospace", fontSize: 12 },
});
