// app/components/ThumbnailCapture.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { UnlockItem } from '../lib/unlocks';
import { districts } from '../data/city';
import { generateLayout } from '../lib/cityLayoutGenerator';

const THUMB_W = 150;
const THUMB_H = 90;

// Module-level cache: level → (itemId → dataUrl)
const thumbnailCache = new Map<number, Map<string, string>>();

interface Props {
  level: number;
  items: UnlockItem[];
  onThumbnailReady: (itemId: string, dataUrl: string) => void;
}

export function ThumbnailCapture({ level, items, onThumbnailReady }: Props) {
  const { gl, scene } = useThree();
  const capturedRef = useRef(false);

  useEffect(() => {
    if (capturedRef.current || items.length === 0) return;
    capturedRef.current = true;

    // Return cached thumbnails immediately if we have them
    const cached = thumbnailCache.get(level);
    if (cached) {
      for (const [id, url] of cached.entries()) {
        onThumbnailReady(id, url);
      }
      return;
    }

    const layout = generateLayout(districts);
    const levelCache = new Map<string, string>();
    thumbnailCache.set(level, levelCache);

    // Offscreen render target
    const rt = new THREE.WebGLRenderTarget(THUMB_W, THUMB_H, {
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    });

    // Isometric camera for thumbnails
    const aspect = THUMB_W / THUMB_H;
    const cam = new THREE.OrthographicCamera(
      -aspect * 20, aspect * 20, 20, -20, 0.1, 500
    );

    // Isometric angles (same as main camera)
    const dist = 80;
    const phi  = (35.264 * Math.PI) / 180;
    const theta = (45 * Math.PI) / 180;

    // Off-screen 2D canvas for pixel readback
    const readCanvas = document.createElement('canvas');
    readCanvas.width  = THUMB_W;
    readCanvas.height = THUMB_H;
    const ctx = readCanvas.getContext('2d')!;

    let cancelled = false;
    const itemQueue = [...items];

    function captureNext() {
      if (cancelled || itemQueue.length === 0) {
        rt.dispose();
        return;
      }

      const item = itemQueue.shift()!;

      // Find world center for this item
      const block = layout.blocks.find(b => b.districtId === item.districtId);
      if (!block) {
        captureNext();
        return;
      }

      let cx = block.x + block.width / 2;
      let cz = block.z + block.depth / 2;

      // For building/floor items, try to use the building's slot position
      if (item.buildingId) {
        const slot = block.buildingSlots.find(s => s.buildingId === item.buildingId);
        if (slot) { cx = slot.x; cz = slot.z; }
      }

      // Aim camera at target
      cam.position.set(
        cx + dist * Math.cos(phi) * Math.sin(theta),
        dist * Math.sin(phi),
        cz + dist * Math.cos(phi) * Math.cos(theta),
      );

      // Zoom level: tighter for buildings than districts
      const zoom = item.type === 'district' ? 8 : 22;
      cam.left   = -aspect * zoom;
      cam.right  =  aspect * zoom;
      cam.top    =  zoom;
      cam.bottom = -zoom;
      cam.updateProjectionMatrix();
      cam.lookAt(cx, 0, cz);

      // Render offscreen
      const prevRenderTarget = gl.getRenderTarget();
      gl.setRenderTarget(rt);
      gl.render(scene, cam);
      gl.setRenderTarget(prevRenderTarget);

      // Read pixels
      const pixels = new Uint8Array(THUMB_W * THUMB_H * 4);
      gl.readRenderTargetPixels(rt, 0, 0, THUMB_W, THUMB_H, pixels);

      // WebGL pixels are flipped vertically — draw flipped to 2D canvas
      const imageData = new ImageData(new Uint8ClampedArray(pixels), THUMB_W, THUMB_H);
      ctx.putImageData(imageData, 0, 0);

      // Flip vertically using drawImage trick
      const flipCanvas = document.createElement('canvas');
      flipCanvas.width  = THUMB_W;
      flipCanvas.height = THUMB_H;
      const flipCtx = flipCanvas.getContext('2d')!;
      flipCtx.translate(0, THUMB_H);
      flipCtx.scale(1, -1);
      flipCtx.drawImage(readCanvas, 0, 0);

      const dataUrl = flipCanvas.toDataURL('image/webp', 0.82);
      levelCache.set(item.id, dataUrl);
      onThumbnailReady(item.id, dataUrl);

      // ~80ms between captures so the main render loop isn't starved
      setTimeout(captureNext, 80);
    }

    // Start after a short delay so the city has time to settle
    const startTimeout = setTimeout(captureNext, 600);

    return () => {
      cancelled = true;
      clearTimeout(startTimeout);
      rt.dispose();
      capturedRef.current = false;
      // Remove incomplete cache entry so the next mount starts a fresh capture
      // (React Strict Mode fires cleanup before the 600ms timeout can run)
      if (levelCache.size === 0) thumbnailCache.delete(level);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  return null;
}
