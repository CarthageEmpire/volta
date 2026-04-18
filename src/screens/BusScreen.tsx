import TransitSectionScreen from './TransitSectionScreen';
import { Screen } from '../types';

interface BusScreenProps {
  navigate: (screen: Screen) => void;
}

export default function BusScreen({ navigate }: BusScreenProps) {
  return <TransitSectionScreen mode="bus" navigate={navigate} />;
}
