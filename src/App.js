import React, { Suspense, useCallback, useMemo, useRef } from 'react'
import { Canvas } from 'react-three-fiber'
import { useSpring, a, useChain } from '@react-spring/three'
import { useGesture } from 'react-use-gesture'
import { Environment, Loader, Plane, Stats } from '@react-three/drei'
import useCopyClipboard from 'react-use-clipboard'
import { Footer } from '@pmndrs/branding'

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
      <Plane ref={meshRef} args={[25, 25]} position={[3, -2, -0.001]}>
        <ReflectorMaterial {...reflectorProps} />
      </Plane>
    </group>
  )
}

export default function App() {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const height = document.documentElement.scrollHeight

  const tempWheel = useRef(0)
  const wheelOpen = useWheel((s) => s.wheelOpen)
  const increaseWheelIndex = useWheel((s) => s.increaseWheelIndex)
  const decreaseWheelIndex = useWheel((s) => s.decreaseWheelIndex)
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
  const bind = useGesture(
    {
      onWheel: ({ xy: [, y] }) => {
        const scroll = parseInt((y / (2 * height)) * 10, 10)
        if (scroll > tempWheel.current) {
          decreaseWheelIndex()
          tempWheel.current = scroll
        }
        if (scroll < tempWheel.current) {
          increaseWheelIndex()
          tempWheel.current = scroll
        }
      },
      onDrag: ({ xy: [, y] }) => {
        const scroll = parseInt((y / height) * 10, 10)
        if (scroll > tempWheel.current) {
          increaseWheelIndex()
          tempWheel.current = scroll
        }
        if (scroll < tempWheel.current) {
          decreaseWheelIndex()
          tempWheel.current = scroll
        }
      }
    },
    { axis: 'y', dragDelay: 1000 }
  )

  return (
    <div {...(wheelOpen && bind())} style={{ height: '100%' }}>
      <Canvas concurrent pixelRatio={[1, 1.5]} camera={{ fov: 20, far: 100, position: [0, -10, 50], zoom: isMobile ? 1 : 1.5 }}>
        <color attach="background" args={['#000']} />
        <fog attach="fog" args={['#000', 50, 60]} />
        <group rotation={[Math.PI / 8, -Math.PI / 3.2, 0]} position-x={0}>
          <Suspense fallback={null}>
            <Scene />
            <Model position={[-2.5, -2.5, 0]} scale={[1.8, 1.8, 1.8]} />
            <Environment files="lightroom_14b.hdr" />
            <Floor />
          </Suspense>
        </group>
        <ambientLight intensity={1} />
        <spotLight intensity={2} position={[10, 0, 10]} penumbra={0.1} angle={Math.PI / 4} distance={30} />
      </Canvas>
      <Stats />
      <Loader />
      <Footer
        date="30. January"
        year="2021"
        link1={<a onClick={handleClick}>Share your composition</a>}
        link2={isCopied && <div>Link copied in clipboard!</div>}
      />
    </div>
  )
}
