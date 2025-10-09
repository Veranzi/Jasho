## Jashoo Frontend (Flutter)

This is the Flutter frontend for Jashoo. It integrates with the Node/Express backend in `jashoo-backend` and Firebase (your Firebase config is already in the project).

### Prerequisites
- Flutter SDK installed
- Android Studio / Xcode as needed for your platform
- Backend running (see `../jashoo-backend/README.md` or `README_UPDATED.md`)

### Project layout
- Single entrypoint: `lib/main.dart`
- Removed duplicates: `lib/main_integrated.dart`, `pubspec_integrated.yaml`

### Configure backend base URL
Pass the backend base URL at run time using a Dart define:

```bash
flutter run -d chrome \
  --web-renderer html \
  --dart-define=API_BASE_URL=http://localhost:4000
```

Android emulator (backend on host machine):

```bash
flutter run \
  --dart-define=API_BASE_URL=http://10.0.2.2:4000
```

In Dart code, read it as:

```dart
const String kApiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://localhost:4000',
);
```

Use `kApiBaseUrl` when constructing your HTTP client or API service.

### Running
- Web: `flutter run -d chrome --dart-define=API_BASE_URL=...`
- Android: `flutter run --dart-define=API_BASE_URL=...`
- iOS: `flutter run -d ios --dart-define=API_BASE_URL=...`

### Firebase
Ensure platform configs exist:
- Android: `android/app/google-services.json`
- iOS: `ios/Runner/GoogleService-Info.plist`
- Web (if using Firebase Web SDK): add config snippet to `web/index.html`

### Troubleshooting
- CORS on web: enable CORS on backend and allow your frontend origin.
- Android cannot reach `localhost`: use `10.0.2.2` on emulator or your host IP on devices.
- iOS simulator on a Mac can use `http://localhost` if backend is on the same machine; otherwise, use host IP.


