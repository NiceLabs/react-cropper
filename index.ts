import Cropper from 'cropperjs';
import { createElement, FC, FunctionComponent, Ref, useEffect, useRef } from 'react';

type Options = Omit<Cropper.Options<EventTarget>, 'ready' | 'zoom' | 'crop' | 'cropstart' | 'cropmove' | 'cropend'>;

interface ComponentMap {
  canvas: HTMLCanvasElement;
  img: HTMLImageElement;
}

export interface Props<T extends keyof ComponentMap> extends Options {
  component?: T;
  ref?: Ref<ComponentMap[T]>;

  disabled?: boolean;

  scaleX?: number;
  scaleY?: number;
  rotateTo?: number;
  zoomTo?: number;

  canvas?: Cropper.SetCanvasDataOptions;
  cropBox?: Cropper.SetCropBoxDataOptions;

  onInitialized(cropper: Cropper): void;
  onReady?(event: Cropper.ReadyEvent<ComponentMap[T]>): void;
  onCrop?(event: Cropper.CropEvent<ComponentMap[T]>): void;
  onCropStart?(event: Cropper.CropStartEvent<ComponentMap[T]>): void;
  onCropMove?(event: Cropper.CropMoveEvent<ComponentMap[T]>): void;
  onCropEnd?(event: Cropper.CropEndEvent<ComponentMap[T]>): void;
  onZoom?(event: Cropper.ZoomEvent<ComponentMap[T]>): void;
}

const CropperComponent: FC<Props<keyof ComponentMap>> = (props) => {
  const ref = useRef<ComponentMap[keyof ComponentMap]>(null);
  useEffect(() => {
    if (!ref.current) {
      return;
    }
    const cropper = new Cropper(ref.current as HTMLCanvasElement, {
      ...props,
      ready(event) {
        apply(event.currentTarget.cropper, props);
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
};

CropperComponent.defaultProps = {
  component: 'canvas',
  dragMode: 'crop',
};

export default CropperComponent as FunctionComponent<Props<keyof ComponentMap>>;

function apply<T extends keyof ComponentMap>(cropper: Cropper, props: Props<T>) {
  cropper[props.disabled ? 'disable' : 'enable']();
  set('setAspectRatio', props.aspectRatio);
  set('setDragMode', props.dragMode);
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
