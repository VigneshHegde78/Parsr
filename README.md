# Parsr 🧾

**Parsr** is an on-device receipt scanner and personal expense tracker.
It converts physical receipts into structured digital data using on-device machine learning and smart parsing — no internet required.

Snap a photo, and Parsr extracts the merchant name, date, and total amount, categorizes the expense, and visualizes your spending habits.

---

## 📸 Screenshots

| Camera Scan | AI Extraction | Analytics Dashboard |
|------------|---------------|---------------------|
| <img src="assets/screenshots/camera.png" width="200" alt="Camera UI" /> | <img src="assets/screenshots/editor.png" width="200" alt="Editor UI" /> | <img src="assets/screenshots/dashboard.png" width="200" alt="Charts UI" /> |

---

## 🚀 Key Features

- **🧠 On-Device OCR:** Uses Google ML Kit to extract text from receipts entirely offline.
- **⚡ Smart Parsing:** Regex-based logic identifies totals, dates, and merchant names from unstructured text.
- **🏷️ Auto-Categorization:** Assigns categories using merchant keyword matching (e.g., Starbucks → Food).
- **✏️ Review & Edit:** Edit extracted data and add payment methods (UPI, Card, Cash).
- **📊 Visual Analytics:** Donut charts break down spending by category.
- **💾 Local Storage:** Data is stored securely on-device using AsyncStorage.

---

## 🛠️ Tech Stack

- **Framework:** React Native (Expo)
- **Language:** TypeScript
- **ML / OCR:** @react-native-ml-kit/text-recognition
- **Camera:** expo-camera
- **Charts:** react-native-gifted-charts
- **Storage:** @react-native-async-storage/async-storage
- **Icons:** @expo/vector-icons

---

## 🏃‍♂️ Getting Started

### 1️⃣ Clone the repository

```bash
git clone https://github.com/VigneshHegde78/Parsr.git
cd parsr
```

2️⃣ Install dependencies

```bash
npm install
```

3️⃣ Build the native app (Required)

This project uses native ML Kit modules and will not work in Expo Go.

Android
```bash
npx expo run:android
```

iOS (macOS only)
```bash
npx expo run:ios
```

4️⃣ Start the dev client

```bash
npx expo start --dev-client
```

## 🧩 How It Works

- **Capture:** User takes a photo of a receipt.
- **Process:** Image is passed to ML Kit Text Recognizer.
- **Parse:** Extracted text is processed using regex patterns to find dates, totals, and merchant names.
- **Categorize:** Merchant keywords are matched to predefined categories.
- **Visualize:** Structured data is saved and aggregated into analytics dashboards.

## 🔮 Roadmap

- [ ] Cloud sync (Firebase / Supabase)
- [ ] Export reports (PDF / CSV)
- [ ] Budget limits per category

<div align="center"> <p>Built with ❤️ by Vignesh</p> </div>
