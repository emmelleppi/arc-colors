import React, { Suspense, useMemo, useRef } from 'react'
import { Canvas } from 'react-three-fiber'
import niceColorPalette from 'nice-color-palettes/1000'
import { useSpring, a, useChain } from '@react-spring/three'
import { Lethargy } from 'lethargy'
import { useWheel as useGestureWheel } from 'react-use-gesture'
import Model from './Color'
import { Environment, Loader, Plane, Stats, useGLTF } from '@react-three/drei'
import { MAX_INDEX, NUM, useWheel } from './store'
import usePostprocessing from './shaders/usePostprocessing'
import useReflector from './shaders/useReflector'
import Screen from './Screen'
import './shaders/materials/ReflectorMaterial'
import './styles.css'

function easeInOutExpo(x) {
  return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2
}

const lethargy = new Lethargy()

function Scene() {
  const springRotY = useRef()
  const springPosX = useRef()
  const wheelOpen = useWheel((s) => s.wheelOpen)
  const wheelIndex = useWheel((s) => s.wheelIndex)
  const _weel = (2 * Math.PI * wheelIndex) / NUM
  const [positions, colors, alpha] = useMemo(() => {
    let colors = new Array(NUM)
      .fill()
      .map((_, i) => Math.abs((wheelIndex + i > 0 ? wheelIndex + i : MAX_INDEX + wheelIndex + i) % MAX_INDEX))
    let alpha = new Array(NUM).fill().map((_, i) => easeInOutExpo(1 - (2 * Math.abs(i - NUM / 2)) / NUM))

    for (let i = 0; i < Math.abs(wheelIndex % NUM); i += 1) {
      const a = alpha.pop()
      const el = colors.pop()
      colors = [el, ...colors]
      alpha = [a, ...alpha]
    }

    if (!wheelOpen) {
      alpha = alpha.map((a) => (a === 1 ? 1 : 0))
    }

    const positions = new Array(NUM)
      .fill()
      .map((_, index) => [0, -2 * Math.sin((2 * Math.PI * index) / NUM), -2 * Math.cos((2 * Math.PI * index) / NUM)])
    return [positions, colors, alpha]
  }, [wheelIndex, wheelOpen])

  const { rotY } = useSpring({
    ref: springRotY,
    rotY: wheelOpen ? Math.PI / 4 : Math.PI / 2
  })
  const { posX, posZ } = useSpring({
    ref: springPosX,
    posX: wheelOpen ? 2 : -3,
    posZ: wheelOpen ? -4 : -1.9
  })
  const { rotX } = useSpring({
    rotX: _weel
  })
  useChain(!wheelOpen ? [springRotY, springPosX] : [springPosX, springRotY], [0, 1])

  return (
    <a.group position-x={posX} position-z={posZ} rotation-y={rotY}>
      <a.group rotation-x={rotX}>
        {positions.map((pos, index) => (
          <Screen
            key={`0${index}`}
            position={pos}
            color={niceColorPalette[colors[index]]}
            rotation-x={-(2 * Math.PI * index) / NUM}
            opacity={alpha[index]}
          />
        ))}
      </a.group>
    </a.group>
  )
}

function Floor() {
  const { nodes, materials } = useGLTF('/colors.glb')
  const [meshRef, floorRef, reflectorProps, passes] = useReflector()
  usePostprocessing(passes)
  return (
    <group position-y={-2.5} rotation-x={-Math.PI / 2}>
      <Plane ref={meshRef} args={[40, 40]} position={[0, 0, -0.001]}>
        <reflectorMaterial transparent opacity={0.7} color="#000" {...reflectorProps} />
      </Plane>
      <mesh ref={floorRef} position={[-2.3, -0.1, -0.01]} rotation-x={Math.PI / 2} scale={[1.8, 1.8, 1.8]} geometry={nodes.Plane.geometry}>
        <primitive object={materials['Plane-mat']} attach="material" metalness={1} roughness={1} />
      </mesh>
    </group>
  )
}

export default function App() {
  const wheelOpen = useWheel((s) => s.wheelOpen)
  const increaseWheelIndex = useWheel((s) => s.increaseWheelIndex)
  const decreaseWheelIndex = useWheel((s) => s.decreaseWheelIndex)

  const bind = useGestureWheel(({ event, last, memo: wait }) => {
    if (!last && wheelOpen) {
      const s = lethargy.check(event)
      if (s) {
        if (!wait) {
          s > 0 ? increaseWheelIndex() : decreaseWheelIndex()
          return true
        }
      } else return false
    } else {
      return false
    }
  })

  return (
    <>
      <Canvas
        concurrent
        pixelRatio={[1, 1.5]}
        gl={{ powerPreference: 'high-performance', antialias: false, stencil: false, depth: false, alpha: false }}
        {...bind()}
        camera={{ fov: 20, far: 100, position: [0, -10, 50], zoom: 1.5 }}>
        <fog attach="fog" args={['#000', 55, 65]} />
        <color attach="background" args={['#000']} />
        <group rotation={[Math.PI / 8, -Math.PI / 3.2, 0]} position-x={0}>
          <Suspense fallback={null}>
            <Scene />
            <Model position={[-2.5, -2.5, 0]} scale={[1.8, 1.8, 1.8]} />
            <Environment files="lightroom_14b.hdr" />
            <Floor />
          </Suspense>
        </group>
        <ambientLight intensity={0.5} />
        <spotLight intensity={1} position={[10, 0, 10]} penumbra={0.1} angle={Math.PI / 4} distance={30} />
      </Canvas>
      <Stats />
      <Loader />
    </>
  )
}
