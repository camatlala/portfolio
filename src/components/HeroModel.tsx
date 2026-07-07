import { Canvas, useFrame } from '@react-three/fiber'
import { Center, Environment, Lightformer, Text3D } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'
import baloo2Bold from '../assets/fonts/baloo2-bold.typeface.json'

function ChromeBalloonText({ scrollProgress }: { scrollProgress: React.MutableRefObject<number> }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    const group = groupRef.current
    if (!group) return
    const t = state.clock.getElapsedTime()
    group.rotation.y = Math.sin(t * 0.25) * 0.35 + scrollProgress.current * Math.PI * 1.2
    group.rotation.x = Math.sin(t * 0.18) * 0.08
    group.position.y = Math.sin(t * 0.6) * 0.08
  })

  return (
    <group ref={groupRef}>
      <Center>
        <Text3D
          // @ts-expect-error -- generated typeface JSON matches three.js FontData at runtime
          font={baloo2Bold}
          size={1}
          height={0.5}
          curveSegments={32}
          bevelEnabled
          bevelThickness={0.1}
          bevelSize={0.08}
          bevelSegments={12}
          letterSpacing={0.25}
        >
          Antonio
          <meshStandardMaterial color="#e9edf2" metalness={1} roughness={0.1} />
        </Text3D>
      </Center>
    </group>
  )
}

export default function HeroModel({
  scrollProgress,
  reducedMotion,
}: {
  scrollProgress: React.MutableRefObject<number>
  reducedMotion: boolean
}) {
  if (reducedMotion) {
    return null
  }

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 6], fov: 42 }}
      gl={{ alpha: true, antialias: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[4, 5, 6]} intensity={1.2} color="#ffffff" />
      <Environment resolution={256}>
        <group>
          <Lightformer
            form="rect"
            intensity={4}
            color="#ffffff"
            scale={[6, 3, 1]}
            position={[0, 3, 4]}
            target={[0, 0, 0]}
          />
          <Lightformer
            form="rect"
            intensity={3}
            color="#2dbef4"
            scale={[4, 4, 1]}
            position={[-5, 0, 2]}
            target={[0, 0, 0]}
          />
          <Lightformer
            form="rect"
            intensity={3}
            color="#ff5a5f"
            scale={[4, 4, 1]}
            position={[5, -1, 2]}
            target={[0, 0, 0]}
          />
          <Lightformer
            form="ring"
            intensity={2}
            color="#ffffff"
            scale={3}
            position={[0, 0, -6]}
            target={[0, 0, 0]}
          />
        </group>
      </Environment>
      <ChromeBalloonText scrollProgress={scrollProgress} />
    </Canvas>
  )
}
