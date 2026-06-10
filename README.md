# 🚗 Where Did I Park?

A quick and simple app to help you remember where you parked in large parking lots.

## Features

 **One-tap Save** - Save your parking location with one click
 **Live Distance** - Real-time distance indicator showing how far you are from your spot
 **Offline Support** - Works completely offline using browser storage
 **Map Display** - Interactive map showing your location and parking spot
 **Mobile Friendly** - Works great on phones and tablets

## Getting Started

### Prerequisites
- Node.js 16+ and npm

### Installation

```bash
# Navigate to the project directory
cd Where-Did-I-Park

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will open at `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

## How It Works

1. **Allow Location Access** - Grant the app permission to access your location
2. **Save Your Spot** - When you park, click "Save My Spot"
3. **View Distance** - The app shows your distance from the parking spot in real-time
4. **Navigate Back** - Use the map to navigate back to your car
5. **Clear** - Once you've found your car, click "Clear Spot" to reset

## Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Leaflet.js** - Lightweight mapping library
- **Vite** - Fast build tool
- **Browser Geolocation API** - Location tracking
- **LocalStorage** - Offline data persistence

## Offline Capability

This app works completely offline:
- Your parking location is stored in browser LocalStorage
- Maps use OpenStreetMap tiles (cached by browser)
- No server connection required after initial load

## Browser Support

- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Note:** Requires HTTPS or localhost for geolocation API access

## Project Structure

```
src/
├── main.tsx          # Application entry point
├── App.tsx           # Main App component with logic
├── App.css           # Styling
└── index.css         # Global styles

index.html            # HTML template
package.json          # Dependencies
tsconfig.json         # TypeScript config
vite.config.ts        # Vite config
```

## Future Enhancements

-  Photo capture of surroundings
-  Multiple parking locations history
-  Share location with others
-  Time stamp and duration tracking
-  Custom themes

## License

MIT

## Contributing

Feel free to submit issues and enhancement requests!
