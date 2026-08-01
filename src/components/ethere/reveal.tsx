import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type RevealVariant = "up" | "zoom" | "left" | "right";

export function Reveal({
  children,
  variant = "up",
  delay = 0,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "span" | "header";
}) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Comp = As as "div";

  return (
    <Comp
      ref={ref as React.Ref<HTMLDivElement>}
      data-reveal={variant}
      style={{ ["--reveal-delay" as string]: `${delay}ms` }}
      className={cn(className)}
    >
      {children}
    </Comp>
  );
}
