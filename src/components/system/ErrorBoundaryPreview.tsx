// QA preview route — intentionally throws on render so the surrounding
// <SystemErrorBoundary> catches it and renders <ServerErrorState>. Lives behind
// `/system/preview/error-boundary` so design / engineering can verify the
// boundary's failure path (reference-id format + copy-on-click + retry) without
// having to provoke a real defect in a live feature.
//
// IMPORTANT: this is QA-only. Never link to it from any user-facing surface.
export default function ErrorBoundaryPreview(): never {
  throw new Error(
    'Forced render error from /system/preview/error-boundary — verifies <SystemErrorBoundary> catches and renders <ServerErrorState>.',
  );
}
