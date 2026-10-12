import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { progressController } from "./progress";

export function createScrollDirector(element: HTMLElement) {
  gsap.registerPlugin(ScrollTrigger);
  const playhead = { progress: 0 };
  const animation = gsap.to(playhead, {
    progress: 1, duration: 1, ease: "none", paused: true,
    onUpdate: () => progressController.set(playhead.progress),
  });
  const trigger = ScrollTrigger.create({
    trigger: element, start: "top top", end: "bottom bottom",
    animation, scrub: true, invalidateOnRefresh: true,
    onRefresh: (self) => progressController.set(self.progress),
  });
  ScrollTrigger.refresh();
  return () => { trigger.kill(); animation.kill(); };
}
