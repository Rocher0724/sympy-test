"use client";

import { useRef, useEffect, useCallback, useState } from "react";

interface Point {
  x: number;
  y: number;
  pressure: number;
}

interface Stroke {
  points: Point[];
}

interface HandwritingCanvasProps {
  onImageReady: (imageData: string) => void;
  isRecognizing: boolean;
}

export function HandwritingCanvas({
  onImageReady,
  isRecognizing,
}: HandwritingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 300 });

  useEffect(() => {
    const updateCanvasSize = () => {
      const width = Math.min(window.innerWidth - 48, 600);
      const height = window.innerWidth < 640 ? 250 : 300;
      setCanvasSize({ width, height });
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  const getCanvasPoint = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0, pressure: 0.5 };

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
        pressure: e.pressure || 0.5,
      };
    },
    []
  );

  const drawStroke = useCallback(
    (ctx: CanvasRenderingContext2D, points: Point[]) => {
      if (points.length < 2) return;

      ctx.strokeStyle = "#1a1a1a";
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const lineWidth = Math.max(1.5, Math.min(6, curr.pressure * 5));

        ctx.beginPath();
        ctx.lineWidth = lineWidth;
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.stroke();
      }
    },
    []
  );

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    strokes.forEach((stroke) => drawStroke(ctx, stroke.points));
    if (currentStroke.length > 0) {
      drawStroke(ctx, currentStroke);
    }
  }, [strokes, currentStroke, drawStroke]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      canvas.setPointerCapture(e.pointerId);
      setIsDrawing(true);
      const point = getCanvasPoint(e);
      setCurrentStroke([point]);
    },
    [getCanvasPoint]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      e.preventDefault();

      const point = getCanvasPoint(e);
      setCurrentStroke((prev) => [...prev, point]);
    },
    [isDrawing, getCanvasPoint]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;

      const canvas = canvasRef.current;
      if (canvas) {
        canvas.releasePointerCapture(e.pointerId);
      }

      setIsDrawing(false);
      if (currentStroke.length > 0) {
        setStrokes((prev) => [...prev, { points: currentStroke }]);
        setCurrentStroke([]);
      }
    },
    [isDrawing, currentStroke]
  );

  const handleClear = useCallback(() => {
    setStrokes([]);
    setCurrentStroke([]);
  }, []);

  const handleUndo = useCallback(() => {
    setStrokes((prev) => prev.slice(0, -1));
  }, []);

  const handleRecognize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const imageData = canvas.toDataURL("image/png");
    onImageReady(imageData);
  }, [onImageReady]);

  const hasContent = strokes.length > 0 || currentStroke.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="relative rounded-xl overflow-hidden border-2 border-zinc-200 dark:border-zinc-700 bg-white">
        <canvas
          ref={canvasRef}
          width={canvasSize.width * 2}
          height={canvasSize.height * 2}
          style={{
            width: canvasSize.width,
            height: canvasSize.height,
            touchAction: "none",
            cursor: "crosshair",
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-zinc-400 dark:text-zinc-500 text-sm">
              여기에 수식을 필기하세요
            </p>
          </div>
        )}
        {isRecognizing && (
          <div className="absolute inset-0 bg-white/80 dark:bg-zinc-900/80 flex items-center justify-center">
            <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>인식 중...</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleUndo}
          disabled={strokes.length === 0 || isRecognizing}
          className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
        >
          ↩ 실행취소
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={!hasContent || isRecognizing}
          className="flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-zinc-100 text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 transition-colors"
        >
          🗑 전체삭제
        </button>
        <button
          type="button"
          onClick={handleRecognize}
          disabled={!hasContent || isRecognizing}
          className="flex-[2] py-2 px-4 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
        >
          ✨ 인식하기
        </button>
      </div>
    </div>
  );
}
