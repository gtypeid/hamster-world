import { InfraFlowView } from '../components/infra/InfraFlowView';
import { InfraProgressBar } from '../components/infra/InfraProgressBar';
import { InfraLogPanel } from '../components/infra/InfraLogPanel';
import { SessionControl } from '../components/infra/SessionControl';

export function Infrastructure() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* ReactFlow infrastructure graph - takes most space */}
        <div className="flex-1 min-h-0">
          <InfraFlowView />
        </div>

        {/* Bottom panel */}
        <div className="shrink-0 border-t border-dark-border bg-dark-bg p-4 space-y-3">
          {/* Progress bar + timer */}
          <InfraProgressBar />

          {/* Session control */}
          <SessionControl />
        </div>
      </div>

      {/* Log panel - fixed height at bottom */}
      <div className="shrink-0 h-48 border-t border-dark-border">
        <InfraLogPanel />
      </div>
    </div>
  );
}
