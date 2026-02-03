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

export default function App() {
	const [permission, requestPermission] = useCameraPermissions();
	const [photo, setPhoto] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const cameraRef = useRef<CameraView>(null);

	// Navigation State
	const [view, setView] = useState<"CAMERA" | "HISTORY">("CAMERA");
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
				<Text style={{ textAlign: "center", color: "white", marginBottom: 10 }}>
					Permission required
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
		if (view === "HISTORY") {
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
								<Button
									title="Discard"
									color="red"
									onPress={() => {
										setPhoto(null);
										setParsedData(null);
									}}
								/>
								{/* CALL SAVE FUNCTION */}
								<Button title="Save" onPress={saveToHistory} />
							</View>
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
									<Button title="Analyze" onPress={analyzeReceipt} />
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
			<View style={styles.tabBar}>
				<TouchableOpacity
					onPress={() => setView("CAMERA")}
					style={styles.tabItem}
				>
					<Text style={[styles.tabText, view === "CAMERA" && styles.activeTab]}>
						📷 Scan
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					onPress={() => setView("HISTORY")}
					style={styles.tabItem}
				>
					<Text
						style={[styles.tabText, view === "HISTORY" && styles.activeTab]}
					>
						📜 History
					</Text>
				</TouchableOpacity>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, backgroundColor: "black" },
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
		flexDirection: "row",
		backgroundColor: "#111",
		paddingBottom: 20,
		paddingTop: 15,
		borderTopWidth: 1,
		borderTopColor: "#333",
	},
	tabItem: { flex: 1, alignItems: "center" },
	tabText: { color: "gray", fontSize: 16, fontWeight: "600" },
	activeTab: { color: "white" },
});
