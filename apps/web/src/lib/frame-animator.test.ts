import { describe, expect, it, vi } from "vitest";
import { createFrameAnimator } from "./frame-animator";

describe("createFrameAnimator", () => {
  it("maps progress to the last frame at 1", () => {
    const frames: number[] = [];
    const anim = createFrameAnimator({
      frameCount: 10,
      reducedMotion: true,
      render: (f) => frames.push(f),
    });
    anim.setProgress(1);
    expect(anim.getCurrentFrame()).toBe(9);
    anim.destroy();
  });

  it("wraps circular direction targets onto the ring", () => {
    const anim = createFrameAnimator({
      frameCount: 8,
      circular: true,
      reducedMotion: true,
      initialFrame: 0,
      render: () => undefined,
    });
    // Point "up" from startAngle -PI*0.75 → stable normalized frame
    anim.setDirection(0, -1, -Math.PI * 0.75);
    const frame = anim.getCurrentFrame();
    expect(frame).toBeGreaterThanOrEqual(0);
    expect(frame).toBeLessThan(8);
    anim.destroy();
  });

  it("clamps linear targets", () => {
    const anim = createFrameAnimator({
      frameCount: 5,
      circular: false,
      reducedMotion: true,
      render: () => undefined,
    });
    anim.setTarget(99);
    expect(anim.getCurrentFrame()).toBe(4);
    anim.setTarget(-3);
    expect(anim.getCurrentFrame()).toBe(0);
    anim.destroy();
  });

  it("destroys without throwing", () => {
    const render = vi.fn();
    const anim = createFrameAnimator({
      frameCount: 4,
      reducedMotion: true,
      render,
    });
    expect(render).toHaveBeenCalled();
    anim.destroy();
    anim.setProgress(0.5);
  });
});
