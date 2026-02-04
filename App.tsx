import { CameraView, useCameraPermissions } from "expo-camera";
import { useState, useRef } from "react";
import {
	Button,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
	Image,
	ActivityIndicator,
	SafeAreaView,
} from "react-native";
import TextRecognition from "@react-native-ml-kit/text-recognition";
import AsyncStorage from "@react-native-async-storage/async-storage"; // <--- Import this
import { parseReceipt } from "./src/utils/parser";
import { HistoryList } from "./src/components/HistoryList"; // <--- Import this
import { MaterialIcons } from "@expo/vector-icons";

export default function App() {
	const [permission, requestPermission] = useCameraPermissions();
	const [photo, setPhoto] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const cameraRef = useRef<CameraView>(null);

	// Navigation State
	const [view, setView] = useState<"CAMERA" | "SPENDS">("SPENDS");
	const [refreshTrigger, setRefreshTrigger] = useState(0); // To reload history

	const [parsedData, setParsedData] = useState<{
		merchant: string | null;
		total: string | null;
		date: string | null;
	} | null>(null);

	if (!permission) return <View />;
	if (!permission.granted) {
		return (
			<View style={styles.container}>
				<Text
					style={{
						textAlign: "center",
						color: "white",
						marginBottom: 10,
						fontSize: 18,
						fontWeight: "bold",
					}}
				>
					Access your camera.
				</Text>
				<MaterialIcons
					name="camera-front"
					size={100}
					color="white"
					style={{ textAlign: "center", margin: 20 }}
				/>
				<Text style={{ textAlign: "center", color: "white", marginBottom: 10 }}>
					"Parsr" would like to access your camera to scan receipts.
				</Text>
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

	const analyzeReceipt = async () => {
		if (!photo) return;
		setLoading(true);
		try {
			const result = await TextRecognition.recognize(photo);
			const smartData = parseReceipt(result.text);
			setParsedData(smartData);
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	// --- SAVE FUNCTION ---
	const saveToHistory = async () => {
		if (!parsedData) return;

		const newItem = {
			id: Date.now().toString(),
			...parsedData,
			total: parsedData.total || "0.00",
		};

		// 1. Get existing
		const existing = await AsyncStorage.getItem("receipts");
		const list = existing ? JSON.parse(existing) : [];

		// 2. Add new
		list.unshift(newItem); // Add to top

		// 3. Save back
		await AsyncStorage.setItem("receipts", JSON.stringify(list));

		// 4. Reset UI
		alert("Saved!");
		setPhoto(null);
		setParsedData(null);
		setRefreshTrigger((prev) => prev + 1); // Tell HistoryList to reload
	};

	// --- RENDER CONTENT BASED ON TAB ---
	const renderContent = () => {
		if (view === "SPENDS") {
			return <HistoryList refreshTrigger={refreshTrigger} />;
		}

		if (photo) {
			return (
				<View style={styles.container}>
					<Image source={{ uri: photo }} style={styles.preview} />
					{parsedData ? (
						<View style={styles.resultContainer}>
							<Text style={styles.header}>✅ Scanned</Text>
							<View style={styles.card}>
								<Text style={styles.label}>Merchant</Text>
								<Text style={styles.value}>{parsedData.merchant}</Text>
								<View style={styles.row}>
									<Text style={styles.value}>
										{parsedData.date || "No Date"}
									</Text>
									<Text style={[styles.value, { color: "green" }]}>
										${parsedData.total || "0.00"}
									</Text>
								</View>
							</View>
							<View style={styles.actionRow}>
								<TouchableOpacity
									style={{
										backgroundColor: "red",
										padding: 10,
										borderRadius: 8,
										flexDirection: "row",
										alignItems: "center",
									}}
									onPress={() => {
										setPhoto(null);
										setParsedData(null);
									}}
								>
									<MaterialIcons
										name="delete-outline"
										size={24}
										color="white"
									/>
									<Text style={{ color: "white", marginLeft: 5 }}>Discard</Text>
								</TouchableOpacity>

								{/* CALL SAVE FUNCTION */}
								<TouchableOpacity
									style={{
										backgroundColor: "green",
										padding: 10,
										borderRadius: 8,
										flexDirection: "row",
										alignItems: "center",
									}}
									onPress={saveToHistory}
								>
									<MaterialIcons name="save" size={24} color="white" />
									<Text style={{ color: "white", marginLeft: 5 }}>Save</Text>
								</TouchableOpacity>
							</View>
						</View>
					) : (
						<View style={styles.buttonContainer}>
							{loading ? (
								<ActivityIndicator size="large" color="white" />
							) : (
								<>
									<TouchableOpacity
										style={{
											backgroundColor: "red",
											padding: 10,
											borderRadius: 8,
											flexDirection: "row",
											alignItems: "center",
										}}
										onPress={() => setPhoto(null)}
									>
										<MaterialIcons name="repeat" size={24} color="white" />
										<Text style={{ color: "white", marginLeft: 5 }}>
											Retake
										</Text>
									</TouchableOpacity>
									<TouchableOpacity
										style={{
											backgroundColor: "#0077b6",
											padding: 10,
											borderRadius: 8,
											flexDirection: "row",
											alignItems: "center",
										}}
										onPress={analyzeReceipt}
									>
										<MaterialIcons name="compare" size={24} color="white" />
										<Text style={{ color: "white", marginLeft: 5 }}>
											Analyze
										</Text>
									</TouchableOpacity>
								</>
							)}
						</View>
					)}
				</View>
			);
		}

		return (
			<CameraView style={styles.camera} ref={cameraRef}>
				<View style={styles.buttonContainer}>
					<TouchableOpacity style={styles.captureBtn} onPress={takePicture}>
						<View style={styles.captureBtnInner} />
					</TouchableOpacity>
				</View>
			</CameraView>
		);
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
			{/* MAIN CONTENT AREA */}
			<View style={{ flex: 1 }}>{renderContent()}</View>

			{/* BOTTOM TAB BAR */}
			{view === "SPENDS" ? (
				<View style={styles.tabBar}>
					<TouchableOpacity
						onPress={() => setView("CAMERA")}
						style={styles.tabItem}
					>
						<MaterialIcons name="document-scanner" size={26} color="white" />
						<Text style={styles.tabText}>Scan</Text>
					</TouchableOpacity>
				</View>
			) : (
				<View style={styles.backButton}>
					<MaterialIcons
						name="arrow-back"
						size={30}
						color="white"
						style={{ margin: 20 }}
						onPress={() => setView("SPENDS")}
					/>
				</View>
			)}
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "black", justifyContent: "center" },
	camera: { flex: 1 },
	preview: { flex: 1, resizeMode: "contain", opacity: 0.6 },
	buttonContainer: {
		flex: 1,
		flexDirection: "row",
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
	card: {
		backgroundColor: "#f9f9f9",
		padding: 20,
		borderRadius: 15,
		marginBottom: 20,
	},
	label: { color: "gray", fontSize: 12, textTransform: "uppercase" },
	value: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
	row: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
	actionRow: { flexDirection: "row", justifyContent: "space-around" },
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

	// NEW STYLES
	tabBar: {
		position: "absolute",
		left: 120,
		right: 120,
		bottom: 10,
		flex: 1,
		width: "auto",
		paddingVertical: 16,
		backgroundColor: "#0077b6",
		padding: 10,
		justifyContent: "space-around",
		alignItems: "center",
		flexDirection: "row",
		borderRadius: 30,
		elevation: 5,
		shadowColor: "black",
		shadowOpacity: 0.3,
		shadowOffset: { width: 0, height: 2 },
		shadowRadius: 4,
	},
	tabItem: {
		flex: 1,
		alignItems: "center",
		flexDirection: "row",
		justifyContent: "center",
		gap: 8,
	},
	tabText: { color: "white", fontSize: 16, fontWeight: "600" },
	backButton: { position: "absolute", top: 40, left: 10 },
});
