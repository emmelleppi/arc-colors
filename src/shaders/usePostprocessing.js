import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame, useThree, useLoader } from 'react-three-fiber'
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BlendFunction,
  SMAAImageLoader,
  SMAAEffect,
  SSAOEffect,
  NormalPass,
  PredicationMode,
  TextureEffect
} from 'postprocessing'
export default function usePostprocessing(extra = []) {
  const { gl, scene, camera } = useThree()
  const smaa = useLoader(SMAAImageLoader)

  const [composer, composer2] = useMemo(() => {
    const composer = new EffectComposer(gl, {
      frameBufferType: THREE.HalfFloatType,
      multisampling: 0
    })
    const renderPass = new RenderPass(scene, camera)
    const normalPass = new NormalPass(scene, camera)

    const SMAA = new SMAAEffect(...smaa)
    SMAA.edgeDetectionMaterial.setEdgeDetectionThreshold(0.05)
    SMAA.edgeDetectionMaterial.setPredicationMode(PredicationMode.DEPTH)
    SMAA.edgeDetectionMaterial.setPredicationThreshold(0.002)
    SMAA.edgeDetectionMaterial.setPredicationScale(1.0)
    const edgesTextureEffect = new TextureEffect({
      blendFunction: BlendFunction.SKIP,
      texture: SMAA.renderTargetEdges.texture
    })
    const weightsTextureEffect = new TextureEffect({
      blendFunction: BlendFunction.SKIP,
      texture: SMAA.renderTargetWeights.texture
    })
    // END ANTIALIAS

    const aOconfig = {
      blendFunction: BlendFunction.MULTIPLY,
      samples: 6, // May get away with less samples
      rings: 5, // Just make sure this isn't a multiple of samples
      distanceThreshold: 1,
      distanceFalloff: 0.5,
      rangeThreshold: 0.5, // Controls sensitivity based on camera view distance **
      rangeFalloff: 0.5,
      luminanceInfluence: 0,
      radius: 2, // Spread range
      intensity: 4,
      bias: 0.08
    }

    const AO = new SSAOEffect(camera, normalPass.renderTarget.texture, aOconfig)

    const effectPass = new EffectPass(camera, SMAA, edgesTextureEffect, weightsTextureEffect, AO)
    composer.addPass(renderPass)
    composer.addPass(normalPass)
    composer.addPass(effectPass)

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
  }, [])

  useFrame((_, delta) => {
    composer2.render(delta)
    composer.render(delta)
  }, -1)
  return null
}
