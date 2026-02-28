"use client";

import React, { useEffect, useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
    OrbitControls,
    Environment,
    Text,
    ContactShadows,
    Float,
    useGLTF,
    useAnimations,
    Html
} from "@react-three/drei";
import { SyncStageDraft, Segment } from "@/lib/schema";
import { getStyleForClip } from "@/lib/motionConstants";
import * as THREE from "three";

function KPopDancer({ activeClip }: { activeClip: string }) {
    const group = useRef<THREE.Group>(null);

    // 1. Base model load
    const { scene } = useGLTF('/models/Ch46_nonPBR (1).glb');

    // 2. Load animation files
    const { animations: idleAnim } = useGLTF('/models/Happy Idle.glb');
    const { animations: hiphopAnim } = useGLTF('/models/Hip Hop Dancing.glb');
    const { animations: armsAnim } = useGLTF('/models/Arms Hip Hop Dance.glb');
    const { animations: jazzAnim } = useGLTF('/models/Jazz Dancing.glb');

    // 3. Combine animations into one array and map names
    const allAnimations = React.useMemo(() => {
        const createAnim = (animArray: THREE.AnimationClip[], newName: string) => {
            if (!animArray || !animArray[0]) return null;
            const cloned = animArray[0].clone();
            cloned.name = newName;
            return cloned;
        };

        return [
            createAnim(idleAnim, 'happy_idle'),
            createAnim(hiphopAnim, 'hiphop_dance'),
            createAnim(armsAnim, 'arms_hiphop'),
            createAnim(jazzAnim, 'jazz_dance')
        ].filter(Boolean) as THREE.AnimationClip[];
    }, [idleAnim, hiphopAnim, armsAnim, jazzAnim]);

    const { actions } = useAnimations(allAnimations, group);

    useEffect(() => {
        if (!actions) return;
        const action = actions[activeClip];
        if (action) {
            action.reset().fadeIn(0.5).play();
        }
        return () => {
            if (action) action.fadeOut(0.5);
        };
    }, [activeClip, actions]);

    return (
        <group ref={group} dispose={null}>
            <primitive object={scene} scale={1.2} position={[0, -0.9, 0]} castShadow />
            {/* Visual indicator for feet/stage mark */}
            <mesh position={[0, -0.9, 0]} receiveShadow>
                <circleGeometry args={[0.5, 32]} />
                <meshStandardMaterial color="#000" transparent opacity={0.5} />
            </mesh>
        </group>
    );
}

useGLTF.preload('/models/Ch46_nonPBR (1).glb');
useGLTF.preload('/models/Happy Idle.glb');
useGLTF.preload('/models/Hip Hop Dancing.glb');
useGLTF.preload('/models/Arms Hip Hop Dance.glb');
useGLTF.preload('/models/Jazz Dancing.glb');

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

            <Suspense fallback={
                <Html center>
                    <div className="flex flex-col items-center justify-center p-4 bg-black/80 rounded border border-fuchsia-500/50 backdrop-blur-md whitespace-nowrap">
                        <div className="w-8 h-8 border-4 border-fuchsia-500 border-t-transparent rounded-full animate-spin mb-3"></div>
                        <div className="text-xs font-bold tracking-widest text-fuchsia-400 uppercase font-mono">Loading 3D Assets...</div>
                        <div className="text-[10px] text-fuchsia-400/50 mt-1">~30MB Models</div>
                    </div>
                </Html>
            }>
                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <KPopDancer activeClip={activeClip} />
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
                <meshStandardMaterial color="#111" roughness={0.2} metalness={0.9} />
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
