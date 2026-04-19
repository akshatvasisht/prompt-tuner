declare module "phosphor-react/dist/icons/*.esm.js" {
  import type { ComponentType, SVGProps } from "react";
  const Icon: ComponentType<
    SVGProps<SVGSVGElement> & {
      size?: number | string;
      weight?: string;
      color?: string;
      mirrored?: boolean;
    }
  >;
  export default Icon;
}
