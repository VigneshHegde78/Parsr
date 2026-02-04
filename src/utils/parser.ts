type ParsedReceipt = {
	merchant: string;
	date: string | null;
	total: string | null;
	category: "Food" | "Travel" | "Stay" | "Shopping" | "Other"; // <--- NEW
};

export const parseReceipt = (rawText: string): ParsedReceipt => {
	const lines = rawText
		.split("\n")
		.map((l) => l.trim())
		.filter((l) => l.length > 0);
	const textUpper = rawText.toUpperCase();

	// 1. Find Merchant (Simple heuristic)
	const merchant = lines.find((l) => l.length > 3) || "Unknown Merchant";

	// 2. Find Date
	const dateRegex =
		/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})|(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/;
	const dateMatch = rawText.match(dateRegex);
	const date = dateMatch ? dateMatch[0] : null;

	// 3. Find Total
	const priceRegex = /[$]?\s?(\d+\.\d{2})/g;
	let foundTotal = null;

	const totalLine = lines.find((line) => line.toUpperCase().includes("TOTAL"));
	if (totalLine) {
		const match = totalLine.match(priceRegex);
		if (match) foundTotal = match[0].replace("$", "").trim();
	}

	if (!foundTotal) {
		const allPrices = [...rawText.matchAll(priceRegex)].map((m) =>
			parseFloat(m[1])
		);
		if (allPrices.length > 0) {
			foundTotal = Math.max(...allPrices).toFixed(2);
		}
	}

	// 4. GUESS CATEGORY (NEW LOGIC) 🧠
	let category: ParsedReceipt["category"] = "Other";

	if (
		textUpper.match(
			/BURGER|PIZZA|CAFE|COFFEE|STARBUCKS|MCDONALD|KFC|RESTAURANT|DINER/
		)
	) {
		category = "Food";
	} else if (
		textUpper.match(
			/UBER|OLA|LYFT|FUEL|SHELL|PETROL|AIRLINE|FLIGHT|TRAIN|METRO/
		)
	) {
		category = "Travel";
	} else if (textUpper.match(/HOTEL|OYO|AIRBNB|RESORT|ROOM|STAY/)) {
		category = "Stay";
	} else if (textUpper.match(/AMAZON|FLIPKART|ZARA|HM|UNIQLO|MALL|MART/)) {
		category = "Shopping";
	}

	return {
		merchant,
		date,
		total: foundTotal,
		category,
	};
};
