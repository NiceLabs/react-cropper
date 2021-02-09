import Cropper from 'cropperjs';
import { createElement, ForwardedRef, forwardRef, FunctionComponent, Ref, useEffect, useRef } from 'react';

type Options = Omit<Cropper.Options, 'ready' | 'zoom' | 'crop' | 'cropstart' | 'cropmove' | 'cropend' | 'data'>;

export interface Props<T extends keyof ComponentMap> extends Options {
  component?: T;
  ref?: Ref<ComponentMap[T]>;

  disabled?: boolean;

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
  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const cropper = new Cropper(ref.current, {
      ...props,
      data: props.data as Cropper.Data,
      ready(event) {
        const target = event.target as EventTarget & { cropper: Cropper };
        apply(target.cropper, props);
        props.onReady?.(event);
      },
      crop: props.onCrop,
      cropstart: props.onCropStart,
      cropmove: props.onCropMove,
      cropend: props.onCropEnd,
      zoom: props.onZoom,
    });
    props.onInitialized(cropper);
    return () => {
      cropper.destroy();
    };
  }, [ref]);
  return createElement(props.component!, { ref });
});

CropperComponent.defaultProps = {
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

function apply<T extends keyof ComponentMap>(cropper: Cropper, props: Props<T>) {
  cropper[props.disabled ? 'disable' : 'enable']();
  set('setAspectRatio', props.aspectRatio);
  set('setDragMode', props.dragMode);
  set('setData', props.data);
  set('setCropBoxData', props.cropBox);
  set('setCanvasData', props.canvas);
  set('scaleX', props.scaleX);
  set('scaleY', props.scaleY);
  set('rotateTo', props.rotateTo);
  set('zoomTo', props.zoomTo);
  function set(name: keyof Cropper, value: unknown | undefined) {
    if (value !== undefined || value !== null) {
      // @ts-ignore
      cropper[name](value);
    }
  }
}
