import './App.css';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    FaceLandmarker, FaceLandmarkerOptions, FilesetResolver, Category, Landmark,
    HandLandmarker, HandLandmarkerOptions, HandLandmarkerResult,
    PoseLandmarker, PoseLandmarkerOptions, PoseLandmarkerResult
} from "@mediapipe/tasks-vision";
import * as THREE from 'three';
import { Color } from 'three';
import { Canvas, useFrame, useGraph } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useDropzone } from 'react-dropzone'; // Ensure correct import

// --- Constants ---
const smoothingFactor = 0.3;

// Options defined globally as constants
const faceOptions: FaceLandmarkerOptions = {
    baseOptions: { modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`, delegate: "GPU" },
    numFaces: 1, runningMode: "VIDEO", outputFaceBlendshapes: true, outputFacialTransformationMatrixes: true,
};
const handOptions: HandLandmarkerOptions = {
    baseOptions: { modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`, delegate: "GPU" },
    numHands: 2, runningMode: "VIDEO"
};
const poseOptions: PoseLandmarkerOptions = {
    baseOptions: { modelAssetPath: `https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task`, delegate: "GPU" },
    numPoses: 1, runningMode: "VIDEO", outputSegmentationMasks: false
};


// --- Helper Functions ---
const vectorFromLandmark = (lm: Landmark): THREE.Vector3 => {
    // Adjustments might be needed based on coordinate systems (e.g., Y/Z inversion)
    return new THREE.Vector3(lm.x, 1 - lm.y, -lm.z); // Example inversion
};

const getWorldQuaternion = (bone: THREE.Bone | undefined): THREE.Quaternion => {
     const worldQuaternion = new THREE.Quaternion();
     bone?.getWorldQuaternion(worldQuaternion);
     return worldQuaternion;
 };

 const rotateFingerSegment = (
    jointRef: React.RefObject<THREE.Bone | undefined>,
    parentRef: React.RefObject<THREE.Bone | undefined>,
    lmFrom: Landmark,
    lmTo: Landmark,
    defaultLocalDir: THREE.Vector3 = new THREE.Vector3(0, 1, 0)
 ) => {
    if (jointRef.current && parentRef.current) {
        const parentWorldInv = new THREE.Quaternion();
        const targetLocalDir = new THREE.Vector3();
        const targetQuaternion = new THREE.Quaternion(); // Quaternion for this specific rotation

        const vFrom = vectorFromLandmark(lmFrom);
        const vTo = vectorFromLandmark(lmTo);

        targetLocalDir.subVectors(vTo, vFrom).normalize();

        parentWorldInv.copy(getWorldQuaternion(parentRef.current)).invert();
        targetLocalDir.applyQuaternion(parentWorldInv);

        targetQuaternion.setFromUnitVectors(defaultLocalDir, targetLocalDir);

        jointRef.current.quaternion.slerp(targetQuaternion, smoothingFactor);
    }
 };


// --- Avatar Component ---
interface AvatarProps {
    url: string;
    faceResult: any;
    handResult: HandLandmarkerResult | null;
    poseResult: PoseLandmarkerResult | null;
}

