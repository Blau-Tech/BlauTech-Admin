import { CityScopeProvider } from '@/lib/cityScope'

// Wraps every page under /dashboard/* in the city scope so useCityScope() is
// available at the top of each page (above components/Layout's JSX).
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <CityScopeProvider>{children}</CityScopeProvider>
}
