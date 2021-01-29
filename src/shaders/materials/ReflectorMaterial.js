import { extend } from 'react-three-fiber'
import { Color, MeshBasicMaterial } from 'three'

class ReflectorMaterial extends MeshBasicMaterial {
  _tDiffuse
  _tDepth
  _tBlur
  _textureMatrix
  constructor(parameters = {}) {
    super(parameters)
    this.setValues(parameters)
    this._tDepth = { value: null }
    this._tBlur = { value: null }
    this._tDiffuse = { value: null }
    this._textureMatrix = { value: null }
  }

  onBeforeCompile(shader) {
    shader.uniforms.tDiffuse = this._tDiffuse
    shader.uniforms.tDepth = this._tDepth
    shader.uniforms.tBlur = this._tBlur
    shader.uniforms.textureMatrix = this._textureMatrix

    shader.vertexShader = `
        uniform mat4 textureMatrix;
        varying vec4 my_vUv;
     
      ${shader.vertexShader}
    `
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `
        #include <project_vertex>
        my_vUv = textureMatrix * vec4( position, 1.0 );
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        `
    )

    shader.fragmentShader = `
        uniform sampler2D tDiffuse;
        uniform sampler2D tDepth;
        uniform sampler2D tBlur;
        varying vec4 my_vUv;
        ${shader.fragmentShader}
    `
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `
        #include <dithering_fragment>
        vec3 coord = my_vUv.xyz / my_vUv.w;
        vec4 base = sRGBToLinear(texture2DProj( tDiffuse, my_vUv ));
        vec4 depth = sRGBToLinear(texture2DProj( tDepth, my_vUv ));
        vec4 blur = sRGBToLinear(texture2DProj( tBlur, my_vUv ));
        float depthFactor = smoothstep(0.75, 1.0, 1.0-depth.a);
        gl_FragColor.rgb = mix(blur,base, 0.75 * depthFactor).rgb;
      `
    )
  }
  get tDiffuse() {
    return this._tDiffuse.value
  }
  set tDiffuse(v) {
    this._tDiffuse.value = v
  }
  get tDepth() {
    return this._tDepth.value
  }
  set tDepth(v) {
    this._tDepth.value = v
  }
  get tBlur() {
    return this._tBlur.value
  }
  set tBlur(v) {
    this._tBlur.value = v
  }
  get textureMatrix() {
    return this._textureMatrix.value
  }
  set textureMatrix(v) {
    this._textureMatrix.value = v
  }
}

extend({ ReflectorMaterial })
