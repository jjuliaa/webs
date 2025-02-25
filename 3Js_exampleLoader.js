/*  Loading a Gltf with animation options
    Remember to check if your gltf is valid: 
    https://github.khronos.org/glTF-Validator/
*/

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// import the addon
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer;
let mesh = new THREE.Mesh(); //we will load our gltf scene into this variable

let controls;

//add loader variable 
let loader;

//for animations
let mixer, clips, clock;

let isSpaceDown = false;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    clock = new THREE.Clock();

    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setClearColor( 0x000000, 0 ); // the default
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    //add the loader
    loader = new GLTFLoader();

    loader.load('models/green_cube.glb', function (gltf) {

        mesh = gltf.scene;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        //to log the mesh position for debug
        console.log("mesh position: ", mesh.position.x, mesh.position.y, mesh.position.z);

        scene.add(mesh);
        //for animations:
        // Create an AnimationMixer, and get the list of AnimationClip instances
        mixer = new THREE.AnimationMixer(gltf.scene);

        gltf.animations.forEach((clip) => {

            mixer.clipAction(clip).play();

        });

    }, undefined, function (error) {

        console.error(error);

    });

    // if you cant see your model, play with lighting:
    const light = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(light);
    //note: why is it okay to use const here?
    const light1 = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
    scene.add(light1);

    camera.position.z = 5;

    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keydown', onKeyPressed, false);


}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function onKeyPressed() {
    document.onkeydown = function (e) {
        console.log(e); // see information about key

        if (e.Code = "Space") {
            isSpaceDown = !isSpaceDown; //note the ! means "not" so whatever is true becomes false and false becomes true, like a light switch 
            console.log(isSpaceDown)
        }
    }

}


function animate() {
    requestAnimationFrame(animate);

    // Play animations
    let delta = clock.getDelta();

    //for start and stop with spacebar use "if" statement and the "{ }""
    if (isSpaceDown) {
        console.log("pressed space");
        if (mixer) mixer.update(delta); // otherwise you only need this line to play animation
    }

    //log camera position for debug
    //console.log("cam position: ", camera.position.x, camera.position.y, camera.position.z);
    
    //note: we can also access the gltf.scene via our global varibale mesh and do stuff directly
    //mesh.rotation.x += 0.02;

    renderer.render(scene, camera);
}

init();
animate();

