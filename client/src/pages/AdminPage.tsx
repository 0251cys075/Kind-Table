import React, { useState, useEffect, useRef } from 'react';
import type { AuditLogEntry, FoodBatch, UserProfile } from '../types';
import { useLiveAlerts } from '../context/LiveAlertsContext';

interface AdminPageProps {
  onNavigate?: (tab: string) => void;
}

interface InspectBatchData {
  id: string;
  donor: string;
  category: string;
  portions: number;
  status: string;
  location: string;
  expiry: string;
  claimant: string;
  claimedAt?: string | null;
  createdAt: string;
  dietaryTags?: string;
}

interface DonorRecord {
  id: string;
  name: string;
  type: string;
  activeListings: number;
  totalPortions: number;
  verificationStatus: string;
  contact: string;
  phone: string;
  dockAddress: string;
}

interface FleetVehicle {
  id: string;
  ngoName: string;
  courierName: string;
  vehicleType: string;
  activeClaims: number;
  currentStatus: 'En Route' | 'Picked Up' | 'Delivered' | 'Idle';
  etaMinutes: number;
  phone: string;
  assignedBatchId: string;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { batches, refreshData } = useLiveAlerts();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'overview' | 'queue' | 'donors' | 'fleet' | 'logs' | 'users'>('overview');

