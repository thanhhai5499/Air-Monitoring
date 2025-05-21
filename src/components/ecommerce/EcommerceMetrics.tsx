import {
  ArrowDownIcon,
  ArrowUpIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";

export default function EcommerceMetrics() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
      {/* <!-- UV Index Metric Item --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl dark:bg-gray-800">
          <span className="text-gray-800 text-lg font-bold dark:text-white/90">UV</span>
        </div>
        <div className="flex items-end justify-between mt-3">
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">UV Index</span>
            <h4 className="mt-1 font-bold text-gray-800 text-base dark:text-white/90">7.2</h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            5.2%
          </Badge>
        </div>
      </div>
      {/* <!-- PM2.5 Metric Item --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl dark:bg-gray-800">
          <span className="text-gray-800 text-lg font-bold dark:text-white/90">2.5</span>
        </div>
        <div className="flex items-end justify-between mt-3">
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">PM2.5</span>
            <h4 className="mt-1 font-bold text-gray-800 text-base dark:text-white/90">35 µg/m³</h4>
          </div>
          <Badge color="error">
            <ArrowDownIcon />
            2.1%
          </Badge>
        </div>
      </div>
      {/* <!-- PM10 Metric Item --> */}
      <div className="rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-white/[0.03] md:p-4">
        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-xl dark:bg-gray-800">
          <span className="text-gray-800 text-lg font-bold dark:text-white/90">10</span>
        </div>
        <div className="flex items-end justify-between mt-3">
          <div>
            <span className="text-xs text-gray-500 dark:text-gray-400">PM10</span>
            <h4 className="mt-1 font-bold text-gray-800 text-base dark:text-white/90">60 µg/m³</h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            1.8%
          </Badge>
        </div>
      </div>
    </div>
  );
}
