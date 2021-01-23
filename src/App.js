import React, { Suspense, useMemo, useRef } from 'react'
import { Canvas, extend } from 'react-three-fiber'
import niceColorPalette from 'nice-color-palettes/1000'
import { useSpring, a, useChain } from '@react-spring/three'
import { Lethargy } from 'lethargy'
import { useWheel as useGestureWheel } from 'react-use-gesture'
import Model from './Color'
import { Environment, Loader, OrbitControls, Plane, Stats } from '@react-three/drei'
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
    rotY: wheelOpen ? Math.PI / 3 : Math.PI / 2
  })
  const { posX, posZ } = useSpring({
    ref: springPosX,
    posX: wheelOpen ? 3 : -3,
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
  const [meshRef, floorRef, reflectorProps, passes] = useReflector()
  usePostprocessing(passes)
  return (
    <group position-y={-2.5} rotation-x={-Math.PI / 2}>
      <Plane ref={meshRef} args={[40, 22]} position={[0, 0, -0.001]}>
        <reflectorMaterial transparent opacity={0.7} color="black" {...reflectorProps} />
      </Plane>
      <Plane ref={floorRef} args={[70, 70]} receiveShadow>
        <shadowMaterial color="#111" transparent opacity={0.2} />
      </Plane>
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
        gl={{ powerPreference: 'high-performance' }}
        pixelRatio={[1, 1.5]}
        {...bind()}
        shadowMap
        camera={{ fov: 25, far: 100, position: [0, -12, 50], zoom: 1.5 }}>
        <group rotation={[Math.PI / 8, -Math.PI / 3, 0]} position-x={0}>
          <Suspense fallback={null}>
            <Scene />
            <Model position={[-2.5, -2.5, 0]} scale={[1.8, 1.8, 1.8]} />
            <Environment files="adams_place_bridge_1k.hdr" />
            <Floor />
          </Suspense>
        </group>
        <ambientLight intensity={0.1} />
        <spotLight
          position={[20, 1, 10]}
          intensity={1.5}
          castShadow
          penumbra={1}
          distance={60}
          angle={Math.PI / 6}
          shadow-mapSize-width={518}
          shadow-mapSize-height={518}
        />
        <spotLight position={[10, 40, 0]} intensity={5} penumbra={1} distance={45} angle={Math.PI / 3} />
      </Canvas>
      <Stats />
      <Loader />
    </>
  )
}
