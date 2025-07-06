"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

import { WaitlistDialog } from "./waitlist-dialog";

const menuVariants = {
  hidden: {
    opacity: 0,
    y: -10,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -10,
  },
} satisfies Variants;

const navVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
} satisfies Variants;

const linkVariants = {
  hidden: {
    opacity: 0,
    y: -10,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 20,
    },
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 35,
      mass: 0.8,
    },
  },
} satisfies Variants;

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="z-50 hidden items-center justify-center gap-6 max-sm:flex">
      <button
        className="relative flex h-6 w-6 touch-manipulation flex-col justify-center gap-2"
        aria-label="Toggle menu"
        onClick={() => setIsOpen(!isOpen)}
      >
        <motion.div
          className="bg-foreground absolute h-[2px] w-6 origin-center"
          animate={isOpen ? { rotate: 42, y: 0 } : { rotate: 0, y: -4 }}
          transition={{ stiffness: 450, damping: 25, duration: 0.14 }}
        />
        <motion.div
          className="bg-foreground absolute h-[2px] w-6 origin-center"
          animate={isOpen ? { rotate: -42, y: 0 } : { rotate: 0, y: 4 }}
          transition={{ stiffness: 450, damping: 25, duration: 0.14 }}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.1 }}
            className="bg-background/95 fixed inset-0 top-14 z-40 p-6 backdrop-blur-sm"
          >
            <motion.nav
              variants={navVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-col text-lg"
            >
              <motion.div variants={linkVariants}>
                <Link
                  href="#how-it-works"
                  className="block w-full py-6"
                  onClick={() => setIsOpen(false)}
                >
                  How it works
                </Link>
              </motion.div>
              <motion.div variants={linkVariants}>
                <Link
                  href="#features"
                  className="block w-full py-6"
                  onClick={() => setIsOpen(false)}
                >
                  Features
                </Link>
              </motion.div>
              <motion.div variants={linkVariants}>
                <Link href="#team" className="block w-full py-6" onClick={() => setIsOpen(false)}>
                  Use cases
                </Link>
              </motion.div>
              <motion.div variants={linkVariants}>
                <Link href="/" className="block w-full py-6" onClick={() => setIsOpen(false)}>
                  Login
                </Link>
              </motion.div>
              <motion.div variants={linkVariants}>
                <div className="block w-full py-6">
                  <WaitlistDialog buttonSize="lg" className="h-12 w-full text-lg font-normal" />
                </div>
              </motion.div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
