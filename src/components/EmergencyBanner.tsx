import { EmergencyInfo } from "@/data/markers";

export default function EmergencyBanner({ info }: { info: EmergencyInfo }) {
  return (
    <div className="px-4 pb-4">
      <div className="bg-error-container rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-on-error-container">
            emergency
          </span>
          <p className="font-semibold text-on-error-container">
            Emergency Information
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm text-on-error-container">
          <div>
            <p className="text-xs font-semibold opacity-70">Emergency</p>
            <p className="font-bold text-lg">999</p>
          </div>
          <div>
            <p className="text-xs font-semibold opacity-70">Grid Ref</p>
            <p className="font-mono text-sm">{info.gridReference}</p>
          </div>
          <div>
            <p className="text-xs font-semibold opacity-70">what3words</p>
            <p className="font-mono text-sm">
              ///{info.what3words}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold opacity-70">Nearest Road</p>
            <p className="text-sm">{info.nearestRoad}</p>
          </div>
        </div>
        <p className="text-xs text-on-error-container opacity-70 mt-2">
          {info.mountainRescue}
        </p>
        <p className="text-xs text-on-error-container opacity-70 mt-1">
          Signal: {info.nearestPhone}
        </p>
      </div>
    </div>
  );
}
