import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventInput, EventContentArg } from "@fullcalendar/core";
import { Modal } from "../components/ui/modal";
import { useModal } from "../hooks/useModal";
import PageMeta from "../components/common/PageMeta";
import DatePicker from "../components/form/date-picker";

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
  };
}

const Calendar: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();

  useEffect(() => {
    // Initialize with no events
    setEvents([]);
  }, []);

  const handleDateSelect = () => {
    resetModalFields();
    openModal();
  };

  const handleEventClick = () => {
    openModal();
  };

  const resetModalFields = () => {};

  return (
    <>
      <PageMeta
        title="Calendar | Air Monitoring Dashboard"
        description="Calendar for scheduling and managing events in the Air Monitoring system"
      />
      <div className="rounded-2xl border  border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="custom-calendar">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: "prev,next addEventButton",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            events={events}
            selectable={true}
            select={handleDateSelect}
            eventClick={handleEventClick}
            eventContent={renderEventContent}
            customButtons={{
              addEventButton: {
                text: "Lọc báo cáo",
                click: openModal,
              },
            }}
          />
        </div>
        <Modal
          isOpen={isOpen}
          onClose={closeModal}
          className="max-w-[700px] h-[600px] p-6 lg:p-10"
        >
          <div className="flex flex-col px-6 custom-scrollbar gap-4">
            <div>
              <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                Lọc Báo Cáo
              </h5>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Chọn các tiêu chí để lọc và xuất báo cáo dữ liệu quan trắc không khí
              </p>
            </div>
            <div className="flex flex-col gap-4 mt-8 w-full">
              <div className="flex flex-col gap-2 w-full mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Chọn khoảng thời gian
                </label>
                <div className="flex gap-4 w-full">
                  <div className="flex-1 min-w-0">
                    <DatePicker
                      id="report-date-from"
                      mode="single"
                      label="Từ ngày"
                      placeholder="mm/dd/yyyy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <DatePicker
                      id="report-date-to"
                      mode="single"
                      label="Đến ngày"
                      placeholder="mm/dd/yyyy"
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 w-full mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Chọn trạm quan trắc
                </label>
                <select
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                >
                  <option value="">Tất cả các trạm</option>
                  <option value="tram1">Trạm 1</option>
                  <option value="tram2">Trạm 2</option>
                  <option value="tram3">Trạm 3</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 w-full mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Chọn thông số
                </label>
                <select
                  className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                >
                  <option value="">Tất cả thông số</option>
                  <option value="uv">Chỉ số UV</option>
                  <option value="pm25">PM2.5</option>
                  <option value="pm10">PM10</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-6 modal-footer justify-center">
              <button
                onClick={closeModal}
                type="button"
                className="flex w-32 justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              >
                Đóng
              </button>
              <button
                onClick={() => { /* TODO: implement export to Excel */ }}
                type="button"
                className="btn btn-success btn-update-event flex w-32 justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600"
              >
                Xuất dữ liệu
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </>
  );
};

const renderEventContent = (eventInfo: EventContentArg) => {
  const event = eventInfo.event;
  // TypeScript assertion để xác định kiểu cho extendedProps
  const calendar = (event.extendedProps as { calendar: string }).calendar;
  const colorClass = `fc-bg-${calendar.toLowerCase()}`;
  return (
    <div
      className={`event-fc-color flex fc-event-main ${colorClass} p-1 rounded-sm`}
    >
      <div className="fc-daygrid-event-dot"></div>
      <div className="fc-event-time">{eventInfo.timeText}</div>
      <div className="fc-event-title">{event.title}</div>
    </div>
  );
};

export default Calendar;
