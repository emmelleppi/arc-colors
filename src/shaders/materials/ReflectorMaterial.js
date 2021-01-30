import { useTexture } from '@react-three/drei'
import M from 'component-material'
import { useEffect } from 'react'
import { RepeatWrapping } from 'three'

export default function ReflectorMaterial({ tDiffuse, tDepth, tBlur, textureMatrix, ...props }) {
  const textures = useTexture(['/normal_floor.jpeg', '/roughness_floor.jpeg'])
  useEffect(() => {
    textures.forEach((t) => {
      t.wrapS = t.wrapT = RepeatWrapping
      t.repeat.set(0.5, 0.5)
    })
  }, [textures])
  return (
    <M
      {...props}
      normalMap={textures[0]}
      roughnessMap={textures[1]}
      metalness={0}
      roughness={1}
      envMapIntensity={0.001}
      transparent
      uniforms={{
        tDiffuse: { type: 'sampler2D', value: tDiffuse },
        tDepth: { type: 'sampler2D', value: tDepth },
        tBlur: { type: 'sampler2D', value: tBlur },
        textureMatrix: { type: 'mat4', value: textureMatrix }
      }}
      varyings={{ my_vUv: { type: 'vec4' } }}>
      <M.Vert.Body>{`
        my_vUv = textureMatrix * vec4( position, 1.0 );
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      `}</M.Vert.Body>
      <M.Frag.emissivemap_fragment>{`
        vec3 coord = my_vUv.xyz / my_vUv.w;
        vec4 base = sRGBToLinear(texture2DProj( tDiffuse, my_vUv ));
        vec4 depth = sRGBToLinear(texture2DProj( tDepth, my_vUv ));
        vec4 blur = sRGBToLinear(texture2DProj( tBlur, my_vUv ));

        float depthFactor = smoothstep(0.5, 2.0, 1.0-depth.a);
        depthFactor *= 2.0;
        depthFactor = min(1.0, depthFactor);

        float reflectorRoughnessFactor = roughness;
        #ifdef USE_ROUGHNESSMAP
          vec4 reflectorTexelRoughness = texture2D( roughnessMap, vUv );
          reflectorRoughnessFactor *= reflectorTexelRoughness.g;
        #endif
        reflectorRoughnessFactor = min(1.0, reflectorRoughnessFactor);
        reflectorRoughnessFactor = smoothstep(0.0, 0.5, reflectorRoughnessFactor);
        
        base.rgb = mix(diffuseColor, base, 0.8).rgb;
        vec4 merge = mix(blur, base, depthFactor);
        merge = mix(merge, blur, reflectorRoughnessFactor);
        diffuseColor.rgb *= 0.003 + 0.997* sRGBToLinear(merge).rgb;        
      `}</M.Frag.emissivemap_fragment>
    </M>
  )
}
