import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Filter, Download, Landmark, Pencil, Trash2, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function PhysicalFacilities() {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const fetchFacilities = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getFacilities({ search, limit: 50 });
      if (response.success && response.data) {
        setFacilities(response.data.results);
        setTotal(response.data.total);
      } else {
        toast.error(response.error || 'Failed to fetch facilities');
      }
    } catch (error) {
      toast.error('An error occurred while fetching facilities');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchFacilities();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchFacilities]);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Landmark className="h-6 w-6 text-[#0d9488]" />
            Physical Facility Management
          </h1>
          <p className="text-slate-500 mt-1">Manage health centers, clinics, and administrative offices across all provinces.</p>
        </div>
        <Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white gap-2 shadow-sm transition-all active:scale-95">
          <Plus className="h-4 w-4" /> Add New Facility
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name or code..."
              className="pl-10 bg-white border-slate-200 focus:ring-[#0d9488]/20 focus:border-[#0d9488]"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2 text-slate-600">
              <Filter className="h-4 w-4" /> Filters
            </Button>
            <Button variant="outline" size="sm" className="gap-2 text-slate-600">
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="font-semibold">Facility Name</TableHead>
                <TableHead className="font-semibold">Code</TableHead>
                <TableHead className="font-semibold">Type</TableHead>
                <TableHead className="font-semibold">Location</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <Loader2 className="h-8 w-8 animate-spin text-[#0d9488]" />
                      <span>Loading facilities...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : facilities.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-slate-500">
                    No facilities found.
                  </TableCell>
                </TableRow>
              ) : (
                facilities.map((facility) => (
                  <TableRow key={facility.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium text-slate-900">{facility.facility_name}</TableCell>
                    <TableCell className="text-slate-600 font-mono text-xs uppercase">{facility.facility_code}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50">
                        {facility.type_name || 'Clinic'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{facility.province || 'Harare'}</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {facility.district || 'Harare District'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={facility.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-700 border-slate-100'}>
                        {facility.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-[#0d9488]">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>Showing {facilities.length} of {total} facilities</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled className="h-8">Previous</Button>
            <Button variant="outline" size="sm" disabled className="h-8">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
