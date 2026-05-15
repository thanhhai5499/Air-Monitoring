// Component interfaces

export interface TableColumn {
    key: string;
    title: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
    render?: (value: any, record: any, index: number) => React.ReactNode;
}

export interface DataTableProps {
    columns: TableColumn[];
    data: any[];
    loading?: boolean;
    emptyText?: string;
    className?: string;
    showIndex?: boolean;
    indexTitle?: string;
    pagination?: {
        pageSize?: number;
        showSizeChanger?: boolean;
        showTotal?: boolean;
    };
    exportButton?: {
        show: boolean;
        onExport: () => void;
        text?: string;
    };
}

export interface HeaderProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
}

export interface SidebarProps {
    isOpen: boolean;
    isCollapsed: boolean;
    onClose: () => void;
}

export interface LayoutProps {
    children: React.ReactNode;
}

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface UserInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    userInfo: {
        fullName: string;
        email: string;
        workplace: string;
        position: string;
        phone?: string;
        avatar?: string;
    };
    onSave?: (data: {
        fullName: string;
        email: string;
        workplace: string;
        position: string;
        phone?: string;
        avatar?: string;
    }) => void;
}

export interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onChangePassword?: (current: string, newPass: string) => void;
}

export interface StationDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    station: any;
}

export interface StationSelectorProps {
    selectedStation: any;
    onStationChange: (station: any) => void;
    stations: any[];
}

export interface MapComponentProps {
    stations: any[];
    selectedStation?: any;
    onStationSelect?: (station: any) => void;
}

export interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    placeholder?: string;
    className?: string;
}

export interface UpdateUserStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: number;
    currentStatus: string;
    onUpdate: (userId: number, status: string) => void;
}

export interface UpdateUserRoleModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: number;
    currentRole: string;
    onUpdate: (userId: number, role: string) => void;
}

export interface UpdateManagementUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    onUpdate: (userId: number, data: any) => void;
}

export interface DeactivateUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: number;
    userName: string;
    onDeactivate: (userId: number) => void;
}

export interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: string;
} 