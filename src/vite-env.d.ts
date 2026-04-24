/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_DEMO_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace JSX {
  interface IntrinsicElements {
    "gmp-map-3d": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        center?: string;
        tilt?: string | number;
        heading?: string | number;
        range?: string | number;
        roll?: string | number;
        mode?: string;
      },
      HTMLElement
    >;
    "gmp-marker-3d": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        position?: string;
        altitude?: string | number;
        "altitude-mode"?: string;
        label?: string;
      },
      HTMLElement
    >;
  }
}
