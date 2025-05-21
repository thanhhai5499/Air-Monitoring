import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useState } from "react";

export default function StatisticsChart() {
  const [station, setStation] = useState(1);
  const options: ApexOptions = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#465FFF", "#F59E42", "#22C55E"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line",
      toolbar: { show: false },
    },
    stroke: {
      curve: "straight",
      width: [2, 2, 2],
    },
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.55, opacityTo: 0 },
    },
    markers: {
      size: 0,
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 6 },
    },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: { enabled: false },
    tooltip: { enabled: true },
    xaxis: {
      type: "category",
      categories: Array.from({ length: 31 }, (_, i) => (i + 1).toString()),
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: { style: { fontSize: "12px", colors: ["#6B7280"] } },
      title: { text: "", style: { fontSize: "0px" } },
    },
  };

  function randomArr(min: number, max: number) {
    return Array.from({ length: 31 }, () => Math.round((Math.random() * (max - min) + min) * 10) / 10);
  }

  // Dữ liệu cho từng trạm
  const allStations = [
    [
      { name: "UV Index", data: randomArr(6, 10) },
      { name: "PM2.5", data: randomArr(18, 35) },
      { name: "PM10", data: randomArr(40, 60) },
    ],
    [
      { name: "UV Index", data: randomArr(5, 9) },
      { name: "PM2.5", data: randomArr(15, 30) },
      { name: "PM10", data: randomArr(35, 55) },
    ],
    [
      { name: "UV Index", data: randomArr(7, 11) },
      { name: "PM2.5", data: randomArr(20, 38) },
      { name: "PM10", data: randomArr(45, 65) },
    ],
  ];
  const series = allStations[station - 1];

  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-5 pb-5 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Thống kê chất lượng không khí theo trạm (theo ngày)
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Dữ liệu 3 chỉ số (UV, PM2.5, PM10) từng ngày trong tháng cho từng trạm quan trắc
          </p>
        </div>
        <div className="flex items-start w-full gap-3 sm:justify-end">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[1, 2, 3].map((num) => (
              <button
                key={num}
                className={`px-4 py-1 rounded-md font-medium text-sm transition-colors duration-150 ${station === num ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                onClick={() => setStation(num)}
              >
                Trạm {num}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          <Chart options={options} series={series} type="area" height={310} />
        </div>
      </div>
    </div>
  );
}
