import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";

const metrics = [
  {
    label: "UV Index",
    value: 6.8,
    percent: 4,
    isUp: true,
    color: "#465FFF",
  },
  {
    label: "PM2.5",
    value: 28,
    percent: 3,
    isUp: false,
    color: "#F59E42",
  },
  {
    label: "PM10",
    value: 52,
    percent: 2,
    isUp: true,
    color: "#22C55E",
  },
];

export default function MonthlyTarget() {
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Trung bình tháng
            </h3>
            <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
              Trung bình tháng của các chỉ số chất lượng không khí
            </p>
          </div>
          <div className="relative inline-block">
            <button className="dropdown-toggle" onClick={toggleDropdown}>
              <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
            </button>
            <Dropdown
              isOpen={isOpen}
              onClose={closeDropdown}
              className="w-40 p-2"
            >
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                View More
              </DropdownItem>
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Delete
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 mt-6 sm:grid-cols-3">
          {metrics.map((m) => {
            const options: ApexOptions = {
              colors: [m.color],
              chart: {
                fontFamily: "Outfit, sans-serif",
                type: "radialBar",
                height: 120,
                sparkline: { enabled: true },
              },
              plotOptions: {
                radialBar: {
                  startAngle: -120,
                  endAngle: 120,
                  hollow: { size: "65%" },
                  track: {
                    background: "#F3F4F6",
                    strokeWidth: "100%",
                    margin: 5,
                  },
                  dataLabels: {
                    name: { show: false },
                    value: {
                      fontSize: "28px",
                      fontWeight: "700",
                      offsetY: 8,
                      color: "#1D2939",
                      formatter: function (val) {
                        if (m.label === "UV Index") return String(val);
                        return `${val}`;
                      },
                    },
                  },
                },
              },
              fill: { type: "solid", colors: [m.color] },
              stroke: { lineCap: "round" },
              labels: [m.label],
            };
            return (
              <div key={m.label} className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col items-center dark:border-gray-800 dark:bg-white/[0.03]">
                <Chart options={options} series={[m.value]} type="radialBar" height={120} />
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">{m.label}</div>
                <span className={`inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${m.isUp ? 'bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-500' : 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500'}`}>
                  {m.isUp ? <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg> : <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>}
                  {m.isUp ? '+' : '-'}{m.percent}%
                </span>
              </div>
            );
          })}
        </div>
        <p className="mx-auto mt-8 w-full max-w-[380px] text-center text-sm text-gray-500 sm:text-base">
          Chỉ số trung bình tháng: UV Index 6.8 (tăng 4%), PM2.5 28 µg/m³ (giảm 3%), PM10 52 µg/m³ (tăng 2%).
        </p>
      </div>
    </div>
  );
}
