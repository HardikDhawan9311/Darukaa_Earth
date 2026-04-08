import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Activity } from 'lucide-react';

const ProjectCard = ({ project, isSelected, onClick }) => {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className={`p-5 rounded-[24px] cursor-pointer border transition-all duration-300 relative group overflow-hidden ${
        isSelected 
          ? 'bg-gradient-to-br from-[#11ccf5]/10 to-transparent border-[#11ccf5]/40 shadow-[0_10px_30px_rgba(17,204,245,0.05)]' 
          : 'bg-[#080b0e] border-white/5 hover:border-white/20'
      }`}
    >
      {isSelected && (
        <motion.div layoutId="highlight" className="absolute left-0 top-0 w-1 h-full bg-[#11ccf5]" />
      )}
      <div className="flex justify-between items-start mb-3">
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          project.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 
          project.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
        }`}>
          {project.status}
        </span>
        <span className="text-[10px] text-gray-600 italic font-mono">{project.lastUpdated}</span>
      </div>
      <h4 className="text-white font-black leading-tight mb-2 group-hover:text-[#11ccf5] transition-colors">{project.name}</h4>
      <p className="text-sm text-gray-500 truncate mb-4">{project.region}</p>
      
      <div className="flex items-center justify-between border-t border-white/5 pt-4">
        <div className="flex items-center space-x-2">
           <Leaf className="w-3 h-3 text-[#11ccf5]" />
           <span className="text-[10px] font-bold text-gray-400">Carbon: <span className="text-white">{project.carbon}%</span></span>
        </div>
        <div className="flex items-center space-x-2">
           <Activity className="w-3 h-3 text-[#ff3d5f]" />
           <span className="text-[10px] font-bold text-gray-400">Bio: <span className="text-white">{project.biodiversity}%</span></span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