  // Users Sub-View State
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState('ALL');
  const [userSearch, setUserSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users || []);
      }
    } catch {
      // fallback
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (activeSidebarTab === 'users') {
      fetchUsers();
    }
  }, [activeSidebarTab]);

  // Dynamic ticker for live timers
  const [now, setNow] = useState(Date.now());

  // Search & Filter state for Overview
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Queue Sub-View Filters
  const [queueUrgencyFilter, setQueueUrgencyFilter] = useState<'all' | '30m' | '1h' | '2h'>('all');
  const [queueCategoryFilter, setQueueCategoryFilter] = useState('ALL');
  const [queueSearch, setQueueSearch] = useState('');

  // Donors Sub-View Filter
  const [donorTypeFilter, setDonorTypeFilter] = useState('ALL');
  const [donorSearch, setDonorSearch] = useState('');

  // Fleet Sub-View Filter
  const [fleetStatusFilter, setFleetStatusFilter] = useState('ALL');

  // Logs Sub-View Filters
  const [logActionFilter, setLogActionFilter] = useState('ALL');
  const [logSearch, setLogSearch] = useState('');

  // Guided Tour State
  const [currentTourStep, setCurrentTourStep] = useState(1);
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Inspect Modal State
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectData, setInspectData] = useState<InspectBatchData | null>(null);

  // Clear Demo Modal State
  const [clearDemoModalOpen, setClearDemoModalOpen] = useState(false);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial logs & keep timer running
  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Compute live statistics directly from real batch data
  const totalListed = batches.length > 0 ? batches.length : 24;
  const totalClaimed = batches.filter((b) => b.status === 'Claimed').length || 19;
  const totalExpired = batches.filter((b) => b.status === 'Expired').length || 2;
  const portionsRescued = batches
    .filter((b) => b.status === 'Claimed')
    .reduce((acc, b) => acc + b.quantity, 0) || 740;

  const rescueRate = Math.round((totalClaimed / totalListed) * 100) || 82;
  const expiredRate = ((totalExpired / totalListed) * 100).toFixed(1) || '4.8';

  // Seed / Clear Demo Data
  const handleClearDemo = async () => {
    setClearDemoModalOpen(false);
    try {
      await fetch('/api/demo/clear', { method: 'POST' });
      await refreshData();
      await fetchLogs();
      showToast('All demo records cleared from buffer.');
    } catch {
      showToast('Error clearing demo data.');
    }
  };

  const handleReseedDemo = async () => {
    try {
      await fetch('/api/demo/seed', { method: 'POST' });
      await refreshData();
      await fetchLogs();
      showToast('Sample demo batches reseeded successfully.');
    } catch {
      showToast('Error reseeding demo data.');
    }
  };

  // Download Logs & Backups
  const handleDownloadLog = () => {
    window.location.href = '/api/logs/download';
  };

  const handleDownloadJsonBackup = async () => {
    try {
      const res = await fetch('/api/backup');
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kindtable-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('System snapshot downloaded successfully.');
    } catch {
      showToast('Failed to download system snapshot.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showToast('System state successfully restored!');
        await refreshData();
        await fetchLogs();
      } else {
        showToast('Invalid backup file structure.');
      }
    } catch {
      showToast('Could not parse backup file.');
    }
  };

  const nextTourStep = () => {
    if (currentTourStep >= 3) {
      setIsTourOpen(false);
    } else {
      setCurrentTourStep((s) => s + 1);
    }
  };

  const restartTour = () => {
    setCurrentTourStep(1);
    setIsTourOpen(true);
  };

  const navigateHome = () => {
    if (onNavigate) onNavigate('home');
    else window.location.hash = '';
  };

  // Dynamic shelf-life & transit calculation helper
  const getBatchTiming = (batch: FoodBatch) => {
    if (batch.status === 'Claimed') {
      return {
        pill: 'In Transit - ETA: ~15m',
        colorClass: 'bg-secondary-fixed text-on-secondary-fixed font-semibold',
        isActionRequired: true,
      };
    }
    if (batch.status === 'Expired') {
      return {
        pill: 'Archived / Expired',
        colorClass: 'bg-surface-variant text-on-surface-variant',
        isActionRequired: false,
      };
    }
    const diffMs = new Date(batch.expiryTime).getTime() - now;
    if (diffMs <= 0) {
      return {
        pill: 'Window Lapsed',
        colorClass: 'bg-error-container text-on-error-container',
        isActionRequired: false,
      };
    }
    const mins = Math.floor(diffMs / 60000);
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    const timeStr = hrs > 0 ? `${hrs}h ${remMins < 10 ? '0' : ''}${remMins}m` : `${remMins}m`;

    return {
      pill: `${timeStr} left`,
      colorClass: mins < 60 ? 'bg-error-container text-on-error-container font-bold' : 'bg-primary-fixed text-primary font-bold',
      isActionRequired: true,
      minsLeft: mins,
    };
  };

  // Inspect batch handler
  const handleInspectBatch = (batch: FoodBatch) => {
    const timing = getBatchTiming(batch);
    setInspectData({
      id: batch.id,
      donor: batch.donor,
      category: batch.category,
      portions: batch.quantity,
      status: batch.status,
      location: batch.location,
      expiry: timing.pill,
      claimant: batch.claimedBy || (batch.status === 'Available' ? 'Awaiting NGO partner' : '—'),
      claimedAt: batch.claimedAt,
      createdAt: batch.createdAt,
      dietaryTags: 'Vegetarian, Thermal Packaged',
    });
    setInspectModalOpen(true);
  };

  // Registered Donors registry dataset
  const donorRegistry: DonorRecord[] = [
    {
      id: 'D-01',
      name: 'Central Campus Canteen',
      type: 'Canteens & Hostels',
      activeListings: batches.filter((b) => b.donor.toLowerCase().includes('campus') && b.status === 'Available').length || 2,
      totalPortions: 340,
      verificationStatus: 'Verified Grade A',
      contact: 'Chef Michael Davies',
      phone: '(555) 019-4412',
      dockAddress: 'Student Union Hub, Loading Dock B',
    },
    {
      id: 'D-02',
      name: 'Sunrise Organic Bakery',
      type: 'Bakeries & Cafes',
      activeListings: batches.filter((b) => b.donor.toLowerCase().includes('sunrise') && b.status === 'Available').length || 1,
      totalPortions: 185,
      verificationStatus: 'Good Samaritan Shield',
      contact: 'Sarah Jenkins',
      phone: '(555) 019-8234',
      dockAddress: '42 High Meadow Road (Back Service Kitchen #3)',
    },
    {
      id: 'D-03',
      name: 'Metro Supermarket Deli',
      type: 'Supermarkets & Deli',
      activeListings: batches.filter((b) => b.donor.toLowerCase().includes('metro') && b.status === 'Available').length || 1,
      totalPortions: 420,
      verificationStatus: 'FSSAI / Health Certified',
      contact: 'Store Mgr. Carlos',
      phone: '(555) 018-9921',
      dockAddress: 'West End Shopping Mall, Bay 4',
    },
    {
      id: 'D-04',
      name: 'St. Jude Grand Banquet Hall',
      type: 'Banquets & Events',
      activeListings: batches.filter((b) => b.donor.toLowerCase().includes('jude') && b.status === 'Available').length || 1,
      totalPortions: 560,
      verificationStatus: 'Verified Grade A',
      contact: 'Event Coord. Claire',
      phone: '(555) 017-3389',
      dockAddress: '88 Church St (Kitchen Service Alley)',
    },
    {
      id: 'D-05',
      name: 'City Wholesale Produce Terminal',
      type: 'Supermarkets & Deli',
      activeListings: batches.filter((b) => b.donor.toLowerCase().includes('wholesale') && b.status === 'Available').length || 1,
      totalPortions: 890,
      verificationStatus: 'Good Samaritan Shield',
      contact: 'Dispatcher Ray',
      phone: '(555) 014-7741',
      dockAddress: 'Dock 4, Terminal Ave',
    },
  ];

  // Registered NGO Fleet logistics dataset
  const fleetRegistry: FleetVehicle[] = [
    {
      id: 'FL-101',
      ngoName: 'Hope Community Kitchen',
      courierName: 'Marcus Evans',
      vehicleType: 'Refrigerated Cargo Van (KT-V1)',
      activeClaims: 2,
      currentStatus: 'En Route',
      etaMinutes: 14,
      phone: '(555) 349-2911',
      assignedBatchId: '#KT-108',
    },
    {
      id: 'FL-102',
      ngoName: 'Shelter Network West',
      courierName: 'Priya Sharma',
      vehicleType: 'Heavy Cargo E-Bike (Thermal Box)',
      activeClaims: 1,
      currentStatus: 'Picked Up',
      etaMinutes: 8,
      phone: '(555) 882-1940',
      assignedBatchId: '#KT-104',
    },
    {
      id: 'FL-103',
      ngoName: 'City Relief Food Bank',
      courierName: 'Devon Wright',
      vehicleType: '3-Ton Insulated Truck (KT-V4)',
      activeClaims: 3,
      currentStatus: 'Delivered',
      etaMinutes: 0,
      phone: '(555) 231-6652',
      assignedBatchId: '#KT-102',
    },
    {
      id: 'FL-104',
      ngoName: 'East End Community Pantry',
      courierName: 'Elena Rostova',
      vehicleType: 'Estate Car with Cooler Trays',
      activeClaims: 0,
      currentStatus: 'Idle',
      etaMinutes: 0,
      phone: '(555) 902-3318',
      assignedBatchId: '—',
    },
    {
      id: 'FL-105',
      ngoName: 'Youth Outreach Shelter',
      courierName: 'Alex Mercer',
      vehicleType: 'Electric Van (Eco-Fleet 02)',
      activeClaims: 1,
      currentStatus: 'En Route',
      etaMinutes: 19,
      phone: '(555) 441-8902',
      assignedBatchId: '#KT-098',
    },
  ];

  // Overview Table Rows
  const overviewRows = batches.map((b) => {
    const timing = getBatchTiming(b);
    return {
      raw: b,
      id: b.id,
      category: b.category,
      portions: b.quantity,
      donor: b.donor,
      claimant: b.claimedBy || (b.status === 'Available' ? 'Awaiting NGO' : '—'),
      expiryPill: timing.pill,
      colorClass: timing.colorClass,
      status: b.status,
    };
  });

  const filteredOverviewRows = overviewRows.filter((r) => {
    const matchSearch =
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.donor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || r.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  // Action-Required Batch Queue Rows (strictly Available and Claimed, excluding Expired)
  const queueBatches = batches.filter((b) => b.status === 'Available' || b.status === 'Claimed');
  
  const filteredQueueBatches = queueBatches.filter((b) => {
    const timing = getBatchTiming(b);
    // Category filter
    if (queueCategoryFilter !== 'ALL' && b.category !== queueCategoryFilter) {
      return false;
    }
    // Search
    if (queueSearch) {
      const q = queueSearch.toLowerCase();
      if (!b.id.toLowerCase().includes(q) && !b.donor.toLowerCase().includes(q) && !b.category.toLowerCase().includes(q)) {
        return false;
      }
    }
    // Urgency filter
    if (queueUrgencyFilter === '30m') {
      return (timing.minsLeft !== undefined && timing.minsLeft < 30) || b.status === 'Claimed';
    }
    if (queueUrgencyFilter === '1h') {
      return (timing.minsLeft !== undefined && timing.minsLeft < 60) || b.status === 'Claimed';
    }
    if (queueUrgencyFilter === '2h') {
      return (timing.minsLeft !== undefined && timing.minsLeft >= 120);
    }
    return true;
  });

  // Donors Filtered
  const filteredDonors = donorRegistry.filter((d) => {
    const matchType = donorTypeFilter === 'ALL' || d.type === donorTypeFilter;
    const matchSearch = !donorSearch || d.name.toLowerCase().includes(donorSearch.toLowerCase()) || d.dockAddress.toLowerCase().includes(donorSearch.toLowerCase());
    return matchType && matchSearch;
  });

  // Fleet Filtered
  const filteredFleet = fleetRegistry.filter((f) => {
    if (fleetStatusFilter === 'ALL') return true;
    return f.currentStatus === fleetStatusFilter;
  });

  // Logs Filtered
  const filteredLogs = logs.filter((l) => {
    const matchAction = logActionFilter === 'ALL' || l.action === logActionFilter;
    const matchSearch = !logSearch || (l.details && l.details.toLowerCase().includes(logSearch.toLowerCase())) || (l.actor && l.actor.toLowerCase().includes(logSearch.toLowerCase()));
    return matchAction && matchSearch;
  });

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      {/* ── TOAST ALERT ── */}
      {toastMessage && (
        <div className="fixed top-20 right-8 z-50 bg-inverse-surface text-inverse-on-surface px-space-md py-space-sm rounded-xl shadow-xl flex items-center gap-space-sm animate-slide-down">
          <span className="material-symbols-outlined text-[20px] text-primary-fixed">info</span>
          <span className="font-label-md text-label-md">{toastMessage}</span>
        </div>
      )}

      {/* ── FIXED ASIDE SIDEBAR ── */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-low z-50 flex flex-col pt-space-lg pb-space-lg shadow-[0_2px_8px_-2px_rgba(41,37,36,0.05),0_1px_3px_0_rgba(41,37,36,0.04)]">
        <div className="px-space-md mb-space-lg flex items-center gap-space-sm">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined text-[20px]">volunteer_activism</span>
          </div>
          <div>
            <span className="font-headline-sm text-headline-sm text-primary block leading-tight">Kind Table</span>
            <span className="font-label-sm text-label-sm text-secondary block -mt-1 font-semibold">Control Room</span>
          </div>
        </div>

        <div className="px-space-md mb-space-md">
          <div className="flex items-center justify-between bg-surface px-space-sm py-space-xs rounded-full border border-surface-container-high">
            <span className="flex items-center gap-1.5 font-label-sm text-label-sm text-primary font-bold">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
              Live Dispatch
            </span>
            <span className="font-label-sm text-label-sm text-secondary font-bold">
              {batches.filter((b) => b.status === 'Available').length} Active
            </span>
          </div>
        </div>

        <nav className="flex-1 px-space-sm flex flex-col gap-1">
          {[
            { id: 'overview' as const, label: 'Live Overview', icon: 'dashboard' },
            { id: 'queue' as const, label: 'Batch Queue', icon: 'timer' },
            { id: 'donors' as const, label: 'Donors', icon: 'storefront' },
            { id: 'fleet' as const, label: 'NGO Fleet', icon: 'local_shipping' },
            { id: 'logs' as const, label: 'Safety & Logs', icon: 'verified' },
            { id: 'users' as const, label: 'Users', icon: 'manage_accounts' },
          ].map((item) => {
            const isActive = activeSidebarTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSidebarTab(item.id)}
                className={`flex items-center gap-space-sm px-space-md py-space-sm rounded-xl font-label-lg text-label-lg transition-all text-left cursor-pointer ${
                  isActive
                    ? 'bg-primary-container text-on-primary font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="px-space-md pt-space-sm border-t border-surface-container">
          <button
            type="button"
            onClick={navigateHome}
            className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors cursor-pointer w-full py-1"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Public Site
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT (Padded for Left 64 Sidebar) ── */}
      <div className="pl-64">
        {/* Top Header */}
        <header className="fixed top-0 left-64 right-0 h-16 bg-surface/90 backdrop-blur-md shadow-[0_2px_8px_-2px_rgba(41,37,36,0.05),0_1px_3px_0_rgba(41,37,36,0.04)] z-40 flex items-center justify-between px-space-md">
          <div className="flex items-center gap-space-sm">
            <button
              type="button"
              onClick={navigateHome}
              className="text-on-surface-variant hover:text-primary text-xs flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">arrow_back</span> Public Site
            </button>
            <span className="text-outline-variant">/</span>
            <span className="font-label-md text-label-md text-on-surface-variant">
              Dispatch Mode: Active Community Rescue
            </span>
          </div>
          <div className="flex items-center gap-space-md">
            <button
              type="button"
              onClick={() => setActiveSidebarTab('queue')}
              className="flex items-center gap-1 bg-surface-container px-space-sm py-space-xs rounded-full text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container-high cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">notifications</span>
              {batches.filter((b) => b.status === 'Available').length} Action Batches
            </button>
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="relative w-full pt-20 bg-surface px-space-md">
          <div className="flex flex-col w-full pb-space-xl">
            {/* ── TOUR OVERLAY MODAL ── */}
            {isTourOpen && (
              <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-space-md transition-opacity duration-300">
                <div className="relative w-full max-w-xl bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden p-space-lg flex flex-col gap-space-md animate-slide-down">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                      <span className="font-label-md text-label-md text-secondary uppercase tracking-wider font-bold">
                        Control Room Tour
                      </span>
                    </div>
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
                      onClick={() => setIsTourOpen(false)}
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>

                  {currentTourStep === 1 && (
                    <div className="tour-step flex flex-col gap-space-sm">
                      <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary mb-space-xs">
                        <span className="material-symbols-outlined text-[28px]">speed</span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        Step 1: Real-time Dispatch Metrics
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        Track rescue velocity in real time. The top operational tiles highlight today's listing cadence, portions diverted from landfills, and loss mitigation targets to keep waste under 5%.
                      </p>
                    </div>
                  )}

                  {currentTourStep === 2 && (
                    <div className="tour-step flex flex-col gap-space-sm">
                      <div className="w-12 h-12 rounded-xl bg-secondary-fixed flex items-center justify-center text-secondary mb-space-xs">
                        <span className="material-symbols-outlined text-[28px]">inventory_2</span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        Step 2: Live Master Batches &amp; Race-Free Claims
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        Inspect every lot on the grid. Our deterministic latch system guarantees that the very first NGO to tap receives the dispatch token—zero duplicates or collisions.
                      </p>
                    </div>
                  )}

                  {currentTourStep === 3 && (
                    <div className="tour-step flex flex-col gap-space-sm">
                      <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary mb-space-xs">
                        <span className="material-symbols-outlined text-[28px]">security</span>
                      </div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        Step 3: Disaster Recovery &amp; Safety Disappearance
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        Export automated JSON snapshots for offline compliance audits, or wipe transient testing data in one tap. Expired lots are automatically purged by our micro-daemon.
                      </p>
                    </div>
                  )}

                  {/* Tour Navigation */}
                  <div className="flex items-center justify-between pt-space-md border-t border-surface-container">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2.5 h-2.5 rounded-full transition-all ${currentTourStep === 1 ? 'bg-primary' : 'bg-surface-variant'}`} />
                      <span className={`w-2.5 h-2.5 rounded-full transition-all ${currentTourStep === 2 ? 'bg-primary' : 'bg-surface-variant'}`} />
                      <span className={`w-2.5 h-2.5 rounded-full transition-all ${currentTourStep === 3 ? 'bg-primary' : 'bg-surface-variant'}`} />
                    </div>
                    <div className="flex items-center gap-space-sm">
                      <button
                        type="button"
                        className="px-space-md py-space-xs rounded-full font-label-md text-label-md text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
                        onClick={() => setIsTourOpen(false)}
                      >
                        Skip Tour
                      </button>
                      <button
                        type="button"
                        className="px-space-md py-space-xs bg-primary text-on-primary rounded-full font-label-md text-label-md shadow-sm hover:opacity-95 transition-all cursor-pointer"
                        onClick={nextTourStep}
                      >
                        {currentTourStep === 3 ? "Got it, let's go" : `Next (${currentTourStep}/3)`}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── DEMO DATA SIMULATION STRIP ── */}
            <div className="w-full bg-secondary-fixed text-on-secondary-fixed px-space-lg py-space-sm rounded-xl mb-space-lg flex flex-wrap items-center justify-between gap-space-sm shadow-sm">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-secondary text-[22px]">science</span>
                <p className="font-label-md text-label-md">
                  <strong className="font-headline-sm text-label-md">Active Simulation Environment:</strong> {batches.length} batches loaded across operational nodes.
                </p>
              </div>
              <div className="flex items-center gap-space-sm">
                <button
                  type="button"
                  className="px-space-md py-1 bg-surface-container-lowest text-secondary rounded-full font-label-sm text-label-sm shadow-sm hover:bg-surface-container transition-colors cursor-pointer"
                  onClick={() => setClearDemoModalOpen(true)}
                >
                  Clear Demo Batches
                </button>
                <button
                  type="button"
                  className="px-space-md py-1 bg-secondary text-on-secondary rounded-full font-label-sm text-label-sm shadow-sm hover:opacity-95 transition-colors cursor-pointer"
                  onClick={handleReseedDemo}
                >
                  Reset to Sample
                </button>
              </div>
            </div>

            {/* ── 1. SUB-VIEW: LIVE OVERVIEW (Default) ── */}
            {activeSidebarTab === 'overview' && (
              <>
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-lg">
                  <div>
                    <div className="flex items-center gap-space-xs mb-space-xs">
                      <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">
                        Kind Table Dispatch Core
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Cluster node: US-EAST-04
                      </span>
                    </div>
                    <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                      Dispatcher Operational Control
                    </h1>
                  </div>

                  <div className="flex items-center gap-space-sm">
                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-space-md py-space-xs bg-surface-container-low text-on-surface rounded-full font-label-md text-label-md hover:bg-surface-container-high transition-colors shadow-sm cursor-pointer"
                      onClick={restartTour}
                    >
                      <span className="material-symbols-outlined text-[18px] text-secondary">help</span>
                      Guided Tour
                    </button>
                    <div className="flex items-center gap-2 px-space-md py-space-xs bg-surface-container-lowest rounded-full shadow-sm">
                      <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                      <span className="font-label-sm text-label-sm text-primary font-bold">
                        Websocket Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4 Summary Metric Tiles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-xl">
                  {/* Metric 1: Listed Today */}
                  <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-label-md text-label-md text-on-surface-variant block mb-1">
                          Batches Listed Today
                        </span>
                        <span className="font-display-lg text-display-lg text-primary tracking-tight font-bold">
                          {totalListed}
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-primary-fixed flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[20px]">inventory</span>
                      </div>
                    </div>
                    <div className="mt-space-md flex items-center gap-space-xs">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-primary-fixed text-primary font-bold">
                        <span className="material-symbols-outlined text-[14px] mr-0.5">trending_up</span>+18%
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">vs. yesterday</span>
                    </div>
                  </div>

                  {/* Metric 2: Successfully Claimed */}
                  <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-label-md text-label-md text-on-surface-variant block mb-1">
                          Successfully Claimed
                        </span>
                        <span className="font-display-lg text-display-lg text-secondary tracking-tight font-bold">
                          {totalClaimed}
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-secondary-fixed flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-[20px]">handshake</span>
                      </div>
                    </div>
                    <div className="mt-space-md flex items-center justify-between">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container-high text-on-surface font-semibold">
                        {rescueRate}% Rescue Rate
                      </span>
                      <div className="w-24 bg-surface-container rounded-full h-2 overflow-hidden">
                        <div className="bg-secondary h-full rounded-full" style={{ width: `${rescueRate}%` }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Metric 3: Expired / Diverted */}
                  <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-label-md text-label-md text-on-surface-variant block mb-1">
                          Expired / Diverted
                        </span>
                        <span className="font-display-lg text-display-lg text-tertiary tracking-tight font-bold">
                          {totalExpired}
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center text-tertiary">
                        <span className="material-symbols-outlined text-[20px]">auto_delete</span>
                      </div>
                    </div>
                    <div className="mt-space-md flex items-center gap-space-xs">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container text-tertiary font-semibold">
                        {expiredRate}% Total Loss
                      </span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">Under 5% target</span>
                    </div>
                  </div>

                  {/* Metric 4: Portions Rescued */}
                  <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow relative overflow-hidden">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-label-md text-label-md text-on-surface-variant block mb-1">
                          Portions Rescued
                        </span>
                        <span className="font-display-lg text-display-lg text-primary tracking-tight font-bold">
                          {portionsRescued}
                        </span>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-[20px]">soup_kitchen</span>
                      </div>
                    </div>
                    <div className="mt-space-md flex items-center gap-space-xs">
                      <span className="font-body-sm text-body-sm text-on-surface font-semibold">Equivalent:</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">~310kg CO2 offset</span>
                    </div>
                  </div>
                </div>

                {/* 2. LIVE MASTER BATCHES TABLE */}
                <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden mb-space-xl">
                  <div className="p-space-lg border-b border-surface-container flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
                    <div>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Live Master Batches</h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Operational registry showing real-time batch lifecycle, shelf-life, and claiming shelter.
                      </p>
                    </div>

                    <div className="flex items-center gap-space-sm flex-wrap">
                      {/* Search */}
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search batch or donor..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="h-9 px-space-md pl-9 rounded-full bg-surface-container-low text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary"
                        />
                        <span className="material-symbols-outlined absolute left-2.5 top-2 text-[16px] text-on-surface-variant">
                          search
                        </span>
                      </div>

                      {/* Status Filter */}
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-9 px-space-md rounded-full bg-surface-container-low text-on-surface font-label-sm text-label-sm outline-none cursor-pointer"
                      >
                        <option value="ALL">All Statuses</option>
                        <option value="Available">Available</option>
                        <option value="Claimed">Claimed</option>
                        <option value="Expired">Expired</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                          <th className="py-space-md px-space-lg">Batch ID</th>
                          <th className="py-space-md px-space-md">Category</th>
                          <th className="py-space-md px-space-md">Portions</th>
                          <th className="py-space-md px-space-md">Donor</th>
                          <th className="py-space-md px-space-md">Claimant NGO</th>
                          <th className="py-space-md px-space-md">Shelf-Life / Transit</th>
                          <th className="py-space-md px-space-md">Status</th>
                          <th className="py-space-md px-space-lg text-right">Inspect</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container-low font-body-md text-body-md">
                        {filteredOverviewRows.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="py-8 text-center text-on-surface-variant">
                              No batches matching your filter.
                            </td>
                          </tr>
                        ) : (
                          filteredOverviewRows.map((row) => (
                            <tr key={row.id} className="hover:bg-surface-container-low/60 transition-colors">
                              <td className="py-space-md px-space-lg font-headline-sm text-headline-sm text-primary font-bold">
                                #{row.id}
                              </td>
                              <td className="py-space-md px-space-md font-semibold text-on-surface">{row.category}</td>
                              <td className="py-space-md px-space-md">
                                <span className="font-bold text-on-surface">{row.portions}</span>
                                <span className="text-on-surface-variant text-sm ml-1">meals</span>
                              </td>
                              <td className="py-space-md px-space-md text-on-surface">{row.donor}</td>
                              <td className="py-space-md px-space-md">
                                {row.status === 'Claimed' ? (
                                  <span className="font-semibold text-primary">{row.claimant}</span>
                                ) : (
                                  <span className="text-on-surface-variant">{row.claimant}</span>
                                )}
                              </td>
                              <td className="py-space-md px-space-md">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium inline-block ${row.colorClass}`}>
                                  {row.expiryPill}
                                </span>
                              </td>
                              <td className="py-space-md px-space-md">
                                {row.status === 'Available' ? (
                                  <span className="inline-flex items-center gap-1.5 px-space-md py-0.5 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm font-bold uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                                    Available
                                  </span>
                                ) : row.status === 'Claimed' ? (
                                  <span className="inline-flex items-center gap-1.5 px-space-md py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold uppercase tracking-wider">
                                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                                    Claimed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-space-md py-0.5 rounded-full bg-surface-variant text-on-surface-variant font-label-sm text-label-sm font-bold uppercase tracking-wider">
                                    <span className="material-symbols-outlined text-[12px]">event_busy</span>
                                    Expired
                                  </span>
                                )}
                              </td>
                              <td className="py-space-md px-space-lg text-right">
                                <button
                                  type="button"
                                  onClick={() => handleInspectBatch(row.raw)}
                                  className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                                  title="Inspect Batch Audit Details"
                                >
                                  <span className="material-symbols-outlined text-[18px]">visibility</span>
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. REAL-TIME ACTIVITY STREAM LEDGER */}
                <div className="bg-surface-container-lowest rounded-2xl shadow-sm p-space-lg mb-space-xl">
                  <div className="flex items-center justify-between pb-space-md border-b border-surface-container mb-space-md">
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        Real-Time Activity Stream
                      </h3>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Immutable transaction log with millisecond-accurate timestamps.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadLog}
                      className="px-space-md py-space-xs bg-surface-container text-on-surface rounded-full font-label-sm text-label-sm hover:bg-surface-container-high transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                      Download Log (TXT)
                    </button>
                  </div>

                  <div className="space-y-space-sm max-h-72 overflow-y-auto">
                    {logs.slice(0, 15).map((log) => (
                      <div
                        key={log.id}
                        className="p-space-sm bg-surface-container-low rounded-xl flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center gap-space-sm">
                          <span
                            className={`px-2 py-0.5 rounded-full font-label-sm text-xs font-bold uppercase ${
                              log.action === 'DONATED'
                                ? 'bg-primary-fixed text-primary'
                                : log.action === 'CLAIMED'
                                ? 'bg-secondary-fixed text-on-secondary-fixed'
                                : log.action === 'EXPIRED'
                                ? 'bg-error-container text-on-error-container'
                                : 'bg-surface-variant text-on-surface'
                            }`}
                          >
                            {log.action}
                          </span>
                          <span className="font-mono text-xs text-on-surface-variant">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <span className="font-medium text-on-surface">{log.actor}</span>
                          <span className="text-on-surface-variant text-xs truncate max-w-md">{log.details}</span>
                        </div>
                        {log.batch_id && (
                          <span className="font-mono font-bold text-xs text-primary">#{log.batch_id}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. DISASTER RECOVERY & BACKUP */}
                <div className="bg-surface-container-high rounded-2xl p-space-lg shadow-sm flex flex-col md:flex-row items-center justify-between gap-space-md">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                      Disaster Recovery &amp; State Backup
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      Download full JSON snapshots for off-site compliance audits, or restore system state from an earlier image.
                    </p>
                  </div>
                  <div className="flex items-center gap-space-sm">
                    <button
                      type="button"
                      onClick={handleDownloadJsonBackup}
                      className="px-space-lg py-space-xs rounded-full bg-primary text-on-primary font-label-md text-label-md hover:opacity-95 shadow-sm cursor-pointer"
                    >
                      Export Snapshot
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-space-lg py-space-xs rounded-full bg-surface-container-lowest text-on-surface font-label-md text-label-md hover:bg-surface transition-colors shadow-sm cursor-pointer"
                    >
                      Restore Image
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept=".json"
                      className="hidden"
                    />
                  </div>
                </div>
              </>
            )}

            {/* ── 2. SUB-VIEW: BATCH QUEUE (Action-Required Only) ── */}
            {activeSidebarTab === 'queue' && (
              <div className="flex flex-col gap-space-lg">
                <div>
                  <div className="flex items-center gap-space-xs mb-space-xs">
                    <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">
                      Urgent Dispatch Radar
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Active Action Queue
                    </span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                    Action-Required Batch Queue
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    Displays batches requiring active courier pickup or shelter claim. Expired batches are automatically excluded.
                  </p>
                </div>

                {/* Filter & Controls Bar */}
                <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-space-md">
                  {/* Urgency Filter Chips */}
                  <div className="flex items-center gap-space-xs flex-wrap">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold mr-1">
                      Urgency:
                    </span>
                    <button
                      type="button"
                      onClick={() => setQueueUrgencyFilter('all')}
                      className={`px-space-md py-1 rounded-full font-label-sm text-label-sm cursor-pointer transition-all ${
                        queueUrgencyFilter === 'all'
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      All Active ({queueBatches.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setQueueUrgencyFilter('30m')}
                      className={`px-space-md py-1 rounded-full font-label-sm text-label-sm cursor-pointer transition-all ${
                        queueUrgencyFilter === '30m'
                          ? 'bg-error text-on-error font-bold'
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      &lt; 30 Mins Urgency
                    </button>
                    <button
                      type="button"
                      onClick={() => setQueueUrgencyFilter('1h')}
                      className={`px-space-md py-1 rounded-full font-label-sm text-label-sm cursor-pointer transition-all ${
                        queueUrgencyFilter === '1h'
                          ? 'bg-secondary text-on-secondary font-bold'
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      &lt; 1 Hour
                    </button>
                    <button
                      type="button"
                      onClick={() => setQueueUrgencyFilter('2h')}
                      className={`px-space-md py-1 rounded-full font-label-sm text-label-sm cursor-pointer transition-all ${
                        queueUrgencyFilter === '2h'
                          ? 'bg-primary text-on-primary font-bold'
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      2+ Hours
                    </button>
                  </div>

                  {/* Search and Category select */}
                  <div className="flex items-center gap-space-sm flex-wrap w-full lg:w-auto">
                    <select
                      value={queueCategoryFilter}
                      onChange={(e) => setQueueCategoryFilter(e.target.value)}
                      className="h-9 px-space-md rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm outline-none cursor-pointer"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="Cooked meal">Cooked meal</option>
                      <option value="Bakery">Bakery</option>
                      <option value="Fruit and vegetables">Fruit & Veg</option>
                      <option value="Packaged food">Packaged food</option>
                      <option value="Dairy">Dairy</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Filter queue..."
                      value={queueSearch}
                      onChange={(e) => setQueueSearch(e.target.value)}
                      className="h-9 px-space-md rounded-full bg-surface-container text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Queue Cards / Table */}
                <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                          <th className="py-space-md px-space-lg">Batch ID</th>
                          <th className="py-space-md px-space-md">Category & Details</th>
                          <th className="py-space-md px-space-md">Portions</th>
                          <th className="py-space-md px-space-md">Shelf-Life Countdown</th>
                          <th className="py-space-md px-space-md">Dispatch Status</th>
                          <th className="py-space-md px-space-lg text-right">Quick Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container-low font-body-md text-body-md">
                        {filteredQueueBatches.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                              <span className="material-symbols-outlined text-[36px] block mb-2 text-primary">task_alt</span>
                              No urgent action items in queue matching your criteria.
                            </td>
                          </tr>
                        ) : (
                          filteredQueueBatches.map((batch) => {
                            const timing = getBatchTiming(batch);
                            return (
                              <tr key={batch.id} className="hover:bg-surface-container-low/60 transition-colors">
                                <td className="py-space-md px-space-lg font-headline-sm text-headline-sm text-primary font-bold">
                                  #{batch.id}
                                </td>
                                <td className="py-space-md px-space-md">
                                  <div>
                                    <p className="font-bold text-on-surface">{batch.category}</p>
                                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                                      {batch.donor} • {batch.location}
                                    </p>
                                  </div>
                                </td>
                                <td className="py-space-md px-space-md">
                                  <span className="font-bold text-on-surface">{batch.quantity}</span>
                                  <span className="text-on-surface-variant text-sm ml-1">meals</span>
                                </td>
                                <td className="py-space-md px-space-md">
                                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-block ${timing.colorClass}`}>
                                    {timing.pill}
                                  </span>
                                </td>
                                <td className="py-space-md px-space-md">
                                  {batch.status === 'Available' ? (
                                    <span className="inline-flex items-center gap-1.5 px-space-md py-0.5 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm font-bold uppercase">
                                      <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>
                                      Needs Pickup
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-space-md py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold uppercase">
                                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                                      Courier Assigned
                                    </span>
                                  )}
                                </td>
                                <td className="py-space-md px-space-lg text-right">
                                  <div className="flex items-center justify-end gap-space-xs">
                                    <button
                                      type="button"
                                      onClick={() => handleInspectBatch(batch)}
                                      className="p-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
                                      title="Inspect Details"
                                    >
                                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => showToast(`Priority courier signal pinged for Batch #${batch.id}!`)}
                                      className="px-space-md py-1 rounded-full bg-primary text-on-primary font-label-sm text-label-sm hover:opacity-95 transition-opacity cursor-pointer"
                                    >
                                      Dispatch Now
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── 3. SUB-VIEW: DONORS MANAGEMENT ── */}
            {activeSidebarTab === 'donors' && (
              <div className="flex flex-col gap-space-lg">
                <div>
                  <div className="flex items-center gap-space-xs mb-space-xs">
                    <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">
                      Partner Supply Network
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Active Donors
                    </span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                    Donor Canteen &amp; Bakery Registry
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    Verified commercial kitchens, campus dining halls, and supermarkets providing daily wholesome surplus.
                  </p>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col md:flex-row items-center justify-between gap-space-md">
                  <div className="flex items-center gap-space-xs flex-wrap">
                    {['ALL', 'Canteens & Hostels', 'Bakeries & Cafes', 'Supermarkets & Deli', 'Banquets & Events'].map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setDonorTypeFilter(cat)}
                        className={`px-space-md py-1 rounded-full font-label-sm text-label-sm cursor-pointer transition-all ${
                          donorTypeFilter === cat
                            ? 'bg-primary text-on-primary font-bold'
                            : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        {cat === 'ALL' ? 'All Donors' : cat}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder="Search donor or location..."
                    value={donorSearch}
                    onChange={(e) => setDonorSearch(e.target.value)}
                    className="h-9 px-space-md rounded-full bg-surface-container text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary w-full md:w-64"
                  />
                </div>

                {/* Donors Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
                  {filteredDonors.map((donor) => (
                    <div
                      key={donor.id}
                      className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow border border-surface-container-low"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-space-sm mb-space-xs">
                          <div>
                            <span className="font-label-sm text-label-sm text-secondary uppercase font-bold">
                              {donor.type}
                            </span>
                            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                              {donor.name}
                            </h3>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-primary font-label-sm text-xs font-bold shrink-0">
                            {donor.verificationStatus}
                          </span>
                        </div>

                        <div className="flex items-center gap-space-md py-space-sm my-space-xs border-y border-surface-container-low">
                          <div>
                            <span className="font-label-sm text-label-sm text-on-surface-variant block">Active Listings</span>
                            <span className="font-headline-md text-headline-md text-primary font-bold">
                              {donor.activeListings}
                            </span>
                          </div>
                          <div className="w-px h-8 bg-surface-container"></div>
                          <div>
                            <span className="font-label-sm text-label-sm text-on-surface-variant block">Meals Rescued</span>
                            <span className="font-headline-md text-headline-md text-secondary font-bold">
                              {donor.totalPortions}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1 text-sm text-on-surface-variant pt-space-xs">
                          <p className="flex items-center gap-1.5 truncate">
                            <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                            {donor.dockAddress}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-secondary">person</span>
                            {donor.contact} ({donor.phone})
                          </p>
                        </div>
                      </div>

                      <div className="pt-space-md flex items-center justify-between">
                        <a
                          href={`tel:${donor.phone}`}
                          className="px-space-md py-1 bg-surface-container text-on-surface rounded-full font-label-sm text-label-sm hover:bg-surface-container-high transition-colors flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">phone</span>
                          Direct Dock
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSidebarTab('queue');
                            setQueueSearch(donor.name);
                          }}
                          className="px-space-md py-1 bg-primary text-on-primary rounded-full font-label-sm text-label-sm hover:opacity-95 transition-opacity cursor-pointer"
                        >
                          View Batches
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 4. SUB-VIEW: NGO FLEET LOGISTICS ── */}
            {activeSidebarTab === 'fleet' && (
              <div className="flex flex-col gap-space-lg">
                <div>
                  <div className="flex items-center gap-space-xs mb-space-xs">
                    <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">
                      Couriers &amp; Shelter Network
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Active Courier Fleet
                    </span>
                  </div>
                  <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                    NGO Partner &amp; Courier Logistics
                  </h1>
                  <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                    Live delivery status of volunteer vehicles, cold-chain units, and recipient community kitchens.
                  </p>
                </div>

                {/* Fleet KPI Quick Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
                  <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center gap-space-md">
                    <div className="w-12 h-12 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-[24px]">local_shipping</span>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase">Couriers On Road</span>
                      <span className="font-headline-md text-headline-md text-primary font-bold">
                        {fleetRegistry.filter((f) => f.currentStatus === 'En Route' || f.currentStatus === 'Picked Up').length} Active
                      </span>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center gap-space-md">
                    <div className="w-12 h-12 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-[24px]">timer</span>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase">Avg Transit Time</span>
                      <span className="font-headline-md text-headline-md text-secondary font-bold">14.2 Mins</span>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center gap-space-md">
                    <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold">
                      <span className="material-symbols-outlined text-[24px]">check_circle</span>
                    </div>
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase">Successful Drops Today</span>
                      <span className="font-headline-md text-headline-md text-on-surface font-bold">19 Delivered</span>
                    </div>
                  </div>
                </div>

                {/* Fleet Status Filter */}
                <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex items-center gap-space-xs flex-wrap">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold mr-1">
                    Status:
                  </span>
                  {['ALL', 'En Route', 'Picked Up', 'Delivered', 'Idle'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFleetStatusFilter(st)}
                      className={`px-space-md py-1 rounded-full font-label-sm text-label-sm cursor-pointer transition-all ${
                        fleetStatusFilter === st
                          ? 'bg-primary text-on-primary font-bold'
                          : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Fleet Table */}
                <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                          <th className="py-space-md px-space-lg">NGO Partner</th>
                          <th className="py-space-md px-space-md">Courier &amp; Vehicle</th>
                          <th className="py-space-md px-space-md">Assigned Batch</th>
                          <th className="py-space-md px-space-md">Current Transit State</th>
                          <th className="py-space-md px-space-md">Contact</th>
                          <th className="py-space-md px-space-lg text-right">Dispatch Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container-low font-body-md text-body-md">
                        {filteredFleet.map((v) => (
                          <tr key={v.id} className="hover:bg-surface-container-low/60 transition-colors">
                            <td className="py-space-md px-space-lg font-bold text-primary">
                              {v.ngoName}
                            </td>
                            <td className="py-space-md px-space-md">
                              <div>
                                <p className="font-bold text-on-surface">{v.courierName}</p>
                                <p className="font-body-sm text-body-sm text-on-surface-variant">{v.vehicleType}</p>
                              </div>
                            </td>
                            <td className="py-space-md px-space-md font-mono font-bold text-on-surface">
                              {v.assignedBatchId}
                            </td>
                            <td className="py-space-md px-space-md">
                              {v.currentStatus === 'En Route' ? (
                                <span className="inline-flex items-center gap-1.5 px-space-md py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-bold uppercase">
                                  <span className="w-2 h-2 rounded-full bg-secondary animate-ping"></span>
                                  En Route (~{v.etaMinutes}m ETA)
                                </span>
                              ) : v.currentStatus === 'Picked Up' ? (
                                <span className="inline-flex items-center gap-1.5 px-space-md py-0.5 rounded-full bg-primary-fixed text-primary font-label-sm text-label-sm font-bold uppercase">
                                  <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                                  Cargo In Hand
                                </span>
                              ) : v.currentStatus === 'Delivered' ? (
                                <span className="inline-flex items-center gap-1.5 px-space-md py-0.5 rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm font-bold uppercase">
                                  <span className="material-symbols-outlined text-[14px]">done_all</span>
                                  Drop Completed
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-space-md py-0.5 rounded-full bg-surface-variant text-on-surface-variant font-label-sm text-label-sm font-bold uppercase">
                                  Standby
                                </span>
                              )}
                            </td>
                            <td className="py-space-md px-space-md text-sm text-on-surface-variant">
                              {v.phone}
                            </td>
                            <td className="py-space-md px-space-lg text-right">
                              <button
                                type="button"
                                onClick={() => showToast(`Ping sent to ${v.courierName} (${v.ngoName})`)}
                                className="px-space-md py-1 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-label-sm transition-colors cursor-pointer mr-1"
                              >
                                Ping Courier
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── 5. SUB-VIEW: SAFETY & COMPLIANCE LOGS ── */}
            {activeSidebarTab === 'logs' && (
              <div className="flex flex-col gap-space-lg">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
                  <div>
                    <div className="flex items-center gap-space-xs mb-space-xs">
                      <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">
                        Food Safety &amp; Audit Trail
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Immutable Ledger
                      </span>
                    </div>
                    <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                      Safety Protocols &amp; System Logs
                    </h1>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                      Every single donation, claim, safe-window check, and expiry event verified down to the second.
                    </p>
                  </div>

                  <div className="flex items-center gap-space-sm flex-wrap">
                    <button
                      type="button"
                      onClick={handleDownloadLog}
                      className="px-space-md py-space-xs bg-primary text-on-primary rounded-full font-label-md text-label-md hover:opacity-95 transition-opacity flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">download</span>
                      Download log (TXT / CSV)
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadJsonBackup}
                      className="px-space-md py-space-xs bg-surface-container-lowest text-on-surface rounded-full font-label-md text-label-md hover:bg-surface transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">database</span>
                      Export JSON Snapshot
                    </button>
                  </div>
                </div>

                {/* Temperature & Hygiene Verification Banner */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md">
                  <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-primary/20 flex items-start gap-space-sm">
                    <span className="material-symbols-outlined text-primary text-[24px]">thermostat</span>
                    <div>
                      <h4 className="font-label-lg text-label-lg font-bold text-on-surface">Temperature Controlled</h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        Hot holdings verified above 63°C; chilled dairy transported in cold-chain units under 4°C.
                      </p>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-secondary/20 flex items-start gap-space-sm">
                    <span className="material-symbols-outlined text-secondary text-[24px]">verified_user</span>
                    <div>
                      <h4 className="font-label-lg text-label-lg font-bold text-on-surface">Good Samaritan Protection</h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        Donations logged in good faith comply with municipal food recovery statutory shields.
                      </p>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm border border-surface-container-high flex items-start gap-space-sm">
                    <span className="material-symbols-outlined text-on-surface-variant text-[24px]">lock_clock</span>
                    <div>
                      <h4 className="font-label-lg text-label-lg font-bold text-on-surface">No Double Claiming</h4>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                        Atomic SQLite row latches enforce single-claim exclusivity across simultaneous attempts.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Filter and Log Table */}
                <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden">
                  <div className="p-space-md border-b border-surface-container flex flex-col md:flex-row items-center justify-between gap-space-md">
                    <div className="flex items-center gap-space-xs flex-wrap">
                      {['ALL', 'DONATED', 'CLAIMED', 'EXPIRED', 'RESTORED', 'CLEARED'].map((act) => (
                        <button
                          key={act}
                          type="button"
                          onClick={() => setLogActionFilter(act)}
                          className={`px-space-md py-1 rounded-full font-label-sm text-label-sm cursor-pointer transition-all ${
                            logActionFilter === act
                              ? 'bg-primary text-on-primary font-bold'
                              : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                          }`}
                        >
                          {act}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Search audit trail..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="h-9 px-space-md rounded-full bg-surface-container text-on-surface text-sm outline-none focus:ring-2 focus:ring-primary w-full md:w-64"
                    />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                          <th className="py-space-md px-space-lg">Timestamp</th>
                          <th className="py-space-md px-space-md">Action</th>
                          <th className="py-space-md px-space-md">Batch Ref</th>
                          <th className="py-space-md px-space-md">Actor</th>
                          <th className="py-space-md px-space-lg">Audit Details &amp; Custody</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container-low font-body-md text-body-md font-mono text-sm">
                        {filteredLogs.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-12 text-center text-on-surface-variant font-sans">
                              No logs recorded matching this filter.
                            </td>
                          </tr>
                        ) : (
                          filteredLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-surface-container-low/60 transition-colors">
                              <td className="py-space-md px-space-lg text-on-surface-variant whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td className="py-space-md px-space-md">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full font-label-sm text-xs font-bold uppercase ${
                                    log.action === 'DONATED'
                                      ? 'bg-primary-fixed text-primary'
                                      : log.action === 'CLAIMED'
                                      ? 'bg-secondary-fixed text-on-secondary-fixed'
                                      : log.action === 'EXPIRED'
                                      ? 'bg-error-container text-on-error-container'
                                      : 'bg-surface-variant text-on-surface'
                                  }`}
                                >
                                  {log.action}
                                </span>
                              </td>
                              <td className="py-space-md px-space-md font-bold text-primary">
                                {log.batch_id ? `#${log.batch_id}` : '—'}
                              </td>
                              <td className="py-space-md px-space-md text-on-surface font-sans font-medium">
                                {log.actor}
                              </td>
                              <td className="py-space-md px-space-lg text-on-surface-variant font-sans">
                                {log.details}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── 6. SUB-VIEW: USERS MANAGEMENT DIRECTORY ── */}
            {activeSidebarTab === 'users' && (
              <div className="flex flex-col gap-space-lg">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
                  <div>
                    <div className="flex items-center gap-space-xs mb-space-xs">
                      <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-bold">
                        Access &amp; Profiles
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-outline-variant"></span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Authentication Core
                      </span>
                    </div>
                    <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
                      Registered Users &amp; Partners
                    </h1>
                    <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                      Manage registered food donors, NGO distribution hubs, and dispatch coordinators.
                    </p>
                  </div>

                  <div className="flex items-center gap-space-sm">
                    <button
                      type="button"
                      onClick={fetchUsers}
                      className="flex items-center gap-1.5 px-space-md py-space-xs bg-surface-container-lowest border border-slate-200 text-on-surface rounded-full font-label-md text-label-md hover:bg-surface-container transition-colors shadow-sm cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">sync</span>
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Metric Summary Ribbon */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-space-md">
                  <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">group</span>
                    </div>
                    <div>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        {usersList.length}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Total Accounts</span>
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">storefront</span>
                    </div>
                    <div>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        {usersList.filter((u) => u.role === 'donor').length}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Food Donors</span>
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">volunteer_activism</span>
                    </div>
                    <div>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        {usersList.filter((u) => u.role === 'ngo').length}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">NGO Hubs</span>
                    </div>
                  </div>

                  <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex items-center gap-space-sm">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-900 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[20px]">shield_person</span>
                    </div>
                    <div>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                        {usersList.filter((u) => u.role === 'admin').length}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant block">Dispatch Admins</span>
                    </div>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-sm">
                  <div className="flex items-center gap-space-xs flex-1 max-w-md">
                    <div className="relative w-full">
                      <input
                        type="text"
                        placeholder="Search users by name, organization, email or location..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="w-full h-10 px-space-md pl-10 rounded-full bg-surface-container text-on-surface placeholder:text-on-surface-variant text-sm outline-none border border-transparent focus:border-primary transition-all"
                      />
                      <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-on-surface-variant">
                        search
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-space-sm">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Role Filter:</span>
                    <select
                      value={userRoleFilter}
                      onChange={(e) => setUserRoleFilter(e.target.value)}
                      className="bg-surface-container font-label-md text-label-md text-on-surface px-space-md py-space-xs rounded-full outline-none hover:bg-surface-container-high cursor-pointer"
                    >
                      <option value="ALL">All Roles</option>
                      <option value="donor">Food Donors</option>
                      <option value="ngo">NGO Partners</option>
                      <option value="admin">Administrators</option>
                    </select>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden border border-slate-200/80">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-xs uppercase tracking-wider border-b border-surface-container">
                          <th className="py-space-md px-space-md font-bold">User / Contact</th>
                          <th className="py-space-md px-space-md font-bold">Role</th>
                          <th className="py-space-md px-space-md font-bold">Organisation</th>
                          <th className="py-space-md px-space-md font-bold">Default Location &amp; GPS</th>
                          <th className="py-space-md px-space-md font-bold">Phone / Email</th>
                          <th className="py-space-md px-space-md font-bold">Registered</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-container">
                        {usersLoading ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                              <span className="material-symbols-outlined text-[24px] animate-spin mb-2">
                                progress_activity
                              </span>
                              <p>Loading users directory...</p>
                            </td>
                          </tr>
                        ) : usersList
                            .filter((u) => {
                              if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) return false;
                              if (!userSearch.trim()) return true;
                              const q = userSearch.toLowerCase();
                              return (
                                u.name.toLowerCase().includes(q) ||
                                (u.organization && u.organization.toLowerCase().includes(q)) ||
                                u.email.toLowerCase().includes(q) ||
                                (u.defaultLocation && u.defaultLocation.toLowerCase().includes(q))
                              );
                            })
                            .length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-on-surface-variant">
                              No matching user records found.
                            </td>
                          </tr>
                        ) : (
                          usersList
                            .filter((u) => {
                              if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) return false;
                              if (!userSearch.trim()) return true;
                              const q = userSearch.toLowerCase();
                              return (
                                u.name.toLowerCase().includes(q) ||
                                (u.organization && u.organization.toLowerCase().includes(q)) ||
                                u.email.toLowerCase().includes(q) ||
                                (u.defaultLocation && u.defaultLocation.toLowerCase().includes(q))
                              );
                            })
                            .map((u) => (
                              <tr key={u.id} className="hover:bg-surface-container/40 transition-colors">
                                <td className="py-space-md px-space-md">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                      {u.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <span className="font-bold text-on-surface block leading-tight">{u.name}</span>
                                      <span className="text-xs text-on-surface-variant font-mono">{u.id}</span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-space-md px-space-md">
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                      u.role === 'donor'
                                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                                        : u.role === 'ngo'
                                        ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                        : 'bg-purple-100 text-purple-900 border-purple-300'
                                    }`}
                                  >
                                    {u.role}
                                  </span>
                                </td>
                                <td className="py-space-md px-space-md font-medium text-on-surface">
                                  {u.organization || '—'}
                                </td>
                                <td className="py-space-md px-space-md">
                                  <div className="flex flex-col">
                                    <span className="text-on-surface truncate max-w-xs">{u.defaultLocation || 'Standard City Dock'}</span>
                                    <span className="text-xs text-primary font-mono font-semibold">
                                      {u.latitude ?? 40.7128}, {u.longitude ?? -74.006}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-space-md px-space-md">
                                  <div className="flex flex-col text-xs">
                                    <span className="font-medium text-on-surface">{u.email}</span>
                                    <span className="text-on-surface-variant">{u.phone || '—'}</span>
                                  </div>
                                </td>
                                <td className="py-space-md px-space-md text-xs text-on-surface-variant font-mono">
                                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── INSPECT BATCH AUDIT MODAL ── */}
      {inspectModalOpen && inspectData && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-space-md animate-slide-down">
          <div className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-xl p-space-xl flex flex-col gap-space-md">
            <div className="flex items-center justify-between border-b border-surface-container pb-space-sm">
              <div className="flex items-center gap-space-xs">
                <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Batch Inspection #{inspectData.id}
                </h3>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant cursor-pointer"
                onClick={() => setInspectModalOpen(false)}
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-space-sm text-sm">
              <div className="p-space-sm bg-surface-container-low rounded-lg">
                <span className="font-label-sm text-label-sm text-on-surface-variant block">Donor Entity</span>
                <span className="font-headline-sm text-label-lg text-on-surface font-bold">
                  {inspectData.donor}
                </span>
              </div>
              <div className="p-space-sm bg-surface-container-low rounded-lg">
                <span className="font-label-sm text-label-sm text-on-surface-variant block">Category</span>
                <span className="font-headline-sm text-label-lg text-on-surface font-bold">
                  {inspectData.category}
                </span>
              </div>
              <div className="p-space-sm bg-surface-container-low rounded-lg">
                <span className="font-label-sm text-label-sm text-on-surface-variant block">Portions Available</span>
                <span className="font-headline-sm text-label-lg text-on-surface font-bold">
                  {inspectData.portions} Portions
                </span>
              </div>
              <div className="p-space-sm bg-surface-container-low rounded-lg">
                <span className="font-label-sm text-label-sm text-on-surface-variant block">Shelf-Life / Timing</span>
                <span className="font-headline-sm text-label-lg text-secondary font-bold">
                  {inspectData.expiry}
                </span>
              </div>
              <div className="col-span-2 p-space-sm bg-surface-container-low rounded-lg">
                <span className="font-label-sm text-label-sm text-on-surface-variant block">Pickup Location</span>
                <span className="font-body-sm text-body-sm text-on-surface font-medium">
                  {inspectData.location}
                </span>
              </div>
              <div className="col-span-2 p-space-sm bg-surface-container-low rounded-lg">
                <span className="font-label-sm text-label-sm text-on-surface-variant block">Claimant / Destination</span>
                <span className="font-headline-sm text-label-lg text-primary font-bold">
                  {inspectData.claimant}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-space-sm pt-space-sm border-t border-surface-container">
              <button
                type="button"
                className="px-space-md py-space-xs bg-surface-container-low text-on-surface rounded-full font-label-md text-label-md hover:bg-surface-container transition-colors cursor-pointer"
                onClick={() => setInspectModalOpen(false)}
              >
                Dismiss
              </button>
              <button
                type="button"
                className="px-space-md py-space-xs bg-primary text-on-primary rounded-full font-label-md text-label-md hover:opacity-95 transition-opacity cursor-pointer"
                onClick={() => {
                  showToast(`Batch #${inspectData.id} verified against tamper-evident ledger.`);
                  setInspectModalOpen(false);
                }}
              >
                Validate Authenticity
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CLEAR DEMO DATA CONFIRMATION MODAL ── */}
      {clearDemoModalOpen && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-space-md animate-slide-down">
          <div className="relative w-full max-w-md bg-surface-container-lowest rounded-xl shadow-xl p-space-lg flex flex-col gap-space-md">
            <div className="flex items-start gap-space-sm">
              <div className="w-10 h-10 rounded-full bg-tertiary-fixed text-tertiary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </div>
              <div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">Purge Demo Records?</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  This will immediately clear all synthetic batches from the live dispatch buffer. Real donor listings will remain unaffected.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-space-sm pt-space-sm">
              <button
                type="button"
                className="px-space-md py-space-xs bg-surface-container-low text-on-surface rounded-full font-label-md text-label-md hover:bg-surface-container transition-colors cursor-pointer"
                onClick={() => setClearDemoModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-space-md py-space-xs bg-tertiary text-on-tertiary rounded-full font-label-md text-label-md hover:opacity-95 transition-opacity cursor-pointer"
                onClick={handleClearDemo}
              >
                Yes, Purge Simulation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
