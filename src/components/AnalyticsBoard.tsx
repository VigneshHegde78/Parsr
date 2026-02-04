import React from "react";
import { View, Text, Dimensions } from "react-native";
import { PieChart } from "react-native-gifted-charts";

export const AnalyticsBoard = ({ history }: { history: any[] }) => {
	// 1. Calculate Totals per Category
	const categoryTotals: Record<string, number> = {
		Food: 0,
		Travel: 0,
		Stay: 0,
		Shopping: 0,
		Other: 0,
	};

	let grandTotal = 0;

	history.forEach((item) => {
		const price = parseFloat(item.total) || 0;
		const cat = item.category || "Other";

		if (categoryTotals[cat] !== undefined) {
			categoryTotals[cat] += price;
		} else {
			categoryTotals.Other += price;
		}
		grandTotal += price;
	});

	// 2. Prepare Data for Chart
	const pieData = [
		{ value: categoryTotals.Food, color: "#f472b6", text: "Food" }, // Pink
		{ value: categoryTotals.Travel, color: "#60a5fa", text: "Travel" }, // Blue
		{ value: categoryTotals.Stay, color: "#a78bfa", text: "Stay" }, // Purple
		{ value: categoryTotals.Shopping, color: "#34d399", text: "Shop" }, // Green
		{ value: categoryTotals.Other, color: "#9ca3af", text: "Other" }, // Gray
	].filter((d) => d.value > 0); // Hide empty categories

	return (
		<View
			style={{
				backgroundColor: "white",
				borderRadius: 20,
				padding: 20,
				marginBottom: 20,
				elevation: 4,
			}}
		>
			<Text
				style={{
					fontSize: 18,
					fontWeight: "bold",
					marginBottom: 20,
					textAlign: "center",
				}}
			>
				Spending Breakdown
			</Text>

			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-around",
				}}
			>
				{/* THE CHART */}
				<View style={{ alignItems: "center" }}>
					{grandTotal > 0 ? (
						<PieChart
							data={pieData}
							donut
							radius={70}
							innerRadius={50}
							centerLabelComponent={() => (
								<View style={{ alignItems: "center" }}>
									<Text style={{ fontSize: 12, color: "gray" }}>Total</Text>
									<Text style={{ fontSize: 18, fontWeight: "bold" }}>
										${grandTotal.toFixed(0)}
									</Text>
								</View>
							)}
						/>
					) : (
						<View style={{ height: 140, justifyContent: "center" }}>
							<Text style={{ color: "gray" }}>No data yet</Text>
						</View>
					)}
				</View>

				{/* THE LEGEND */}
				<View>
					{pieData.map((item, index) => (
						<View
							key={index}
							style={{
								flexDirection: "row",
								alignItems: "center",
								marginBottom: 8,
							}}
						>
							<View
								style={{
									width: 10,
									height: 10,
									borderRadius: 5,
									backgroundColor: item.color,
									marginRight: 8,
								}}
							/>
							<Text style={{ fontSize: 12, color: "#333", width: 60 }}>
								{item.text}
							</Text>
							<Text style={{ fontSize: 12, fontWeight: "bold" }}>
								${item.value.toFixed(0)}
							</Text>
						</View>
					))}
				</View>
			</View>
		</View>
	);
};
