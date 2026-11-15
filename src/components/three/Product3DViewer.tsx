import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { Eye, RotateCw, ChevronDown, ChevronUp } from 'lucide-react';

interface Product3DViewerProps {
  category: string;
  colorHex: string;
  colorName: string;
  productName: string;
}

type ViewPreset = 'front' | 'detail' | 'side' | 'back';

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

function createFabricWeaveMap(maxAnisotropy: number, isDenim: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#dcdcdc';
  ctx.fillRect(0, 0, 256, 256);

  for (let y = 0; y < 256; y += 3) {
    for (let x = 0; x < 256; x += 3) {
      const pattern = isDenim ? (x + y) % 6 === 0 : x % 6 === 0 || y % 6 === 0;
      ctx.fillStyle = pattern ? 'rgba(255,255,255,0.92)' : 'rgba(190,190,195,0.85)';
      ctx.fillRect(x, y, 2, 2);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, maxAnisotropy);
  return tex;
}

function resolveGarmentType(category: string): 'trousers' | 'hoodie' | 'kurta' | 'polo' | 'shirt' {
  const c = category.toLowerCase();
  if (c.includes('jeans') || c.includes('trouser') || c.includes('pant')) return 'trousers';
  if (c.includes('hoodie') || c.includes('jacket')) return 'hoodie';
  if (c.includes('traditional') || c.includes('kurta')) return 'kurta';
  if (c.includes('t-shirt') || c.includes('polo')) return 'polo';
  return 'shirt';
}

export function Product3DViewer({
  category,
  colorHex,
  colorName,
  productName,
}: Product3DViewerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const fabricMatRef = useRef<THREE.MeshPhysicalMaterial | null>(null);
  const presetTargetRef = useRef<THREE.Vector3 | null>(null);
  const autoSpinRef = useRef<boolean>(true);
  const requestRenderRef = useRef<(() => void) | null>(null);

  const [autoSpin, setAutoSpin] = useState(true);
  const [activePreset, setActivePreset] = useState<ViewPreset>('front');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  // Sync garment color dynamically
  useEffect(() => {
    if (fabricMatRef.current) {
      fabricMatRef.current.color.set(colorHex || '#18181B');
      requestRenderRef.current?.();
    }
  }, [colorHex]);

  // Sync auto-spin ref
  useEffect(() => {
    autoSpinRef.current = autoSpin;
    requestRenderRef.current?.();
  }, [autoSpin]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    const isSoftwareGl = detectSoftwareWebGL();
    if (isSoftwareGl) {
      autoSpinRef.current = false;
      setAutoSpin(false);
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      setContextLost(true);
      return;
    }

    const width = container.clientWidth || 520;
    const height = container.clientHeight || 540;
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111114);
    scene.fog = new THREE.FogExp2(0x111114, 0.05);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    camera.position.set(0, 1.45, 4.4);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.15, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.2;
    controls.maxDistance = 7.5;
    controls.maxPolarAngle = Math.PI * 0.56;
    controls.update();

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envRT.texture;
    pmrem.dispose();

    // 3-Point Warm/Cool Studio Rig
    const hemi = new THREE.HemisphereLight(0xe2e8f0, 0x18181b, 0.85);
    scene.add(hemi);

    const key = new THREE.DirectionalLight(0xfff1d6, 2.2);
    key.position.set(3.5, 5.5, 4);
    key.castShadow = !isSoftwareGl;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.left = -3;
    key.shadow.camera.right = 3;
    key.shadow.camera.top = 3;
    key.shadow.camera.bottom = -3;
    key.shadow.bias = -0.0005;
    scene.add(key);

    const rim = new THREE.DirectionalLight(0xd4af37, 1.4);
    rim.position.set(-3.5, 3.5, -3);
    scene.add(rim);

    // Pedestal Grounding
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(1.1, 1.18, 0.14, 48),
      new THREE.MeshStandardMaterial({ color: 0x18181c, roughness: 0.4, metalness: 0.2 })
    );
    plinth.position.y = 0.07;
    plinth.receiveShadow = true;
    scene.add(plinth);

    const goldMat = new THREE.MeshPhysicalMaterial({
      color: 0xd4af37,
      metalness: 0.92,
      roughness: 0.18,
      anisotropy: 0.8,
    });

    const plinthRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.11, 0.014, 12, 64),
      goldMat
    );
    plinthRing.rotation.x = Math.PI / 2;
    plinthRing.position.y = 0.145;
    scene.add(plinthRing);

    const garmentType = resolveGarmentType(category);
    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const weaveMap = createFabricWeaveMap(maxAniso, garmentType === 'trousers');

    const fabricMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(colorHex || '#18181B'),
      map: weaveMap,
      roughness: garmentType === 'trousers' ? 0.88 : 0.78,
      metalness: 0.04,
      sheen: 0.75,
      sheenRoughness: 0.5,
      sheenColor: new THREE.Color(0xd4af37),
    });
    fabricMatRef.current = fabricMat;

    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.88,
      roughness: 0.22,
    });

    const garmentGroup = new THREE.Group();
    scene.add(garmentGroup);

    // Stand pole
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.032, 0.042, 0.65, 20),
      goldMat
    );
    pole.position.y = 0.45;
    garmentGroup.add(pole);

    if (garmentType === 'trousers') {
      // Composite 7-part Trousers/Denim Model
      const waist = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.44, 0.16, 32),
        fabricMat
      );
      waist.scale.set(1.15, 1, 0.72);
      waist.position.y = 1.62;
      waist.castShadow = true;
      garmentGroup.add(waist);

      const leftLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.14, 1.32, 24),
        fabricMat
      );
      leftLeg.position.set(-0.22, 0.92, 0);
      leftLeg.rotation.z = 0.04;
      leftLeg.castShadow = true;
      garmentGroup.add(leftLeg);

      const rightLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.14, 1.32, 24),
        fabricMat
      );
      rightLeg.position.set(0.22, 0.92, 0);
      rightLeg.rotation.z = -0.04;
      rightLeg.castShadow = true;
      garmentGroup.add(rightLeg);

      // Gold Waist Button + Belt Loops
      const btn = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.025, 0.018, 16),
        trimMat
      );
      btn.rotation.x = Math.PI / 2;
      btn.position.set(0, 1.63, 0.32);
      garmentGroup.add(btn);

      for (let i = -2; i <= 2; i++) {
        const loop = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.12, 0.03), trimMat);
        const angle = i * 0.55;
        loop.position.set(Math.sin(angle) * 0.46, 1.63, Math.cos(angle) * 0.31);
        loop.rotation.y = angle;
        garmentGroup.add(loop);
      }
    } else {
      // Composite 8-part Shirt / Polo / Kurta / Hoodie-Jacket Model
      const torsoProfile = [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.36, 0.02),
        new THREE.Vector2(0.37, 0.3),
        new THREE.Vector2(0.35, 0.62),
        new THREE.Vector2(0.45, 0.95),
        new THREE.Vector2(0.5, 1.18),
        new THREE.Vector2(0.22, 1.3),
        new THREE.Vector2(0.14, 1.38),
        new THREE.Vector2(0.0, 1.4),
      ];
      const torsoGeo = new THREE.LatheGeometry(torsoProfile, 36);
      torsoGeo.scale(1.12, 1.0, 0.66);
      const torso = new THREE.Mesh(torsoGeo, fabricMat);
      torso.position.y = 0.68;
      torso.castShadow = true;
      garmentGroup.add(torso);

      // Left & Right Sleeves
      const sleeveLen = garmentType === 'polo' ? 0.42 : 0.92;
      const sleeveRadiusTop = 0.145;
      const sleeveRadiusBot = garmentType === 'polo' ? 0.125 : 0.095;
      const sleeveGeo = new THREE.CylinderGeometry(sleeveRadiusTop, sleeveRadiusBot, sleeveLen, 20);

      const leftSleeve = new THREE.Mesh(sleeveGeo, fabricMat);
      leftSleeve.position.set(
        garmentType === 'polo' ? -0.6 : -0.68,
        garmentType === 'polo' ? 1.66 : 1.42,
        0
      );
      leftSleeve.rotation.z = -0.45;
      leftSleeve.castShadow = true;
      garmentGroup.add(leftSleeve);

      const rightSleeve = new THREE.Mesh(sleeveGeo, fabricMat);
      rightSleeve.position.set(
        garmentType === 'polo' ? 0.6 : 0.68,
        garmentType === 'polo' ? 1.66 : 1.42,
        0
      );
      rightSleeve.rotation.z = 0.45;
      rightSleeve.castShadow = true;
      garmentGroup.add(rightSleeve);

      // Collar / Hood
      if (garmentType === 'hoodie') {
        const hood = new THREE.Mesh(
          new THREE.SphereGeometry(0.28, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.75),
          fabricMat
        );
        hood.position.set(0, 2.08, -0.06);
        hood.rotation.x = -0.35;
        garmentGroup.add(hood);
      } else {
        const collar = new THREE.Mesh(
          new THREE.TorusGeometry(0.175, 0.036, 14, 32),
          garmentType === 'kurta' ? trimMat : fabricMat
        );
        collar.rotation.x = Math.PI / 2 - 0.1;
        collar.position.set(0, 2.02, 0.01);
        garmentGroup.add(collar);
      }

      // Gold Buttons / Placket Trim
      const btnCount = garmentType === 'polo' ? 3 : 5;
      for (let i = 0; i < btnCount; i++) {
        const btn = new THREE.Mesh(
          new THREE.CylinderGeometry(0.018, 0.018, 0.015, 16),
          trimMat
        );
        btn.rotation.x = Math.PI / 2;
        btn.position.set(0, 1.88 - i * 0.16, 0.305);
        garmentGroup.add(btn);
      }

      // Gold Hanger Hook at top
      const hook = new THREE.Mesh(
        new THREE.TorusGeometry(0.06, 0.012, 10, 24, Math.PI * 1.4),
        goldMat
      );
      hook.position.set(0, 2.18, 0);
      garmentGroup.add(hook);
    }

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let disposed = false;
    let renderBusy = false;
    let renderDirty = false;
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

    function requestRender() {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        const delta = Math.min(clock.getDelta(), 0.05);

        if (presetTargetRef.current) {
          camera.position.x = THREE.MathUtils.damp(
            camera.position.x,
            presetTargetRef.current.x,
            6,
            delta
          );
          camera.position.y = THREE.MathUtils.damp(
            camera.position.y,
            presetTargetRef.current.y,
            6,
            delta
          );
          camera.position.z = THREE.MathUtils.damp(
            camera.position.z,
            presetTargetRef.current.z,
            6,
            delta
          );
          if (camera.position.distanceTo(presetTargetRef.current) < 0.03) {
            presetTargetRef.current = null;
          } else {
            renderDirty = true;
          }
        }

        if (autoSpinRef.current && !isSoftwareGl) {
          garmentGroup.rotation.y += delta * 0.55;
          renderDirty = true;
        }

        controls.update();
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (renderDirty && !disposed) requestRender();
        };

        if (isSoftwareGl) {
          afterDraw(done);
        } else {
          done();
        }
      });
    }

    requestRenderRef.current = requestRender;

    const onControlsStart = () => {
      presetTargetRef.current = null;
      autoSpinRef.current = false;
      setAutoSpin(false);
    };
    const onControlsChange = () => requestRender();
    controls.addEventListener('start', onControlsStart);
    controls.addEventListener('change', onControlsChange);

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth || 520;
      const h = container.clientHeight || 540;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener('resize', onResize);

    const canvasEl = renderer.domElement;
    const onContextLost = (e: Event) => {
      e.preventDefault();
      setContextLost(true);
    };
    const onContextRestored = () => {
      setContextLost(false);
      requestRender();
    };
    canvasEl.addEventListener('webglcontextlost', onContextLost);
    canvasEl.addEventListener('webglcontextrestored', onContextRestored);

    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      controls.removeEventListener('start', onControlsStart);
      controls.removeEventListener('change', onControlsChange);
      controls.dispose();
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
      weaveMap.dispose();
      envRT.dispose();
      renderer.dispose();
      if (canvasEl.parentNode === container) {
        container.removeChild(canvasEl);
      }
    };
  }, [category]);

  const selectPreset = (preset: ViewPreset) => {
    setActivePreset(preset);
    setAutoSpin(false);
    autoSpinRef.current = false;
    const map: Record<ViewPreset, THREE.Vector3> = {
      front: new THREE.Vector3(0, 1.45, 4.4),
      detail: new THREE.Vector3(0.45, 1.85, 2.5),
      side: new THREE.Vector3(4.2, 1.45, 0.2),
      back: new THREE.Vector3(0, 1.45, -4.4),
    };
    presetTargetRef.current = map[preset];
    requestRenderRef.current?.();
  };

  if (contextLost) {
    return (
      <div className="w-full h-full min-h-[460px] flex flex-col items-center justify-center bg-[#111114] border border-zinc-800 rounded-lg p-6 text-center">
        <p className="font-display text-2xl text-[#D4AF37]">{productName}</p>
        <p className="text-xs text-zinc-400 mt-2">
          3D viewport paused · Drag view unavailable on current graphics driver
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[480px] sm:h-[540px] bg-[#111114] border border-zinc-800 rounded-lg overflow-hidden">
      {/* Isolated WebGL mount */}
      <div ref={mountRef} className="w-full h-full" />

      {/* Top-Left Minimal Label (no backdrop-blur over WebGL) */}
      <div className="pointer-events-none absolute top-4 left-4 bg-[#09090B]/90 border border-zinc-800 px-3 py-1.5 rounded-md">
        <p className="text-xs text-zinc-300 font-medium">
          3D Interactive Garment · {colorName}
        </p>
      </div>

      {/* Collapsible Bottom Control Dock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center max-w-[94%]">
        <button
          type="button"
          onClick={() => setDockCollapsed((v) => !v)}
          className="mb-1.5 px-3 py-1 bg-[#09090B]/95 border border-zinc-800 rounded-md text-[11px] text-zinc-300 hover:text-[#D4AF37] flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {dockCollapsed ? 'Show Controls' : 'Hide Controls'}
        </button>

        {!dockCollapsed && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-[#09090B]/95 border border-zinc-800 rounded-lg shadow-xl">
            {(['front', 'detail', 'side', 'back'] as ViewPreset[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => selectPreset(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap shrink-0 ${
                  activePreset === p && !autoSpin
                    ? 'bg-[#D4AF37] text-[#09090B]'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {p}
              </button>
            ))}
            <span className="w-px h-4 bg-zinc-800 mx-0.5" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setAutoSpin((s) => !s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                autoSpin
                  ? 'bg-zinc-100 text-[#09090B]'
                  : 'text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <RotateCw className="w-3.5 h-3.5" />
              360° Spin
            </button>
          </div>
        )}
      </div>

      {/* Drag Hint */}
      <div className="pointer-events-none absolute top-4 right-4 hidden sm:flex items-center gap-1.5 bg-[#09090B]/90 border border-zinc-800 px-2.5 py-1.5 rounded-md text-[11px] text-zinc-400">
        <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
        <span>Drag to Rotate</span>
      </div>
    </div>
  );
}
