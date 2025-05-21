import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

import Badge from "../../ui/badge/Badge";
import { useState } from "react";
import { Modal } from "../../ui/modal";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";

interface Station {
  id: number;
  name: string;
  location: string;
  status: "Active" | "Inactive";
}

const initialStations: Station[] = [
  { id: 1, name: "Trạm Trung Tâm", location: "21.0285, 105.8542", status: "Active" },
  { id: 2, name: "Trạm Quận 1", location: "10.7769, 106.7009", status: "Inactive" },
  { id: 3, name: "Trạm Quận 2", location: "10.7872, 106.7498", status: "Active" },
];

export default function BasicTableOne() {
  const [stations, setStations] = useState<Station[]>(initialStations);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);

  const handleRowClick = (station: Station) => {
    setEditingStation(station);
    setModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editingStation) return;
    const { name, value } = e.target;
    setEditingStation({ ...editingStation, [name]: value });
  };

  const handleUpdate = () => {
    if (!editingStation) return;
    setStations((prev) => prev.map((s) => (s.id === editingStation.id ? editingStation : s)));
    setModalOpen(false);
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 w-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800">Quản lý tài khoản</h3>
        <button
          type="button"
          onClick={() => {
            setEditingStation({ id: Date.now(), name: '', location: '', status: 'Active' });
            setModalOpen(true);
          }}
          className="px-5 py-2 rounded-md bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors text-base"
        >
          + Thêm trạm mới
        </button>
      </div>
      <div className="rounded-xl border border-gray-200 bg-white p-6 w-full">
        <div className="w-full overflow-x-auto">
          <Table className="w-full">
            {/* Table Header */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-6 py-4 font-bold text-gray-700 text-start text-xl dark:text-gray-400">
                  Tên trạm
                </TableCell>
                <TableCell isHeader className="px-6 py-4 font-bold text-gray-700 text-start text-xl dark:text-gray-400">
                  Vị trí
                </TableCell>
                <TableCell isHeader className="px-6 py-4 font-bold text-gray-700 text-start text-xl dark:text-gray-400">
                  Trạng thái
                </TableCell>
                <TableCell isHeader className="px-6 py-4 font-bold text-gray-700 text-start text-xl dark:text-gray-400">
                  Tác vụ
                </TableCell>
              </TableRow>
            </TableHeader>
            {/* Table Body */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05] text-lg">
              {stations.map((station) => (
                <TableRow key={station.id}>
                  <TableCell className="px-6 py-4 text-start align-middle text-lg">
                    <span className="block font-semibold text-gray-800 text-lg dark:text-white/90">
                      {station.name}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-500 text-start align-middle text-lg dark:text-gray-400">
                    {station.location}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-gray-500 text-start align-middle text-lg dark:text-gray-400">
                    <Badge
                      size="md"
                      color={station.status === "Active" ? "success" : "error"}
                    >
                      {station.status === "Active" ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-start align-middle">
                    <button
                      type="button"
                      onClick={() => handleRowClick(station)}
                      className="p-3 rounded-md bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                      title="Cập nhật"
                    >
                      <svg width="22" height="22" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M17.0911 3.53206C16.2124 2.65338 14.7878 2.65338 13.9091 3.53206L5.6074 11.8337C5.29899 12.1421 5.08687 12.5335 4.99684 12.9603L4.26177 16.445C4.20943 16.6931 4.286 16.9508 4.46529 17.1301C4.64458 17.3094 4.90232 17.3859 5.15042 17.3336L8.63507 16.5985C9.06184 16.5085 9.45324 16.2964 9.76165 15.988L18.0633 7.68631C18.942 6.80763 18.942 5.38301 18.0633 4.50433L17.0911 3.53206ZM14.9697 4.59272C15.2626 4.29982 15.7375 4.29982 16.0304 4.59272L17.0027 5.56499C17.2956 5.85788 17.2956 6.33276 17.0027 6.62565L16.1043 7.52402L14.0714 5.49109L14.9697 4.59272ZM13.0107 6.55175L6.66806 12.8944C6.56526 12.9972 6.49455 13.1277 6.46454 13.2699L5.96704 15.6283L8.32547 15.1308C8.46772 15.1008 8.59819 15.0301 8.70099 14.9273L15.0436 8.58468L13.0107 6.55175Z" fill="currentColor" />
                      </svg>
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} className="max-w-[500px] p-6">
        <div className="flex flex-col gap-6">
          <h4 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Cập nhật trạm</h4>
          <div>
            <Label htmlFor="name">Tên trạm</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={editingStation?.name || ""}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="location">Vị trí</Label>
            <Input
              id="location"
              name="location"
              type="text"
              value={editingStation?.location || ""}
              onChange={handleInputChange}
            />
          </div>
          <div>
            <Label htmlFor="status">Trạng thái</Label>
            <select
              id="status"
              name="status"
              className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              value={editingStation?.status || "Active"}
              onChange={handleInputChange}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-5 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              className="px-6 py-2 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
            >
              Cập Nhật
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
