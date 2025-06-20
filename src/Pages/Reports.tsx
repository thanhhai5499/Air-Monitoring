import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import DataTable, { TableColumn } from '../components/DataTable';
import StationSelector from '../components/StationSelector';
import DatePicker from '../components/DatePicker';
import * as XLSX from 'xlsx';
import { mockStations } from '../data/mockStations';
import {
  availableYears,
  getMonthlyHistoricalData,
  getDailyHistoricalData,
  type HistoricalReportData
} from '../data/historicalData';
import type { StationData } from '../types/station';

type ViewType = 'monthly' | 'yearly';
type DataType = 'all' | 'uv' | 'pm25' | 'pm10';

// Use the interface from historicalData
type ReportData = HistoricalReportData;

const Reports: React.FC = () => {
  const [selectedStation, setSelectedStation] = useState<StationData | null>(mockStations[0]);
  const [viewType, setViewType] = useState<ViewType>('monthly');
  const [dataType, setDataType] = useState<DataType>('all');
  const [fromDate, setFromDate] = useState<string>('2024-01-01');
  const [toDate, setToDate] = useState<string>('2024-12-31');
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState<ReportData[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentDataViewType, setCurrentDataViewType] = useState<ViewType>('monthly');

  const handleStationChange = (station: StationData) => setSelectedStation(station);

  // Generate initial data on component mount
  useEffect(() => {
    if (selectedStation && fromDate && toDate) {
      generateTableData();
    }
  }, []);

  // Generate table data based on selected filters
  const generateTableData = () => {
    if (!selectedStation || !fromDate || !toDate) {
      setTableData([]);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    setTimeout(() => {
      let data: ReportData[];
      const fromYear = new Date(fromDate).getFullYear();

      if (viewType === 'monthly') {
        data = getMonthlyHistoricalData(selectedStation.id, fromYear);
      } else {
        data = getDailyHistoricalData(selectedStation.id, fromYear);
      }

      // Filter data based on date range
      const filteredData = data.filter(item => {
        const itemDate = new Date(item.date);
        const from = new Date(fromDate);
        const to = new Date(toDate);
        return itemDate >= from && itemDate <= to;
      });

      setTableData(filteredData);
      setCurrentDataViewType(viewType); // Update the current data view type
      setLoading(false);
    }, 500);
  };

  // Handle filter button click
  const handleFilter = () => {
    generateTableData();
  };

  // Handle Excel export
  const handleExportExcel = () => {
    if (tableData.length === 0) return;

    // Prepare data for export
    const exportData = tableData.map((row, index) => {
      const exportRow: any = {
        'STT': index + 1,
        [currentDataViewType === 'monthly' ? 'THÁNG' : 'NGÀY']: row.period
      };

      if (dataType === 'all' || dataType === 'uv') {
        exportRow['UV INDEX'] = row.uv;
      }
      if (dataType === 'all' || dataType === 'pm10') {
        exportRow['PM1.0 (μg/m³)'] = row.pm10;
      }
      if (dataType === 'all' || dataType === 'pm25') {
        exportRow['PM2.5 (μg/m³)'] = row.pm25;
      }
      exportRow['NGÀY CẬP NHẬT'] = new Date(row.date).toLocaleDateString('vi-VN');

      return exportRow;
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const columnWidths = [
      { wch: 5 },  // STT
      { wch: 15 }, // THÁNG/NGÀY
      { wch: 12 }, // UV INDEX
      { wch: 15 }, // PM1.0
      { wch: 15 }, // PM2.5
      { wch: 15 }  // NGÀY CẬP NHẬT
    ];
    worksheet['!cols'] = columnWidths;

    // Add worksheet to workbook
    const sheetName = currentDataViewType === 'monthly' ? 'Báo cáo theo tháng' : 'Báo cáo theo ngày';
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate filename
    const fileName = `bao-cao-chat-luong-khong-khi-${selectedStation?.name || 'tram'}-${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, fileName);
  };

  // Force table re-render when currentDataViewType changes to update column titles
  const [tableKey, setTableKey] = useState(0);
  useEffect(() => {
    setTableKey(prev => prev + 1);
  }, [currentDataViewType]);

  // Define table columns based on data type
  const getColumns = (): TableColumn[] => {
    const baseColumns: TableColumn[] = [
      {
        key: 'period',
        title: currentDataViewType === 'monthly' ? 'THÁNG' : 'NGÀY',
        width: '80px',
        align: 'left'
      }
    ];

    if (dataType === 'all' || dataType === 'uv') {
      baseColumns.push({
        key: 'uv',
        title: 'UV Index',
        width: '70px',
        align: 'center',
        render: (value: number) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${value >= 8 ? 'bg-red-100 text-red-800' :
            value >= 6 ? 'bg-orange-100 text-orange-800' :
              value >= 3 ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
            }`}>
            {value.toFixed(1)}
          </span>
        )
      });
    }

    if (dataType === 'all' || dataType === 'pm10') {
      baseColumns.push({
        key: 'pm10',
        title: 'PM1.0 (μg/m³)',
        width: '90px',
        align: 'center',
        render: (value: number) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${value >= 50 ? 'bg-red-100 text-red-800' :
            value >= 40 ? 'bg-orange-100 text-orange-800' :
              value >= 30 ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
            }`}>
            {value.toFixed(1)}
          </span>
        )
      });
    }

    if (dataType === 'all' || dataType === 'pm25') {
      baseColumns.push({
        key: 'pm25',
        title: 'PM2.5 (μg/m³)',
        width: '90px',
        align: 'center',
        render: (value: number) => (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${value >= 35 ? 'bg-red-100 text-red-800' :
            value >= 25 ? 'bg-orange-100 text-orange-800' :
              value >= 15 ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
            }`}>
            {value.toFixed(1)}
          </span>
        )
      });
    }

    baseColumns.push({
      key: 'date',
      title: 'Ngày cập nhật',
      width: '100px',
      align: 'center',
      render: (value: string) => new Date(value).toLocaleDateString('vi-VN')
    });

    return baseColumns;
  };

  // Calculate statistics
  const getStatistics = () => {
    if (tableData.length === 0) return null;

    const uvAvg = tableData.reduce((sum, item) => sum + item.uv, 0) / tableData.length;
    const pm25Avg = tableData.reduce((sum, item) => sum + item.pm25, 0) / tableData.length;
    const pm10Avg = tableData.reduce((sum, item) => sum + item.pm10, 0) / tableData.length;

    const uvMax = Math.max(...tableData.map(item => item.uv));
    const pm25Max = Math.max(...tableData.map(item => item.pm25));
    const pm10Max = Math.max(...tableData.map(item => item.pm10));

    return {
      uvAvg: uvAvg.toFixed(1),
      pm25Avg: pm25Avg.toFixed(1),
      pm10Avg: pm10Avg.toFixed(1),
      uvMax: uvMax.toFixed(1),
      pm25Max: pm25Max.toFixed(1),
      pm10Max: pm10Max.toFixed(1)
    };
  };

  const statistics = getStatistics();

  return (
    <Layout>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-3 sm:px-6 pt-6 sm:pt-8 pb-6 flex-shrink-0 border-b border-gray-100">
          <div className="flex flex-col gap-1">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Báo cáo chất lượng không khí</h1>
                  <p className="text-gray-600 text-xs mt-1">
                    {hasSearched && fromDate && toDate ? (
                      <>
                        Dữ liệu chi tiết về các chỉ số môi trường từ <span className="font-semibold text-blue-600">{new Date(fromDate).toLocaleDateString('vi-VN')}</span> đến <span className="font-semibold text-blue-600">{new Date(toDate).toLocaleDateString('vi-VN')}</span>
                      </>
                    ) : (
                      "Chọn trạm quan trắc, thời gian và các thông số để xem báo cáo chi tiết"
                    )}
                  </p>
                </div>
              </div>
            </div>
            {/* Filters - moved below the title */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2 ">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 xl:grid-cols-12 gap-4 items-end">
                {/* Station Selector */}
                <div className="sm:col-span-2 lg:col-span-2 xl:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạm quan trắc</label>
                  <div className="min-w-0 h-[36px]">
                    <StationSelector
                      stations={mockStations}
                      selectedStation={selectedStation}
                      onStationChange={handleStationChange}
                      placeholder="Chọn trạm báo cáo"
                    />
                  </div>
                </div>
                {/* View Type Filter */}
                <div className="lg:col-span-1 xl:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại hiển thị</label>
                  <div className="flex rounded-lg border border-gray-300 bg-gray-50 p-1 h-[36px]">
                    <button
                      onClick={() => setViewType('monthly')}
                      className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap ${viewType === 'monthly'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                        }`}
                    >
                      Theo tháng
                    </button>
                    <button
                      onClick={() => setViewType('yearly')}
                      className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap ${viewType === 'yearly'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                        }`}
                    >
                      Theo ngày
                    </button>
                  </div>
                </div>
                {/* From Date Filter */}
                <div className="lg:col-span-1 xl:col-span-2">
                  <DatePicker
                    value={fromDate}
                    onChange={setFromDate}
                    label="Từ ngày"
                    placeholder="dd/mm/yyyy"
                  />
                </div>
                {/* To Date Filter */}
                <div className="lg:col-span-1 xl:col-span-2">
                  <DatePicker
                    value={toDate}
                    onChange={setToDate}
                    label="Đến ngày"
                    placeholder="dd/mm/yyyy"
                  />
                </div>
                {/* Data Type Filter */}
                <div className="lg:col-span-1 xl:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Chỉ số</label>
                  <div className="relative h-[36px]">
                    <select
                      value={dataType}
                      onChange={(e) => setDataType(e.target.value as DataType)}
                      className="w-full pl-8 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none shadow-sm h-full"
                    >
                      <option value="all">Tất cả chỉ số</option>
                      <option value="uv">Chỉ UV Index</option>
                      <option value="pm10">Chỉ PM1.0</option>
                      <option value="pm25">Chỉ PM2.5</option>
                    </select>
                    <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <svg className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {/* Filter Button */}
                <div className="lg:col-span-1 xl:col-span-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">&nbsp;</label>
                  <button
                    onClick={handleFilter}
                    disabled={!selectedStation || !fromDate || !toDate}
                    className="w-full h-[36px] px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm transition-colors duration-200"
                  >
                    <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="flex-1 px-3 sm:px-6 pb-6 min-h-0">
          <DataTable
            key={tableKey}
            columns={getColumns()}
            data={tableData}
            loading={loading}
            showIndex={true}
            indexTitle="STT"
            emptyText={hasSearched ? "Không có dữ liệu để hiển thị" : "Chọn các bộ lọc và nhấn nút tìm kiếm để hiển thị dữ liệu"}
            className="h-full"
            pagination={{
              pageSize: 10,
              showSizeChanger: false,
              showTotal: false
            }}
            exportButton={{
              show: tableData.length > 0,
              onExport: handleExportExcel,
              text: "Tải báo cáo Excel"
            }}
          />
        </div>
      </div>
    </Layout>
  );
};

export default Reports; 