import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
	Image,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { AnalyticsBoard } from "./AnalyticsBoard"; // <--- Import the chart

export const HistoryList = ({ refreshTrigger }: { refreshTrigger: number }) => {
	const [history, setHistory] = useState<any[]>([]);

	useEffect(() => {
		loadHistory();
	}, [refreshTrigger]);

	const loadHistory = async () => {
		const jsonValue = await AsyncStorage.getItem("receipts");
		if (jsonValue != null) {
			setHistory(JSON.parse(jsonValue));
		}
	};

	const clearHistory = async () => {
		await AsyncStorage.removeItem("receipts");
		setHistory([]);
	};

	// Helper to get Icon based on Category
	const getCategoryIcon = (category: string) => {
		switch (category) {
			case "Food":
				return { name: "restaurant", color: "#f472b6" };
			case "Travel":
				return { name: "directions-car", color: "#60a5fa" };
			case "Stay":
				return { name: "hotel", color: "#a78bfa" };
			case "Shopping":
				return { name: "shopping-bag", color: "#34d399" };
			default:
				return { name: "receipt", color: "#9ca3af" };
		}
	};

	return (
		<View style={styles.container}>
			{/* Header */}
			<View style={styles.headerRow}>
				<Text style={styles.title}>My Expenses</Text>
				<TouchableOpacity onPress={clearHistory}>
					<Text style={{ color: "red", fontWeight: "600" }}>Reset</Text>
				</TouchableOpacity>
			</View>

			<FlatList
				data={history}
				keyExtractor={(item) => item.id}
				// Add the Chart as the "Header" of the list so it scrolls with it
				ListHeaderComponent={history.length>0?<AnalyticsBoard history={history} />:<></>}
				renderItem={({ item }) => {
					const icon = getCategoryIcon(item.category);

					return (
						<View style={styles.card}>
							{/* 1. Icon Box */}
							<View
								style={[styles.iconBox, { backgroundColor: icon.color + "20" }]}
							>
								<MaterialIcons
									name={icon.name as any}
									size={24}
									color={icon.color}
								/>
							</View>

							{/* 2. Main Details */}
							<View style={{ flex: 1, marginLeft: 12 }}>
								<Text style={styles.merchant}>{item.merchant}</Text>
								<Text style={styles.date}>{item.date || "No Date"}</Text>

								{/* Payment Tag */}
								<View style={styles.tagContainer}>
									<View style={styles.tag}>
										<Text style={styles.tagText}>{item.category}</Text>
									</View>
									<View style={[styles.tag, { backgroundColor: "#eee" }]}>
										<Text style={[styles.tagText, { color: "#666" }]}>
											{item.paymentMethod || "Cash"}
										</Text>
									</View>
								</View>
							</View>

							{/* 3. Price */}
							<Text style={styles.total}>${item.total}</Text>
						</View>
					);
				}}
				ListEmptyComponent={
					<View style={{ flex: 1, height: "100%", alignItems: "center", marginTop: 200}}>
						<MaterialCommunityIcons name="receipt-text" size={60} color="#ddd" />
						<Text style={styles.empty}>No receipts scanned yet.</Text>
					</View>
				}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f8f9fa",
		paddingTop: 50,
		paddingHorizontal: 20,
	},
	headerRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 15,
	},
	title: { fontSize: 28, fontWeight: "800", color: "#111" },

	// Card Styles
	card: {
		backgroundColor: "white",
		padding: 16,
		borderRadius: 16,
		marginBottom: 12,
		flexDirection: "row",
		alignItems: "center",
		// Shadow for iOS/Android
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 8,
		elevation: 2,
	},
	iconBox: {
		width: 48,
		height: 48,
		borderRadius: 12,
		justifyContent: "center",
		alignItems: "center",
	},
	merchant: { fontSize: 16, fontWeight: "bold", color: "#333" },
	date: { color: "gray", fontSize: 12, marginBottom: 6 },
	total: { fontSize: 18, color: "black", fontWeight: "bold" },

	// Tag Styles
	tagContainer: { flexDirection: "row", gap: 6 },
	tag: {
		backgroundColor: "#f3f4f6",
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 6,
	},
	tagText: { fontSize: 10, color: "#555", fontWeight: "600" },

	empty: { textAlign: "center", marginTop: 10, color: "gray" },
});
