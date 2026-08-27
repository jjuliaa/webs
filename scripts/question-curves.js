(() => {
  const stage = document.querySelector(".exploration-stage");
  const centerpiece = stage?.querySelector(".centerpiece img");
  const svg = stage?.querySelector(".connections");
  const questions = [...(stage?.querySelectorAll(".question") ?? [])];
  const paths = [...(svg?.querySelectorAll(".bezier-line") ?? [])];

  if (!stage || !centerpiece || !svg || questions.length !== paths.length) return;

  let animationFrame = 0;

  const drawCurves = () => {
    animationFrame = 0;

    if (window.matchMedia("(max-width: 680px)").matches) return;

    const stageRect = stage.getBoundingClientRect();
    const centerRect = centerpiece.getBoundingClientRect();
    const stageWidth = Math.max(stageRect.width, 1);
    const stageHeight = Math.max(stageRect.height, 1);
    const centerX = centerRect.left - stageRect.left + centerRect.width / 2;
    const centerY = centerRect.top - stageRect.top + centerRect.height / 2;
    const radiusX = Math.max(centerRect.width / 2, 1);
    const radiusY = Math.max(centerRect.height / 2, 1);

    svg.setAttribute("viewBox", `0 0 ${stageWidth} ${stageHeight}`);

    questions.forEach((question, index) => {
      const text = question.querySelector("p");
      const link = question.querySelector(".question-link-icon");
      if (!text || !link) return;

      const textRect = text.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();
      const targetX = linkRect.left - stageRect.left + linkRect.width / 2;
      const targetY = Math.max(textRect.bottom, linkRect.bottom) - stageRect.top + 5;
      const deltaX = targetX - centerX;
      const deltaY = targetY - centerY;
      const centerDistance = Math.max(Math.hypot(deltaX, deltaY), 1);
      const unitX = deltaX / centerDistance;
      const unitY = deltaY / centerDistance;

      const ellipseScale = 1 / Math.sqrt(
        (deltaX * deltaX) / (radiusX * radiusX) +
        (deltaY * deltaY) / (radiusY * radiusY)
      );
      const boundaryDistance = centerDistance * ellipseScale;
      const desiredGap = Math.min(48, Math.max(26, stageWidth * 0.025));
      const availableGap = Math.max(8, centerDistance - boundaryDistance - 24);
      const imageGap = Math.min(desiredGap, availableGap);
      const startDistance = boundaryDistance + imageGap;
      const startX = centerX + unitX * startDistance;
      const startY = centerY + unitY * startDistance;
      const curveDistance = Math.max(Math.hypot(targetX - startX, targetY - startY), 1);

      const normalX = -unitY;
      const normalY = unitX;
      let bendDirection;
      if (Math.abs(deltaX) < centerDistance * 0.16) {
        bendDirection = index % 2 === 0 ? -1 : 1;
      } else if (deltaX < 0) {
        bendDirection = deltaY < 0 ? -1 : 1;
      } else {
        bendDirection = deltaY < 0 ? 1 : -1;
      }

      const petalSweep = Math.min(56, Math.max(12, curveDistance * 0.12)) * bendDirection;
      const controlOneX = startX + unitX * curveDistance * 0.24 + normalX * petalSweep;
      const controlOneY = startY + unitY * curveDistance * 0.24 + normalY * petalSweep;
      const controlTwoX = targetX - unitX * curveDistance * 0.28 + normalX * petalSweep * 0.35;
      const controlTwoY = targetY - unitY * curveDistance * 0.28 + normalY * petalSweep * 0.35;

      paths[index].setAttribute(
        "d",
        `M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${controlOneX.toFixed(1)} ${controlOneY.toFixed(1)}, ${controlTwoX.toFixed(1)} ${controlTwoY.toFixed(1)}, ${targetX.toFixed(1)} ${targetY.toFixed(1)}`
      );
    });
  };

  const scheduleDraw = () => {
    if (animationFrame) cancelAnimationFrame(animationFrame);
    animationFrame = requestAnimationFrame(drawCurves);
  };

  window.addEventListener("resize", scheduleDraw, { passive: true });
  window.addEventListener("orientationchange", scheduleDraw, { passive: true });

  if ("ResizeObserver" in window) {
    const observer = new ResizeObserver(scheduleDraw);
    observer.observe(stage);
    observer.observe(centerpiece);
  }

  if (centerpiece.complete) scheduleDraw();
  else centerpiece.addEventListener("load", scheduleDraw, { once: true });

  if (document.fonts?.ready) document.fonts.ready.then(scheduleDraw);
  scheduleDraw();
})();
