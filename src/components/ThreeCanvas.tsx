"use client";

import React, { useEffect, useRef, Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import {
    OrbitControls,
    Environment,
    Text,
    ContactShadows,
    Float,
    useGLTF,
    useAnimations,
    Html,
} from "@react-three/drei";
import { Segment } from "@/lib/schema";
import { getStyleForClip } from "@/lib/motionConstants";
import * as THREE from "three";

// Mixamo GLBs are exported in cm units → scale 0.01 to get meters
const SCALE = 0.01;

const CLIP_PATHS: Record<string, string> = {
    happy_idle: "/models/happy_idle.glb",
    hiphop_dance: "/models/hiphop_dance.glb",
    arms_hiphop: "/models/arms_hiphop.glb",
    jazz_dance: "/models/jazz_dance.glb",
};

// Preload all dance animations on module init
Object.values(CLIP_PATHS).forEach(p => useGLTF.preload(p));

// ------------------------------------------------------------------
// KPopDancer: loads the full character+animation GLB for activeClip
// Each GLB is a complete rigged character — bone tracks are unnamed
// so we play ALL tracks simultaneously to animate the mesh.
// ------------------------------------------------------------------
function KPopDancer({ activeClip, color }: { activeClip: string; color: string }) {
    const path = CLIP_PATHS[activeClip] || CLIP_PATHS.happy_idle;
    const { scene, animations } = useGLTF(path);
    const group = useRef<THREE.Group>(null);
    const { actions } = useAnimations(animations, group);

    // Apply emissive tint to the character mesh to reflect segment style
    const tintedScene = useMemo(() => {
        const clone = scene.clone(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        clone.traverse((child: any) => {
            if (child.isMesh && child.material) {
                const mat = child.material.clone();
                // subtle emissive tint
                mat.emissive = new THREE.Color(color).multiplyScalar(0.15);
                child.material = mat;
            }
        });
        return clone;
    }, [scene, color]);

    useEffect(() => {
        // Play ALL animation tracks — each represents one bone's motion track
        const allActions = Object.values(actions);
        if (allActions.length === 0) return;
        allActions.forEach(a => {
            a?.reset().fadeIn(0.4).play();
        });
        return () => {
            allActions.forEach(a => a?.fadeOut(0.4));
        };
    }, [actions, activeClip]);

    return (
        <group ref={group}>
            <primitive object={tintedScene} scale={SCALE} position={[0, 0, 0]} castShadow />
        </group>
    );
}

// ------------------------------------------------------------------
// Main export
// ------------------------------------------------------------------
export default function ThreeCanvas({
    activeSegment,
}: {
    activeSegment?: Segment;
}) {
    // Default to happy_idle — NOT "idle_bounce" (not a valid clip)
    const activeClip = activeSegment?.clipId ?? "happy_idle";
    const activeStyle = getStyleForClip(activeClip);

    return (
        <Canvas
            shadows
            camera={{ position: [0, 1.2, 4.5], fov: 45 }}
            className="absolute inset-0 w-full h-full"
        >
            <color attach="background" args={["#050505"]} />
            <ambientLight intensity={0.5} />
            <spotLight
                position={[3, 6, 4]}
                angle={0.25}
                penumbra={0.8}
                intensity={3}
                castShadow
                color={activeStyle.color}
            />
            <pointLight position={[-4, 2, -3]} intensity={1.2} color="#4F46E5" />
            <pointLight position={[4, 0, 2]} intensity={0.6} color={activeStyle.color} />

            <Environment preset="night" />

            <Suspense
                fallback={
                    <Html center>
                        <div style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            background: "rgba(0,0,0,0.85)",
                            border: "1px solid rgba(217,70,239,0.4)",
                            borderRadius: "8px",
                            padding: "16px 24px",
                            whiteSpace: "nowrap",
                        }}>
                            <div style={{
                                width: 28, height: 28,
                                border: "3px solid #d946ef",
                                borderTopColor: "transparent",
                                borderRadius: "50%",
                                animation: "spin 0.8s linear infinite",
                                marginBottom: 10,
                            }} />
                            <span style={{ color: "#d946ef", fontFamily: "monospace", fontSize: 11, letterSpacing: "0.15em" }}>
                                LOADING 3D...
                            </span>
                        </div>
                    </Html>
                }
            >
                <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.3}>
                    <KPopDancer activeClip={activeClip} color={activeStyle.color} />
                </Float>

                <ContactShadows
                    position={[0, 0, 0]}
                    opacity={0.5}
                    scale={8}
                    blur={2.5}
                    far={3}
                    color={activeStyle.color}
                />
            </Suspense>

            {/* Stage floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial color="#0a0a0a" roughness={0.15} metalness={0.95} />
            </mesh>

            {/* 3D UI label */}
            {activeSegment ? (
                <Text
                    position={[0, 2.4, -1]}
                    fontSize={0.32}
                    color={activeStyle.color}
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/Geist-Bold.ttf"
                    outlineWidth={0.01}
                    outlineColor="#000"
                >
                    {activeSegment.clipId.replace("_", " ").toUpperCase()}
                </Text>
            ) : (
                <Text
                    position={[0, 2.4, -1]}
                    fontSize={0.2}
                    color="#333"
                    anchorX="center"
                    anchorY="middle"
                >
                    WAITING FOR AUDIO...
                </Text>
            )}

            <OrbitControls
                makeDefault
                enablePan={false}
                maxPolarAngle={Math.PI / 2}
                minDistance={2.5}
                maxDistance={8}
                target={[0, 0.8, 0]}
            />
        </Canvas>
    );
}
