'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw,
  Search,
  LayoutDashboard,
  BarChart3,
  Users,
  Calendar,
  Filter,
  Package,
  Share2
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area
} from 'recharts';

const Dashboard = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('All Products');
  const [selectedChannel, setSelectedChannel] = useState('All Channels');
  const [searchTerm, setSearchTerm] = useState('');

  // AI State
  const [modelName, setModelName] = useState('gemini-3.1-flash-lite-preview');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/sales-data');
        if (!response.ok) throw new Error('Failed to fetch sales data from server');
        const cleanData = await response.json();
        
        setRawData(cleanData);
        
        // Set initial date range
        if (cleanData.length > 0) {
          const dates = cleanData.map(d => d.date).sort();
          setStartDate(dates[0]);
          setEndDate(dates[dates.length - 1]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter Logic
  const filteredData = useMemo(() => {
    return rawData.filter(row => {
      const dateMatch = (!startDate || row.date >= startDate) && (!endDate || row.date <= endDate);
      const productMatch = selectedProduct === 'All Products' || row.product === selectedProduct;
      const channelMatch = selectedChannel === 'All Channels' || row.channel === selectedChannel;
      const searchMatch = !searchTerm || 
        row.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.channel.toLowerCase().includes(searchTerm.toLowerCase());
      
      return dateMatch && productMatch && channelMatch && searchMatch;
    });
  }, [rawData, startDate, endDate, selectedProduct, selectedChannel, searchTerm]);

  // Derived Statistics
  const stats = useMemo(() => {
    const totalRevenue = filteredData.reduce((sum, row) => sum + (row.revenue || 0), 0);
    const totalOrders = filteredData.reduce((sum, row) => sum + (row.orders || 0), 0);
    const totalCost = filteredData.reduce((sum, row) => sum + (row.cost || 0), 0);
    const totalProfit = totalRevenue - totalCost;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return { totalRevenue, totalOrders, totalProfit, aov };
  }, [filteredData]);

  // Chart Data Preparation
  const trendData = useMemo(() => {
    const grouped = filteredData.reduce((acc, row) => {
      acc[row.date] = (acc[row.date] || 0) + row.revenue;
      return acc;
    }, {});
    
    return Object.entries(grouped)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredData]);

  const channelData = useMemo(() => {
    const grouped = filteredData.reduce((acc, row) => {
      acc[row.channel] = (acc[row.channel] || 0) + row.revenue;
      return acc;
    }, {});
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const productData = useMemo(() => {
    const grouped = filteredData.reduce((acc, row) => {
      acc[row.product] = (acc[row.product] || 0) + row.revenue;
      return acc;
    }, {});
    
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredData]);

  // Dynamic filter options
  const products = useMemo(() => ['All Products', ...new Set(rawData.map(r => r.product))], [rawData]);
  const channels = useMemo(() => ['All Channels', ...new Set(rawData.map(r => r.channel))], [rawData]);

  // Automated Data Insights
  const dataInsights = useMemo(() => {
    if (filteredData.length === 0) return null;

    const productRev = filteredData.reduce((acc, r) => { acc[r.product] = (acc[r.product] || 0) + r.revenue; return acc; }, {});
    const bestProduct = Object.entries(productRev).sort((a,b) => b[1]-a[1])[0];

    const channelRev = filteredData.reduce((acc, r) => { acc[r.channel] = (acc[r.channel] || 0) + r.revenue; return acc; }, {});
    const bestChannel = Object.entries(channelRev).sort((a,b) => b[1]-a[1])[0];

    const dayRev = filteredData.reduce((acc, r) => { acc[r.date] = (acc[r.date] || 0) + r.revenue; return acc; }, {});
    const peakDay = Object.entries(dayRev).sort((a,b) => b[1]-a[1])[0];

    const channelConv = filteredData.reduce((acc, r) => {
      if (!acc[r.channel]) acc[r.channel] = { o: 0, v: 0 };
      acc[r.channel].o += (r.orders || 0);
      acc[r.channel].v += (r.visitors || 0);
      return acc;
    }, {});
    const topConv = Object.entries(channelConv)
      .map(([name, s]) => ({ name, rate: s.v > 0 ? (s.o / s.v) : 0 }))
      .sort((a,b) => b.rate - a.rate)[0];

    return {
      bestProduct: bestProduct?.[0],
      bestChannel: bestChannel?.[0],
      peakDay: peakDay?.[0],
      topConvChannel: topConv?.name,
      topConvRate: (topConv?.rate * 100).toFixed(1) + '%'
    };
  }, [filteredData]);

  const generateAIInsights = async () => {
    setAiLoading(true);
    try {
      const prompt = `
        Analyze this business sales data from ${startDate} to ${endDate}.
        Summary Metrics:
        - Total Revenue: ${formatCurrency(stats.totalRevenue)}
        - Total Orders: ${stats.totalOrders}
        - Total Profit: ${formatCurrency(stats.totalProfit)}
        - Avg Order Value: ${formatCurrency(stats.aov)}
        - Best Product: ${dataInsights.bestProduct}
        - Best Channel: ${dataInsights.bestChannel}
        
        Provide concise business insights in exactly this JSON format:
        {
          "alerts": ["Alert 1", "Alert 2"],
          "opportunities": ["Opportunity 1", "Opportunity 2"],
          "suggestions": ["Suggestion 1", "Suggestion 2"]
        }
        Keep each point short and clear (max 10 words per point).
      `;

      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelName, prompt })
      });

      if (!response.ok) throw new Error('Server error');
      
      const data = await response.json();
      setAiInsights(data);
    } catch (error) {
      console.error("AI Insight Error:", error);
      alert("Failed to generate AI insights. Ensure the server is configured correctly.");
    } finally {
      setAiLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-primary-600"></div>
          <p className="text-slate-500 font-medium">Powering up your insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-slate-200 p-6 sticky top-0 h-screen">
        <div className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center text-white">
            <LayoutDashboard size={18} />
          </div>
          <span className="font-bold text-xl text-slate-900 tracking-tight">VentureDash</span>
        </div>

        <nav className="space-y-1 flex-1">
          <NavItem icon={<LayoutDashboard size={18} />} label="Overview" active />
          <NavItem icon={<BarChart3 size={18} />} label="Analytics" />
          <NavItem icon={<Users size={18} />} label="Customers" />
        </nav>

        <div className="pt-6 border-t border-slate-100 italic text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          System operational
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">Executive Dashboard</h1>
              <p className="text-slate-500 mt-2 font-medium">Real-time business intelligence and performance tracking</p>
            </div>
            <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
              <button 
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2 hover:bg-slate-50 rounded-lg text-sm font-bold text-slate-700 transition-all"
              >
                <RefreshCcw size={16} />
                Sync
              </button>
              <div className="w-px h-6 bg-slate-200"></div>
              <button className="flex items-center gap-2 px-5 py-2 bg-sky-600 rounded-lg text-sm font-bold text-white hover:bg-sky-700 transition-all shadow-md shadow-sky-200">
                Generate Report
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                <Calendar size={12} /> Start Date
              </label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                <Calendar size={12} /> End Date
              </label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                <Package size={12} /> Product
              </label>
              <select 
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all font-medium appearance-none"
              >
                {products.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                <Share2 size={12} /> Acquisition Channel
              </label>
              <select 
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 outline-none transition-all font-medium appearance-none"
              >
                {channels.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KPICard 
              title="Gross Revenue" 
              value={formatCurrency(stats.totalRevenue)} 
              icon={<DollarSign className="text-emerald-600" />}
              trend="+14.2%"
              isPositive={true}
              subtitle="Current period"
              color="emerald"
            />
            <KPICard 
              title="Conversion Count" 
              value={stats.totalOrders.toLocaleString()} 
              icon={<ShoppingCart className="text-sky-600" />}
              trend="+5.1%"
              isPositive={true}
              subtitle="Verified orders"
              color="blue"
            />
            <KPICard 
              title="Net Contribution" 
              value={formatCurrency(stats.totalProfit)} 
              icon={<TrendingUp className="text-purple-600" />}
              trend="+18.7%"
              isPositive={true}
              subtitle="After operational costs"
              color="purple"
            />
            <KPICard 
              title="AOV Intelligence" 
              value={formatCurrency(stats.aov)} 
              icon={<Target className="text-amber-600" />}
              trend="-1.4%"
              isPositive={false}
              subtitle="Avg. order value"
              color="amber"
            />
          </div>

          {/* Automated Data Insights */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <InsightCard 
              label="Star Performer" 
              value={dataInsights?.bestProduct} 
              desc="Top product by revenue"
              icon={<Package size={14} className="text-sky-600" />}
            />
            <InsightCard 
              label="Growth Engine" 
              value={dataInsights?.bestChannel} 
              desc="Highest revenue source"
              icon={<Share2 size={14} className="text-indigo-600" />}
            />
            <InsightCard 
              label="Peak Demand" 
              value={dataInsights?.peakDay} 
              desc="Highest single-day sales"
              icon={<Calendar size={14} className="text-emerald-600" />}
            />
            <InsightCard 
              label="Efficiency Leader" 
              value={dataInsights?.topConvChannel} 
              desc={`${dataInsights?.topConvRate} Conversion Rate`}
              icon={<Target size={14} className="text-amber-600" />}
            />
          </div>

          {/* AI Insights & Controls */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden text-white">
            <div className="p-8 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-sky-600 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/20">
                  <TrendingUp className="text-white" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight">AI Strategy Engine</h2>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-0.5">Gemini-Powered Intelligence</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    Cloud Secured
                  </span>
                </div>
                
                <select 
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer hover:border-slate-600 transition-colors"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                >
                  <optgroup label="Free Tier (Fast & Efficient)">
                    <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash-Lite (Latest Preview)</option>
                    <option value="gemini-3-flash-preview">Gemini 3 Flash Preview</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (GA)</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  </optgroup>
                  <optgroup label="Pro Tier (Experimental Reasoning)">
                    <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview</option>
                    <option value="gemini-3-pro-preview">Gemini 3 Pro Preview</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                  </optgroup>
                </select>

                <button 
                  onClick={generateAIInsights}
                  disabled={aiLoading}
                  className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    aiLoading ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-sky-500 hover:bg-sky-400 text-white shadow-lg shadow-sky-500/30'
                  }`}
                >
                  {aiLoading ? 'Analyzing...' : 'Generate Insights'}
                </button>
              </div>
            </div>

            {aiInsights ? (
              <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-rose-400 font-bold uppercase text-[10px] tracking-[0.2em]">
                    <ArrowDownRight size={14} /> Alerts
                  </h4>
                  <ul className="space-y-3">
                    {aiInsights.alerts.map((a, i) => (
                      <li key={i} className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl text-sm font-medium text-rose-200">
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-sky-400 font-bold uppercase text-[10px] tracking-[0.2em]">
                    <TrendingUp size={14} /> Opportunities
                  </h4>
                  <ul className="space-y-3">
                    {aiInsights.opportunities.map((o, i) => (
                      <li key={i} className="bg-sky-500/5 border border-sky-500/10 p-3 rounded-xl text-sm font-medium text-sky-200">
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-[10px] tracking-[0.2em]">
                    <Target size={14} /> Suggestions
                  </h4>
                  <ul className="space-y-3">
                    {aiInsights.suggestions.map((s, i) => (
                      <li key={i} className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-xl text-sm font-medium text-emerald-200">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : !aiLoading && (
              <div className="p-12 text-center text-slate-500 font-bold text-sm">
                AI insights are powered by your server-side Gemini configuration.
              </div>
            )}
            
            {aiLoading && (
              <div className="p-12 flex flex-col items-center gap-4">
                <div className="animate-bounce w-2 h-2 bg-sky-500 rounded-full shadow-[0_0_15px_rgba(14,165,233,0.5)]"></div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Gemini is processing your data ecosystem...</p>
              </div>
            )}
          </div>

          {/* Charts Row 1: Trend */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Revenue Velocity</h3>
                <p className="text-slate-500 text-sm font-medium">Daily revenue accumulation trend</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-sky-500"></div>
                  Revenue
                </div>
              </div>
            </div>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                    tickFormatter={(val) => `$${val >= 1000 ? val/1000 + 'k' : val}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#0ea5e9" 
                    strokeWidth={4} 
                    dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Charts Row 2: Distributions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Channel Revenue */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-1">Channel Distribution</h3>
              <p className="text-slate-500 text-sm font-medium mb-8">Revenue performance by marketing channel</p>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={channelData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }}
                    />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [formatCurrency(value), 'Revenue']}
                    />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32}>
                      {channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899'][index % 4]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Products */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-1">High Performers</h3>
              <p className="text-slate-500 text-sm font-medium mb-8">Top products by total revenue contribution</p>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={8}
                    >
                      {productData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#0ea5e9', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6'][index % 5]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value) => [formatCurrency(value), 'Revenue']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {productData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:['#0ea5e9', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6'][i % 5]}}></div>
                    <span className="text-xs font-bold text-slate-600 truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Granular Transaction Ledger</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Audit-ready data logs</p>
              </div>
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filter transactions..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all w-full sm:w-80 font-medium shadow-sm"
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white text-slate-400 text-[10px] font-black uppercase tracking-[0.15em] border-b border-slate-100">
                    <th className="px-8 py-5">Timestamp</th>
                    <th className="px-8 py-5">Product SKU</th>
                    <th className="px-8 py-5">Source</th>
                    <th className="px-8 py-5 text-right">Units</th>
                    <th className="px-8 py-5 text-right">Gross</th>
                    <th className="px-8 py-5 text-right">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5 text-sm font-bold text-slate-500">{row.date}</td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-black text-slate-900 group-hover:text-sky-600 transition-colors">
                          {row.product}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          row.channel === 'Facebook Ads' ? 'bg-blue-50 text-blue-700' : 
                          row.channel === 'Google Ads' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {row.channel}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-sm text-slate-600 text-right font-mono font-bold">{row.orders}</td>
                      <td className="px-8 py-5 text-sm text-slate-900 text-right font-mono font-black">{formatCurrency(row.revenue)}</td>
                      <td className="px-8 py-5 text-right font-mono">
                        <span className={`text-sm font-black ${
                          (row.revenue - row.cost) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {formatCurrency(row.revenue - row.cost)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Displaying {filteredData.length} of {rawData.length} verified records
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active = false }) => (
  <a href="#" className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
    active 
      ? 'bg-sky-50 text-sky-700 shadow-sm shadow-sky-100/50' 
      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
  }`}>
    {icon}
    {label}
  </a>
);

const InsightCard = ({ label, value, desc, icon }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start gap-3 group hover:border-sky-200 transition-all cursor-default">
    <div className="bg-slate-50 p-2 rounded-lg group-hover:bg-sky-50 transition-colors">
      {icon}
    </div>
    <div className="space-y-0.5">
      <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.1em]">{label}</p>
      <p className="text-sm font-black text-slate-900 truncate max-w-[120px]">{value || '---'}</p>
      <p className="text-[10px] text-slate-400 font-bold">{desc}</p>
    </div>
  </div>
);

const KPICard = ({ title, value, icon, trend, isPositive, subtitle, color }) => {
  const colorMap = {
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-sky-50 text-sky-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all hover:shadow-md hover:border-slate-300 group">
      <div className="flex items-center justify-between mb-6">
        <div className={`p-3 rounded-xl transition-transform group-hover:scale-110 duration-300 ${colorMap[color] || 'bg-slate-100 text-slate-600'}`}>
          {React.cloneElement(icon, { size: 24 })}
        </div>
        <div className={`flex items-center gap-1 text-[11px] font-black px-2.5 py-1.5 rounded-lg uppercase tracking-wider ${
          isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
        }`}>
          {isPositive ? <ArrowUpRight size={14} strokeWidth={3} /> : <ArrowDownRight size={14} strokeWidth={3} />}
          {trend}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
        </div>
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{subtitle}</p>
      </div>
    </div>
  );
};

export default Dashboard;
