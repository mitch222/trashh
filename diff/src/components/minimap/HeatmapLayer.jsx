import { useEffect, useRef } from 'react';
import { blobRadiusForSize } from '../../lib/heatmap';

/**
 * Additive radial blobs on a canvas.
 *
 * Canvas rather than SVG because this is the only layer with many nodes and
 * it redraws on every scrubber tick: 30-60 gradient blobs is a plain loop
 * here, versus 60 filtered <circle> elements React would have to diff each
 * time.
 *
 * Samples flagged `inFountain` draw at a third of the alpha. Riot keeps
 * reporting a position while a champion is dead — usually the fountain — so
 * those samples are visually discounted rather than presented as deliberate
 * presence.
 */
export function HeatmapLayer({ width, height, layers, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // jsdom returns null here and logs "Not implemented". Bail rather than
    // throw so component tests can still assert the surrounding markup.
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const radius = blobRadiusForSize(Math.min(width, height));
    ctx.globalCompositeOperation = 'lighter';

    for (const layer of layers || []) {
      for (const point of layer.points || []) {
        const alpha = point.inFountain ? 0.06 : 0.18;
        const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius);
        gradient.addColorStop(0, `rgba(${layer.color}, ${alpha})`);
        gradient.addColorStop(1, `rgba(${layer.color}, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalCompositeOperation = 'source-over';
  }, [width, height, layers]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ width: '100%', height: '100%' }}
      className={`absolute inset-0 ${className}`}
    />
  );
}
