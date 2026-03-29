import React from "react"
import { ArrowLeft } from "lucide-react"

const InventorySubscreenHeader = ({
  title,
  subtitle,
  onBack,
  actions = [],
  children,
}) => {
  return (
    <div className="sticky top-0 z-20 bg-rose-50/95 backdrop-blur border-b border-amber-100">
      <div className="px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-4">
        <div className="flex items-start gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="mt-0.5 w-10 h-10 rounded-full border border-rose-200 bg-white text-rose-700 flex items-center justify-center shadow-sm active:scale-95 active:bg-rose-50"
              aria-label="Quay lại"
            >
              <ArrowLeft size={20} />
            </button>
          ) : null}

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-rose-900 truncate">{title}</h2>
            {subtitle ? (
              <p className="text-sm text-rose-600 mt-1 leading-relaxed">
                {subtitle}
              </p>
            ) : null}
          </div>

          {actions.length ? (
            <div className="flex items-center gap-2">
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center shadow-sm active:scale-95 ${
                    action.tone === "danger"
                      ? "border-rose-200 bg-rose-50 text-rose-600 active:bg-rose-100"
                      : "border-amber-200 bg-white text-amber-700 active:bg-amber-50"
                  }`}
                  aria-label={action.label}
                >
                  <action.icon size={18} />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </div>
  )
}

export default InventorySubscreenHeader
