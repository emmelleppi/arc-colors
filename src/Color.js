/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
*/

import React, { useCallback, useRef } from 'react'
import { useGLTF } from '@react-three/drei/useGLTF'
import { useWheel } from './store'
import Screen from './Screen'
import { BackSide } from 'three'

function Cylinder({ i, material, ...props }) {
  const ref = useRef()
  const paletteIndex = useWheel((state) => state.colors[i])
  const setIndex = useWheel((state) => state.setIndex)
  const handleClick = useCallback(
    (e) => {
      e.stopPropagation()
      setIndex(i, (paletteIndex + 1) % 5)
    },
    [paletteIndex]
  )

  const palette = useWheel((s) => s.palette)

  return (
    <mesh ref={ref} onClick={handleClick} {...props}>
      <primitive object={material} attach="material" metalness={0.6} roughness={0.3} color={palette[paletteIndex]} />
    </mesh>
  )
}

export default function Model(props) {
  const { nodes, materials } = useGLTF('/colors.glb')
  const { nodes: screenNode } = useGLTF('/Screen.gltf')
  return (
    <group {...props} dispose={null}>
      <group position={[-0.54, 1.08, 1.69]}>
        {new Array(36).fill().map((_, index) => (
          <Cylinder
            key={`0${index}`}
            i={index}
            rotation-x={Math.PI / 2}
            rotation-y={-Math.PI / 2}
            geometry={nodes[`Cylinder${index === 0 ? '' : index < 10 ? `00${index}` : `0${index}`}`].geometry}
            material={materials[`Material.${index === 0 ? '037' : index + 1 < 10 ? `00${index + 1}` : `0${index + 1}`}`]}
          />
        ))}
      </group>
      <Screen />
      <mesh geometry={nodes.Cube.geometry} position={[0, 1, 0]} rotation-x={Math.PI / 2}>
        <primitive object={materials.black} attach="material" metalness={0} roughness={0.5} />
      </mesh>
      <mesh geometry={screenNode.Slice.geometry} position={[1.79, 1.789, 0.01]} rotation={[0, 0, 3.14]} scale={[0.999, 0.999, 0.999]}>
        <meshPhysicalMaterial color="#222222" roughness={1} side={BackSide} />
      </mesh>
    </group>
  )
}

useGLTF.preload('/Color.gltf')
