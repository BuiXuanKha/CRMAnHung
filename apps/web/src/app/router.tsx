import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '../features/auth/login-page';
import { AppLayout } from '../shared/ui/layout';
import { PlaceholderPage } from '../shared/ui/placeholder-page';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route
          path="/khach-hang"
          element={
            <PlaceholderPage
              title="Khách hàng"
              description="Module khách hàng sẽ được chuyển từ FacebookCustomerCRM sang đây (P1)."
            />
          }
        />
        <Route
          path="/lo-dat"
          element={
            <PlaceholderPage
              title="Lô đất"
              description="Danh sách / chi tiết lô đất — triển khai ở P2."
            />
          }
        />
        <Route
          path="/giao-dich"
          element={
            <PlaceholderPage
              title="Giao dịch"
              description="Quản lý giao dịch — triển khai ở P3."
            />
          }
        />
        <Route
          path="/dich-vu-so-do"
          element={
            <PlaceholderPage
              title="Dịch vụ sổ đỏ"
              description="Hồ sơ dịch vụ sổ đỏ — triển khai ở P3."
            />
          }
        />
        <Route
          path="/quan-tri/khach-hang"
          element={
            <PlaceholderPage
              title="Quản trị khách hàng"
              description="Registry toàn hệ thống (ADMIN) — triển khai ở P4."
            />
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/khach-hang" replace />} />
    </Routes>
  );
}
