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
	TextInput,
	ScrollView,
} from "react-native";
import TextRecognition from "@react-native-ml-kit/text-recognition";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { parseReceipt } from "./src/utils/parser";
import { HistoryList } from "./src/components/HistoryList";
import { MaterialIcons } from "@expo/vector-icons";

export default function App() {
	const [permission, requestPermission] = useCameraPermissions();
	const [photo, setPhoto] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const cameraRef = useRef<CameraView>(null);

	// Navigation State
	const [view, setView] = useState<"CAMERA" | "SPENDS">("SPENDS");
	const [refreshTrigger, setRefreshTrigger] = useState(0);

	// --- NEW: Editable State ---
	const [parsedData, setParsedData] = useState<{
		merchant: string;
		total: string;
		date: string;
		category: string;
	} | null>(null);

	const [paymentMethod, setPaymentMethod] = useState<"UPI" | "Cash" | "Card">(
		"UPI"
	);

	if (!permission) return <View />;
	if (!permission.granted) {
		return (
			<View style={styles.container}>
				<Text style={styles.permTitle}>Access your camera.</Text>
				<MaterialIcons
					name="camera-front"
					size={100}
					color="white"
					style={{ textAlign: "center", margin: 20 }}
				/>
				<Text style={styles.permText}>
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

			// Load data into editable state
			setParsedData({
				merchant: smartData.merchant || "",
				total: smartData.total || "",
				date: smartData.date || "",
				category: smartData.category || "Other",
			});
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const saveToHistory = async () => {
		if (!parsedData) return;

		const newItem = {
			id: Date.now().toString(),
			...parsedData, // Saves the EDITED values
			paymentMethod, // Saves the selected method
			total: parsedData.total || "0.00",
		};

		const existing = await AsyncStorage.getItem("receipts");
		const list = existing ? JSON.parse(existing) : [];
		list.unshift(newItem);
		await AsyncStorage.setItem("receipts", JSON.stringify(list));

		alert("Saved!");
		setPhoto(null);
		setParsedData(null);
		setRefreshTrigger((prev) => prev + 1);
	};

	// --- RENDER CONTENT ---
	const renderContent = () => {
		if (view === "SPENDS") {
			return <HistoryList refreshTrigger={refreshTrigger} />;
		}

		if (photo) {
			return (
				<View style={styles.container}>
					<Image source={{ uri: photo }} style={styles.preview} />

					{/* --- EDITABLE REVIEW SCREEN --- */}
					{parsedData ? (
						<View style={styles.resultContainer}>
							<Text style={styles.header}>✏️ Review & Edit</Text>

							<ScrollView showsVerticalScrollIndicator={false}>
								{/* 1. Merchant Input */}
								<Text style={styles.label}>Merchant</Text>
								<TextInput
									style={styles.input}
									value={parsedData.merchant}
									onChangeText={(text) =>
										setParsedData({ ...parsedData, merchant: text })
									}
								/>

								{/* 2. Total & Date Row */}
								<View style={styles.row}>
									<View style={{ flex: 1, marginRight: 10 }}>
										<Text style={styles.label}>Total ($)</Text>
										<TextInput
											style={[
												styles.input,
												{ color: "green", fontWeight: "bold" },
											]}
											value={parsedData.total}
											keyboardType="numeric"
											onChangeText={(text) =>
												setParsedData({ ...parsedData, total: text })
											}
										/>
									</View>
									<View style={{ flex: 1 }}>
										<Text style={styles.label}>Date</Text>
										<TextInput
											style={styles.input}
											value={parsedData.date}
											onChangeText={(text) =>
												setParsedData({ ...parsedData, date: text })
											}
										/>
									</View>
								</View>

								{/* 3. Category Chips */}
								<Text style={styles.label}>Category</Text>
								<View style={styles.chipContainer}>
									{["Food", "Travel", "Stay", "Shopping", "Other"].map(
										(cat) => (
											<TouchableOpacity
												key={cat}
												onPress={() =>
													setParsedData({ ...parsedData, category: cat })
												}
												style={[
													styles.chip,
													parsedData.category === cat && styles.activeChip,
												]}
											>
												<Text
													style={[
														styles.chipText,
														parsedData.category === cat &&
															styles.activeChipText,
													]}
												>
													{cat}
												</Text>
											</TouchableOpacity>
										)
									)}
								</View>

								{/* 4. Payment Chips */}
								<Text style={styles.label}>Paid Via</Text>
								<View style={styles.chipContainer}>
									{["UPI", "Card", "Cash"].map((method) => (
										<TouchableOpacity
											key={method}
											onPress={() => setPaymentMethod(method as any)}
											style={[
												styles.chip,
												paymentMethod === method && styles.activeChip,
											]}
										>
											<Text
												style={[
													styles.chipText,
													paymentMethod === method && styles.activeChipText,
												]}
											>
												{method}
											</Text>
										</TouchableOpacity>
									))}
								</View>
							</ScrollView>

							{/* Action Buttons */}
							<View style={styles.actionRow}>
								<TouchableOpacity
									style={[styles.actionBtn, { backgroundColor: "red" }]}
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
									<Text style={styles.actionBtnText}>Discard</Text>
								</TouchableOpacity>

								<TouchableOpacity
									style={[styles.actionBtn, { backgroundColor: "green" }]}
									onPress={saveToHistory}
								>
									<MaterialIcons name="save" size={24} color="white" />
									<Text style={styles.actionBtnText}>Save</Text>
								</TouchableOpacity>
							</View>
						</View>
					) : (
						// Loading / Analyze Actions
						<View style={styles.buttonContainer}>
							{loading ? (
								<ActivityIndicator size="large" color="white" />
							) : (
								<>
									<TouchableOpacity
										style={[styles.actionBtn, { backgroundColor: "red" }]}
										onPress={() => setPhoto(null)}
									>
										<MaterialIcons name="repeat" size={24} color="white" />
										<Text style={styles.actionBtnText}>Retake</Text>
									</TouchableOpacity>

									<TouchableOpacity
										style={[styles.actionBtn, { backgroundColor: "#0077b6" }]}
										onPress={analyzeReceipt}
									>
										<MaterialIcons name="compare" size={24} color="white" />
										<Text style={styles.actionBtnText}>Analyze</Text>
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
			<View style={{ flex: 1 }}>{renderContent()}</View>

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

	// Permission Styles
	permTitle: {
		textAlign: "center",
		color: "white",
		marginBottom: 10,
		fontSize: 18,
		fontWeight: "bold",
	},
	permText: { textAlign: "center", color: "white", marginBottom: 10 },

	// Buttons
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
	actionBtn: {
		padding: 10,
		borderRadius: 8,
		flexDirection: "row",
		alignItems: "center",
	},
	actionBtnText: { color: "white", marginLeft: 5 },

	// Result / Edit Card
	resultContainer: {
		position: "absolute",
		top: 40,
		left: 15,
		right: 15,
		bottom: 40,
		backgroundColor: "white",
		borderRadius: 20,
		padding: 20,
		elevation: 5,
	},
	header: {
		fontSize: 20,
		fontWeight: "bold",
		marginBottom: 15,
		color: "black",
		textAlign: "center",
	},
	label: {
		color: "gray",
		fontSize: 12,
		textTransform: "uppercase",
		marginTop: 10,
		marginBottom: 5,
	},
	input: {
		backgroundColor: "#f0f0f0",
		padding: 12,
		borderRadius: 8,
		fontSize: 16,
		borderWidth: 1,
		borderColor: "#ddd",
	},
	row: { flexDirection: "row", justifyContent: "space-between", width: "100%" },
	actionRow: {
		flexDirection: "row",
		justifyContent: "space-around",
		marginTop: 20,
		paddingTop: 10,
		borderTopWidth: 1,
		borderTopColor: "#eee",
	},

	// Chip Styles
	chipContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
		marginTop: 5,
	},
	chip: {
		paddingVertical: 6,
		paddingHorizontal: 12,
		borderRadius: 20,
		backgroundColor: "#eee",
		borderWidth: 1,
		borderColor: "#ddd",
	},
	activeChip: { backgroundColor: "#0077b6", borderColor: "#0077b6" },
	chipText: { color: "black", fontSize: 12 },
	activeChipText: { color: "white", fontWeight: "bold" },

	// Navigation
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
