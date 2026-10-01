# CI/CD

`build-apk.yml` is intentionally based on native Gradle instead of EAS.

Why:
- It produces a raw `.apk`.
- It does not require an Expo/EAS account or build token.
- GitHub's Ubuntu runner supplies the Android build environment.
- `expo prebuild` generates the native project from the Expo configuration.
- `assembleRelease` compiles the Android release package.
