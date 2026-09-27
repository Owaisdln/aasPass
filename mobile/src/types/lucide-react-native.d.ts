import 'lucide-react-native';
import type { StyleProp, ViewStyle, ColorValue } from 'react-native';

declare module 'lucide-react-native' {
  export interface LucideProps {
    color?: ColorValue | string;
    size?: string | number;
    strokeWidth?: string | number;
    fill?: string;
    style?: StyleProp<ViewStyle>;
  }
}
