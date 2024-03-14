import { ExpoWebGLRenderingContext, GLView } from 'expo-gl';
import { Renderer } from 'expo-three';
import * as React from 'react';
import { MathUtils, Raycaster, Vector2 } from 'three';
import { Color, DirectionalLight, MeshLambertMaterial } from 'three';
import { BoxGeometry, Mesh, PerspectiveCamera, Scene } from 'three';

const radius = 5;
const pointer = new Vector2();
let INTERSECTED: any;
let theta = 0;

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

    // Create a WebGLRenderer without a DOM element
    const renderer = new Renderer({
      gl,
      antialias: true,
      width: width,
      height: height,
    });

    const camera = new PerspectiveCamera(70, width / height, 0.1, 100);

    const scene = new Scene();
    scene.background = new Color(0xf0f0f0);

    const light = new DirectionalLight(0xffffff, 3);
    light.position.set(1, 1, 1).normalize();
    scene.add(light);

    const geometry = new BoxGeometry();

    for (let i = 0; i < 2000; i++) {
      const object = new Mesh(
        geometry,
        new MeshLambertMaterial({ color: Math.random() * 0xffffff })
      );

      object.position.x = Math.random() * 40 - 20;
      object.position.y = Math.random() * 40 - 20;
      object.position.z = Math.random() * 40 - 20;

      object.rotation.x = Math.random() * 2 * Math.PI;
      object.rotation.y = Math.random() * 2 * Math.PI;
      object.rotation.z = Math.random() * 2 * Math.PI;

      object.scale.x = Math.random() + 0.5;
      object.scale.y = Math.random() + 0.5;
      object.scale.z = Math.random() + 0.5;

      scene.add(object);
    }

    const raycaster = new Raycaster();

    function update() {
      theta += 0.1;

      camera.position.x = radius * Math.sin(MathUtils.degToRad(theta));
      camera.position.y = radius * Math.sin(MathUtils.degToRad(theta));
      camera.position.z = radius * Math.cos(MathUtils.degToRad(theta));
      camera.lookAt(scene.position);

      camera.updateMatrixWorld();

      // find intersections

      raycaster.setFromCamera(pointer, camera);

      const intersects = raycaster.intersectObjects(scene.children, false);

      if (intersects.length > 0) {
        if (INTERSECTED != intersects[0].object) {
          if (INTERSECTED)
            INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

          INTERSECTED = intersects[0].object;
          INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
          INTERSECTED.material.emissive.setHex(0xff0000);
        }
      } else {
        if (INTERSECTED)
          INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);

        INTERSECTED = null;
      }
    }

    // Setup an animation loop
    const render = () => {
      timeoutRef.current = requestAnimationFrame(render);
      update();
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
