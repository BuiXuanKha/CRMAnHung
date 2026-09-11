'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type DragEvent,
  type MouseEvent,
} from 'react';
import {
  fileNameFromImageUrl,
  fileToDataUrl,
  galleryImageFile,
} from './lodat-image-download';

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 4;
const ZOOM_WHEEL_STEP = 0.12;
const DRAG_MAX_DIM = 2048;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function usePointerFine() {
  const [fine, setFine] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(hover: hover) and (pointer: fine)').matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return fine;
}

type PcViewArgs = {
  pointerFine: boolean;
  rotationDeg: number;
  imageKey: string;
  enabled: boolean;
};

export function useGalleryPcView({ pointerFine, rotationDeg, imageKey, enabled }: PcViewArgs) {
  const stageRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(ZOOM_MIN);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [baseSize, setBaseSize] = useState({ w: 0, h: 0 });
  const [rotationFitScale, setRotationFitScale] = useState(1);
  const panRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });

  const resetView = useCallback(() => {
    setScale(ZOOM_MIN);
    setTranslate({ x: 0, y: 0 });
    setIsPanning(false);
    panRef.current.active = false;
  }, []);

  const syncLayoutMetrics = useCallback(() => {
    const stage = stageRef.current;
    const img = imgRef.current;
    if (!stage || !img?.naturalWidth) return;

    const viewW = stage.clientWidth;
    const viewH = stage.clientHeight;
    if (!viewW || !viewH) return;

    const containScale = Math.min(viewW / img.naturalWidth, viewH / img.naturalHeight, 1);
    const displayW = img.naturalWidth * containScale;
    const displayH = img.naturalHeight * containScale;
    setBaseSize({ w: displayW, h: displayH });

    if (rotationDeg === 90 || rotationDeg === 270) {
      setRotationFitScale(Math.min(viewW / displayH, viewH / displayW, 1));
    } else {
      setRotationFitScale(1);
    }
  }, [rotationDeg]);

  const clampTranslate = useCallback(
    (x: number, y: number, userScale: number, rotation = rotationDeg) => {
      const stage = stageRef.current;
      const totalScale = rotationFitScale * userScale;
      if (!stage || totalScale <= rotationFitScale * ZOOM_MIN + 0.001) {
        return { x: 0, y: 0 };
      }
      const viewW = stage.clientWidth;
      const viewH = stage.clientHeight;
      const swap = rotation === 90 || rotation === 270;
      const dw = (swap ? baseSize.h : baseSize.w) * totalScale;
      const dh = (swap ? baseSize.w : baseSize.h) * totalScale;
      const maxX = Math.max(0, (dw - viewW) / 2);
      const maxY = Math.max(0, (dh - viewH) / 2);
      return {
        x: clamp(x, -maxX, maxX),
        y: clamp(y, -maxY, maxY),
      };
    },
    [baseSize.h, baseSize.w, rotationDeg, rotationFitScale],
  );

  useEffect(() => {
    resetView();
    setBaseSize({ w: 0, h: 0 });
    setRotationFitScale(1);
  }, [imageKey, resetView]);

  useEffect(() => {
    setTranslate({ x: 0, y: 0 });
  }, [rotationDeg]);

  useLayoutEffect(() => {
    if (!enabled) return;
    syncLayoutMetrics();
  }, [enabled, rotationDeg, imageKey, syncLayoutMetrics]);

  useEffect(() => {
    if (!enabled) return undefined;
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(() => syncLayoutMetrics());
    observer.observe(stage);
    return () => observer.disconnect();
  }, [enabled, syncLayoutMetrics]);

  useEffect(() => {
    if (!pointerFine || !isPanning) return undefined;

    function onMouseMove(event: globalThis.MouseEvent) {
      if (!panRef.current.active) return;
      const dx = event.clientX - panRef.current.startX;
      const dy = event.clientY - panRef.current.startY;
      setTranslate(
        clampTranslate(
          panRef.current.originX + dx,
          panRef.current.originY + dy,
          scale,
          rotationDeg,
        ),
      );
    }

    function endPan() {
      panRef.current.active = false;
      setIsPanning(false);
    }

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', endPan);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', endPan);
    };
  }, [pointerFine, isPanning, scale, rotationDeg, clampTranslate]);

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (!pointerFine) return;
      event.preventDefault();
      event.stopPropagation();

      setScale((prev) => {
        const direction = event.deltaY > 0 ? -1 : 1;
        const next = clamp(prev + direction * ZOOM_WHEEL_STEP, ZOOM_MIN, ZOOM_MAX);
        if (next <= ZOOM_MIN) {
          setTranslate({ x: 0, y: 0 });
          return ZOOM_MIN;
        }
        setTranslate((t) => clampTranslate(t.x, t.y, next));
        return next;
      });
    },
    [pointerFine, clampTranslate],
  );

  useEffect(() => {
    if (!enabled || !pointerFine) return undefined;
    const stage = stageRef.current;
    if (!stage) return undefined;
    const onWheel = (event: WheelEvent) => handleWheel(event);
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [enabled, pointerFine, handleWheel]);

  const handlePanMouseDown = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!pointerFine || scale <= ZOOM_MIN || event.button !== 0) return;
      if (event.target instanceof Element && event.target.closest('button, a')) return;
      event.preventDefault();
      panRef.current = {
        active: true,
        startX: event.clientX,
        startY: event.clientY,
        originX: translate.x,
        originY: translate.y,
      };
      setIsPanning(true);
    },
    [pointerFine, scale, translate.x, translate.y],
  );

  const totalScale = rotationFitScale * scale;
  const canPan = pointerFine && scale > ZOOM_MIN;

  return {
    stageRef,
    imgRef,
    scale,
    translate,
    isPanning,
    totalScale,
    canPan,
    handlePanMouseDown,
    onImgLoad: syncLayoutMetrics,
  };
}

