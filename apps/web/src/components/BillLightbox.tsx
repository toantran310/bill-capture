import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import Counter from "yet-another-react-lightbox/plugins/counter";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/counter.css";
import type { Bill } from "@/api/client";
import { openinaryUrl, IMAGE_MIMES } from "@/lib/utils";

interface LightboxState {
  open: boolean;
  bills: Bill[];
  index: number;
}

export function useBillLightbox() {
  const [state, setState] = useState<LightboxState>({
    open: false,
    bills: [],
    index: 0,
  });

  /** Open at `bill`, navigating only among the image bills of `bills`. */
  const openAt = (bills: Bill[], bill: Bill) => {
    const images = bills.filter((b) => IMAGE_MIMES.includes(b.mimeType));
    setState({
      open: true,
      bills: images,
      index: Math.max(0, images.findIndex((b) => b._id === bill._id)),
    });
  };

  const close = () => setState((s) => ({ ...s, open: false }));

  return { state, openAt, close };
}

export default function BillLightbox({
  state,
  onClose,
}: {
  state: LightboxState;
  onClose: () => void;
}) {
  return (
    <Lightbox
      open={state.open}
      close={onClose}
      index={state.index}
      slides={state.bills.map((b) => ({
        src: openinaryUrl(b.path),
        alt: b.originalName,
      }))}
      plugins={[Zoom, Counter]}
      carousel={{ finite: true, preload: 1 }}
      controller={{ closeOnBackdropClick: true }}
    />
  );
}