import { Asset } from 'expo-asset';
import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import {
  ExpoMaterialXLoader,
  loadAsync,
  loadTextureAsync,
  Renderer,
  TextureLoader,
} from 'expo-three';
import * as React from 'react';
import { MeshBasicMaterial } from 'three';
import * as THREE from 'three';
import {
  AmbientLight,
  BoxGeometry,
  Fog,
  GridHelper,
  Mesh,
  PerspectiveCamera,
  PointLight,
  Scene,
  SpotLight,
} from 'three';
import { MaterialXLoader } from 'three/examples/jsm/loaders/MaterialXLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

const SAMPLE_PATH =
  'https://raw.githubusercontent.com/materialx/MaterialX/main/resources/Materials/Examples/StandardSurface/';

const samples = [
  'standard_surface_brass_tiled.mtlx',
  //'standard_surface_brick_procedural.mtlx',
  'standard_surface_carpaint.mtlx',
  //'standard_surface_chess_set.mtlx',
  'standard_surface_chrome.mtlx',
  'standard_surface_copper.mtlx',
  //'standard_surface_default.mtlx',
  //'standard_surface_glass.mtlx',
  //'standard_surface_glass_tinted.mtlx',
  'standard_surface_gold.mtlx',
  'standard_surface_greysphere.mtlx',
  //'standard_surface_greysphere_calibration.mtlx',
  'standard_surface_jade.mtlx',
  //'standard_surface_look_brass_tiled.mtlx',
  //'standard_surface_look_wood_tiled.mtlx',
  'standard_surface_marble_solid.mtlx',
  'standard_surface_metal_brushed.mtlx',
  'standard_surface_plastic.mtlx',
  //'standard_surface_thin_film.mtlx',
  'standard_surface_velvet.mtlx',
  'standard_surface_wood_tiled.mtlx',
];

