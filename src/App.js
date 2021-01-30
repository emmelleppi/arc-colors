import React, { Suspense, useCallback, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from 'react-three-fiber'
import { useSpring, a, useChain } from '@react-spring/three'
import { Lethargy } from 'lethargy'
import { useGesture } from 'react-use-gesture'
import { Environment, Loader, Plane, Stats, Text } from '@react-three/drei'
import lerp from 'lerp'
import useCopyClipboard from 'react-use-clipboard'

import { MAX_INDEX, NUM, useWheel } from './store'
import Model from './Color'
import usePostprocessing from './shaders/usePostprocessing'
import useReflector from './shaders/useReflector'
import Screen from './Screen'
import ReflectorMaterial from './shaders/materials/ReflectorMaterial'
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
    const _wheelIndex = wheelIndex - NUM / 2
    let colors = new Array(NUM)
      .fill()
      .map((_, i) => Math.abs((_wheelIndex + i > 0 ? _wheelIndex + i : MAX_INDEX + _wheelIndex + i) % MAX_INDEX))
    let alpha = new Array(NUM).fill().map((_, i) => easeInOutExpo(1 - (2 * Math.abs(i - NUM / 2)) / NUM))
    for (let i = 0; i < Math.abs(wheelIndex % NUM); i += 1) {
      const a = alpha.pop()
      const el = colors.pop()
      colors = [el, ...colors]
      alpha = [a, ...alpha]
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
            wheelIndex={colors[index]}
            rotation-x={-(2 * Math.PI * index) / NUM}
            opacity={alpha[index]}
          />
        ))}
      </a.group>
    </a.group>
  )
}

function Floor() {
  const [meshRef, reflectorProps, passes] = useReflector()
  usePostprocessing(passes)
  return (
    <group position-y={-2.5} rotation-x={-Math.PI / 2}>
      <Plane receiveShadow ref={meshRef} args={[18, 18]} position={[3, -2, -0.001]}>
        <ReflectorMaterial transparent opacity={1} {...reflectorProps} />
      </Plane>
      <Share />
    </group>
  )
}

function Share() {
  const ref = useRef()
  const [hover, setHover] = useState(false)
  const [isCopied, setCopied] = useCopyClipboard(window.location.href, {
    successDuration: 2000
  })

  const handleClick = useCallback(
    (e) => {
      e.stopPropagation()
      setCopied()
    },
    [setCopied]
  )

  useFrame(({ clock }) => {
    ref.current.position.z = lerp(ref.current.position.z, 0.1 + 0.05 * Math.sin(clock.elapsedTime) + (hover ? 0.5 : 0), 0.1)
    ref.current.rotation.y = lerp(ref.current.rotation.y, hover ? Math.PI / 2 : 0, 0.1)
  })

  return (
    <Text
      ref={ref}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
      onClick={handleClick}
      font="https://fonts.gstatic.com/s/archivoblack/v10/HTxqL289NzCGg4MzN6KJ7eW6CYyF-A.woff"
      fontSize={0.8}
      position={[1, -2.5, 0.1]}
      rotation={[0, 0, Math.PI / 2]}>
      {isCopied ? 'COPIED!' : 'SHARE'}
    </Text>
  )
}

export default function App() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const wheelOpen = useWheel((s) => s.wheelOpen)
  const increaseWheelIndex = useWheel((s) => s.increaseWheelIndex)
  const decreaseWheelIndex = useWheel((s) => s.decreaseWheelIndex)

  const bind = useGesture(
    {
      onWheel: ({ event, last }) => {
        if (!last && wheelOpen) {
          const s = lethargy.check(event)
          if (s) {
            s > 0 ? increaseWheelIndex() : decreaseWheelIndex()
          }
        }
      },
      onDrag: ({ active, delta: [, my], direction: [, yDir] }) => {
        if (active && Math.abs(my) > 0.5) {
          yDir > 0 ? increaseWheelIndex() : decreaseWheelIndex()
        }
      }
    },
    { axis: 'y', dragDelay: 1000 }
  )

  return (
    <div {...(wheelOpen && bind())} style={{ height: '100%' }}>
      <Canvas concurrent shadowMap pixelRatio={[1, 1.5]} camera={{ fov: 20, far: 100, position: [0, -10, 50], zoom: isMobile ? 1 : 1.5 }}>
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
        <spotLight intensity={2} position={[10, 0, 10]} penumbra={0.1} angle={Math.PI / 4} distance={30} castShadow />
      </Canvas>
      <Stats />
      <Loader />
    </div>
  )
}
