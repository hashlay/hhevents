import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { ToastContainer } from './components/ui/ToastContainer';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { MobileBottomBar } from './components/ui/MobileBottomBar';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { AboutPage } from './pages/public/AboutPage';
import { HallsPage } from './pages/public/HallsPage';
import { FacilitiesPage } from './pages/public/FacilitiesPage';
import { GalleryPage } from './pages/public/GalleryPage';
import { PricingPage } from './pages/public/PricingPage';
import { AvailabilityPage } from './pages/public/AvailabilityPage';
import { BookPage } from './pages/public/BookPage';
import { TrackBookingPage } from './pages/public/TrackBookingPage';
import { LocationPage } from './pages/public/LocationPage';
import { ContactPage } from './pages/public/ContactPage';
import { PrivacyPolicyPage } from './pages/public/PrivacyPolicyPage';
import { TermsPage } from './pages/public/TermsPage';
import { RefundPolicyPage } from './pages/public/RefundPolicyPage';
import { CookiePolicyPage } from './pages/public/CookiePolicyPage';

// Admin Pages
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminRequestsPage } from './pages/admin/AdminRequestsPage';
import { AdminAvailabilityPage } from './pages/admin/AdminAvailabilityPage';
import { AdminCalendarPage } from './pages/admin/AdminCalendarPage';
import { AdminMaintenancePage } from './pages/admin/AdminMaintenancePage';
import { AdminHistoryPage } from './pages/admin/AdminHistoryPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminPhotosPage } from './pages/admin/AdminPhotosPage';
import { AdminPackagesPage } from './pages/admin/AdminPackagesPage';
import { AdminCouponsPage } from './pages/admin/AdminCouponsPage';
import { AdminInquiriesPage } from './pages/admin/AdminInquiriesPage';
import { AdminPaymentsPage } from './pages/admin/AdminPaymentsPage';

const AppContent: React.FC = () => {
  const { currentPath, navigate } = useNavigation();
  const { isAuthenticated, isLoading, user } = useAuth();

  const isAdminRoute = currentPath.startsWith('/admin');
  const isAdminLogin = currentPath === '/admin/login';

  // Admin Route Protection Guard
  const renderAdminRoute = () => {
    if (isLoading && !user && !isAdminLogin) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0B1E19]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#C9AA72] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-[#FAF8F5]">Verifying Executive Session...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated && !isAdminLogin) {
      return <AdminLoginPage navigate={navigate} />;
    }

    switch (currentPath) {
      case '/admin':
        return isAuthenticated ? <AdminDashboardPage navigate={navigate} /> : <AdminLoginPage navigate={navigate} />;
      case '/admin/login':
        return <AdminLoginPage navigate={navigate} />;
      case '/admin/dashboard':
        return <AdminDashboardPage navigate={navigate} />;
      case '/admin/bookings':
      case '/admin/requests':
        return <AdminRequestsPage navigate={navigate} />;
      case '/admin/packages':
        return <AdminPackagesPage navigate={navigate} />;
      case '/admin/availability':
      case '/admin/calendar':
        return <AdminCalendarPage navigate={navigate} />;
      case '/admin/photos':
        return <AdminPhotosPage navigate={navigate} />;
      case '/admin/maintenance':
        return <AdminMaintenancePage navigate={navigate} />;
      case '/admin/history':
        return <AdminHistoryPage navigate={navigate} />;
      case '/admin/settings':
        return <AdminSettingsPage navigate={navigate} />;
      case '/admin/coupons':
      case '/admin/discounts':
        return <AdminCouponsPage navigate={navigate} />;
      case '/admin/inquiries':
        return <AdminInquiriesPage navigate={navigate} />;
      case '/admin/payments':
      case '/admin/ledger':
        return <AdminPaymentsPage navigate={navigate} />;
      default:
        return <AdminDashboardPage navigate={navigate} />;
    }
  };

  const renderPublicRoute = () => {
    switch (currentPath) {
      case '/':
        return <HomePage navigate={navigate} />;
      case '/about':
        return <AboutPage navigate={navigate} />;
      case '/halls':
        return <HallsPage navigate={navigate} />;
      case '/facilities':
        return <FacilitiesPage navigate={navigate} />;
      case '/gallery':
        return <GalleryPage navigate={navigate} />;
      case '/pricing':
        return <PricingPage navigate={navigate} />;
      case '/availability':
        return <AvailabilityPage navigate={navigate} />;
      case '/book':
        return <BookPage navigate={navigate} />;
      case '/track-booking':
        return <TrackBookingPage navigate={navigate} />;
      case '/location':
        return <LocationPage navigate={navigate} />;
      case '/contact':
        return <ContactPage navigate={navigate} />;
      case '/privacy-policy':
      case '/privacy':
        return <PrivacyPolicyPage navigate={navigate} />;
      case '/terms-and-conditions':
      case '/terms':
        return <TermsPage navigate={navigate} />;
      case '/refund-policy':
      case '/refund':
        return <RefundPolicyPage navigate={navigate} />;
      case '/cookie-policy':
      case '/cookies':
        return <CookiePolicyPage navigate={navigate} />;
      default:
        return <HomePage navigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F1E8] text-[#252525] selection:bg-[#F3E8D8] selection:text-[#173D35]">
      <ToastContainer />

      {isAdminRoute && !isAdminLogin ? (
        renderAdminRoute()
      ) : isAdminLogin ? (
        <AdminLoginPage navigate={navigate} />
      ) : (
        <>
          <Navbar currentPath={currentPath} navigate={navigate} />
          <main className="flex-1 animate-in fade-in duration-300">
            {renderPublicRoute()}
          </main>
          <Footer navigate={navigate} />
          <MobileBottomBar currentPath={currentPath} navigate={navigate} />
        </>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <NavigationProvider>
            <AppContent />
          </NavigationProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
