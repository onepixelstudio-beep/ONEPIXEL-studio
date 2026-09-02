import React from 'react';
import QAMainPanel from '../qa/ui/QAMainPanel';

interface QAPanelProps {
  isOpen: boolean;
  onClose: () => void;
  project: any | null;
  undoStackLength: number;
  redoStackLength: number;
  activeTool: string;
  selectedFrameId: string;
  selectedLayerId: string;
}

export default function QAPanel(props: QAPanelProps) {
  if (!props.isOpen) return null;
  
  return <QAMainPanel {...props} />;
}
