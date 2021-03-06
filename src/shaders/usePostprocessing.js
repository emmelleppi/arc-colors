import * as THREE from 'three'
import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from 'react-three-fiber'
import { EffectComposer, RenderPass, SavePass } from 'postprocessing'
export default function usePostprocessing(extra = []) {
  const { gl, size, scene, camera } = useThree()

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
    const renderTarget = new THREE.WebGLRenderTarget(size.width / 2, size.height / 2, parameters)
    const composer2 = new EffectComposer(null)
    composer2.renderer = gl
    composer2.inputBuffer = renderTarget
    composer2.outputBuffer = renderTarget.clone()
    composer2.enableExtensions()
    composer2.autoRenderToScreen = false
    extra.forEach((pass) => {
      composer2.addPass(pass)
      pass.setSize(size.width / 2, size.height / 2)
    })
    return [composer, composer2]
  }, [gl, extra, scene, camera])

  useEffect(() => composer.setSize(size.width, size.height), [composer, size])

  useFrame((_, delta) => {
    composer2.render(delta)
    composer.render(delta)
  }, -1)
  return null
}
