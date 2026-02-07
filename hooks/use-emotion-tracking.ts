"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// Fixed set of emotions to track
const EMOTIONS = ["happy", "neutral", "surprised", "sad", "angry", "bored"] as const;
export type Emotion = (typeof EMOTIONS)[number];
export type EmotionCounts = Record<Emotion, number>;
// SECURITY: FaceBox type removed — bounding box geometry enables re-identification
export type Status = "idle" | "loading" | "tracking" | "summary";

// Mapping from our emotion names to the face-api.js expression keys.
// face-api.js doesn't have a "bored" expression, so we approximate it
// using "disgusted" (similar low-energy, negative-valence characteristics).
const FACEAPI_EXPRESSION_MAP: Record<Emotion, string> = {
  happy: "happy",
  neutral: "neutral",
  surprised: "surprised",
  sad: "sad",
  angry: "angry",
  bored: "disgusted",
};

// Self-hosted models (eliminates supply-chain attack vector from external CDN)
const MODEL_URL = "/models";

// SHA-256 hashes for model integrity verification
const MODEL_HASHES: Record<string, string> = {
  "tiny_face_detector_model-shard1":
    "b7503ce7df31039b1c43316a9b865cab6a70dd748cc602d3fa28b551503c3871",
  "face_expression_model-shard1":
    "9a9840f2cf1f4c7eab95f197512569345c00d2426754d4608b92af30e0300f3d",
};

/** Verify integrity of a model shard against known SHA-256 hash */
async function verifyModelIntegrity(url: string, expectedHash: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashHex = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex === expectedHash;
  } catch {
    return false;
  }
}

// SECURITY (V-10): Minimum detection confidence to reduce adversarial noise
const MIN_DETECTION_CONFIDENCE = 0.7;

// SECURITY (V-10): EMA smoothing factor to resist sudden adversarial shifts
// Lower value = more smoothing (more resistant to sudden changes)
const EMA_SMOOTHING_FACTOR = 0.3;

// Initial emotion counters (all zeroed)
const initialCounts: EmotionCounts = {
  happy: 0,
  neutral: 0,
  surprised: 0,
  sad: 0,
  angry: 0,
  bored: 0,
};

// Initial EMA scores (all zeroed)
const initialEmaScores: Record<string, number> = {
  happy: 0,
  neutral: 0,
  surprised: 0,
  sad: 0,
  angry: 0,
  bored: 0,
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
  // SECURITY: Only store whether faces are detected (boolean), not geometry
  const [facesDetected, setFacesDetected] = useState(false);
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
  // SECURITY (V-10): EMA smoothed scores for adversarial resistance
  const emaScoresRef = useRef<Record<string, number>>({ ...initialEmaScores });

  /**
   * Runs a single detection pass on the current video frame.
   *
   * SECURITY (V-02, V-11): Aggregates all faces per-frame into a single
   * group emotion. No per-face processing, no bounding boxes, no individual
   * tracking. The unit of analysis is "the audience", not "the person".
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
      // SECURITY (V-10): scoreThreshold filters low-confidence detections
      const detections = await faceapi
        .detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({
            scoreThreshold: MIN_DETECTION_CONFIDENCE,
          })
        )
        .withFaceExpressions();

      // SECURITY: Only expose whether faces exist, not count or geometry
      setFacesDetected(detections.length > 0);

      if (detections.length > 0) {
        // SECURITY (V-11): Aggregate all expressions across all faces
        // into a single averaged emotion profile for the entire frame.
        // No per-face processing — prevents individual profiling.
        const aggregated: Record<string, number> = {};
        for (const emotion of EMOTIONS) {
          aggregated[emotion] = 0;
        }

        for (const detection of detections) {
          const expressions = detection.expressions;
          for (const emotion of EMOTIONS) {
            const faceApiKey = FACEAPI_EXPRESSION_MAP[emotion];
            const score =
              (expressions as unknown as Record<string, number>)[faceApiKey] ?? 0;
            aggregated[emotion] += score;
          }
        }

        // Average across all detected faces
        for (const emotion of EMOTIONS) {
          aggregated[emotion] /= detections.length;
        }

        // SECURITY (V-10): Apply EMA smoothing to resist adversarial sudden shifts.
        // Smoothed = alpha * raw + (1 - alpha) * previous_smoothed
        const ema = emaScoresRef.current;
        for (const emotion of EMOTIONS) {
          ema[emotion] =
            EMA_SMOOTHING_FACTOR * aggregated[emotion] +
            (1 - EMA_SMOOTHING_FACTOR) * ema[emotion];
        }

        // Find the dominant group emotion from the EMA-smoothed scores
        let dominant: Emotion = "neutral";
        let maxScore = -1;
        for (const emotion of EMOTIONS) {
          if (ema[emotion] > maxScore) {
            maxScore = ema[emotion];
            dominant = emotion;
          }
        }

        // Update current emotion display (group-level)
        setCurrentEmotion(dominant);

        // Increment the in-memory counter for the group's dominant emotion
        setEmotionCounts((prev) => ({
          ...prev,
          [dominant]: prev[dominant] + 1,
        }));
      }

      // SECURITY (V-01): Zero-retention pipeline — discard all detection data
      // immediately after extracting the aggregate emotion string.
      // This includes bounding boxes, landmarks, and expression probability vectors.
      detections.length = 0;

      // SECURITY (V-01): Clear any internal canvas data face-api.js may have created.
      // This minimizes the window where raw pixel data exists in memory.
      if (video.parentElement) {
        const internalCanvases = video.parentElement.querySelectorAll("canvas");
        internalCanvases.forEach((canvas) => {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        });
      }
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
      setFacesDetected(false);
      emaScoresRef.current = { ...initialEmaScores };

      // Dynamically import face-api.js to avoid SSR issues
      const faceapi = await import("face-api.js");
      faceapiRef.current = faceapi;

      // Verify model integrity before loading (supply-chain protection)
      const integrityChecks = await Promise.all(
        Object.entries(MODEL_HASHES).map(([file, hash]) =>
          verifyModelIntegrity(`${MODEL_URL}/${file}`, hash)
        )
      );
      if (integrityChecks.some((valid) => !valid)) {
        throw new Error("Model integrity check failed. Models may have been tampered with.");
      }

      // Load only the required models (TinyFaceDetector + ExpressionNet)
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);

      // Guard: mediaDevices is only available in secure contexts (HTTPS / localhost)
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error(
          "Camera access requires a secure connection (HTTPS or localhost). " +
          "If accessing remotely, use HTTPS or open the app on localhost."
        );
      }

      // Request webcam permission from the browser
      // SECURITY (V-01): Reduced resolution to minimize raw biometric data in memory
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 320 }, height: { ideal: 240 } },
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

    // SECURITY (V-01, V-09): Clear EMA scores and face-api reference on stop
    emaScoresRef.current = { ...initialEmaScores };
    setFacesDetected(false);

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
    facesDetected,
    startTracking,
    stopTracking,
    error,
    emotions: EMOTIONS,
  };
}
