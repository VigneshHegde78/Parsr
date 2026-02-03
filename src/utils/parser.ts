type ParsedReceipt = {
	merchant: string | null;
	date: string | null;
	total: string | null;
};

export const parseReceipt = (rawText: string): ParsedReceipt => {
	const lines = rawText
		.split("\n")
		.map((l) => l.trim())
		.filter((l) => l.length > 0);

	// 1. Find Merchant (Heuristic: Usually the very first line)
	// We skip lines that are too short (like noise "---" or "*")
	const merchant = lines.find((l) => l.length > 3) || "Unknown Merchant";

	// 2. Find Date (Regex for MM/DD/YYYY or YYYY-MM-DD)
	// Looks for numbers separated by / or -
	const dateRegex =
		/(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})|(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/;
	const dateMatch = rawText.match(dateRegex);
	const date = dateMatch ? dateMatch[0] : null;

	// 3. Find Total Price
	// Strategy: Look for the word "TOTAL" followed by a number.
	// If "TOTAL" isn't found, look for the highest dollar amount in the text.

	// Regex to find currency-like numbers (e.g., 12.99, $4.50)
	const priceRegex = /[$]?\s?(\d+\.\d{2})/g;

	let foundTotal = null;

	// Priority A: Explicit "Total" line
	const totalLine = lines.find((line) => line.toUpperCase().includes("TOTAL"));
	if (totalLine) {
		const match = totalLine.match(priceRegex);
		if (match) foundTotal = match[0].replace("$", "").trim();
	}

	// Priority B: If no "Total" word, find the largest number in the whole text
	if (!foundTotal) {
		const allPrices = [...rawText.matchAll(priceRegex)].map((m) =>
			parseFloat(m[1])
		);
		if (allPrices.length > 0) {
			const maxPrice = Math.max(...allPrices);
			foundTotal = maxPrice.toFixed(2);
		}
	}

	return {
		merchant,
		date,
		total: foundTotal,
	};
};
