"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState } from "react"

export function IntroLoader() {
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let raf = 0
    const start = performance.now()
    const dur = 1800
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur)
      const eased = 1 - Math.pow(1 - p, 3)
      setProgress(Math.round(eased * 100))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setTimeout(() => setDone(true), 260)
    }
    raf = requestAnimationFrame(tick)
    document.body.style.overflow = "hidden"
    return () => {
      cancelAnimationFrame(raf)
      document.body.style.overflow = ""
    }
  }, [])

  useEffect(() => {
    if (done) document.body.style.overflow = ""
  }, [done])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.65, 0, 0.35, 1] }}
          className="fixed inset-0 z-[200] flex items-end justify-between bg-[oklch(0.08_0.005_40)] p-6 md:p-10"
        >
          <motion.div
            exit={{ y: "-101%" }}
            transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
            className="absolute inset-0 bg-[oklch(0.08_0.005_40)]"
          >
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage:
                "linear-gradient(oklch(0.94 0.015 80 / 0.4) 1px, transparent 1px), linear-gradient(90deg, oklch(0.94 0.015 80 / 0.4) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }} />
          </motion.div>

          <div className="relative flex flex-col gap-1">
            <span className="font-wordmark-tight text-[22px] font-semibold text-[oklch(0.94_0.015_80)]">VAISH</span>
            <span className="font-hud text-[10px] text-[oklch(0.62_0.02_60)]">Entry Sequence // by Aryaman V. Gupta</span>
          </div>

          <div className="relative flex items-end gap-6">
            <div className="font-display text-[72px] leading-none text-[oklch(0.94_0.015_80)] md:text-[120px]">
              <motion.span
                key={Math.floor(progress / 5)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="tabular-nums"
              >
                {String(progress).padStart(3, "0")}
              </motion.span>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-px bg-[oklch(0.94_0.015_80_/_0.1)]">
            <motion.div
              className="h-full bg-[oklch(0.72_0.14_50)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="absolute top-6 right-6 flex items-center gap-2 md:top-10 md:right-10">
            <span className="h-[6px] w-[6px] rounded-full bg-[oklch(0.72_0.14_50)] animate-loader-tick" />
            <span className="font-hud text-[10px] text-[oklch(0.62_0.02_60)]">Signal Acquired</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
