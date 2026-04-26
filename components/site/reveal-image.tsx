"use client"

import Image, { type ImageProps } from "next/image"
import { useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"
import { SHIMMER } from "@/lib/shimmer"
import { useFinePointer } from "@/lib/hooks"
import { cn } from "@/lib/utils"

/* ---------------------------------------------------------------------------
 * RevealImage :: cursor-driven porthole reveal.
 *
 * Stack
 *   bottom layer :: the visible image (current state)
 *   top layer    :: an "alternate" image (desaturated past, dimmer realm,
 *                   or a wholly different src), masked by a radial-gradient
 *                   centered on the cursor. The mask only reveals a circle
 *                   ~140px around the pointer.
 *
 * Behavior
 *   - On pointer enter, top layer fades in and the mask follows the cursor.
 *   - On pointer leave, top layer fades out.
 *   - Inside the masked area the cursor reads `data-cursor="view"` so the
 *     CustomCursor switches to its viewing chrome (pre-existing behavior).
 *
 * Reduced motion
 *   The reveal layer never mounts; visitor sees a normal image.
 *
 * SEO
 *   Both images render in the DOM at all times so crawlers see both.
 * ------------------------------------------------------------------------- */

type Props = Omit<ImageProps, "placeholder" | "blurDataURL"> & {
  /** Alternate image source revealed inside the cursor porthole. May be the
      same as the base src — in that case revealClassName supplies the
      visual difference (e.g., a CSS filter for a "past memory" look). */
  revealSrc: string
  /** Alt text for the alternate image. Empty string = decorative. */
  revealAlt?: string
  /** Diameter of the porthole in pixels. Default 220. */
  portholeSize?: number
  /** Optional caption shown beside the cursor inside the masked area. */
  revealLabel?: string
  /** ClassName applied to the reveal-layer Image. If omitted, falls back
      to className. Use this to layer CSS filters on the alternate. */
  revealClassName?: string
}

export function RevealImage({
  revealSrc,
  revealAlt = "",
  portholeSize = 220,
  revealLabel,
  revealClassName,
  className,
  alt,
  ...imageProps
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)
  const reduced = useReducedMotion()
  // Cursor porthole only makes sense with a fine pointer. On touch a tap
  // would briefly fire the mask + ring + alt-image render once, then
  // disappear — confusing UX and dead overhead. Treat coarse pointers the
  // same as reduced-motion: skip the reveal layer entirely.
  const finePointer = useFinePointer()
  const enabled = !reduced && finePointer

  const updatePosition = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const x = ((e.clientX - r.left) / r.width) * 100
    const y = ((e.clientY - r.top) / r.height) * 100
    ref.current!.style.setProperty("--cx", `${x}%`)
    ref.current!.style.setProperty("--cy", `${y}%`)
  }

  return (
    <div
      ref={ref}
      data-cursor={enabled ? "view" : undefined}
      data-cursor-label={enabled ? revealLabel || "Untold" : undefined}
      onPointerEnter={enabled ? () => setActive(true) : undefined}
      onPointerLeave={enabled ? () => setActive(false) : undefined}
      onPointerMove={enabled ? updatePosition : undefined}
      className={cn("relative overflow-hidden", className)}
      style={
        {
          "--cx": "50%",
          "--cy": "50%",
          "--porthole": `${portholeSize}px`,
        } as React.CSSProperties
      }
    >
      {/* Base layer :: the current image. className is destructured out
          of imageProps so we have to forward it explicitly here, otherwise
          callers' `object-cover` (etc.) is dropped on the base layer. */}
      <Image
        {...imageProps}
        alt={alt}
        className={className}
        placeholder="blur"
        blurDataURL={SHIMMER}
      />

      {/* Reveal layer :: the alternate, masked to a soft circle. */}
      {enabled && (
        <div
          aria-hidden={!active}
          className="pointer-events-none absolute inset-0 transition-opacity duration-300 ease-out"
          style={{
            opacity: active ? 1 : 0,
            // The mask is a radial gradient centered on the cursor. Inside
            // the porthole alpha is 1; it ramps to 0 over ~30% of the radius
            // for a soft edge.
            WebkitMaskImage: `radial-gradient(circle var(--porthole) at var(--cx) var(--cy), black 35%, transparent 70%)`,
            maskImage: `radial-gradient(circle var(--porthole) at var(--cx) var(--cy), black 35%, transparent 70%)`,
          }}
        >
          <Image
            src={revealSrc}
            alt={revealAlt}
            fill={imageProps.fill}
            width={imageProps.fill ? undefined : imageProps.width}
            height={imageProps.fill ? undefined : imageProps.height}
            sizes={imageProps.sizes}
            className={revealClassName ?? className}
            placeholder="blur"
            blurDataURL={SHIMMER}
          />
        </div>
      )}

      {/* Cursor-following hint ring :: a thin copper outline traces the
          porthole edge on the active state. Pointer-events:none so it
          never interferes with hover. */}
      {enabled && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-200"
          style={{
            opacity: active ? 1 : 0,
            background: `radial-gradient(circle calc(var(--porthole) * 0.5) at var(--cx) var(--cy), transparent 78%, oklch(0.74 0.15 52 / 0.55) 80%, transparent 84%)`,
          }}
        />
      )}
    </div>
  )
}
