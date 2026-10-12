type Listener = (progress: number) => void;
let current = 0;
const listeners = new Set<Listener>();

export const progressController = {
  get: () => current,
  set(value: number) {
    current = Math.min(1, Math.max(0, value));
    listeners.forEach((listener) => listener(current));
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    listener(current);
    return () => { listeners.delete(listener); };
  },
};

export function navigateToProgress(progress: number, reducedMotion = false) {
  const journey = document.getElementById("assembly-journey");
  if (!journey) return;
  const distance = journey.offsetHeight - window.innerHeight;
  window.scrollTo({ top: journey.offsetTop + distance * progress, behavior: reducedMotion ? "instant" : "smooth" });
}