export default function App() {
  const timeoutRef = React.useRef<number>();

  React.useEffect(() => {
    // Clear the animation loop when the component unmounts
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const onContextCreate = async (gl: ExpoWebGLRenderingContext) => {
    // removes the warning EXGL: gl.pixelStorei() doesn't support this parameter yet!
    const pixelStorei = gl.pixelStorei.bind(gl);
    gl.pixelStorei = function (...args) {
      const [parameter] = args;
      switch (parameter) {
        case gl.UNPACK_FLIP_Y_WEBGL:
          return pixelStorei(...args);
      }
    };

    const { drawingBufferWidth: width, drawingBufferHeight: height } = gl;
    const clearColor = 0x6ad6f0;
    const lightColor = 0xffffff;

    // Create a WebGLRenderer without a DOM element
    const renderer = new Renderer({
      gl,
      clearColor,
      width: width,
      height: height,
    });

    const camera = new PerspectiveCamera(70, width / height, 0.01, 1000);
    camera.position.set(2, 5, 5);
    camera.updateProjectionMatrix();

    const scene = new Scene();
    scene.fog = new Fog(clearColor, 1, 1000);
    scene.add(new GridHelper(10, 10));

    // lights
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 3);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.position.set(0, 20, 10);
    scene.add(dirLight);

    // ground
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2000, 2000),
      new THREE.MeshPhongMaterial({ color: 0xcbcbcb, depthWrite: false })
    );
    mesh.rotation.x = -Math.PI / 2;
    scene.add(mesh);

    const grid = new THREE.GridHelper(200, 40, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);

    // const ambientLight = new AmbientLight(0x101010, Math.PI);
    // scene.add(ambientLight);

    // const pointLight = new PointLight(lightColor, 2 * Math.PI, 1000, 0.0);
    // pointLight.position.set(0, 200, 200);
    // scene.add(pointLight);

    // const spotLight = new SpotLight(
    //   lightColor,
    //   0.5 * Math.PI,
    //   0,
    //   Math.PI / 3,
    //   0,
    //   0.0
    // );
    // spotLight.position.set(0, 500, 100);
    // spotLight.lookAt(scene.position);
    // scene.add(spotLight);

    // Load and add a texture
    // const cube = new IconMesh();
    // scene.add(cube);

    // Load and add an obj model
    // const model: Record<string, string> = {
    //   '3d.obj':
    //     'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/obj/walt/WaltHead.obj',
    //   '3d.mtl':
    //     'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/obj/walt/WaltHead.mtl',
    // };

    console.log('loading bg...');
    const bgAsset = Asset.fromModule(
      require('./assets/symmetrical_garden_02_1k.hdr')
    );
    await bgAsset.downloadAsync();

    console.log('loaded bg asset');

    const bgTexture = await loadTextureAsync({ asset: bgAsset.localUri! });

    console.log('loaded bg texture');

    // const bgTexture: THREE.DataTexture = await new Promise((resolve) => {
    //   new RGBELoader().load(bgAsset.localUri!, async (texture) => {
    //     console.log('bgloaded', texture);
    //     // texture.mapping = THREE.EquirectangularReflectionMapping;
    //     // console.log('set mapping');

    //     resolve(texture);
    //   });
    // });

    // console.log('setting bg texture', bgTexture);

    scene.background = bgTexture;
    scene.environment = bgTexture;

    console.log('loading shaderball...');
    const ballAsset = Asset.fromModule(
      require('./assets/ShaderBall-decimated.glb')
    );
    await ballAsset.downloadAsync();

    console.log('loaded shaderball asset');

    const shaderBall = await loadAsync(ballAsset);
    const model = shaderBall.scene;

    console.log('loaded model');

    scene.add(model);

    camera.lookAt(model.position);

    // const materialAsset = await loadAsync(SAMPLE_PATH + samples[0]);
    let materialObj;

    const materialXUri = `https://raw.githubusercontent.com/materialx/MaterialX/main/resources/Materials/Examples/StandardSurface/standard_surface_metal_brushed.mtlx`;

    try {
      //       const materialAssetRaw = `<?xml version="1.0"?>
      // <materialx version="1.38" colorspace="lin_rec709" fileprefix="../../../Images/">
      //   <nodegraph name="NG_brass1">
      //     <tiledimage name="image_color" type="color3">
      //       <input name="file" type="filename" value="brass_color.jpg" colorspace="srgb_texture" />
      //       <input name="uvtiling" type="vector2" value="1.0, 1.0" />
      //     </tiledimage>
      //     <tiledimage name="image_roughness" type="float">
      //       <input name="file" type="filename" value="brass_roughness.jpg" />
      //       <input name="uvtiling" type="vector2" value="1.0, 1.0" />
      //     </tiledimage>
      //     <output name="out_color" type="color3" nodename="image_color" />
      //     <output name="out_roughness" type="float" nodename="image_roughness" />
      //   </nodegraph>
      //   <standard_surface name="SR_brass1" type="surfaceshader">
      //     <input name="base" type="float" value="1" />
      //     <input name="base_color" type="color3" value="1, 1, 1" />
      //     <input name="specular" type="float" value="0" />
      //     <input name="specular_roughness" type="float" nodegraph="NG_brass1" output="out_roughness" />
      //     <input name="metalness" type="float" value="1" />
      //     <input name="coat" type="float" value="1" />
      //     <input name="coat_color" type="color3" nodegraph="NG_brass1" output="out_color" />
      //     <input name="coat_roughness" type="float" nodegraph="NG_brass1" output="out_roughness" />
      //   </standard_surface>
      //   <surfacematerial name="Tiled_Brass" type="material">
      //     <input name="surfaceshader" type="surfaceshader" nodename="SR_brass1" />
      //   </surfacematerial>
      // </materialx>`;

      const materialObj = await new MaterialXLoader()
        .setPath(SAMPLE_PATH)
        .loadAsync('standard_surface_metal_brushed.mtlx')
        .then(({ materials }) => Object.values(materials).pop());
      // console.log('loaded materialassetraw', materialAssetRaw);

      // const materialLoader = new MaterialXLoader();
      // console.log('about to parse');
      // materialObj = materialLoader.parse(materialAssetRaw);
      console.log('parsed materialobj', materialObj);

      // const brassMaterial = Object.values(materialObj.materials).pop();
      const brassMaterial = materialObj;

      // const testMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });

      console.log('brassMaterial', brassMaterial);

      const testMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(0xff0000), // Red
        metalness: 0.5,
        roughness: 0.4,
        clearcoat: 1.0, // High clearcoat for reflective surface
        clearcoatRoughness: 0.1,
      });

      console.log('testmaterial', testMaterial);
      const calibrationMesh = model.getObjectByName('Calibration_Mesh');
      console.log('calibrationMesh', calibrationMesh);
      calibrationMesh.material = testMaterial;

      const Preview_Mesh = model.getObjectByName('Preview_Mesh');
      console.log('Preview_Mesh', Preview_Mesh);
      Preview_Mesh.material = testMaterial;
    } catch (err) {
      console.error('error loading materialasset', err);
    }

    // const object = await loadAsync(
    //   [model['3d.obj'], model['3d.mtl']],
    //   // @ts-ignore
    //   null,
    //   (name) => model[name]
    // );

    // object.position.y += 2;
    // object.position.z -= 2;
    // object.scale.set(0.02, 0.02, 0.02);

    // scene.add(object);

    // camera.lookAt(cube.position);

    // function update() {
    //   cube.rotation.y += 0.05;
    //   cube.rotation.x += 0.025;
    // }

    // Setup an animation loop
    const render = () => {
      timeoutRef.current = requestAnimationFrame(render);
      //   update();
      renderer.render(scene, camera);
      gl.endFrameEXP();
    };
    render();
  };

  return (
    <GLView
      style={{ flex: 1 }}
      onContextCreate={onContextCreate}
      enableExperimentalWorkletSupport
    />
  );
}

