import { DocHeading, DocSubHeading } from './ServiceDocLayout';

/* ── Data types ── */

export interface TerraformFile {
  name: string;
  desc: string;
}

export interface TerraformGroup {
  label: string;
  sub?: string;
  files: TerraformFile[];
}

export interface TerraformContextData {
  groups: TerraformGroup[];
}

/* ── Renderer ── */

export function TerraformContextSection({ data }: { data: TerraformContextData }) {
  return (
    <div className="space-y-6">
      <DocHeading>테라폼 컨텍스트</DocHeading>

      {data.groups.map((group, gi) => (
        <div key={group.label}>
          {gi > 0 && <div className="border-t border-gray-700/50 my-4" />}
          <DocSubHeading sub={group.sub}>{group.label}</DocSubHeading>
          <div className="space-y-3 text-sm text-gray-400 pl-4">
            {group.files.map((file, fi) => (
              <div key={file.name} className={fi > 0 ? 'border-t border-gray-800 pt-3' : ''}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-indigo-400 font-mono font-semibold">{file.name}</span>
                </div>
                <div className="pl-3 text-gray-500">{file.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
