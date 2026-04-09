import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Building2, User, Truck, Pencil } from 'lucide-react';
import { useDrivers } from '../hooks/useDrivers';
import { formatDate, cn } from '../lib/utils';
import { ACTION_TYPE_LABELS, CONTRACT_TYPE_LABELS, getActionBadgeClasses } from '../lib/mockData';
import Spinner from '../components/Spinner';
import CustomSelect from '../components/CustomSelect';

export default function SearchRecords() {
  const navigate = useNavigate();
  const { data: drivers = [], isLoading } = useDrivers();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = drivers.filter((d) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      d.cr6cd_dix_name.toLowerCase().includes(q) ||
      (d.cr6cd_dix_drivercode || '').toLowerCase().includes(q) ||
      (d.cr6cd_dix_agentname || '').toLowerCase().includes(q) ||
      (d.cr6cd_dix_unitname || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && d.cr6cd_dix_isactive) || (statusFilter === 'inactive' && !d.cr6cd_dix_isactive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl font-semibold text-foreground">Search Records</h1>
        <p className="text-muted-foreground mt-1">Search and manage all records</p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm p-4 mb-6 animate-fade-in-up transition-all duration-200 hover:shadow-md" style={{ animationDelay: '55ms' }}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors duration-200 group-focus-within:text-primary" />
            <input
              type="text"
              placeholder="Search by name, driver code, terminal, or unit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-sm pl-10 h-9 outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-md placeholder:text-muted-foreground hover:border-muted-foreground/40"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <CustomSelect
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              className="w-[140px]"
              triggerClassName="h-9"
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-fade-in-up transition-all duration-200 hover:shadow-md" style={{ animationDelay: '110ms' }}>
        <div className="hidden lg:flex items-center gap-4 px-6 py-3 bg-muted/50 border-b border-border text-xs font-semibold">
          <span className="w-28 flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Terminal</span>
          <span className="w-40 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Driver Name</span>
          <span className="w-24">Driver Code</span>
          <span className="w-24 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Unit #</span>
          <span className="w-28">Action</span>
          <span className="w-32">Contract Type</span>
          <span className="flex-1">Created By</span>
          <span className="w-16 text-center">Edit</span>
        </div>

        {isLoading ? (
          <Spinner label="Loading records..." />
        ) : filtered.length === 0 ? (
          <Spinner label="No records found" className="[&>div:first-child]:hidden" />
        ) : (
          filtered.map((d) => (
            <div
              key={d.cr6cd_dix_driverid}
              className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 px-6 py-4 cursor-pointer border-b border-border last:border-b-0 transition-all duration-200 hover:bg-primary/5 active:bg-primary/10"
            >
              <div className="lg:w-28">
                <span className="lg:hidden text-xs text-muted-foreground">Terminal: </span>
                <span className="text-foreground">{d.cr6cd_dix_agentname || '—'}</span>
              </div>
              <div className="lg:w-40">
                <span className="lg:hidden text-xs text-muted-foreground">Name: </span>
                <span className="font-medium text-foreground">{d.cr6cd_dix_name}</span>
              </div>
              <div className="lg:w-24">
                <span className="lg:hidden text-xs text-muted-foreground">Code: </span>
                <span className="text-muted-foreground">{d.cr6cd_dix_drivercode || '—'}</span>
              </div>
              <div className="lg:w-24">
                <span className="lg:hidden text-xs text-muted-foreground">Unit: </span>
                <span className="text-muted-foreground">{d.cr6cd_dix_unitname || '—'}</span>
              </div>
              <div className="lg:w-28">
                <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-transform duration-200 hover:scale-105', getActionBadgeClasses(d.cr6cd_dix_actiontype))}>
                  {ACTION_TYPE_LABELS[d.cr6cd_dix_actiontype] || '—'}
                </span>
              </div>
              <div className="lg:w-32 text-muted-foreground text-sm">
                {CONTRACT_TYPE_LABELS[d.cr6cd_dix_contracttype] || '—'}
              </div>
              <div className="flex-1 text-muted-foreground text-sm flex items-center justify-between">
                <span>{d.cr6cd_dix_createdbyname}</span>
                <span className="text-xs">{formatDate(d.createdon)}</span>
              </div>
              <div className="lg:w-16 flex justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/new-driver', { state: { driver: d } });
                  }}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground transition-all duration-200 hover:bg-primary/10 hover:text-primary hover:scale-110 active:scale-95"
                  title="Edit record"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