class IconMesh extends Mesh {
  constructor() {
    super();
    this.geometry = new BoxGeometry(1.0, 1.0, 1.0);

    // Example of loading a texture from the web:
    // loadAsync(
    //   'https://github.com/expo/expo/blob/main/apps/bare-expo/assets/splash.png?raw=true'
    // ).then((texture) => {
    //   console.log('loadAsync texture', texture);
    //   this.material = new MeshBasicMaterial({ map: texture });
    // });

    // Example of loading a local asset:
    const asset = Asset.fromModule(require('./assets/icon.png'));
    const loader = new TextureLoader();
    asset.downloadAsync().then((downloadedAsset) => {
      loader.load(asset.localUri, (texture) => {
        this.material = new MeshBasicMaterial({ map: texture });
      });
    });
  }
}

// const brass = {
//   anisotropy: 0,
//   anisotropyRotation: 0,
//   attenuationColor: 16777215,
//   blendColor: 0,
//   clearcoat: 0,
//   clearcoatRoughness: 0,
//   color: 16777215,
//   emissive: 0,
//   envMapIntensity: 1,
//   envMapRotation: [0, 0, 0, 'XYZ'],
//   inputNodes: {
//     clearcoatNode: '1729ee68-2de7-4ebc-ada0-98e323ae8a6e',
//     clearcoatRoughnessNode: '2346cae4-b6d7-4f09-8beb-326b36675b95',
//     colorNode: '1ec24a66-de49-4649-99af-e0944e844a12',
//     metalnessNode: '482c6a28-3b52-47ad-9d2a-e31004e688a1',
//     roughnessNode: '2e99cf5e-35bc-4f4e-a62e-1ef138b29b56',
//   },
//   iridescence: 0,
//   iridescenceIOR: 1.3,
//   iridescenceThicknessRange: [100, 400],
//   metadata: { generator: 'Material.toJSON', type: 'Material', version: 4.6 },
//   metalness: 0,
//   name: 'Metal_Brushed',
//   nodes: [[Object], [Object], [Object], [Object], [Object], [Object], [Object]],
//   roughness: 1,
//   sheen: 0,
//   sheenColor: 0,
//   sheenRoughness: 1,
//   specularColor: 16777215,
//   specularIntensity: 1,
//   thickness: 0,
//   transmission: 0,
//   type: 'MeshPhysicalNodeMaterial',
//   uuid: 'f63e431a-9d90-4f52-b4bc-2c80a2e86d05',
// };

// const test = {
//   anisotropy: 0,
//   anisotropyRotation: 0,
//   attenuationColor: 16777215,
//   blendColor: 0,
//   clearcoat: 1,
//   clearcoatRoughness: 0.1,
//   color: 16711680,
//   emissive: 0,
//   envMapIntensity: 1,
//   envMapRotation: [0, 0, 0, 'XYZ'],
//   iridescence: 0,
//   iridescenceIOR: 1.3,
//   iridescenceThicknessRange: [100, 400],
//   metadata: { generator: 'Material.toJSON', type: 'Material', version: 4.6 },
//   metalness: 0.5,
//   reflectivity: 0.5,
//   roughness: 0.4,
//   sheen: 0,
//   sheenColor: 0,
//   sheenRoughness: 1,
//   specularColor: 16777215,
//   specularIntensity: 1,
//   thickness: 0,
//   transmission: 0,
//   type: 'MeshPhysicalMaterial',
//   uuid: 'a9b72331-3a99-4451-8caf-9d20a184d18e',
// };
