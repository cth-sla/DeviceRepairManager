import React from 'react';
import { DeviceType } from '../types';
import { Cpu, Mic, Video, Zap, Tablet, Box, Network, Shield, Router, HardDrive } from 'lucide-react';

interface DeviceIconProps {
  type: string;
  className?: string;
  size?: number;
}

export const DeviceIcon: React.FC<DeviceIconProps> = ({ type, className, size = 16 }) => {
  let Icon = Box;
  
  switch (type) {
    case DeviceType.CODEC:
      Icon = Cpu;
      break;
    case DeviceType.MIC:
      Icon = Mic;
      break;
    case DeviceType.CAMERA:
      Icon = Video;
      break;
    case DeviceType.SOURCE:
      Icon = Zap;
      break;
    case DeviceType.SWITCH:
      Icon = Network;
      break;
    case DeviceType.FIREWALL:
      Icon = Shield;
      break;
    case DeviceType.ROUTER:
      Icon = Router;
      break;
    case DeviceType.MCU:
      Icon = HardDrive;
      break;
    case DeviceType.OTHER:
      Icon = Box;
      break;
    default:
      Icon = Box;
  }

  return <Icon className={className} size={size} />;
};