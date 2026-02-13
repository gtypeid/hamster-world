import { InfraFlowView } from '../components/infra/InfraFlowView';
import { InfraProgressBar } from '../components/infra/InfraProgressBar';
import { InfraLogPanel } from '../components/infra/InfraLogPanel';
import { SessionControl } from '../components/infra/SessionControl';

export function Infrastructure() {
  return (
    <div className="h-full flex overflow-hidden">
      {/* Left panel - controls + logs */}
      <div className="w-80 shrink-0 flex flex-col border-r border-dark-border bg-dark-sidebar">
        {/* Session control */}
        <div className="shrink-0 p-4 border-b border-dark-border">
          <SessionControl />
        </div>

        {/* Progress bar */}
        <div className="shrink-0 p-4 border-b border-dark-border">
          <InfraProgressBar />
        </div>

        {/* Log panel - fills remaining space */}
        <div className="flex-1 min-h-0">
          <InfraLogPanel />
        </div>
      </div>

      {/* Right panel - ReactFlow full viewport */}
      <div className="flex-1 min-w-0">
        <InfraFlowView />
      </div>
    </div>
  );
}
