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

/*
 * Schedule state marks. Each state gets its own SHAPE, not just its own color —
 * a filled disc, an open ring, a barred ring, a small dot — so the week grid
 * stays readable with color removed.
 */
export function MarkLogged({ size = 15, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} fill={color} />
      <Polyline points="7,12.5 10.5,16 17,8.5" stroke="#04140C" strokeWidth={2.75} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function MarkDue({ size = 15, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2.5} fill="none" />
    </Svg>
  );
}

export function MarkMissed({ size = 15, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} fill="none" />
      <Line x1={7.5} y1={12} x2={16.5} y2={12} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function MarkScheduled({ size = 15, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3.25} fill={color} />
    </Svg>
  );
}

/* Injection-guide step marks — drawn, replacing the emoji the craft floor bans. */
export function StepWash({ size = 34, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 13.5c0-1.5 1-2.5 2.5-2.5h5c1.5 0 2.5 1 2.5 2.5v3A3.5 3.5 0 0 1 13.5 20h-3A3.5 3.5 0 0 1 7 16.5Z" stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
      <Path d="M9.5 8V5.5M12 8V4M14.5 8V5.5" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function StepSwab({ size = 34, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={7.5} stroke={color} strokeWidth={STROKE} strokeDasharray="3 3" />
      <Circle cx={12} cy={12} r={2.75} fill={color} />
    </Svg>
  );
}

export function StepNeedle({ size = 34, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1={5} y1={19} x2={14} y2={10} stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Rect x={12.5} y={4.5} width={7} height={7} rx={1.5} transform="rotate(45 16 8)" stroke={color} strokeWidth={STROKE} />
      <Line x1={7.5} y1={13.5} x2={10.5} y2={16.5} stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function StepTimer({ size = 34, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={13} r={7.5} stroke={color} strokeWidth={STROKE} />
      <Polyline points="12,9 12,13 15,15" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Line x1={9.5} y1={3} x2={14.5} y2={3} stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function StepPress({ size = 34, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={STROKE} />
      <Circle cx={12} cy={12} r={8.5} stroke={color} strokeWidth={STROKE} strokeDasharray="2 4" />
    </Svg>
  );
}

export function StepDispose({ size = 34, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 7.5h12l-1 12a2 2 0 0 1-2 1.8H9a2 2 0 0 1-2-1.8Z" stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
      <Line x1={4.5} y1={7.5} x2={19.5} y2={7.5} stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Path d="M9.5 7.5V5a1.5 1.5 0 0 1 1.5-1.5h2A1.5 1.5 0 0 1 14.5 5v2.5" stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
    </Svg>
  );
}

export function StepMuscle({ size = 34, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4.5 14c0-3.5 2-6.5 5-6.5 2 0 3 1 4.5 1S17 7 18.5 8c1.2.8 1.5 2.5 1 4.5-.6 2.4-2.5 4-2.5 6H7c0-2-2.5-2.5-2.5-4.5Z" stroke={color} strokeWidth={STROKE} strokeLinejoin="round" />
    </Svg>
  );
}

export function StepAspirate({ size = 34, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={6.5} stroke={color} strokeWidth={STROKE} />
      <Line x1={15.8} y1={15.8} x2={20} y2={20} stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function StepNose({ size = 34, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 4v7.5c0 1.5-2.5 2-2.5 4 0 1.5 1.3 2.5 3 2.5" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6.5 18c-1.5 0-2.5-1.2-2.5-2.8 0-2 1.5-3.2 3-3.2" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function StepPill({ size = 34, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={8.5} width={18} height={7} rx={3.5} transform="rotate(-30 12 12)" stroke={color} strokeWidth={STROKE} />
      <Line x1={12} y1={7.5} x2={12} y2={16.5} stroke={color} strokeWidth={STROKE} transform="rotate(-30 12 12)" />
    </Svg>
  );
}

export function StepNote({ size = 34, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={4} width={14} height={16} rx={2.5} stroke={color} strokeWidth={STROKE} />
      <Polyline points="8.5,12 11,14.5 15.5,9.5" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" fill="none" />
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
