"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { 
    OrbitControls, 
    Environment, 
    Text, 
    useAnimations, 
    useGLTF, 
    ContactShadows,
    Float
} from "@react-three/drei";
import { SyncStageDraft, Segment } from "@/lib/schema";
import { getStyleForClip } from "@/lib/motionConstants";
import * as THREE from "three";

function Dancer({ activeClip }: { activeClip: string }) {
    const group = useRef<THREE.Group>(null);
    
    // 🔥 NOTE: In a real demo, you'd place a .glb in /public/models/
    // Since we don't have it yet, we'll use a placeholder but keep the logic structure.
    // const { scene, animations } = useGLTF("/models/dancer_all_clips.glb");
    // const { actions } = useAnimations(animations, group);

    useEffect(() => {
        if (!group.current) return;
        const style = getStyleForClip(activeClip);
        const mesh = group.current.children[0] as THREE.Mesh;
        if (mesh && mesh.material) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            mat.color.set(style.color);
            mat.emissive.set(style.emissive);
            group.current.scale.set(1.1, style.scaleY * 1.1, 1.1);
            setTimeout(() => {
                group.current?.scale.set(1, style.scaleY, 1);
            }, 250);
        }

        /* 
        // REAL ANIMATION LOGIC (when GLB is ready):
        const action = actions[activeClip];
        if (action) {
            action.reset().fadeIn(0.5).play();
            return () => { action.fadeOut(0.5); };
        }
        */
    }, [activeClip]);

    return (
        <group ref={group}>
            <mesh position={[0, 0.9, 0]} castShadow>
                <capsuleGeometry args={[0.4, 1, 4, 16]} />
                <meshStandardMaterial color="#6b21a8" emissive="#3b0764" roughness={0.3} metalness={0.8} />
            </mesh>
            {/* Visual indicator for feet */}
            <mesh position={[0, 0, 0]} receiveShadow>
                <circleGeometry args={[0.5, 32]} />
                <meshStandardMaterial color="#000" transparent opacity={0.5} />
            </mesh>
        </group>
    );
}

export default function ThreeCanvas({
    activeSegment,
    draft
}: {
    activeSegment?: Segment;
    draft: SyncStageDraft | null;
}) {
    const activeClip = activeSegment?.clipId || "idle_bounce";
    const activeStyle = getStyleForClip(activeClip);

    return (
        <Canvas
            shadows
            camera={{ position: [0, 2, 5], fov: 45 }}
            className="absolute inset-0 w-full h-full"
        >
            <color attach="background" args={["#050505"]} />
            <ambientLight intensity={0.4} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} castShadow />
            <pointLight position={[-10, -10, -10]} intensity={1} color="#4F46E5" />

            <Environment preset="night" />

            <Suspense fallback={null}>
                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <Dancer activeClip={activeClip} />
                </Float>
                
                <ContactShadows 
                    position={[0, -0.01, 0]} 
                    opacity={0.4} 
                    scale={10} 
                    blur={2} 
                    far={4.5} 
                />
            </Suspense>

            {/* Stage Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial 
                    color="#111" 
                    roughness={0.2} 
                    metalness={0.9} 
                />
            </mesh>

            {/* UI Text in 3D */}
            {activeSegment ? (
                <Text
                    position={[0, 2.8, -1]}
                    fontSize={0.4}
                    color={activeStyle.color}
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/Geist-Bold.ttf"
                >
                    {activeSegment.clipId.toUpperCase()}
                </Text>
            ) : (
                <Text
                    position={[0, 2.8, -1]}
                    fontSize={0.25}
                    color="#555"
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
                minDistance={3}
                maxDistance={10}
            />
        </Canvas>
    );
}
