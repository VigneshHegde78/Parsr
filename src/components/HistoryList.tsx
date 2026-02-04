import React, { useEffect, useState } from "react";
import {
	View,
	Text,
	FlatList,
	TouchableOpacity,
	StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const HistoryList = ({ refreshTrigger }: { refreshTrigger: number }) => {
	const [history, setHistory] = useState<any[]>([]);

	// Load data whenever the trigger changes
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

	return (
		<View style={styles.container}>
			<View style={styles.headerRow}>
				<Text style={styles.title}>Spendings</Text>
				<TouchableOpacity onPress={clearHistory}>
					<Text style={{ color: "red" }}>Clear All</Text>
				</TouchableOpacity>
			</View>

			<FlatList
				data={history}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<View style={styles.item}>
						<View>
							<Text style={styles.merchant}>{item.merchant}</Text>
							<Text style={styles.date}>{item.date || "No Date"}</Text>
						</View>
						<Text style={styles.total}>${item.total}</Text>
					</View>
				)}
				ListEmptyComponent={
					<Text style={styles.empty}>No receipts scanned yet.</Text>
				}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#f5f5f5",
		paddingTop: 50,
		paddingHorizontal: 20,
	},
	headerRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 20,
	},
	title: { fontSize: 28, fontWeight: "bold" },
	item: {
		backgroundColor: "white",
		padding: 20,
		borderRadius: 12,
		marginBottom: 10,
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},
	merchant: { fontSize: 16, fontWeight: "bold" },
	date: { color: "gray", fontSize: 12, marginTop: 4 },
	total: { fontSize: 18, color: "green", fontWeight: "bold" },
	empty: { textAlign: "center", marginTop: 50, color: "gray" },
});
