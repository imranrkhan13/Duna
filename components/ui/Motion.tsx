"use client";

import { motion, type HTMLMotionProps } from "framer-motion";

type RevealProps = HTMLMotionProps<"div"> & {
  delay?: number;
};

export function Reveal({ delay = 0, children, ...props }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
      transition={{ duration: 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
      viewport={{ once: true, margin: "-80px" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function HoverLift({ children, ...props }: HTMLMotionProps<"div">) {
  return (
    <motion.div
      transition={{ duration: 0.2, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export const MotionDiv = motion.div;
export const MotionButton = motion.button;
