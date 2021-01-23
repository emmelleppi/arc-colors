import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame, useThree } from 'react-three-fiber'
import { EffectComposer } from 'postprocessing'

export default function usePostprocessing(extra = []) {
  const { gl } = useThree()
  const [composer] = useMemo(() => {
    const parameters = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBFormat,
      encoding: gl.outputEncoding
    }
    const renderTarget = new THREE.WebGLRenderTarget(516, 516, parameters)

    const composer = new EffectComposer(null)
    composer.autoRenderToScreen = false
    composer.renderer = gl
    composer.inputBuffer = renderTarget
    composer.outputBuffer = renderTarget.clone()
    composer.enableExtensions()

    extra.forEach((pass) => {
      composer.addPass(pass)
      pass.setSize(258, 258)
    })
    return [composer]
  }, [])

  const render = useRef(0)
  useFrame((_, delta) => {
    if (render.current === 2) {
      composer.render(delta)
      render.current = 0
    }
    render.current += 1
    gl.setRenderTarget(null)
  })
  return null
}
