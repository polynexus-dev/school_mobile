import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet } from "react-native";

// Normalised landmark positions [x, y] in 0-1 space (mimics InsightFace 5-pt + 25-pt mesh layout)
const PTS: [number, number][] = [
  [0.50, 0.03],  // 0  crown
  [0.33, 0.09],  // 1  forehead-L
  [0.67, 0.09],  // 2  forehead-R
  [0.17, 0.21],  // 3  temple-L
  [0.83, 0.21],  // 4  temple-R
  [0.26, 0.31],  // 5  eye-L-outer
  [0.37, 0.29],  // 6  eye-L-centre
  [0.46, 0.32],  // 7  eye-L-inner
  [0.54, 0.32],  // 8  eye-R-inner
  [0.63, 0.29],  // 9  eye-R-centre
  [0.74, 0.31],  // 10 eye-R-outer
  [0.50, 0.42],  // 11 nose-bridge
  [0.50, 0.53],  // 12 nose-tip
  [0.42, 0.56],  // 13 nose-ala-L
  [0.58, 0.56],  // 14 nose-ala-R
  [0.15, 0.52],  // 15 cheek-L
  [0.85, 0.52],  // 16 cheek-R
  [0.35, 0.67],  // 17 mouth-L
  [0.50, 0.70],  // 18 mouth-C
  [0.65, 0.67],  // 19 mouth-R
  [0.21, 0.76],  // 20 jaw-L
  [0.79, 0.76],  // 21 jaw-R
  [0.35, 0.87],  // 22 chin-L
  [0.50, 0.93],  // 23 chin-C
  [0.65, 0.87],  // 24 chin-R
];

const EDGES: [number, number][] = [
  // forehead
  [0, 1], [0, 2], [1, 3], [2, 4],
  // temples -> eyes
  [3, 5], [1, 5], [4, 10], [2, 10],
  // eye line
  [5, 6], [6, 7], [7, 8], [8, 9], [9, 10],
  // eyes -> nose bridge
  [7, 11], [8, 11],
  // nose
  [11, 12], [12, 13], [12, 14],
  // cheeks
  [3, 15], [5, 15], [4, 16], [10, 16],
  // cheek -> mouth
  [15, 17], [16, 19],
  // nose -> mouth
  [13, 17], [14, 19],
  // mouth
  [17, 18], [18, 19],
  // mouth -> jaw
  [15, 20], [17, 20], [16, 21], [19, 21],
  // jaw -> chin
  [20, 22], [21, 24], [22, 23], [23, 24],
  // centre axis
  [0, 11], [12, 18], [18, 23],
];

interface MeshLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

const MeshLine: React.FC<MeshLineProps> = ({ x1, y1, x2, y2, color }) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ang = Math.atan2(dy, dx) * (180 / Math.PI);
  return (
    <View
      style={{
        position: "absolute",
        left: (x1 + x2) / 2 - len / 2,
        top: (y1 + y2) / 2 - 0.5,
        width: len,
        height: 1,
        backgroundColor: color,
        opacity: 0.40,
        transform: [{ rotate: `${ang}deg` }],
      }}
    />
  );
};

interface FaceMeshOverlayProps {
  width: number;
  height: number;
  phase: "aligning" | "countdown" | "captured";
}

export const FaceMeshOverlay: React.FC<FaceMeshOverlayProps> = ({ width, height, phase }) => {
  const pulse = useRef(new Animated.Value(0.55)).current;
  const scan = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let pLoop: Animated.CompositeAnimation | null = null;
    let sLoop: Animated.CompositeAnimation | null = null;

    if (phase === "aligning") {
      pLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 0.85, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.45, duration: 800, useNativeDriver: true }),
        ])
      );
      pLoop.start();
    } else if (phase === "countdown") {
      sLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(scan, { toValue: height * 0.85, duration: 600, useNativeDriver: true }),
          Animated.timing(scan, { toValue: 0, duration: 600, useNativeDriver: true }),
        ])
      );
      sLoop.start();
    }

    return () => {
      pLoop?.stop();
      sLoop?.stop();
    };
  }, [phase, height, pulse, scan]);

  const lineColor =
    phase === "captured" ? "#22C55E" : phase === "countdown" ? "#7C3AED" : "#6366F1";

  const dotColor =
    phase === "captured" ? "#4ADE80" : phase === "countdown" ? "#A78BFA" : "#818CF8";

  return (
    <View pointerEvents="none" style={[styles.container, { width, height }]}>
      {/* Mesh lines */}
      {EDGES.map(([i, j], idx) => {
        const [px1, py1] = PTS[i];
        const [px2, py2] = PTS[j];
        return (
          <MeshLine
            key={idx}
            x1={px1 * width}
            y1={py1 * height}
            x2={px2 * width}
            y2={py2 * height}
            color={lineColor}
          />
        );
      })}

      {/* Mesh dots */}
      {PTS.map(([px, py], idx) => (
        <Animated.View
          key={idx}
          style={[
            styles.dot,
            {
              left: px * width - 3,
              top: py * height - 3,
              backgroundColor: dotColor,
              opacity: phase === "aligning" ? pulse : 0.85,
            },
          ]}
        />
      ))}

      {/* Laser scan line during countdown */}
      {phase === "countdown" && (
        <Animated.View
          style={[
            styles.laser,
            {
              width: width * 0.9,
              left: width * 0.05,
              transform: [{ translateY: scan }],
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    alignSelf: "center",
  },
  dot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  laser: {
    position: "absolute",
    top: 0,
    height: 2,
    backgroundColor: "#A78BFA",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
});

export default FaceMeshOverlay;
