# Motion Capture Avatar

A real-time 3D avatar animation system that uses your webcam to capture facial expressions, hand gestures, and body poses, then applies them to a customizable 3D avatar in real-time.

## Features

- **Real-time Face Tracking**: Captures facial expressions and head movements using MediaPipe Face Landmarker
- **Hand Gesture Recognition**: Tracks detailed finger movements and hand poses
- **Body Pose Detection**: Captures arm movements and upper body positioning
- **Custom Avatar Support**: Load your own avatars or any compatible GLB models
- **Drag & Drop**: Easy avatar loading via file drop or URL input
- **Smooth Animation**: Real-time motion smoothing for natural avatar movement

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/motion-capture-avatar.git
cd motion-capture-avatar
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Getting Started

1. **Allow Webcam Access**: When prompted, allow the application to access your webcam
2. **Wait for Loading**: The app will load MediaPipe models (this may take a moment on first load)
3. **See Your Avatar**: Once loaded, you'll see the default avatar mimicking your movements

### Loading Custom Avatars

#### Option 1: Ready Player Me
1. Visit [Ready Player Me](https://readyplayer.me/avatar?utm_campaign=youtube-studio-playlist&utm_source=youtube&utm_medium=social&id=68520217a076f9bd65682429)
2. Create your custom avatar
3. Copy the GLB URL (make sure to include `?morphTargets=ARKit&textureAtlas=1024`)
4. Paste the URL into the input field in the app

#### Option 2: File Upload
1. Download a GLB file to your computer
2. Drag and drop the file onto the dropzone in the app
3. The avatar will load automatically

#### Option 3: Direct URL
- Paste any compatible GLB model URL into the input field

### Avatar Requirements

For best results, your GLB model should have:
- **ARKit Blendshapes**: For facial expression mapping
- **Standard Bone Names**: The app expects specific bone naming conventions:
  - Head, Neck, Spine2
  - LeftShoulder, LeftArm, LeftForeArm, LeftHand
  - RightShoulder, RightArm, RightForeArm, RightHand
  - Individual finger bones (LeftHandThumb1, LeftHandIndex1, etc.)

## Customization

### Adjusting Motion Sensitivity

In `src/App.tsx`, modify the `smoothingFactor` constant (line 8):
```typescript
const smoothingFactor = 0.3; // Lower = more responsive, Higher = smoother
```

### Modifying Bone Mappings

If your avatar uses different bone names, update the `boneRefs` object in the Avatar component (around line 85):
```typescript
const boneRefs: { [key: string]: React.MutableRefObject<THREE.Bone | undefined> } = {
  Head: headRef, 
  Neck: neckRef,
  // Add your custom bone names here
};
```

### Camera Position

Adjust the 3D camera in the Canvas component (line 475):
```typescript
camera={{
  fov: 25,
  position: [0, 0, 9] // [x, y, z] coordinates
}}
```

## Project Structure

```
src/
├── App.tsx          # Main application component
├── App.css          # Application styles and theming
├── index.tsx        # React entry point
├── index.css        # Global styles
└── react-app-env.d.ts  # TypeScript definitions
```

## API Reference

### Key Components

#### `Avatar`
The main 3D avatar component that handles:
- GLB model loading
- Bone mapping and animation
- Motion data application

#### `App`
The root component managing:
- MediaPipe initialization
- Webcam stream handling
- Motion detection loop
- UI state management

### Key Functions

#### `setupMediaPipe()`
Initializes MediaPipe face, hand, and pose landmarkers

#### `predict()`
Main prediction loop that processes webcam frames

#### `rotateFingerSegment()`
Helper function for applying finger rotations