let transparentDragImage: HTMLImageElement | null = null;

function getTransparentDragImage() {
  if (transparentDragImage) return transparentDragImage;
  const img = new Image();
  img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=';
  transparentDragImage = img;
  return img;
}

export function useGalleryDragToZalo(
  url: string,
  rotationDeg: number,
  index: number,
  active: boolean,
) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle');
  const fileRef = useRef<File | null>(null);
  const dataUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fileRef.current = null;
    dataUrlRef.current = null;
    setStatus('idle');
    if (!active || !url) return undefined;

    setStatus('loading');
    const name = fileNameFromImageUrl(url, index);
    void galleryImageFile(url, rotationDeg, name, { maxDim: DRAG_MAX_DIM })
      .then(async (file) => {
        if (cancelled) return;
        fileRef.current = file;
        dataUrlRef.current = await fileToDataUrl(file);
        if (!cancelled) setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('failed');
      });

    return () => {
      cancelled = true;
    };
  }, [url, rotationDeg, index, active]);

  const handleDragStart = useCallback((event: DragEvent<HTMLImageElement>) => {
    const file = fileRef.current;
    const dt = event.dataTransfer;
    if (!file || !dt) {
      event.preventDefault();
      return;
    }
    dt.effectAllowed = 'copy';
    dt.setDragImage(getTransparentDragImage(), 0, 0);
    dt.clearData();
    const dataUrl = dataUrlRef.current;
    if (dataUrl) {
      dt.setData('DownloadURL', `${file.type}:${file.name}:${dataUrl}`);
    } else if (dt.items) {
      dt.items.add(file);
    }
  }, []);

  return { ready: status === 'ready', loading: status === 'loading', handleDragStart };
}

export function galleryPcCursorClass(args: {
  pointerFine: boolean;
  canPan: boolean;
  isPanning: boolean;
  canNativeDrag: boolean;
  dragLoading: boolean;
  zoomed: boolean;
}) {
  if (!args.pointerFine) return '';
  if (args.canPan) return args.isPanning ? 'is-grabbing' : 'is-grab';
  if (args.zoomed) return '';
  if (args.canNativeDrag) return 'is-draggable';
  if (args.dragLoading) return 'is-drag-wait';
  return '';
}

