import React from "react"
import { motion, AnimatePresence } from "framer-motion"

const PurchaseListBottomBar = ({
  visible = true,
  label,
  icon: Icon,
  onClick,
}) => {
  return (
    <AnimatePresence initial={false}>
      {visible ? (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="absolute inset-x-0 bottom-0 z-30 border-t border-rose-200 bg-rose-50/95 px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur"
        >
          <button
            type="button"
            onClick={onClick}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-rose-500 px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-rose-200 active:scale-[0.98] active:bg-rose-600 transition"
          >
            {Icon ? <Icon size={18} /> : null}
            <span>{label}</span>
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

export default PurchaseListBottomBar
