import PageBreadcrumb from "../components/common/PageBreadCrumb";
// import DefaultInputs from "../components/form/form-elements/DefaultInputs";
import PageMeta from "../components/common/PageMeta";
import BasicTableOne from "../components/tables/BasicTables/BasicTableOne";

export default function Stations() {
  return (
    <div>
      <PageMeta
        title="Quản lý các trạm | Air Monitoring"
        description="Quản lý các trạm quan trắc không khí"
      />
      <PageBreadcrumb pageTitle="Quản lý các trạm" />
      <div className="flex flex-col min-h-[60vh] pt-8 gap-10 w-full">
        {/* <div className="w-full max-w-xl">
          <DefaultInputs />
        </div> */}
        <div className="w-full">
          <BasicTableOne />
        </div>
      </div>
    </div>
  );
} 