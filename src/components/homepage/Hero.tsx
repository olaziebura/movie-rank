"use client";

// import AiChat from "./AiChat";
import { motion } from "framer-motion";

export const Hero = () => {
  return (
    <section className="relative flex flex-col items-center justify-center bg-neutral-800 text-white py-12 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-600 to-neutral-800 z-0" />
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-yellow-400/60"
          initial={{
            x: Math.random() * 1200,
            y: Math.random() * 800,
            opacity: "0.5",
          }}
          animate={{
            y: -100,
            opacity: 0,
          }}
          transition={{
            duration: 20 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* <AiChat /> */}
    </section>
  );
};
