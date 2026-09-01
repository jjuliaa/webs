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

      const textFragments = [...text.getClientRects()];
      const linkRect = link.getBoundingClientRect();
      const contentRects = [...textFragments, linkRect];
      const contentLeft = Math.min(...contentRects.map((rect) => rect.left)) - stageRect.left;
      const contentRight = Math.max(...contentRects.map((rect) => rect.right)) - stageRect.left;
      const contentTop = Math.min(...contentRects.map((rect) => rect.top)) - stageRect.top;
      const contentBottom = Math.max(...contentRects.map((rect) => rect.bottom)) - stageRect.top;
      const questionCenterX = (contentLeft + contentRight) / 2;
      const questionCenterY = (contentTop + contentBottom) / 2;
      const questionDeltaX = questionCenterX - centerX;
      const questionDeltaY = questionCenterY - centerY;
      const questionDistance = Math.max(Math.hypot(questionDeltaX, questionDeltaY), 1);
      const questionUnitX = questionDeltaX / questionDistance;
      const questionUnitY = questionDeltaY / questionDistance;
      const halfQuestionWidth = Math.max((contentRight - contentLeft) / 2, 1);
      const halfQuestionHeight = Math.max((contentBottom - contentTop) / 2, 1);
      const horizontalEdgeDistance = Math.abs(questionUnitX) > 0.0001
        ? halfQuestionWidth / Math.abs(questionUnitX)
        : Number.POSITIVE_INFINITY;
      const verticalEdgeDistance = Math.abs(questionUnitY) > 0.0001
        ? halfQuestionHeight / Math.abs(questionUnitY)
        : Number.POSITIVE_INFINITY;
      const contentEdgeDistance = Math.min(horizontalEdgeDistance, verticalEdgeDistance);
      const questionGap = Math.min(12, Math.max(7, stageWidth * 0.005));
      const targetX = questionCenterX - questionUnitX * (contentEdgeDistance + questionGap);
      const targetY = questionCenterY - questionUnitY * (contentEdgeDistance + questionGap);
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

    svg.classList.add("is-ready");
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
