import { DOMParser } from '@xmldom/xmldom';
import { TextureLoader } from 'three';

import {
  MaterialXLoader,
  MaterialXNode,
} from 'three/examples/jsm/loaders/MaterialXLoader';

export class ExpoMaterialXLoader extends MaterialXLoader {
  constructor(manager) {
    super(manager);
  }

  parse(text) {
    return new ExpoMaterialX(super.manager, super.path).parse(text);
  }
}

class ExpoMaterialX {
  constructor(manager, path) {
    this.manager = manager;
    this.path = path;
    this.resourcePath = '';

    this.nodesXLib = new Map();
    //this.nodesXRefLib = new WeakMap();

    this.textureLoader = new TextureLoader(manager);
  }

  addMaterialXNode(materialXNode) {
    this.nodesXLib.set(materialXNode.nodePath, materialXNode);
  }

  /*getMaterialXNodeFromXML( xmlNode ) {

        return this.nodesXRefLib.get( xmlNode );

    }*/

  getMaterialXNode(...names) {
    return this.nodesXLib.get(names.join('/'));
  }

  parseNode(nodeXML, nodePath = '') {
    const materialXNode = new MaterialXNode(this, nodeXML, nodePath);
    // console.log( "materialXNode", materialXNode.nodeXML)
    if (materialXNode.nodePath) this.addMaterialXNode(materialXNode);

    // NEW CHANGES FROM THREEJS --- children doesn't work with domparser lib, need to filter through childNodes
    // Assuming 'nodeXML' is the current node you're working with
    const elementChildren = Array.from(nodeXML.childNodes).filter(
      (node) => node.nodeType === node.ELEMENT_NODE
    );

    // console.log("nodexmlchildren", nodeXML.children)

    for (const childNodeXML of elementChildren) {
      const childMXNode = this.parseNode(childNodeXML, materialXNode.nodePath);
      materialXNode.add(childMXNode);
    }

    return materialXNode;
  }

  parse(text) {
    const rootXML = new DOMParser().parseFromString(
      text,
      'application/xml'
    ).documentElement;

    this.textureLoader.setPath(this.path);

    //

    const materials = this.parseNode(rootXML).toMaterials();

    return { materials };
  }
}
