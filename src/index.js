import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { Canvas, extend, useFrame } from 'react-three-fiber'
import lerp from 'lerp'
import { RoundedBoxBufferGeometry } from 'three/examples/jsm/geometries/RoundedBoxBufferGeometry'
import niceColorPalette from 'nice-color-palettes/1000'
import { useSpring, a, useChain } from '@react-spring/three'
import { Lethargy } from 'lethargy'
import { useWheel as useGestureWheel } from 'react-use-gesture'
import Model from './Color'
import { Environment } from '@react-three/drei'
import { MAX_INDEX, NUM, useWheel } from './store'
import './styles.css'

extend({ RoundedBoxBufferGeometry })

function easeInOutExpo(x) {
  return x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2
}

const lethargy = new Lethargy()

function Thing({ color, opacity, ...props }) {
  const ref = useRef()
  const scale = opacity === 1 ? 1.4 : 1
  const toggle = useWheel((s) => s.toggleWheel)
  const wheelOpen = useWheel((s) => s.wheelOpen)
  const setPalette = useWheel((s) => s.setPalette)
  const [localOpen, setLocalOpen] = useState(wheelOpen)

  useFrame(() => {
    const newScale = lerp(ref.current.scale.x, scale, 0.1)
    ref.current.scale.set(newScale, newScale, newScale)
  })
  const springOpacityRef = useRef()
  const { springOpacity } = useSpring({
    ref: springOpacityRef,
    springOpacity: opacity
  })

  useEffect(() => {
    if (localOpen) {
      springOpacityRef.current.start({
        springOpacity: opacity
      })
      if (!wheelOpen) {
        setLocalOpen(false)
      }
    } else {
      springOpacityRef.current.start({
        springOpacity: opacity,
        delay: wheelOpen ? 1000 : 0,
        onRest: () => setLocalOpen(true)
      })
    }
    if (opacity === 1) {
      setPalette(color)
    }
  }, [localOpen, setLocalOpen, wheelOpen, opacity, setPalette, color])

  return (
    <group
      onClick={(e) => {
        e.stopPropagation()
        if (opacity === 1) {
          toggle()
        }
      }}
      ref={ref}
      {...props}>
      {color.map((c, i) => (
        <mesh receiveShadow castShadow key={`0${i}`} position-x={(i - 2.5) / 3.3} renderOrder={0} visible={opacity > 0.01}>
          <roundedBoxBufferGeometry args={[0.4, 0.8, 0.1]} />
          <a.meshStandardMaterial color={c} transparent opacity={springOpacity} />
        </mesh>
      ))}
    </group>
  )
}

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
    rotY: wheelOpen ? 0 : Math.PI/2
  })
  const { posX, posZ } = useSpring({
    ref: springPosX,
    posX: wheelOpen ? 6 : -2.78,
    posZ: wheelOpen ? 0 : -1.85
  })
  const { rotX } = useSpring({
    rotX: _weel
  })
  useChain(!wheelOpen ? [springRotY, springPosX] : [springPosX, springRotY], [0, 1])

  return (
    <a.group position-x={posX} position-z={posZ} rotation-y={rotY}>
      <a.group rotation-x={rotX}>
        {positions.map((pos, index) => (
          <Thing
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

function App() {
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
    <Canvas {...bind()} orthographic shadowMap camera={{ zoom: 70, position:[0,-12,50] }}>
      <color attach="background" args={['#333']} />
      <group rotation={[Math.PI/8,-Math.PI/3,0]}>
        <Scene />
        <Suspense fallback={null}>
          <Model position={[-2.5,-2.5,0]} scale={[1.8,1.8,1.8]} />
          <Environment preset="apartment" />
        </Suspense>
      </group>
      <spotLight
        position={[0, 30, -30]}
        castShadow 
        intensity={4}
        angle={Math.PI/3}
        distance={50}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
    </Canvas>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
