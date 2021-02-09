import Cropper from 'cropperjs';
import { FunctionComponent, createElement, ForwardedRef, forwardRef, Ref, useCallback, useEffect, useRef, useState } from 'react';

type Options = Omit<Cropper.Options, 'ready' | 'zoom' | 'crop' | 'cropstart' | 'cropmove' | 'cropend' | 'data'>;

export interface Props<T extends keyof ComponentMap> extends Options {
  component?: T;
  ref?: Ref<ComponentMap[T]>;

  enable?: boolean;

  scaleX?: number;
  scaleY?: number;
  rotateTo?: number;
  zoomTo?: number;

  data?: Cropper.SetDataOptions;
  canvas?: Cropper.SetCanvasDataOptions;
  cropBox?: Cropper.SetCropBoxDataOptions;

  onInitialized(cropper: Cropper): void;
  onReady?(event: Cropper.ReadyEvent): void;
  onCrop?(event: Cropper.CropEvent): void;
  onCropStart?(event: Cropper.CropStartEvent): void;
  onCropMove?(event: Cropper.CropMoveEvent): void;
  onCropEnd?(event: Cropper.CropEndEvent): void;
  onZoom?(event: Cropper.ZoomEvent): void;
}

interface ComponentMap {
  canvas: HTMLCanvasElement;
  img: HTMLImageElement;
}

const CropperComponent = forwardRef<ComponentMap[keyof ComponentMap], Props<keyof ComponentMap>>((props, outerRef) => {
  const ref = useForwardedRef<ComponentMap[keyof ComponentMap]>(outerRef);
  const [cropper, setCropper] = useState<Cropper>();
  const update = useCallback((cropper: Cropper) => configure(cropper, props), [props]);
  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const cropper = new Cropper(ref.current, {
      ...props,
      data: props.data as Cropper.Data,
      ready(event) {
        const target = event.target as EventTarget & { cropper: Cropper };
        update(target.cropper);
        props.onReady?.(event);
      },
      crop: props.onCrop,
      cropstart: props.onCropStart,
      cropmove: props.onCropMove,
      cropend: props.onCropEnd,
      zoom: props.onZoom,
    });
    props.onInitialized(cropper);
    setCropper(cropper);
    return () => {
      cropper.destroy();
    };
  }, [ref]);
  useEffect(() => cropper && update(cropper), [cropper, props]);
  return createElement(props.component!, { ref });
});

CropperComponent.defaultProps = {
  enable: true,
  component: 'canvas',
  dragMode: 'crop',
};

export default CropperComponent as FunctionComponent<Props<keyof ComponentMap>>;

function useForwardedRef<T>(forwardedRef: ForwardedRef<T>) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (typeof forwardedRef === 'function') {
      forwardedRef(ref.current);
    } else if (forwardedRef) {
      // @ts-ignore
      ref.current = forwardedRef.current;
    }
  }, [ref, forwardedRef]);
  return ref;
}

function configure<T extends keyof ComponentMap>(cropper: Cropper, props: Props<T>) {
  cropper[props.enable ? 'enable' : 'disable']();
  props.aspectRatio && cropper.setAspectRatio(props.aspectRatio);
  props.dragMode && cropper.setDragMode(props.dragMode);
  props.data && cropper.setData(props.data);
  props.cropBox && cropper.setCropBoxData(props.cropBox);
  props.canvas && cropper.setCanvasData(props.canvas);
  props.scaleX && cropper.scaleX(props.scaleX);
  props.scaleY && cropper.scaleY(props.scaleY);
  props.rotateTo && cropper.rotateTo(props.rotateTo);
  props.zoomTo && props.zoomTo > 0 && cropper.zoomTo(props.zoomTo);
}
