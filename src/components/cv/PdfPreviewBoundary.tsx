import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { FileText } from "lucide-react";

export class PdfPreviewBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Document PDF preview failed:", error, info);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="h-full grid place-items-center p-6 text-center text-sm text-muted-foreground">
          <div>
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>The live preview could not load.</p>
            <p className="mt-1">You can still edit and download the document.</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
