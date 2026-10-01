# Salah Tracker

A minimalist, offline-first Android Salah tracker built with React Native + Expo.

## Features

- Fajr, Dhuhr, Asr, Maghrib and Isha tracking.
- Three normal statuses: Prayed, Delayed, Missed.
- One-tap status cycling.
- Previous/next day navigation.
- Period Mode / Exemption Period.
- Exempt prayers are locked and excluded from analytics.
- Weekly and monthly statistics.
- 100% local storage using AsyncStorage.
- No login, account, cloud sync or internet requirement at runtime.
- GitHub Actions workflow for a release APK.

## Run locally

Install Node.js (LTS), then:

```bash
npm install
npx expo start
```

For a native Android development build:

```bash
npx expo prebuild --platform android
npx expo run:android
```

The repository intentionally does not commit the generated `android/` folder. CI generates it reproducibly with `expo prebuild`.

## Build the release APK locally

```bash
npm install
npx expo prebuild --platform android --non-interactive
cd android
./gradlew assembleRelease
```

On Windows, use:

```powershell
cd android
.\gradlew.bat assembleRelease
```

The APK is normally produced at:

`android/app/build/outputs/apk/release/app-release.apk`

## GitHub Actions APK build

Push to `main` and `.github/workflows/build-apk.yml` will:

1. Install Node dependencies.
2. Run Expo prebuild for Android.
3. Run Gradle `assembleRelease`.
4. Upload the raw APK as a GitHub Actions artifact.
5. Create/update a GitHub Release tagged with the commit SHA and attach the raw APK.

This workflow does not use EAS or an online user account. Expo is used only as the React Native/native project build tool; the final APK is compiled by Gradle on GitHub's Android runner.

## Data model

Each calendar date is stored under one JSON object:

```text
{
  "2026-10-01": {
    "exempt": false,
    "prayers": {
      "fajr": "prayed",
      "dhuhr": "delayed",
      "asr": null,
      "maghrib": "missed",
      "isha": "prayed"
    }
  }
}
```

If `exempt` is true, the five prayer values are ignored by analytics and the UI locks them as Exempt.

## Privacy

There is no login or remote database. Prayer records stay in the device's AsyncStorage. Removing the app can remove its local data depending on Android's app-data handling.
