import React from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface InteractiveHoverButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  text?: string
  variant?: "primary" | "secondary" | "danger"
}

const InteractiveHoverButton = React.forwardRef<
  HTMLButtonElement,
  InteractiveHoverButtonProps
>(({ text = "Button", className, variant = "primary", ...props }, ref) => {
  const isSecondary = variant === "secondary"
  const isDanger = variant === "danger"

  return (
    <button
      ref={ref}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-full px-7 py-2.5 text-center font-semibold text-white transition-all duration-300 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]",
        isDanger
          ? "border border-slate-600 bg-[#111318] hover:border-slate-300 hover:bg-[#181b20]"
          : isSecondary
            ? "border border-slate-600 bg-[#101218] hover:border-slate-400 hover:bg-[#161922]"
            : "border border-slate-500 bg-[#0c0f16] hover:border-slate-200 hover:bg-[#151924]",
        className
      )}
      {...props}
    >
      <span className="relative z-20 inline-block translate-x-1 transition-all duration-300 group-hover:translate-x-12 group-hover:opacity-0">
        {text}
      </span>
      <div className="absolute top-0 left-0 z-20 flex h-full w-full translate-x-12 items-center justify-center gap-2 text-white opacity-0 transition-all duration-300 group-hover:-translate-x-0 group-hover:opacity-100">
        <span>{text}</span>
        <ArrowRight className="w-4 h-4" />
      </div>
      <div
        className={cn(
          // Hidden dot by default; expands only on hover so it doesn't sit on the text
          "absolute left-[20%] top-[40%] z-10 h-0 w-0 opacity-0 rounded-full transition-all duration-300 group-hover:left-[-15%] group-hover:top-[-15%] group-hover:h-[140%] group-hover:w-[140%] group-hover:opacity-100",
          isDanger || isSecondary
            ? "bg-slate-500"
            : "bg-slate-300"
        )}
      ></div>
    </button>
  )
})

InteractiveHoverButton.displayName = "InteractiveHoverButton"

export { InteractiveHoverButton }