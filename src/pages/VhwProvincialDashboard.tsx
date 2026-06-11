import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import PieChartComponent from '../components/PieChartComponent';
import PivotTables from '../components/PivotTables';
import { useAuth } from '../hooks/useAuth';
import { useVhwMasterList } from '../hooks/useData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#0d9488', '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const VhwProvincialDashboard: React.FC = () => {
  const { user } = useAuth();
  const [vhwMasterList] = useVhwMasterList();
  const provinces = [...new Set(vhwMasterList.map(record => record.province))].filter(p => p);
  
  // Check if user has province restriction
  const isProvinceRestricted = user?.province !== null;
  const [selectedProvince, setSelectedProvince] = useState<string>(
    isProvinceRestricted && user?.province ? user.province : (provinces[0] || '')
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  
  // Update selected province if user changes or user province changes
  useEffect(() => {
    if (isProvinceRestricted && user?.province) {
      setSelectedProvince(user.province);
    }
  }, [user, isProvinceRestricted]);

  const provinceRecords = vhwMasterList.filter(record => record.province === selectedProvince);
  const districts = [...new Set(provinceRecords.map(record => record.district))].filter(d => d);

  // Filter VHW records by selected district
  const filteredVhwRecords = selectedDistrict === 'all' 
    ? provinceRecords 
    : provinceRecords.filter(record => record.district === selectedDistrict);

  // Calculate stats for selected province
  const provinceStats = [
    { label: 'Total VHWs', value: provinceRecords.length },
    { label: 'Districts', value: districts.length },
    { label: 'Filtered VHWs', value: filteredVhwRecords.length },
  ];

  const paymentCategoryCounts = provinceRecords.reduce((acc, record) => {
    acc[record.paymentCategory] = (acc[record.paymentCategory] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Prepare data for pie chart
  const paymentCategoryData: Array<{ name: string; value: number; color: string }> = Object.entries(paymentCategoryCounts)
    .map(([category, count], index) => ({
      name: category,
      value: count,
      color: COLORS[index % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  // Count per district
  const districtCounts = provinceRecords.reduce((acc, record) => {
    if (record.district) {
      acc[record.district] = (acc[record.district] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const districtData = Object.entries(districtCounts).map(([district, count]) => ({
    district,
    count,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Village Health Workers - Provincial Level Dashboard</h1>
      </div>

      {/* Province Selector */}
      {!isProvinceRestricted && (
        <Card>
          <CardHeader>
            <CardTitle>Select Province</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedProvince} onValueChange={setSelectedProvince}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select a province" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map((province, index) => (
                  <SelectItem key={index} value={province}>
                    {province}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}
      
      {isProvinceRestricted && (
        <Card>
          <CardHeader>
            <CardTitle>Viewing Province</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full max-w-md px-3 py-2 text-sm font-semibold border border-gray-300 rounded-md bg-gray-50">
              {selectedProvince}
            </div>
          </CardContent>
        </Card>
      )}

      {/* District Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select District</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedDistrict} onValueChange={setSelectedDistrict}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select a district" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Districts</SelectItem>
              {districts.map((district, index) => (
                <SelectItem key={index} value={district}>
                  {district}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {provinceStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Categories Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Categories Distribution - {selectedProvince}</CardTitle>
          </CardHeader>
          <CardContent>
            <PieChartComponent
              data={paymentCategoryData}
              height={350}
              showLabel={true}
              showLegend={true}
              showTooltip={true}
              legendPosition="right"
              colors={COLORS}
              outerRadius={90}
              paddingAngle={2}
              tooltipFormatter={(value) => value.toLocaleString()}
            />
          </CardContent>
        </Card>

        {/* VHWs per District Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>VHWs per District - {selectedProvince}</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="district" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Legend />
                <Bar dataKey="count" fill="#0d9488" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Payment Categories Details */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Categories - {selectedProvince}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(paymentCategoryCounts).map(([category, count], index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                <div className="text-lg font-semibold">{category}</div>
                <div className="text-2xl font-bold">{count}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* VHW Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>VHW Records - {selectedDistrict === 'all' ? 'All Districts' : selectedDistrict}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Name</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">ID Number</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">District</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Health Centre</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Phone Number</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Payment Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">Data Quality</th>
                </tr>
              </thead>
              <tbody>
                {filteredVhwRecords.map((record, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm">{record.firstName} {record.lastName}</td>
                    <td className="px-4 py-3 text-sm">{record.idNumber}</td>
                    <td className="px-4 py-3 text-sm">{record.district}</td>
                    <td className="px-4 py-3 text-sm">{record.healthCentre}</td>
                    <td className="px-4 py-3 text-sm">{record.phoneNumber}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        record.paymentCategory === 'Correct' ? 'bg-green-100 text-green-800' :
                        record.paymentCategory.includes('Over') ? 'bg-yellow-100 text-yellow-800' :
                        record.paymentCategory.includes('Under') ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {record.paymentCategory}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        record.dataQuality === 'Good' ? 'bg-green-100 text-green-800' :
                        record.dataQuality === 'Fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {record.dataQuality}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pivot Tables */}
      <div className="mt-8">
        <PivotTables />
      </div>
    </div>
  );
};

export default VhwProvincialDashboard;
