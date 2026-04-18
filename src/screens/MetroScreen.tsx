import TransitSectionScreen from './TransitSectionScreen';
import { Screen } from '../types';

interface MetroScreenProps {
  navigate: (screen: Screen) => void;
}

export default function MetroScreen({ navigate }: MetroScreenProps) {
  return <TransitSectionScreen mode="metro" navigate={navigate} />;
}
