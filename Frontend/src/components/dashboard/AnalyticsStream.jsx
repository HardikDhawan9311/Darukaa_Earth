import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import { ChevronRight, TrendingUp } from 'lucide-react';

const AnalyticsStream = ({
  lineData,
  barData,
  chartConfig,
  selectedProject,
  avgCarbon = 0,
  avgBio = 0,
  siteCount = 0,
}) => {
  return (
    <div className="w-[420px] flex flex-col space-y-6">
      
      {/* Real-time Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#080b0e] border border-white/5 rounded-3xl p-5 shadow-xl">
           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Impact Score</p>
           <h4 className="text-2xl font-black text-white">{avgCarbon}%</h4>
           <div className="w-full bg-white/5 h-1 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-[#11ccf5]" style={{ width: `${Math.max(0, Math.min(100, avgCarbon))}%` }} />
           </div>
        </div>
        <div className="bg-[#080b0e] border border-white/5 rounded-3xl p-5 shadow-xl">
           <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">CO2 Offset</p>
           <h4 className="text-2xl font-black text-white">{siteCount}</h4>
           <div className="w-full bg-white/5 h-1 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-[#ff3d5f]" style={{ width: `${Math.max(10, Math.min(100, avgBio))}%` }} />
           </div>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-[#080b0e] border border-white/5 rounded-[32px] p-6 shadow-xl flex-1 flex flex-col">
         <div className="flex items-center justify-between mb-8">
           <h4 className="font-black text-white tracking-tight">Analytical Streams</h4>
         </div>

         <div className="flex-1 w-full relative min-h-[200px]">
            <Line data={lineData} options={chartConfig} />
         </div>

         <div className="mt-8 border-t border-white/5 pt-8">
           <h5 className="text-[10px] font-black uppercase text-gray-500 tracking-[3px] mb-6">Regional Growth</h5>
           <div className="h-[140px] w-full">
              <Bar data={barData} options={chartConfig} />
           </div>
         </div>
      </div>

      {/* Selection Overview Card */}
      <div className="bg-[#11ccf5] rounded-[32px] p-6 shadow-[0_8px_40px_rgba(17,204,245,0.2)]">
         <div className="flex justify-between items-start mb-6">
           <h4 className="text-black font-black text-xl leading-tight">{selectedProject.name}</h4>
           <div className="bg-black p-2 rounded-full cursor-pointer hover:rotate-90 transition-transform duration-300">
              <ChevronRight className="w-6 h-6 text-white" />
           </div>
         </div>
         <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
               <div className="w-3 h-3 bg-black rounded-full" />
               <span className="text-black font-black text-lg">{siteCount} Site(s)</span>
            </div>
            <TrendingUp className="text-black/40 w-6 h-6" />
         </div>
      </div>

    </div>
  );
};

export default AnalyticsStream;
