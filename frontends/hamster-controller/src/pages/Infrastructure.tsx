import { InfraFlowView } from '../components/infra/InfraFlowView';
import { InfraLogPanel } from '../components/infra/InfraLogPanel';
import { SessionBar } from '../components/infra/SessionBar';

export function Infrastructure() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top bar - session control + progress (navbar style) */}
      <div className="shrink-0 border-b border-dark-border bg-dark-sidebar">
        <SessionBar />
      </div>

      {/* Center - ReactFlow (takes most of the space) */}
      <div className="flex-1 min-h-0">
        <InfraFlowView />
      </div>

      {/* Bottom strip - info + logs */}
      <div className="shrink-0 h-48 border-t border-dark-border flex">
        {/* Info box */}
        <div className="w-72 shrink-0 border-r border-dark-border bg-[#0c1222] p-3 overflow-y-auto">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">
            Infrastructure
          </div>
          <div className="space-y-2 text-[11px] text-gray-400 leading-relaxed">
            <div className="flex items-start gap-2">
              <span className="text-accent-orange shrink-0 mt-0.5">*</span>
              <span>
                <span className="text-gray-300 font-medium">8 EC2 t3.micro</span> instances on AWS Free Tier (ap-northeast-2)
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-400 shrink-0 mt-0.5">*</span>
              <span>
                <span className="text-blue-300 font-medium">front-sg</span> public :80 /
                <span className="text-purple-300 font-medium"> auth-sg</span> VPC :8090 /
                <span className="text-green-300 font-medium"> internal-sg</span> VPC only
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-400 shrink-0 mt-0.5">*</span>
              <span>
                <span className="text-gray-300 font-medium">MySQL 8.0</span> (8 DBs) +
                <span className="text-gray-300 font-medium"> MongoDB 7.0</span> +
                <span className="text-gray-300 font-medium"> Kafka 7.5</span> KRaft
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-indigo-400 shrink-0 mt-0.5">*</span>
              <span>
                Session = terraform apply + <span className="font-mono text-gray-300">sleep 1200s</span> + destroy
              </span>
            </div>
          </div>
        </div>

        {/* Log panel - fills remaining width */}
        <div className="flex-1 min-w-0">
          <InfraLogPanel />
        </div>
      </div>
    </div>
  );
}
