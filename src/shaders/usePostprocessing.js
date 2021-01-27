import * as THREE from 'three'
import { useMemo } from 'react'
import { useFrame, useThree } from 'react-three-fiber'
import {
  EffectComposer,
  RenderPass,
  SavePass,
} from 'postprocessing'
export default function usePostprocessing(extra = []) {
  const { gl, scene, camera } = useThree()

  const [composer, composer2] = useMemo(() => {
    const composer = new EffectComposer(gl, {
      frameBufferType: THREE.HalfFloatType,
      multisampling: 4
    })
    const renderPass = new RenderPass(scene, camera)
    const savePass = new SavePass()
    composer.addPass(renderPass)
    composer.addPass(savePass)

    const parameters = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBFormat
    }
    const renderTarget = new THREE.WebGLRenderTarget(512, 512, parameters)
    const composer2 = new EffectComposer(null)
    composer2.autoRenderToScreen = false
    composer2.renderer = gl
    composer2.inputBuffer = renderTarget
    composer2.outputBuffer = renderTarget.clone()
    composer2.enableExtensions()
    composer2.autoRenderToScreen = false
    extra.forEach((pass) => {
      composer2.addPass(pass)
      pass.setSize(512, 512)
    })
    return [composer, composer2]
  }, [gl, extra,scene, camera])

  useFrame((_, delta) => {
    composer2.render(delta)
    composer.render(delta)
  }, -1)
  return null
}
