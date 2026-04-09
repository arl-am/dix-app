import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from './lib/theme';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import SearchRecords from './pages/SearchRecords';
import NewEntry from './pages/NewEntry';
import NewCancellation from './pages/NewCancellation';
import QuickForms from './pages/QuickForms';
import RiderPermit from './pages/quickforms/RiderPermit';
import IntentOfLease from './pages/quickforms/IntentOfLease';
import IrpPlateForm from './pages/quickforms/IrpPlateForm';
import InsuranceForm from './pages/quickforms/InsuranceForm';
import Settings from './pages/Settings';

const queryClient = new QueryClient();

export default function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <div className="flex h-screen bg-background overflow-hidden transition-colors duration-200">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/drivers" element={<SearchRecords />} />
                  <Route path="/new-driver" element={<NewEntry />} />
                  <Route path="/cancellations" element={<NewCancellation />} />
                  <Route path="/documents" element={<QuickForms />} />
                  <Route path="/documents/rider-permit" element={<RiderPermit />} />
                  <Route path="/documents/intent-of-lease" element={<IntentOfLease />} />
                  <Route path="/documents/irp-plate-form" element={<IrpPlateForm />} />
                  <Route path="/documents/insurance-form" element={<InsuranceForm />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </main>
            </div>
          </div>
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
