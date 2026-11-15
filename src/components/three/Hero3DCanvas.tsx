import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const _targetRot = new THREE.Vector2();

function detectSoftwareWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createWeaveTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#151518';
  ctx.fillRect(0, 0, 256, 256);

  // Fine diagonal twill / herringbone textile weave
  for (let y = 0; y < 256; y += 4) {
    for (let x = 0; x < 256; x += 4) {
      const diag = ((x + y) % 8 === 0) ? 26 : 16;
      ctx.fillStyle = `rgb(${diag}, ${diag}, ${diag + 3})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, maxAnisotropy);
  return tex;
}

export function Hero3DCanvas() {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [contextLost, setContextLost] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const isSoftwareGl = detectSoftwareWebGL();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setContextLost(true);
      return;
    }

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 560;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x09090b);
    scene.fog = new THREE.FogExp2(0x09090b, 0.045);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 60);
    camera.position.set(0, 1.85, 6.2);
    camera.lookAt(0, 1.35, 0);

    // Procedural Studio Environment Map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envRT = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    pmremGenerator.dispose();

    // 3-Point Warm/Cool Studio Rig
    const hemiLight = new THREE.HemisphereLight(0xcbd5e1, 0x18181b, 0.75);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffe4b5, 2.4);
    keyLight.position.set(4.5, 6.5, 4.5);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.camera.left = -4;
    keyLight.shadow.camera.right = 4;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -4;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xd4af37, 1.8);
    rimLight.position.set(-4.5, 4.2, -3.5);
    scene.add(rimLight);

    // Materials
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const weaveTex = createWeaveTexture(maxAniso);

    const obsidianStoneMat = new THREE.MeshStandardMaterial({
      color: 0x141417,
      roughness: 0.35,
      metalness: 0.15,
    });

    const brushedGoldMat = new THREE.MeshPhysicalMaterial({
      color: 0xd4af37,
      metalness: 0.92,
      roughness: 0.18,
      clearcoat: 0.4,
      anisotropy: 0.75,
    });

    const woolFabricMat = new THREE.MeshPhysicalMaterial({
      color: 0x1b1c20,
      map: weaveTex,
      roughness: 0.85,
      metalness: 0.04,
      sheen: 0.85,
      sheenRoughness: 0.45,
      sheenColor: new THREE.Color(0xd4af37),
    });

    const innerShirtMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f0f12,
      roughness: 0.65,
      metalness: 0.05,
      sheen: 0.5,
      sheenColor: new THREE.Color(0x52525b),
    });

    // Ground & Contact Shadow Disc
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.9,
      metalness: 0.05,
    });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(14, 48), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Composite 8-part Tailored Atelier Mannequin Group
    const atelierGroup = new THREE.Group();
    scene.add(atelierGroup);

    // 1. Stone Plinth + Gold Bevel Ring (bottom-center grounded)
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(1.15, 1.25, 0.2, 48),
      obsidianStoneMat
    );
    plinth.position.y = 0.1;
    plinth.receiveShadow = true;
    plinth.castShadow = true;
    atelierGroup.add(plinth);

    const plinthTrim = new THREE.Mesh(
      new THREE.TorusGeometry(1.16, 0.022, 16, 64),
      brushedGoldMat
    );
    plinthTrim.rotation.x = Math.PI / 2;
    plinthTrim.position.y = 0.2;
    atelierGroup.add(plinthTrim);

    // 2. Brushed Gold Stand Rod
    const standPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.055, 1.05, 24),
      brushedGoldMat
    );
    standPole.position.y = 0.72;
    standPole.castShadow = true;
    atelierGroup.add(standPole);

    const standCollar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.13, 0.08, 24),
      brushedGoldMat
    );
    standCollar.position.y = 0.24;
    atelierGroup.add(standCollar);

    // Rotating Bust Sub-group
    const bustGroup = new THREE.Group();
    bustGroup.position.y = 1.22;
    atelierGroup.add(bustGroup);

    // 3. Sculpted Tailored Torso (LatheGeometry)
    const torsoPoints = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.36, 0.02),
      new THREE.Vector2(0.38, 0.28),
      new THREE.Vector2(0.35, 0.58),
      new THREE.Vector2(0.46, 0.92),
      new THREE.Vector2(0.54, 1.18),
      new THREE.Vector2(0.24, 1.32),
      new THREE.Vector2(0.14, 1.44),
      new THREE.Vector2(0.0, 1.46),
    ];
    const torsoGeo = new THREE.LatheGeometry(torsoPoints, 40);
    torsoGeo.scale(1.16, 1.0, 0.68);
    const torsoMesh = new THREE.Mesh(torsoGeo, woolFabricMat);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    bustGroup.add(torsoMesh);

    // 4. Inner Shirt V-Placket & Collar
    const placketGeo = new THREE.BoxGeometry(0.16, 0.78, 0.14);
    const placketMesh = new THREE.Mesh(placketGeo, innerShirtMat);
    placketMesh.position.set(0, 0.9, 0.25);
    bustGroup.add(placketMesh);

    const collarGeo = new THREE.TorusGeometry(0.165, 0.032, 16, 36, Math.PI * 1.45);
    const collarMesh = new THREE.Mesh(collarGeo, brushedGoldMat);
    collarMesh.rotation.x = Math.PI / 2 - 0.15;
    collarMesh.rotation.z = -Math.PI * 0.22;
    collarMesh.position.set(0, 1.36, 0.02);
    bustGroup.add(collarMesh);

    // 5. Tailored Jacket Lapels (ExtrudeGeometry)
    const lapelShape = new THREE.Shape();
    lapelShape.moveTo(0, 0);
    lapelShape.lineTo(0.19, 0.42);
    lapelShape.lineTo(0.09, 0.48);
    lapelShape.lineTo(-0.04, 0.1);
    lapelShape.closePath();

    const lapelGeo = new THREE.ExtrudeGeometry(lapelShape, {
      depth: 0.035,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2,
    });

    const leftLapel = new THREE.Mesh(lapelGeo, woolFabricMat);
    leftLapel.position.set(0.07, 0.68, 0.27);
    leftLapel.rotation.y = -0.22;
    leftLapel.castShadow = true;
    bustGroup.add(leftLapel);

    const rightLapel = new THREE.Mesh(lapelGeo, woolFabricMat);
    rightLapel.scale.x = -1;
    rightLapel.position.set(-0.07, 0.68, 0.27);
    rightLapel.rotation.y = 0.22;
    rightLapel.castShadow = true;
    bustGroup.add(rightLapel);

    // 6. Four Brushed Gold Placket Buttons
    const buttonGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.016, 18);
    for (let i = 0; i < 4; i++) {
      const btn = new THREE.Mesh(buttonGeo, brushedGoldMat);
      btn.rotation.x = Math.PI / 2;
      btn.position.set(0, 0.38 + i * 0.18, 0.305 - i * 0.008);
      bustGroup.add(btn);
    }

    // 7. Neck Finial Cap
    const neckCap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.145, 0.145, 0.05, 32),
      brushedGoldMat
    );
    neckCap.position.y = 1.46;
    bustGroup.add(neckCap);

    // 8. Architectural Gold Halo Rings
    const outerRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.55, 0.012, 16, 96),
      brushedGoldMat
    );
    outerRing.position.y = 1.95;
    outerRing.rotation.x = Math.PI * 0.42;
    outerRing.rotation.y = 0.24;
    atelierGroup.add(outerRing);

    const innerRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.22, 0.009, 12, 80),
      brushedGoldMat
    );
    innerRing.position.y = 1.95;
    innerRing.rotation.x = -Math.PI * 0.36;
    innerRing.rotation.y = -0.3;
    atelierGroup.add(innerRing);

    // 9. Instanced Gold Dust Particles
    const particleCount = 48;
    const pGeo = new THREE.OctahedronGeometry(0.016, 0);
    const pInst = new THREE.InstancedMesh(pGeo, brushedGoldMat, particleCount);
    const dummy = new THREE.Object3D();
    const pData: { r: number; y: number; a: number; speed: number; scale: number }[] = [];
    for (let i = 0; i < particleCount; i++) {
      const r = 1.3 + Math.random() * 1.6;
      const y = 0.4 + Math.random() * 2.9;
      const a = Math.random() * Math.PI * 2;
      const speed = 0.12 + Math.random() * 0.2;
      const scale = 0.65 + Math.random() * 0.7;
      pData.push({ r, y, a, speed, scale });
      dummy.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      pInst.setMatrixAt(i, dummy.matrix);
    }
    pInst.instanceMatrix.needsUpdate = true;
    pInst.computeBoundingSphere();
    scene.add(pInst);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    const onPointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      _targetRot.set(nx * 0.35, ny * 0.12);
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 560;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const canvasEl = renderer.domElement;
    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => setContextLost(false);
    canvasEl.addEventListener('webglcontextlost', onContextLost);
    canvasEl.addEventListener('webglcontextrestored', onContextRestored);

    let frameId = 0;
    let disposed = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (!gl || !gl.fenceSync) {
        frameId = window.setTimeout(cb, 80);
        return;
      }
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      const elapsed = clock.getElapsedTime();

      if (!prefersReduced) {
        bustGroup.rotation.y = THREE.MathUtils.damp(
          bustGroup.rotation.y,
          elapsed * 0.35 + _targetRot.x,
          3.5,
          delta
        );
        outerRing.rotation.z = elapsed * 0.18;
        innerRing.rotation.z = -elapsed * 0.24;

        for (let i = 0; i < particleCount; i++) {
          const item = pData[i];
          const angle = item.a + elapsed * item.speed;
          dummy.position.set(
            Math.cos(angle) * item.r,
            item.y + Math.sin(elapsed * 0.8 + i) * 0.08,
            Math.sin(angle) * item.r
          );
          dummy.rotation.y = elapsed + i;
          dummy.scale.setScalar(item.scale);
          dummy.updateMatrix();
          pInst.setMatrixAt(i, dummy.matrix);
        }
        pInst.instanceMatrix.needsUpdate = true;
      }

      renderer.render(scene, camera);

      if (prefersReduced) return;
      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('resize', onResize);
      canvasEl.removeEventListener('webglcontextlost', onContextLost);
      canvasEl.removeEventListener('webglcontextrestored', onContextRestored);

      scene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          mesh.geometry?.dispose();
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material?.dispose();
          }
        }
      });
      weaveTex.dispose();
      envRT.dispose();
      renderer.dispose();
      if (canvasEl.parentNode === container) {
        container.removeChild(canvasEl);
      }
    };
  }, []);

  if (contextLost) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#121215] via-[#09090B] to-[#1A160B]">
        <div className="text-center px-6">
          <p className="font-display text-3xl text-[#D4AF37]">SAIM CLOTHES</p>
          <p className="text-xs text-zinc-400 mt-1">3D Atelier Showcase</p>
        </div>
      </div>
    );
  }

  return <div ref={mountRef} className="w-full h-full" aria-label="Interactive 3D SAIM CLOTHES Garment Showcase" />;
}
