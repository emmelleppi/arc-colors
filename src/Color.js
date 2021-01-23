/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
*/

import React, { useCallback, useState } from 'react'
import { useGLTF } from '@react-three/drei/useGLTF'
import produce from 'immer'
import { useWheel } from './store'
import Screen from './Screen'
import { useNormalTexture } from '@react-three/drei'

function Cylinder({ i, ...props }) {
  const paletteIndex = useWheel(state => state.colors[i])
  const setIndex = useWheel(state => state.setIndex)
  const handleClick = useCallback( (e) => { 
    e.stopPropagation() 
    setIndex(i, (paletteIndex + 1) % 5)
  }, [paletteIndex] )

  const palette = useWheel((s) => s.palette)

  return (
    <mesh castShadow receiveShadow onClick={handleClick} {...props}>
      <meshPhysicalMaterial metalness={0.8} roughness={0.8} color={palette[color]} />
    </mesh>
  )
}

export default function Model(props) {
  const { nodes } = useGLTF('/Color3.gltf')
  return (
    <group {...props} dispose={null}>
      <group position={[-0.54, 1.08, 1.69]}>
        {new Array(36).fill().map((_, index) => (
          <Cylinder
            key={`0${index}`}
            i={index}
            rotation={[0, -Math.PI / 2, -Math.PI / 2]}
            geometry={nodes[`Cylinder${index === 0 ? '' : index < 10 ? `00${index}` : `0${index}`}`].geometry}
          />
        ))}
      </group>
      <Screen />
      <mesh castShadow geometry={nodes.Cube.geometry} position={[0, 1, 0]} rotation-x={Math.PI / 2}>
        <meshPhysicalMaterial metalness={0.8} roughness={0.8} color="#777" />
      </mesh>
    </group>
  )
}

useGLTF.preload('/Color.gltf')