function Avatar({ url, faceResult, handResult, poseResult }: AvatarProps) {
    const { Euler, Matrix4 } = THREE;

    const gltf = useGLTF(url);
    const scene = gltf.scene;
    const { nodes } = useGraph(scene);
    const avatarRef = useRef<THREE.Group>(null!);

    // --- Bone Refs --- (Ensure names match your GLB model)
    const headRef = useRef<THREE.Bone>();
    const neckRef = useRef<THREE.Bone>();
    const spine2Ref = useRef<THREE.Bone>();
    const leftShoulderRef = useRef<THREE.Bone>();
    const leftUpperArmRef = useRef<THREE.Bone>();
    const leftLowerArmRef = useRef<THREE.Bone>();
    const leftHandRef = useRef<THREE.Bone>();
    const rightShoulderRef = useRef<THREE.Bone>();
    const rightUpperArmRef = useRef<THREE.Bone>();
    const rightLowerArmRef = useRef<THREE.Bone>();
    const rightHandRef = useRef<THREE.Bone>();
    // Left Fingers
    const leftHandThumb1Ref = useRef<THREE.Bone>(); const leftHandThumb2Ref = useRef<THREE.Bone>(); const leftHandThumb3Ref = useRef<THREE.Bone>();
    const leftHandIndex1Ref = useRef<THREE.Bone>(); const leftHandIndex2Ref = useRef<THREE.Bone>(); const leftHandIndex3Ref = useRef<THREE.Bone>(); const leftHandIndex4Ref = useRef<THREE.Bone>();
    const leftHandMiddle1Ref = useRef<THREE.Bone>(); const leftHandMiddle2Ref = useRef<THREE.Bone>(); const leftHandMiddle3Ref = useRef<THREE.Bone>(); const leftHandMiddle4Ref = useRef<THREE.Bone>();
    const leftHandRing1Ref = useRef<THREE.Bone>(); const leftHandRing2Ref = useRef<THREE.Bone>(); const leftHandRing3Ref = useRef<THREE.Bone>(); const leftHandRing4Ref = useRef<THREE.Bone>();
    const leftHandPinky1Ref = useRef<THREE.Bone>(); const leftHandPinky2Ref = useRef<THREE.Bone>(); const leftHandPinky3Ref = useRef<THREE.Bone>(); const leftHandPinky4Ref = useRef<THREE.Bone>();
    // Right Fingers
    const rightHandThumb1Ref = useRef<THREE.Bone>(); const rightHandThumb2Ref = useRef<THREE.Bone>(); const rightHandThumb3Ref = useRef<THREE.Bone>();
    const rightHandIndex1Ref = useRef<THREE.Bone>(); const rightHandIndex2Ref = useRef<THREE.Bone>(); const rightHandIndex3Ref = useRef<THREE.Bone>(); const rightHandIndex4Ref = useRef<THREE.Bone>();
    const rightHandMiddle1Ref = useRef<THREE.Bone>(); const rightHandMiddle2Ref = useRef<THREE.Bone>(); const rightHandMiddle3Ref = useRef<THREE.Bone>(); const rightHandMiddle4Ref = useRef<THREE.Bone>();
    const rightHandRing1Ref = useRef<THREE.Bone>(); const rightHandRing2Ref = useRef<THREE.Bone>(); const rightHandRing3Ref = useRef<THREE.Bone>(); const rightHandRing4Ref = useRef<THREE.Bone>();
    const rightHandPinky1Ref = useRef<THREE.Bone>(); const rightHandPinky2Ref = useRef<THREE.Bone>(); const rightHandPinky3Ref = useRef<THREE.Bone>(); const rightHandPinky4Ref = useRef<THREE.Bone>();

    const headMeshRef = useRef<THREE.SkinnedMesh[]>([]);
    const boneDefaultDirection = useRef(new THREE.Vector3(0, 1, 0)).current; // Adjust if needed

    useEffect(() => {
        headMeshRef.current = [];
        if (nodes.Wolf3D_Head) headMeshRef.current.push(nodes.Wolf3D_Head as THREE.SkinnedMesh);
        if (nodes.Wolf3D_Teeth) headMeshRef.current.push(nodes.Wolf3D_Teeth as THREE.SkinnedMesh);
        if (nodes.Wolf3D_Beard) headMeshRef.current.push(nodes.Wolf3D_Beard as THREE.SkinnedMesh);
        if (nodes.Wolf3D_Avatar) headMeshRef.current.push(nodes.Wolf3D_Avatar as THREE.SkinnedMesh);
        if (nodes.Wolf3D_Head_Custom) headMeshRef.current.push(nodes.Wolf3D_Head_Custom as THREE.SkinnedMesh);
        if (nodes.EyeLeft) headMeshRef.current.push(nodes.EyeLeft as THREE.SkinnedMesh);
        if (nodes.EyeRight) headMeshRef.current.push(nodes.EyeRight as THREE.SkinnedMesh);

        // **VERIFY THESE NAMES AGAINST YOUR ACTUAL MODEL**
        const boneRefs: { [key: string]: React.MutableRefObject<THREE.Bone | undefined> } = {
             Head: headRef, Neck: neckRef, Spine2: spine2Ref,
             LeftShoulder: leftShoulderRef, LeftArm: leftUpperArmRef, LeftForeArm: leftLowerArmRef, LeftHand: leftHandRef,
             RightShoulder: rightShoulderRef, RightArm: rightUpperArmRef, RightForeArm: rightLowerArmRef, RightHand: rightHandRef,
             LeftHandThumb1: leftHandThumb1Ref, LeftHandThumb2: leftHandThumb2Ref, LeftHandThumb3: leftHandThumb3Ref,
             LeftHandIndex1: leftHandIndex1Ref, LeftHandIndex2: leftHandIndex2Ref, LeftHandIndex3: leftHandIndex3Ref, LeftHandIndex4: leftHandIndex4Ref,
             LeftHandMiddle1: leftHandMiddle1Ref, LeftHandMiddle2: leftHandMiddle2Ref, LeftHandMiddle3: leftHandMiddle3Ref, LeftHandMiddle4: leftHandMiddle4Ref,
             LeftHandRing1: leftHandRing1Ref, LeftHandRing2: leftHandRing2Ref, LeftHandRing3: leftHandRing3Ref, LeftHandRing4: leftHandRing4Ref,
             LeftHandPinky1: leftHandPinky1Ref, LeftHandPinky2: leftHandPinky2Ref, LeftHandPinky3: leftHandPinky3Ref, LeftHandPinky4: leftHandPinky4Ref,
              RightHandThumb1: rightHandThumb1Ref, RightHandThumb2: rightHandThumb2Ref, RightHandThumb3: rightHandThumb3Ref,
              RightHandIndex1: rightHandIndex1Ref, RightHandIndex2: rightHandIndex2Ref, RightHandIndex3: rightHandIndex3Ref, RightHandIndex4: rightHandIndex4Ref,
              RightHandMiddle1: rightHandMiddle1Ref, RightHandMiddle2: rightHandMiddle2Ref, RightHandMiddle3: rightHandMiddle3Ref, RightHandMiddle4: rightHandMiddle4Ref,
              RightHandRing1: rightHandRing1Ref, RightHandRing2: rightHandRing2Ref, RightHandRing3: rightHandRing3Ref, RightHandRing4: rightHandRing4Ref,
              RightHandPinky1: rightHandPinky1Ref, RightHandPinky2: rightHandPinky2Ref, RightHandPinky3: rightHandPinky3Ref, RightHandPinky4: rightHandPinky4Ref,
        };

        scene.traverse((object: THREE.Object3D) => {
            if (object instanceof THREE.Bone && boneRefs[object.name]) {
                boneRefs[object.name].current = object;
            }
            if (object instanceof THREE.Mesh) {
                object.castShadow = true;
                object.receiveShadow = true;
            }
        });
        console.log("Assigned Bone Refs:", Object.keys(boneRefs).filter(key => boneRefs[key].current)); // Log assigned refs

    }, [nodes, scene, url]); // Re-run if URL changes

    useFrame((state, delta) => {
        // --- Reusable Vectors/Quaternions ---
        // Declared here to be reused across face/pose/hand logic within the same frame
         const parentWorldInv = new THREE.Quaternion();
         const targetLocalDir = new THREE.Vector3();
         const targetQuaternion = new THREE.Quaternion(); // REUSE this quaternion

        // --- Face Blendshapes and Head Rotation ---
        if (faceResult?.faceBlendshapes?.length > 0 && faceResult.faceBlendshapes[0].categories) {
             const faceBlendshapes = faceResult.faceBlendshapes[0].categories;
              faceBlendshapes.forEach((element: Category) => {
                   headMeshRef.current.forEach((mesh: THREE.SkinnedMesh) => {
                       if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
                           let index = mesh.morphTargetDictionary[element.categoryName];
                           if (index >= 0) {
                               mesh.morphTargetInfluences[index] = THREE.MathUtils.lerp(
                                   mesh.morphTargetInfluences[index], element.score, smoothingFactor * 3
                               );
                            }
                        }
                   });
               });

              if (faceResult?.facialTransformationMatrixes?.length > 0 && faceResult.facialTransformationMatrixes[0].data) {
                  const matrixData = faceResult.facialTransformationMatrixes[0].data;
                  const matrix = new Matrix4().fromArray(matrixData);

                   if (headRef.current) {
                       // Use the *reusable* targetQuaternion from the start of useFrame
                       targetQuaternion.setFromRotationMatrix(matrix);

                       // Optional: Adjust rotation based on coordinate system differences if needed
                       // const adjustment = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
                       // targetQuaternion.multiplyQuaternions(adjustment, targetQuaternion);

                       headRef.current.quaternion.slerp(targetQuaternion, smoothingFactor * 2); // Slerp towards target
                   }
                   // Adjust neck/spine based on head rotation
                   if (neckRef.current && headRef.current) {
                       neckRef.current.rotation.set( headRef.current.rotation.x * 0.3, headRef.current.rotation.y * 0.5, headRef.current.rotation.z * 0.3 );
                   }
                   if (spine2Ref.current && headRef.current) {
                        spine2Ref.current.rotation.set( headRef.current.rotation.x * 0.1, headRef.current.rotation.y * 0.2, headRef.current.rotation.z * 0.1 );
                   }
               }
        }


        // --- Pose Landmarks (Arms) ---
        if (poseResult && poseResult.worldLandmarks && poseResult.worldLandmarks.length > 0) {
             const worldLandmarks = poseResult.worldLandmarks[0];
              const pLeftShoulder = vectorFromLandmark(worldLandmarks[11]);
              const pRightShoulder = vectorFromLandmark(worldLandmarks[12]);
              const pLeftElbow = vectorFromLandmark(worldLandmarks[13]);
              const pRightElbow = vectorFromLandmark(worldLandmarks[14]);
              const pLeftWrist = vectorFromLandmark(worldLandmarks[15]);
              const pRightWrist = vectorFromLandmark(worldLandmarks[16]);

              // Left Arm
              if (leftUpperArmRef.current && leftShoulderRef.current) { // Check shoulder ref exists
                  targetLocalDir.subVectors(pLeftElbow, pLeftShoulder).normalize();
                  parentWorldInv.copy(getWorldQuaternion(leftShoulderRef.current)).invert(); // Parent is shoulder
                  targetLocalDir.applyQuaternion(parentWorldInv);
                  targetQuaternion.setFromUnitVectors(boneDefaultDirection, targetLocalDir); // Reuse targetQuaternion
                  leftUpperArmRef.current.quaternion.slerp(targetQuaternion, smoothingFactor);
              }
              if (leftLowerArmRef.current && leftUpperArmRef.current) {
                  targetLocalDir.subVectors(pLeftWrist, pLeftElbow).normalize();
                  parentWorldInv.copy(getWorldQuaternion(leftUpperArmRef.current)).invert(); // Parent is upper arm
                  targetLocalDir.applyQuaternion(parentWorldInv);
                  targetQuaternion.setFromUnitVectors(boneDefaultDirection, targetLocalDir); // Reuse targetQuaternion
                  leftLowerArmRef.current.quaternion.slerp(targetQuaternion, smoothingFactor);
              }
              // Right Arm
               if (rightUpperArmRef.current && rightShoulderRef.current) { // Check shoulder ref exists
                   targetLocalDir.subVectors(pRightElbow, pRightShoulder).normalize();
                   parentWorldInv.copy(getWorldQuaternion(rightShoulderRef.current)).invert(); // Parent is shoulder
                   targetLocalDir.applyQuaternion(parentWorldInv);
                   targetQuaternion.setFromUnitVectors(boneDefaultDirection, targetLocalDir); // Reuse targetQuaternion
                   rightUpperArmRef.current.quaternion.slerp(targetQuaternion, smoothingFactor);
               }
               if (rightLowerArmRef.current && rightUpperArmRef.current) {
                   targetLocalDir.subVectors(pRightWrist, pRightElbow).normalize();
                   parentWorldInv.copy(getWorldQuaternion(rightUpperArmRef.current)).invert(); // Parent is upper arm
                   targetLocalDir.applyQuaternion(parentWorldInv);
                   targetQuaternion.setFromUnitVectors(boneDefaultDirection, targetLocalDir); // Reuse targetQuaternion
                   rightLowerArmRef.current.quaternion.slerp(targetQuaternion, smoothingFactor);
               }
        }

        // --- Hand Landmarks (Wrist + ALL Fingers) ---
        if (handResult && handResult.worldLandmarks && handResult.worldLandmarks.length > 0) {
            handResult.worldLandmarks.forEach((handLandmarks: Landmark[], index: number) => {
                 if (handResult.handednesses && handResult.handednesses[index] && handResult.handednesses[index][0]) {
                     const handedness = handResult.handednesses[index][0].categoryName;
                     const isLeft = handedness === 'Left';
                     const handRef = isLeft ? leftHandRef : rightHandRef;
                     const lowerArmRef = isLeft ? leftLowerArmRef : rightLowerArmRef;
                     // ... (finger ref assignments remain the same) ...
                     const thumbRefs = isLeft ? [leftHandThumb1Ref, leftHandThumb2Ref, leftHandThumb3Ref] : [rightHandThumb1Ref, rightHandThumb2Ref, rightHandThumb3Ref];
                     const indexRefs = isLeft ? [leftHandIndex1Ref, leftHandIndex2Ref, leftHandIndex3Ref, leftHandIndex4Ref] : [rightHandIndex1Ref, rightHandIndex2Ref, rightHandIndex3Ref, rightHandIndex4Ref];
                     const middleRefs = isLeft ? [leftHandMiddle1Ref, leftHandMiddle2Ref, leftHandMiddle3Ref, leftHandMiddle4Ref] : [rightHandMiddle1Ref, rightHandMiddle2Ref, rightHandMiddle3Ref, rightHandMiddle4Ref];
                     const ringRefs = isLeft ? [leftHandRing1Ref, leftHandRing2Ref, leftHandRing3Ref, leftHandRing4Ref] : [rightHandRing1Ref, rightHandRing2Ref, rightHandRing3Ref, rightHandRing4Ref];
                     const pinkyRefs = isLeft ? [leftHandPinky1Ref, leftHandPinky2Ref, leftHandPinky3Ref, leftHandPinky4Ref] : [rightHandPinky1Ref, rightHandPinky2Ref, rightHandPinky3Ref, rightHandPinky4Ref];


                     // Landmarks
                     const wristLm = handLandmarks[0]; const thumbCMC = handLandmarks[1]; const thumbMCP = handLandmarks[2]; const thumbIP = handLandmarks[3]; const thumbTIP = handLandmarks[4];
                     const indexMCP = handLandmarks[5]; const indexPIP = handLandmarks[6]; const indexDIP = handLandmarks[7]; const indexTIP = handLandmarks[8];
                     const middleMCP = handLandmarks[9]; const middlePIP = handLandmarks[10]; const middleDIP = handLandmarks[11]; const middleTIP = handLandmarks[12];
                     const ringMCP = handLandmarks[13]; const ringPIP = handLandmarks[14]; const ringDIP = handLandmarks[15]; const ringTIP = handLandmarks[16];
                     const pinkyMCP = handLandmarks[17]; const pinkyPIP = handLandmarks[18]; const pinkyDIP = handLandmarks[19]; const pinkyTIP = handLandmarks[20];

                     // --- Hand (Wrist) Rotation ---
                     if (handRef.current && lowerArmRef.current) {
                         targetLocalDir.subVectors(vectorFromLandmark(middleMCP), vectorFromLandmark(wristLm)).normalize();
                         parentWorldInv.copy(getWorldQuaternion(lowerArmRef.current)).invert();
                         targetLocalDir.applyQuaternion(parentWorldInv);
                         targetQuaternion.setFromUnitVectors(boneDefaultDirection, targetLocalDir); // Reuse targetQuaternion
                         handRef.current.quaternion.slerp(targetQuaternion, smoothingFactor);
                     }

                    // --- Finger Rotations --- (Using the helper function)
                    // Thumb
                    rotateFingerSegment(thumbRefs[0], handRef, thumbCMC, thumbMCP, boneDefaultDirection);
                    rotateFingerSegment(thumbRefs[1], thumbRefs[0], thumbMCP, thumbIP, boneDefaultDirection);
                    rotateFingerSegment(thumbRefs[2], thumbRefs[1], thumbIP, thumbTIP, boneDefaultDirection);
                    // Index
                    rotateFingerSegment(indexRefs[0], handRef, indexMCP, indexPIP, boneDefaultDirection);
                    rotateFingerSegment(indexRefs[1], indexRefs[0], indexPIP, indexDIP, boneDefaultDirection);
                    rotateFingerSegment(indexRefs[2], indexRefs[1], indexDIP, indexTIP, boneDefaultDirection);
                    // Middle
                    rotateFingerSegment(middleRefs[0], handRef, middleMCP, middlePIP, boneDefaultDirection);
                    rotateFingerSegment(middleRefs[1], middleRefs[0], middlePIP, middleDIP, boneDefaultDirection);
                    rotateFingerSegment(middleRefs[2], middleRefs[1], middleDIP, middleTIP, boneDefaultDirection);
                    // Ring
                    rotateFingerSegment(ringRefs[0], handRef, ringMCP, ringPIP, boneDefaultDirection);
                    rotateFingerSegment(ringRefs[1], ringRefs[0], ringPIP, ringDIP, boneDefaultDirection);
                    rotateFingerSegment(ringRefs[2], ringRefs[1], ringDIP, ringTIP, boneDefaultDirection);
                    // Pinky
                    rotateFingerSegment(pinkyRefs[0], handRef, pinkyMCP, pinkyPIP, boneDefaultDirection);
                    rotateFingerSegment(pinkyRefs[1], pinkyRefs[0], pinkyPIP, pinkyDIP, boneDefaultDirection);
                    rotateFingerSegment(pinkyRefs[2], pinkyRefs[1], pinkyDIP, pinkyTIP, boneDefaultDirection);
                 }
            });
        }
    });

     useEffect(() => { return () => { /* Cleanup if needed */ }; }, [url]);

    return <primitive ref={avatarRef} object={scene} position={[0, -1.7, 3]} />
}


