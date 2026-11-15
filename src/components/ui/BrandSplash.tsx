import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function BrandSplash() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(
      () => setVisible(false),
      prefersReduced ? 200 : 1050
    );
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } }}
          className="fixed inset-0 z-[100] bg-[#09090B] flex flex-col items-center justify-center px-6"
          aria-label="Loading SAIM CLOTHES"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="text-center"
          >
            <div className="w-14 h-14 mx-auto mb-5 border border-[#D4AF37]/60 flex items-center justify-center rotate-45">
              <span className="-rotate-45 font-display text-2xl font-semibold text-[#D4AF37] tracking-wider">
                SC
              </span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-[0.18em] text-[#F4F4F5]">
              SAIM CLOTHES
            </h1>
            <p className="text-xs tracking-[0.25em] text-zinc-400 mt-2 uppercase">
              Tailored Menswear Atelier
            </p>
            <div className="w-44 h-[1px] bg-zinc-800 mx-auto mt-6 overflow-hidden">
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-[#D4AF37] origin-left"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
