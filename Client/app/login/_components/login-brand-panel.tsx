import Image from "next/image";
import { Droplet, Heart } from "lucide-react";

import { QuoteCarousel } from "./quote-carousel";

/** Left brand panel for the login screen — full-bleed donation art with overlaid copy. */
export function LoginBrandPanel() {
  return (
    <aside className="relative isolate hidden min-h-screen w-1/2 overflow-hidden bg-[#200605] px-8 py-9 text-white sm:px-12 lg:flex lg:px-14">
      {/* Full-bleed donation artwork — horizontal shift lives on the wrapper
          so the float keyframe doesn't override it */}
      <div className="absolute inset-0 -z-10 translate-x-[20%]">
        <Image
          src="/blood-donation.png"
          alt=""
          fill
          priority
          className="animate-float scale-110 object-cover"
        />
      </div>

      {/* Legibility gradient — light darkening on the text side only */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#200605]/85 via-[#200605]/30 to-transparent" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-[#200605]/60 to-transparent" />

      {/* Subtle dotted texture */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.10]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,150,140,0.7) 0.7px, transparent 0.7px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex w-full flex-col">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff7777] to-[#ed1832] shadow-[0_0_30px_rgba(255,40,55,0.3)]">
            <Droplet size={24} strokeWidth={1.8} />
          </div>
          <span className="text-lg font-bold tracking-tight">DoodleBlue</span>
        </div>

        <div className="mt-16 flex flex-1 flex-col lg:mt-24">
          <div className="max-w-[350px]">
            <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#ff8985]">
              <Heart size={14} />
              Give the gift of life
            </p>

            <h1 className="font-display text-5xl font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-6xl">
              Small
              <br />
              Drops
              <br />
              <span className="bg-gradient-to-r from-[#ffaaa0] via-[#ff6669] to-[#ff414e] bg-clip-text text-transparent">
                Big Lives.
              </span>
            </h1>

            <p className="mt-6 text-base font-medium text-white/75 sm:text-lg">
              Connect. Donate. Save Lives.
            </p>

            <div className="mt-5 h-1 w-12 rounded-full bg-[#ff5059]" />

            <QuoteCarousel className="mt-5 min-h-21 max-w-[300px] text-sm leading-7 text-white/60 sm:text-base" />

            {/* Impact message */}
            {/* <div className="mt-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-red-300/20 bg-red-400/10 text-[#ff7777]">
                <Heart size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white/90">
                  One donation. Three lives.
                </p>
                <p className="mt-1 text-xs text-white/50">
                  A little kindness goes a long way.
                </p>
              </div>
            </div> */}
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 mt-8 flex items-center justify-between border-t border-white/10 pt-5 text-xs text-white/40">
          <span>DoodleBlue Admin Console</span>
          <span className="flex items-center gap-1.5">
            <Heart size={12} className="text-[#ff656c]" />
            Every drop counts
          </span>
        </div>
      </div>
    </aside>
  );
}
