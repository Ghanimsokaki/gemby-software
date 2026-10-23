"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { FAQ } from "@/lib/config";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl divide-y divide-white/[0.07] overflow-hidden rounded-2xl border border-white/[0.07] bg-panel/40 backdrop-blur-sm">
      {FAQ.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q}>
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03] sm:px-6"
            >
              <span className="font-mono text-[0.7rem] text-brand-500">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className={`flex-1 text-[0.92rem] font-medium transition-colors ${
                  isOpen ? "text-white" : "text-slate-300"
                }`}
              >
                {item.q}
              </span>
              <span
                className={`grid size-6 shrink-0 place-items-center rounded-md border transition-all duration-300 ${
                  isOpen
                    ? "rotate-45 border-brand-400/40 bg-brand-400/10 text-brand-300"
                    : "border-white/10 text-slate-500"
                }`}
              >
                <Plus className="size-3.5" />
              </span>
            </button>

            <div
              className="grid transition-all duration-300 ease-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-5 pl-[3.4rem] text-[0.87rem] leading-relaxed text-slate-400 sm:px-6 sm:pl-[3.9rem]">
                  {item.a}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
