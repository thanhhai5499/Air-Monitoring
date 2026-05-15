import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import DataTable from '../components/DataTable';
import StationSelector from '../components/StationSelector';
import DatePicker from '../components/DatePicker';
import * as XLSX from 'xlsx';
import { fetchStationsList, fetchStationSensors, fetchReportFilter } from '../services/dataApi';
import type { StationData } from '../types/station';
import { TableColumn } from '../types/components';

type ViewType = 'monthly' | 'yearly' | 'hourly';
type DataType = 'all' | 'uv' | 'pm25' | 'pm10';

// Đã xóa import historicalData từ dữ liệu mẫu

type ReportData = any;

// Hàm lấy ngày hôm nay dạng yyyy-MM-dd
const getTodayString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const Reports: React.FC = () => {
  const [stations, setStations] = useState<StationData[]>([]);
  const [selectedStation, setSelectedStation] = useState<StationData | null>(null);
  const [viewType, setViewType] = useState<ViewType>('monthly');
  const [dataType, setDataType] = useState<DataType>('all');
  const [fromDate, setFromDate] = useState<string>(getTodayString());
  const [toDate, setToDate] = useState<string>(getTodayString());
  const [loading, setLoading] = useState(false);
  const [tableData, setTableData] = useState<ReportData[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentDataViewType, setCurrentDataViewType] = useState<ViewType>('monthly');
  const [stationSensors, setStationSensors] = useState<{ [stationId: string]: any[] }>({});
  const [sensorTypes, setSensorTypes] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([]);
  const [tableRows, setTableRows] = useState<any[]>([]);

  useEffect(() => {
    fetchStationsList()
      .then((data: any[]) => {
        const mapped = data.map((s) => {
          let status: 'online' | 'maintenance' | 'offline' = 'offline';
          if (s.Status === 'active') status = 'online';
          else if (s.Status === 'maintenance') status = 'maintenance';
          return {
            id: s.Id?.toString() || s.id?.toString() || '',
            name: s.Name || s.name || '',
            status,
            location: s.Location || s.location || '',
            coordinates: { lat: 0, lng: 0 },
            sensors: [],
          };
        });
        setStations(mapped);
        setSelectedStation(mapped[0] || null);
      })
      .catch((err: unknown) => {
        setStations([]);
        setSelectedStation(null);
        // Có thể show toast lỗi ở đây
      });
  }, []);

  useEffect(() => {
    fetchStationSensors().then((data) => {
      // data: [{ StationId, SensorTypeId, Name, ... }]
      // Group by StationId
      const grouped: { [stationId: string]: any[] } = {};
      data.forEach((item: any) => {
        if (!grouped[item.StationId]) grouped[item.StationId] = [];
        grouped[item.StationId].push(item);
      });
      setStationSensors(grouped);
    });
  }, []);

  useEffect(() => {
    if (!selectedStation) {
      setSensorTypes([]);
      return;
    }
    fetchStationSensors(selectedStation.id).then((data) => {
      // data: [{ StationId, SensorTypeId, Name, ... }]
      const sensors = data.filter((item: any) => item.Name !== 'Battery');
      setSensorTypes(sensors);
    });
  }, [selectedStation]);

  const handleStationChange = (station: StationData) => setSelectedStation(station);

  // Generate initial data on component mount
  useEffect(() => {
    if (selectedStation && fromDate && toDate) {
      generateTableData();
    }
  }, []);

  // Generate table data based on selected filters
  const generateTableData = async () => {
    if (!selectedStation || !fromDate || !toDate) {
      setTableData([]);
      return;
    }

    setLoading(true);
    setHasSearched(true);

    try {
      const data = await fetchReportFilter({
        stationId: selectedStation.id,
        fromDate,
        toDate,
        dataType: dataType === 'all' ? 'all' : dataType,
        viewType
      });
      setTableData(data);
      setCurrentDataViewType(viewType);
    } catch (err) {
      setTableData([]);
      // Có thể show toast lỗi ở đây
    } finally {
      setLoading(false);
    }
  };

  // Handle filter button click
  const handleFilter = () => {
    generateTableData();
  };

  // Handle Excel export
  const handleExportExcel = () => {
    if (tableRows.length === 0) return;

    // Lấy danh sách cột động (trừ period, hoặc trừ period/hour nếu hourly)
    let exportColumns: TableColumn[] = [];
    if (currentDataViewType === 'hourly') {
      exportColumns = tableColumns.filter(col => col.key !== 'period' && col.key !== 'hour');
    } else {
      exportColumns = tableColumns.filter(col => col.key !== 'period');
    }
    const exportData = tableRows.map((row, index) => {
      const exportRow: any = {
        'STT': index + 1
      };
      if (currentDataViewType === 'hourly') {
        // Format ngày về dd/mm/yyyy
        let dateStr = row.period;
        if (typeof dateStr === 'string') {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            dateStr = d.toLocaleDateString('vi-VN');
          }
        }
        exportRow['NGÀY'] = dateStr;
        exportRow['GIỜ'] = row.hour !== undefined ? row.hour.toString().padStart(2, '0') + ':00' : '';
      } else {
        exportRow[currentDataViewType === 'monthly' ? 'THÁNG' : 'NGÀY'] = row.period;
      }
      // Thêm các chỉ số động
      exportColumns.forEach(col => {
        exportRow[col.title] = row[col.key];
      });
      return exportRow;
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();

    // Add worksheet to workbook
    const sheetName =
      currentDataViewType === 'monthly' ? 'Báo cáo theo tháng'
        : currentDataViewType === 'hourly' ? 'Báo cáo theo giờ'
          : 'Báo cáo theo ngày';

    // Tạo tiêu đề động
    const viewTypeLabel =
      currentDataViewType === 'monthly' ? 'tháng'
        : currentDataViewType === 'hourly' ? 'giờ'
          : 'ngày';
    // Lấy chỉ số được chọn (nếu là all thì ghi 'tất cả chỉ số')
    let indicatorLabel = 'tất cả chỉ số';
    if (dataType !== 'all') indicatorLabel = dataType;
    // Lấy location thay cho tên trạm
    const stationLabel = selectedStation?.location || '';
    // Lấy ngày
    const fromLabel = (() => { const d = new Date(fromDate); return !isNaN(d.getTime()) ? d.toLocaleDateString('vi-VN') : fromDate; })();
    const toLabel = (() => { const d = new Date(toDate); return !isNaN(d.getTime()) ? d.toLocaleDateString('vi-VN') : toDate; })();
    const title = `Báo cáo thống kê dữ liệu của ${stationLabel} theo ${viewTypeLabel} của chỉ số ${indicatorLabel} từ ${fromLabel} đến ${toLabel}`;

    // Thêm dòng tiêu đề vào đầu sheet
    const header = Object.keys(exportData[0] || {});
    const dataWithTitle = [Array(header.length).fill('')];
    dataWithTitle[0][0] = title;
    dataWithTitle.push(header);
    exportData.forEach(row => {
      dataWithTitle.push(header.map(h => row[h]));
    });
    const worksheet = XLSX.utils.aoa_to_sheet(dataWithTitle);
    // Merge & center dòng tiêu đề đầu tiên, wrap text
    if (header.length > 1) {
      worksheet['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: header.length - 1 } }
      ];
      worksheet['A1'].s = {
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
      };
    }
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Format dates as dd-mm-yyyy
    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    };
    const from = formatDate(fromDate);
    const to = formatDate(toDate);
    const stationName = selectedStation?.name?.replace(/[^a-zA-Z0-9-_]/g, '_') || 'tram';
    const fileName = `bao-cao-${stationName}-tu_${from}_den_${to}.xlsx`;

    // Save file
    XLSX.writeFile(workbook, fileName);
  };

  // Force table re-render when currentDataViewType changes to update column titles
  const [tableKey, setTableKey] = useState(0);
  useEffect(() => {
    setTableKey(prev => prev + 1);
  }, [currentDataViewType]);

  // Sau khi fetch xong tableData, tự động sinh columns và rows động
  useEffect(() => {
    const dataArr = tableData as any[];
    if (!Array.isArray(dataArr) || dataArr.length === 0) {
      setTableColumns([]);
      setTableRows([]);
      return;
    }
    // 1. Lấy danh sách period duy nhất
    let periods: any[] = [];
    if (currentDataViewType === 'hourly') {
      // period = date + hour
      periods = [...new Set(dataArr.map(item => `${item.date}__${item.hour}`))];
    } else {
      periods = [...new Set(dataArr.map(item => item.period))];
    }
    // 2. Lấy danh sách indicator duy nhất, loại bỏ 'Battery'
    const indicators = [...new Set(dataArr.map(item => item.indicator))].filter(ind => ind !== 'Battery');
    // 3. Group data theo period
    const rows = periods.map(period => {
      let items, firstItem, row: any;
      if (currentDataViewType === 'hourly') {
        const [date, hour] = period.split('__');
        items = dataArr.filter(item => item.date === date && String(item.hour) === hour);
        firstItem = items[0] || {};
        row = { period: date, hour };
      } else {
        items = dataArr.filter(item => item.period === period);
        firstItem = items[0] || {};
        row = { period };
        if (firstItem.month) row.month = firstItem.month;
        if (firstItem.year) row.year = firstItem.year;
      }
      items.forEach(item => {
        if (item.indicator !== 'Battery') {
          row[item.indicator] = item.avgValue;
        }
      });
      return row;
    });
    // 4. Sinh columns động
    const columns: TableColumn[] = [];
    if (currentDataViewType === 'hourly') {
      columns.push({
        key: 'period',
        title: 'NGÀY',
        width: '80px',
        align: 'left' as const,
        render: (value: any) => {
          if (typeof value === 'string') {
            const d = new Date(value);
            if (!isNaN(d.getTime())) {
              return d.toLocaleDateString('vi-VN');
            }
          }
          return value;
        }
      });
      columns.push({
        key: 'hour',
        title: 'GIỜ',
        width: '60px',
        align: 'center' as const,
        render: (value: any) => value !== undefined ? value.toString().padStart(2, '0') + ':00' : '--'
      });
    } else {
      columns.push({
        key: 'period',
        title: currentDataViewType === 'monthly' ? 'THÁNG' : 'NGÀY',
        width: '80px',
        align: 'left' as const,
        render: (value: any, row: any) => {
          if (currentDataViewType === 'monthly') {
            if (row.month && row.year) {
              return `${row.month.toString().padStart(2, '0')}/${row.year}`;
            }
            if (typeof value === 'string') {
              const d = new Date(value);
              if (!isNaN(d.getTime())) {
                return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
              }
            }
            return '-';
          } else {
            if (typeof value === 'string') {
              const d = new Date(value);
              if (!isNaN(d.getTime())) {
                return d.toLocaleDateString('vi-VN');
              }
            }
            return value;
          }
        }
      });
    }
    columns.push(...indicators.map(ind => ({
      key: ind,
      title: ind,
      width: '90px',
      align: 'center' as const,
      render: (value: number) => value !== undefined ? value.toFixed(1) : '--'
    })));
    setTableColumns(columns);
    setTableRows(rows);
  }, [tableData, currentDataViewType]);

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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-4 flex-wrap">
                {/* Trạm quan trắc */}
                <div className="flex-1 min-w-[280px] max-w-[400px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạm quan trắc</label>
                  <StationSelector
                    stations={stations}
                    selectedStation={selectedStation}
                    onStationChange={handleStationChange}
                    placeholder="Chọn trạm báo cáo"
                  />
                </div>
                {/* Loại hiển thị */}
                <div className="flex-1 min-w-[200px] ">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại hiển thị</label>
                  <div className="flex gap-2 rounded-lg border border-gray-300 bg-gray-50 p-1 min-h-[36px] w-full">
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
                    <button
                      onClick={() => setViewType('hourly')}
                      className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 whitespace-nowrap ${viewType === 'hourly'
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                        }`}
                    >
                      Theo giờ
                    </button>
                  </div>
                </div>
                {/* Từ ngày */}
                <div className="flex-1 min-w-[90px] max-w-[160px]">
                  <DatePicker
                    value={fromDate}
                    onChange={setFromDate}
                    label="Từ ngày"
                    placeholder="dd/mm/yyyy"
                  />
                </div>
                {/* Đến ngày */}
                <div className="flex-1 min-w-[90px] max-w-[160px]">
                  <DatePicker
                    value={toDate}
                    onChange={setToDate}
                    label="Đến ngày"
                    placeholder="dd/mm/yyyy"
                  />
                </div>
                {/* Chỉ số */}
                <div className="flex-1 min-w-[90px] max-w-[160px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Chỉ số</label>
                  <select
                    value={dataType}
                    onChange={(e) => setDataType(e.target.value as DataType)}
                    className="w-full pl-8 pr-8 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none shadow-sm h-full"
                  >
                    <option value="all">Tất cả chỉ số</option>
                    {sensorTypes.filter(s => s.Name !== 'Battery').map(s => (
                      <option key={s.SensorTypeId} value={s.Name}>
                        {s.Name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Nút lọc */}
                <div className="min-w-[60px] flex items-end">
                  <button
                    onClick={handleFilter}
                    disabled={!selectedStation || !fromDate || !toDate}
                    className="w-full h-[36px] px-3 py-2 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm transition-colors duration-200"
                  >
                    <svg className="w-3 h-3 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            columns={hasSearched ? tableColumns : []}
            data={hasSearched ? tableRows : []}
            loading={loading}
            showIndex={hasSearched}
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
    </Layout >
  );
};

export default Reports; 