// --- App Component ---
function App() {
    const [url, setUrl] = useState<string>("https://models.readyplayer.me/6460d95f9ae10f45bffb2864.glb?morphTargets=ARKit&textureAtlas=1024");
    const [faceResult, setFaceResult] = useState<any>(null);
    const [handResult, setHandResult] = useState<HandLandmarkerResult | null>(null);
    const [poseResult, setPoseResult] = useState<PoseLandmarkerResult | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [objectUrl, setObjectUrl] = useState<string | null>(null); // To manage Object URL lifecycle

    const videoRef = useRef<HTMLVideoElement>(null);
    const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
    const handLandmarkerRef = useRef<HandLandmarker | null>(null);
    const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
    const lastVideoTimeRef = useRef<number>(-1);
    const animationFrameIdRef = useRef<number | null>(null);
    const visionRunningRef = useRef<boolean>(false);

    const [theme, setTheme] = useState('light'); // Default theme
    const toggleTheme = () => {
        setTheme(currentTheme => (currentTheme === 'light' ? 'dark' : 'light'));
      };


    // --- Dropzone and Input Handling ---
    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            // Revoke previous object URL if one exists
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
            const newObjectUrl = URL.createObjectURL(file);
            console.log("Loading dropped GLB:", file.name);
            setObjectUrl(newObjectUrl); // Store the object URL for cleanup
            setUrl(newObjectUrl); // Update URL state for Avatar
        }
    }, [objectUrl]); // Depend on objectUrl to revoke the previous one

    // Destructure getInputProps here
    const { getRootProps, getInputProps } = useDropzone({ onDrop, accept: { 'model/gltf-binary': ['.glb'] } });

    const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newUrl = event.target.value;
        if (newUrl && (newUrl.startsWith('http://') || newUrl.startsWith('https://')) && newUrl.endsWith('.glb')) {
            // Revoke previous object URL if switching back to HTTP URL
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
                setObjectUrl(null);
            }
            console.log("Loading URL:", newUrl);
            setUrl(newUrl);
        } else if (!newUrl) {
             // Clear URL if input is empty
             if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
                setObjectUrl(null);
             }
             setUrl(""); // Or a default URL
        } else {
            console.warn("Invalid URL pasted. Please use a valid .glb URL.");
        }
    };

     // --- Webcam and Prediction Loop --- (Define before setupMediaPipe)
     const startWebcam = useCallback(() => { // Use useCallback here
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setError("getUserMedia() is not supported by your browser");
            console.error("getUserMedia not supported");
            setIsLoading(false); // Stop loading if webcam fails early
            return;
        }
        console.log("Starting webcam...");
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
            .then((stream) => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    // Start loop *after* setup is complete and video is playing
                    // The listener logic is moved to setupMediaPipe success path
                    console.log("Webcam stream acquired.");
                } else {
                     console.warn("Video ref not available when stream was acquired.");
                     stream.getTracks().forEach(track => track.stop()); // Stop unused stream
                }
            })
            .catch((err) => {
                console.error("Error accessing webcam:", err);
                setError(`Error accessing webcam: ${err instanceof Error ? err.message : String(err)}`);
                setIsLoading(false); // Stop loading on webcam error
            });
    }, []); // Empty dependency array is fine here


    const predict = useCallback(() => {
        if (!videoRef.current || videoRef.current.readyState < 2 || !visionRunningRef.current) {
            // Don't run if video not ready OR if vision setup isn't complete/running
            animationFrameIdRef.current = requestAnimationFrame(predict);
            return;
        }

        const video = videoRef.current;
        // performance.now() removed as it wasn't used
        const videoTimeMs = video.currentTime * 1000;

        if (videoTimeMs > 0 && videoTimeMs !== lastVideoTimeRef.current) { // Ensure valid time > 0
            lastVideoTimeRef.current = videoTimeMs;

            try { // Add try...catch for robustness in prediction calls
                if (faceLandmarkerRef.current) {
                    const faceResults = faceLandmarkerRef.current.detectForVideo(video, videoTimeMs);
                    setFaceResult(faceResults);
                }
                if (handLandmarkerRef.current) {
                    const handResults = handLandmarkerRef.current.detectForVideo(video, videoTimeMs);
                    setHandResult(handResults);
                }
                if (poseLandmarkerRef.current) {
                    const poseResults = poseLandmarkerRef.current.detectForVideo(video, videoTimeMs);
                    setPoseResult(poseResults);
                }
            } catch (predictionError) {
                 console.error("Error during Mediapipe detection:", predictionError);
                 // Optionally set an error state or stop the loop
            }
        }

        // Continue the loop only if vision is still supposed to be running
        if (visionRunningRef.current) {
             animationFrameIdRef.current = requestAnimationFrame(predict);
        } else {
             animationFrameIdRef.current = null; // Ensure loop stops if visionRunningRef is false
        }
    }, []); // State setters are stable, refs don't need to be dependencies

    const startPredictionLoop = useCallback(() => {
        if (!visionRunningRef.current) {
             console.warn("Attempted to start prediction loop, but vision is not running.");
             return; // Don't start if vision setup failed or was stopped
        }
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
        }
        lastVideoTimeRef.current = -1;
        console.log("Starting prediction loop.");
        predict(); // Start the loop
    }, [predict]); // Depends on predict

    // --- Mediapipe Setup ---
    const setupMediaPipe = useCallback(async () => {
        if (visionRunningRef.current) {
            console.log("Mediapipe setup already running or complete.");
            return;
        }
        visionRunningRef.current = true; // Mark as starting/running
        setError(null);
        setIsLoading(true);
        console.log("Setting up MediaPipe...");

        try {
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );

            console.log("Creating Landmarkers...");
            // Use Promise.all for potentially faster parallel loading
            [faceLandmarkerRef.current, handLandmarkerRef.current, poseLandmarkerRef.current] = await Promise.all([
                 FaceLandmarker.createFromOptions(vision, faceOptions),
                 HandLandmarker.createFromOptions(vision, handOptions),
                 PoseLandmarker.createFromOptions(vision, poseOptions)
            ]);

            console.log("Mediapipe setup complete.");
            startWebcam(); // Start webcam after models are loaded

            // Add listener here, only after setup is successful
             if (videoRef.current) {
                videoRef.current.addEventListener('loadeddata', startPredictionLoop);
                // If video data is *already* loaded, start loop immediately
                if (videoRef.current.readyState >= 2) {
                    startPredictionLoop();
                }
            }

        } catch (err) {
            console.error("Failed to setup MediaPipe:", err);
            setError(`Failed to initialize Mediapipe models: ${err instanceof Error ? err.message : String(err)}`);
            visionRunningRef.current = false; // Mark as not running due to error
        } finally {
            // Only set loading false *after* webcam has also started (or failed)
            // Consider moving setIsLoading(false) to after webcam promise resolves/rejects
             setIsLoading(false); // Simplified: set loading false after setup attempt
        }
    // Add startWebcam and startPredictionLoop as dependencies
    }, [startWebcam, startPredictionLoop]);


    // --- Main Effect Hook ---
    useEffect(() => {
        // Capture video ref current value here for use in cleanup
        const currentVideoNode = videoRef.current;

        setupMediaPipe();

        return () => {
            console.log("Cleaning up App component...");
            visionRunningRef.current = false; // Signal to stop prediction loop

            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
                animationFrameIdRef.current = null;
                console.log("Prediction loop stopped.");
            }

            // Use the captured variable 'currentVideoNode' in cleanup
            if (currentVideoNode) {
                 // Remove listener using the captured node
                 currentVideoNode.removeEventListener('loadeddata', startPredictionLoop);

                 if (currentVideoNode.srcObject) {
                    const stream = currentVideoNode.srcObject as MediaStream;
                    stream.getTracks().forEach(track => track.stop());
                    currentVideoNode.srcObject = null; // Important to release camera
                    console.log("Webcam stream stopped.");
                 }
            }

            faceLandmarkerRef.current?.close();
            handLandmarkerRef.current?.close();
            poseLandmarkerRef.current?.close();
            faceLandmarkerRef.current = null;
            handLandmarkerRef.current = null;
            poseLandmarkerRef.current = null;
            console.log("Mediapipe landmarkers closed.");

             // Revoke object URL if one was created
             if (objectUrl) {
                 URL.revokeObjectURL(objectUrl);
                 console.log("Object URL revoked.");
             }
        };
    // Add objectUrl to dependency array for cleanup logic related to it
    }, [setupMediaPipe, startPredictionLoop, objectUrl]);


    return (
        <div className="App" data-theme={theme}>
    
          {/* ===== LEFT PANEL ===== */}
          <div className="left-panel">
    
            {/* Theme Toggle Button */}
            <button className="theme-toggle" onClick={toggleTheme}>
              Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode
            </button>
    
            {/* Camera Feed Area */}
            <div className="camera-feed">
                  {/* Use the actual video tag for MediaPipe */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', transform: 'scaleX(-1)' }} // Flip horizontally if needed
                  />
                {/* Loading/Error Overlay can go here */}
                {isLoading && <div className="loading-overlay">Loading Models & Webcam...</div>}
                {error && <div className="error-overlay">Error: {error}</div>}
            </div>
    
            {/* Controls Area */}
            <div className="controls">
              {/* URL Display/Input Area */}
               <input
                   type="text"
                   className="url-input"
                   placeholder="Paste .glb URL or drop file below"
                   defaultValue={url.startsWith('blob:') ? '' : url}
                   onChange={handleOnChange}
                   style={{
                       width: '100%', boxSizing: 'border-box', padding: '10px',
                       borderRadius: '8px', border: '1px solid var(--border-color)',
                       backgroundColor: 'var(--control-bg-light)', color: 'var(--control-text-light)'
                   }}
               />
    
               {/* Dropzone Element */}
               <div {...getRootProps()} className="dropzone">
                   <input {...getInputProps()} />
                   <p>Drag & drop your downloaded .glb file here, or click to select</p>
               </div>
               {/* End Dropzone */}
    
            </div>
          </div>
    
          {/* ===== RIGHT PANEL ===== */}
          <div className="right-panel">
              {/* Conditionally render Canvas only when URL is valid */}
              {url ? (
                  // Find this Canvas component
                  <Canvas
                      style={{ width: '100%', height: '100%' }}
                      // --- MODIFY THIS CAMERA PROP ---
                      camera={{
                          fov: 25, // You can experiment with fov later if needed (e.g., 30)
                          position: [0, 0, 9] // Changed from [0, 0.5, 5] - Moves camera back (z=9) and centers vertically (y=0)
                      }}
                      // --- END OF MODIFICATION ---
                      shadows
                  >
                      <ambientLight intensity={0.8} />
                      <directionalLight
                          position={[5, 5, 5]}
                          intensity={1}
                          castShadow
                          shadow-mapSize-width={1024}
                          shadow-mapSize-height={1024}
                      />
                      <directionalLight position={[-5, 5, -5]} intensity={0.3}/>
                      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.7, 0]} receiveShadow>
                          <planeGeometry args={[10, 10]} />
                          <shadowMaterial opacity={0.3} />
                      </mesh>
                      <React.Suspense fallback={null}>
                          <Avatar url={url} faceResult={faceResult} handResult={handResult} poseResult={poseResult} />
                      </React.Suspense>
                  </Canvas>
              ) : (
                  <div style={{ color: 'var(--text-dark)' }}>
                      Drop or paste a .glb model URL to load the avatar.
                  </div>
              )}
          </div>
    
          {/* ===== LOGO ===== */}
          <img
            src="your-logo.png" // Replace with your logo path
            alt="Logo"
            className="logo"
          />
    
        </div>
      );
}

export default App;