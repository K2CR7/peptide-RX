import Svg, { Circle, Line, Path, Polyline, Rect } from "react-native-svg";

interface IconProps {
  size?: number;
  color: string;
}

const STROKE = 1.75;

export function RingIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={8.5} stroke={color} strokeWidth={STROKE} strokeDasharray="38 16" strokeLinecap="round" />
      <Circle cx={12} cy={12} r={2.4} fill={color} />
    </Svg>
  );
}

export function WeekIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3.5} y={5} width={17} height={15.5} rx={3} stroke={color} strokeWidth={STROKE} />
      <Line x1={3.5} y1={10} x2={20.5} y2={10} stroke={color} strokeWidth={STROKE} />
      <Line x1={8} y1={3} x2={8} y2={7} stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Line x1={16} y1={3} x2={16} y2={7} stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Circle cx={8.5} cy={14.5} r={1.5} fill={color} />
    </Svg>
  );
}

export function VialIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={8} y={7} width={8} height={13.5} rx={2.5} stroke={color} strokeWidth={STROKE} />
      <Line x1={6.5} y1={4} x2={17.5} y2={4} stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Line x1={12} y1={4} x2={12} y2={7} stroke={color} strokeWidth={STROKE} />
      <Line x1={8} y1={13.5} x2={16} y2={13.5} stroke={color} strokeWidth={STROKE} />
    </Svg>
  );
}

export function TrendIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="3.5,17.5 9,11.5 13.5,15 20.5,6.5" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Circle cx={20.5} cy={6.5} r={2} fill={color} />
    </Svg>
  );
}

export function FuelIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4.5 10.5h15a7.5 7.5 0 0 1-15 0Z" stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
      <Path d="M8 7c0-2 2-2.5 2-4" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Path d="M13.5 7c0-2 2-2.5 2-4" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function BookIcon({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 6.5C10 4.8 7 4.5 4 4.8v13.7c3-.3 6 0 8 1.7 2-1.7 5-2 8-1.7V4.8c-3-.3-6 0-8 1.7Z" stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
      <Line x1={12} y1={7} x2={12} y2={19.5} stroke={color} strokeWidth={STROKE} />
    </Svg>
  );
}

export function CheckMark({ size = 14, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="4,13 10,19 20,6" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function PlusMark({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1={12} y1={4.5} x2={12} y2={19.5} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
      <Line x1={4.5} y1={12} x2={19.5} y2={12} stroke={color} strokeWidth={2.5} strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronRight({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="9,5 16.5,12 9,19" stroke={color} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}
