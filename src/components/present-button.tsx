"use client";

import { useNavigate } from "@tanstack/react-router";
import { Maximize2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  enterFullscreen,
  findProjectorScreen,
  isExtendedDisplay,
  openProjectorWindow,
} from "@/lib/present";

type PresentButtonProps = Omit<ButtonProps, "onClick"> & {
  slug: string;
  set?: boolean;
};

export function PresentButton({
  slug,
  set = false,
  children,
  variant = "primary",
  ...props
}: PresentButtonProps) {
  const navigate = useNavigate();

  return (
    <Button
      variant={variant}
      {...props}
      onClick={async () => {
        const setFlag = set ? "1" : undefined;
        let projector = null;
        if (isExtendedDisplay()) {
          projector = await findProjectorScreen();
        }
        if (projector) {
          openProjectorWindow(slug, { set: setFlag, screen: projector });
        }
        void navigate({
          to: "/present/$slug",
          params: { slug },
          search: { set: setFlag, stage: undefined },
        });
        if (!projector) {
          void enterFullscreen();
        }
      }}
    >
      {children ?? (
        <>
          <Maximize2 className="size-4" />
          Present
        </>
      )}
    </Button>
  );
}
