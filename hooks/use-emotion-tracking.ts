"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// Fixed set of emotions to track
const EMOTIONS = ["happy", "neutral", "surprised", "sad", "angry"] as const;
export type Emotion = (typeof EMOTIONS)[number];
export type EmotionCounts = Record<Emotion, number>;
export type FaceBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export type Status = "idle" | "loading" | "tracking" | "summary";

// CDN URL for pre-trained face-api.js models
const MODEL_URL =
  "https://justadudewhohacks.github.io/face-api.js/models";

// Initial emotion counters (all zeroed)
const initialCounts: EmotionCounts = {
  happy: 0,
  neutral: 0,
  surprised: 0,
  sad: 0,
  angry: 0,
};

export function useEmotionTracking() {
  // Application state: idle → loading → tracking → summary
  const [status, setStatus] = useState<Status>("idle");
  // In-memory aggregated emotion counters
  const [emotionCounts, setEmotionCounts] = useState<EmotionCounts>({
    ...initialCounts,
  });
  // The most recently detected dominant emotion
  const [currentEmotion, setCurrentEmotion] = useState<Emotion | null>(null);
  // Detected face bounding boxes (in percentage relative to video size)
  const [faceBoxes, setFaceBoxes] = useState<FaceBox[]>([]);
  // Error message for user feedback
  const [error, setError] = useState<string | null>(null);

  // Ref for the HTML video element (passed to the page)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Ref to hold the active media stream for cleanup
  const streamRef = useRef<MediaStream | null>(null);
  // Flag to control the detection loop
  const detectingRef = useRef(false);
  // Ref to hold the face-api module after dynamic import
  const faceapiRef = useRef<typeof import("face-api.js") | null>(null);

  /**
   * Runs a single detection pass on the current video frame.
   * Detects all faces and their expressions, then updates counters
   * for each detected face's dominant emotion.
   */
  const runDetection = useCallback(async () => {
    const faceapi = faceapiRef.current;
    const video = videoRef.current;

    // Guard: stop if detection was cancelled or video isn't ready
    if (!detectingRef.current || !faceapi || !video) return;
    if (video.readyState < 2) {
      // Video not ready yet, retry shortly
      setTimeout(runDetection, 200);
      return;
    }

    try {
      // Detect all faces in the frame using TinyFaceDetector (lightweight)
      // and retrieve expression probabilities for each face
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceExpressions();

      const newFaceBoxes: FaceBox[] = [];

      // Process each detected face
      for (const detection of detections) {
        const expressions = detection.expressions;
        const box = detection.detection.box;

        // Calculate relative coordinates (percentages) for responsive UI
        // We use the video's videoWidth/videoHeight, not the element's client size
        // to ensure accuracy regardless of display size if object-fit is handled correctly.
        newFaceBoxes.push({
          x: (box.x / video.videoWidth) * 100,
          y: (box.y / video.videoHeight) * 100,
          width: (box.width / video.videoWidth) * 100,
          height: (box.height / video.videoHeight) * 100,
        });

        // Find the dominant emotion from our fixed set
        let dominant: Emotion = "neutral";
        let maxScore = -1;

        for (const emotion of EMOTIONS) {
          const score = expressions[emotion] ?? 0;
          if (score > maxScore) {
            maxScore = score;
            dominant = emotion;
          }
        }

        // Update current emotion display
        setCurrentEmotion(dominant);

        // Increment the in-memory counter for this emotion
        setEmotionCounts((prev) => ({
          ...prev,
          [dominant]: prev[dominant] + 1,
        }));
      }

      setFaceBoxes(newFaceBoxes);
    } catch {
      // Silently ignore individual frame detection errors
      // (e.g., transient canvas issues)
    }

    // Schedule the next detection pass (~500ms interval to limit CPU usage)
    if (detectingRef.current) {
      setTimeout(runDetection, 500);
    }
  }, []);

  /**
   * Starts the full tracking pipeline:
   * 1. Load face-api.js models
   * 2. Request webcam access
   * 3. Begin detection loop
   */
  const startTracking = useCallback(async () => {
    try {
      setStatus("loading");
      setError(null);
      setEmotionCounts({ ...initialCounts });
      setCurrentEmotion(null);
      setFaceBoxes([]);

      // Dynamically import face-api.js to avoid SSR issues
      const faceapi = await import("face-api.js");
      faceapiRef.current = faceapi;

      // Load only the required models (TinyFaceDetector + ExpressionNet)
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);

      // Request webcam permission from the browser
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;

      // Attach the stream to the video element and start playback
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Activate detection loop
      setStatus("tracking");
      detectingRef.current = true;

      // Small delay to ensure video has actual frames before detecting
      setTimeout(runDetection, 600);
    } catch (err: unknown) {
      // Surface meaningful error messages to the user
      const message =
        err instanceof Error ? err.message : "Failed to start tracking";
      setError(message);
      setStatus("idle");

      // Clean up any partial stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, [runDetection]);

  /**
   * Stops the tracking pipeline:
   * 1. Stop the detection loop
   * 2. Release the webcam stream
   * 3. Transition to summary state
   */
  const stopTracking = useCallback(() => {
    // Stop the detection loop
    detectingRef.current = false;

    // Release all webcam tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear the video element source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Transition to summary view
    setStatus("summary");
  }, []);

  // Cleanup on unmount: ensure webcam is released
  useEffect(() => {
    return () => {
      detectingRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // --- Derived values ---

  // Total number of emotion detections across all faces and frames
  const totalDetections = Object.values(emotionCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  // Percentage distribution of each emotion
  const emotionPercentages: Record<Emotion, number> = {} as Record<
    Emotion,
    number
  >;
  for (const emotion of EMOTIONS) {
    emotionPercentages[emotion] =
      totalDetections > 0
        ? Math.round((emotionCounts[emotion] / totalDetections) * 1000) / 10
        : 0;
  }

  // Overall dominant emotion of the event (highest count)
  const dominantEventEmotion: Emotion | null =
    totalDetections > 0
      ? EMOTIONS.reduce((a, b) =>
        emotionCounts[a] >= emotionCounts[b] ? a : b
      )
      : null;

  return {
    status,
    emotionCounts,
    currentEmotion,
    totalDetections,
    emotionPercentages,
    dominantEventEmotion,
    videoRef,
    faceBoxes,
    startTracking,
    stopTracking,
    error,
    emotions: EMOTIONS,
  };
}
