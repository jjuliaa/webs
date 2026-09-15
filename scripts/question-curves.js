(() => {
  const stage = document.querySelector(".exploration-stage");
  const centerpiece = stage?.querySelector(".centerpiece img");
  const svg = stage?.querySelector(".connections");
  const questions = [...(stage?.querySelectorAll(".question") ?? [])];
  const paths = [...(svg?.querySelectorAll(".bezier-line") ?? [])];

  if (!stage || !centerpiece || !svg || questions.length !== paths.length) return;

  let animationFrame = 0;

  const boundsInStage = (rects, stageRect) => ({
    left: Math.min(...rects.map((rect) => rect.left)) - stageRect.left,
    right: Math.max(...rects.map((rect) => rect.right)) - stageRect.left,
    top: Math.min(...rects.map((rect) => rect.top)) - stageRect.top,
    bottom: Math.max(...rects.map((rect) => rect.bottom)) - stageRect.top,
  });

  const questionBounds = (question, stageRect) => {
    const text = question.querySelector("p");
    const link = question.querySelector(".question-link-icon");
    if (!text || !link) return null;

    const textFragments = [...text.getClientRects()];
    const rects = [...textFragments, link.getBoundingClientRect()];
    return rects.length ? boundsInStage(rects, stageRect) : null;
  };

  const expanded = (rect, padding) => ({
    left: rect.left - padding,
    right: rect.right + padding,
    top: rect.top - padding,
    bottom: rect.bottom + padding,
  });

  const pointOnCubic = (start, controlOne, controlTwo, end, progress) => {
    const inverse = 1 - progress;
    const inverseSquared = inverse * inverse;
    const progressSquared = progress * progress;
    return {
      x:
        inverseSquared * inverse * start.x +
        3 * inverseSquared * progress * controlOne.x +
        3 * inverse * progressSquared * controlTwo.x +
        progressSquared * progress * end.x,
      y:
        inverseSquared * inverse * start.y +
        3 * inverseSquared * progress * controlOne.y +
        3 * inverse * progressSquared * controlTwo.y +
        progressSquared * progress * end.y,
    };
  };

  const pointOnDoubleCurve = (curve, progress) => {
    if (progress <= 0.5) {
      return pointOnCubic(
        { x: curve.startX, y: curve.startY },
        { x: curve.controlOneX, y: curve.controlOneY },
        { x: curve.controlTwoX, y: curve.controlTwoY },
        { x: curve.middleX, y: curve.middleY },
        progress * 2
      );
    }

    return pointOnCubic(
      { x: curve.middleX, y: curve.middleY },
      { x: curve.controlThreeX, y: curve.controlThreeY },
      { x: curve.controlFourX, y: curve.controlFourY },
      { x: curve.targetX, y: curve.targetY },
      (progress - 0.5) * 2
    );
  };

  const distanceToRect = (point, rect) => {
    const horizontal = Math.max(rect.left - point.x, 0, point.x - rect.right);
    const vertical = Math.max(rect.top - point.y, 0, point.y - rect.bottom);
    return Math.hypot(horizontal, vertical);
  };

  const curveScore = (curve, obstacles, stageWidth, stageHeight, preferredDirection) => {
    let score = Math.abs(curve.sweep) * 0.08;
    if (curve.sweep && Math.sign(curve.sweep) !== preferredDirection) score += 3;

    const samples = 64;
    for (let sample = 1; sample < samples; sample += 1) {
      const point = pointOnDoubleCurve(curve, sample / samples);

      if (point.x < 3 || point.x > stageWidth - 3 || point.y < 3 || point.y > stageHeight - 3) {
        score += 20000;
      }

      obstacles.forEach((obstacle) => {
        const distance = distanceToRect(point, obstacle);
        if (distance === 0) score += 100000;
        else if (distance < 18) score += (18 - distance) * 45;
      });
    }

    return score;
  };

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
    const contentBounds = questions.map((question) => questionBounds(question, stageRect));
    const protectedElements = [
      document.querySelector(".site-links"),
      stage.querySelector(".bubble-header"),
      document.querySelector(".corner-icon"),
    ].filter(Boolean);
    const fixedObstacles = protectedElements.map((element) =>
      expanded(boundsInStage([element.getBoundingClientRect()], stageRect), 12)
    );

    svg.setAttribute("viewBox", `0 0 ${stageWidth} ${stageHeight}`);

    questions.forEach((question, index) => {
      const content = contentBounds[index];
      if (!content) return;

      const contentLeft = content.left;
      const contentRight = content.right;
      const contentTop = content.top;
      const contentBottom = content.bottom;
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

      let preferredDirection;
      if (Math.abs(deltaX) < centerDistance * 0.16) {
        preferredDirection = index % 2 === 0 ? -1 : 1;
      } else if (deltaX < 0) {
        preferredDirection = deltaY < 0 ? -1 : 1;
      } else {
        preferredDirection = deltaY < 0 ? 1 : -1;
      }

      const baseSweep = Math.min(68, Math.max(18, curveDistance * 0.14));
      const sweepLimit = Math.min(150, curveDistance * 0.44);
      const sweepValues = [
        preferredDirection * baseSweep,
        -preferredDirection * baseSweep,
        preferredDirection * baseSweep * 0.85,
        -preferredDirection * baseSweep * 0.85,
        preferredDirection * baseSweep * 1.35,
        -preferredDirection * baseSweep * 1.35,
        preferredDirection * baseSweep * 1.8,
        -preferredDirection * baseSweep * 1.8,
      ].map((sweep) => Math.max(-sweepLimit, Math.min(sweepLimit, sweep)));

      const obstacles = [
        ...contentBounds
          .filter((bounds, obstacleIndex) => bounds && obstacleIndex !== index)
          .map((bounds) => expanded(bounds, 10)),
        ...fixedObstacles,
      ];

      const candidates = [...new Set(sweepValues.map((sweep) => sweep.toFixed(3)))]
        .map(Number)
        .map((sweep) => {
          const middleX = startX + unitX * curveDistance * 0.52 + normalX * sweep * 0.3;
          const middleY = startY + unitY * curveDistance * 0.52 + normalY * sweep * 0.3;

          return {
            sweep,
            startX,
            startY,
            middleX,
            middleY,
            targetX,
            targetY,
            controlOneX: startX + unitX * curveDistance * 0.18 + normalX * sweep * 0.55,
            controlOneY: startY + unitY * curveDistance * 0.18 + normalY * sweep * 0.55,
            controlTwoX: middleX - unitX * curveDistance * 0.14 + normalX * sweep * 0.18,
            controlTwoY: middleY - unitY * curveDistance * 0.14 + normalY * sweep * 0.18,
            controlThreeX: middleX + unitX * curveDistance * 0.14 - normalX * sweep * 0.18,
            controlThreeY: middleY + unitY * curveDistance * 0.14 - normalY * sweep * 0.18,
            controlFourX: targetX - unitX * curveDistance * 0.2 - normalX * sweep * 0.55,
            controlFourY: targetY - unitY * curveDistance * 0.2 - normalY * sweep * 0.55,
          };
        });

      const bestCurve = candidates.reduce((best, candidate) => {
        const score = curveScore(candidate, obstacles, stageWidth, stageHeight, preferredDirection);
        return !best || score < best.score ? { curve: candidate, score } : best;
      }, null)?.curve;

      if (!bestCurve) return;

      paths[index].setAttribute(
        "d",
        `M ${bestCurve.startX.toFixed(1)} ${bestCurve.startY.toFixed(1)} C ${bestCurve.controlOneX.toFixed(1)} ${bestCurve.controlOneY.toFixed(1)}, ${bestCurve.controlTwoX.toFixed(1)} ${bestCurve.controlTwoY.toFixed(1)}, ${bestCurve.middleX.toFixed(1)} ${bestCurve.middleY.toFixed(1)} C ${bestCurve.controlThreeX.toFixed(1)} ${bestCurve.controlThreeY.toFixed(1)}, ${bestCurve.controlFourX.toFixed(1)} ${bestCurve.controlFourY.toFixed(1)}, ${bestCurve.targetX.toFixed(1)} ${bestCurve.targetY.toFixed(1)}`
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
