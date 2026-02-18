/**
 * EmberMascot.tsx
 * Reusable mascot SVG component with state-based rendering.
 * Import and use on any screen:
 *   <EmberMascot state="idle" size={200} />
 */

import React from 'react';
import { Animated, ViewStyle } from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  LinearGradient as SvgLinearGradient,
  Stop,
  Ellipse,
  Path,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import { MascotState } from '../theme';

interface EmberMascotProps {
  state?: MascotState;
  size?: number;
  style?: ViewStyle | Animated.AnimatedProps<ViewStyle>;
}

// ─── Gradient configs per state ──────────────────────────────────────────────
const GRAD_CONFIGS: Record<
  MascotState,
  { outer: [string, string, string]; inner: [string, string] }
> = {
  idle:        { outer: ['#CC3D00', '#FF6B1A', '#FFD166'], inner: ['#FF6B1A', '#FFE566'] },
  focused:     { outer: ['#CC3D00', '#FF6B1A', '#FFD166'], inner: ['#FF8C00', '#FFD166'] },
  excited:     { outer: ['#FF6B1A', '#FFAA33', '#FFD166'], inner: ['#FFAA33', '#FFE8A0'] },
  sad:         { outer: ['#5A0A0A', '#C04040', '#E84545'], inner: ['#C04040', '#E87070'] },
  tired:       { outer: ['#3A1A0A', '#8A4020', '#AA5533'], inner: ['#7A3010', '#AA6040'] },
  celebrating: { outer: ['#FF8C00', '#FFAA33', '#FFE566'], inner: ['#FFCC44', '#FFFACD'] },
};

// ─── Body path per state (shape changes) ─────────────────────────────────────
const BODY_PATHS: Record<MascotState, string> = {
  idle:        'M110 198 C78 198 52 178 45 150 C38 122 48 88 68 70 C82 57 95 50 110 48 C125 50 138 57 152 70 C172 88 182 122 175 150 C168 178 142 198 110 198Z',
  focused:     'M110 198 C76 198 48 176 42 146 C35 116 47 80 68 62 C82 48 95 41 110 39 C125 41 138 48 152 62 C173 80 185 116 178 146 C172 176 144 198 110 198Z',
  excited:     'M110 193 C78 193 52 173 45 145 C38 117 48 83 68 65 C82 52 95 45 110 43 C125 45 138 52 152 65 C172 83 182 117 175 145 C168 173 142 193 110 193Z',
  sad:         'M110 198 C80 198 55 179 49 152 C43 125 51 92 69 74 C82 60 95 54 110 52 C125 54 138 60 151 74 C169 92 177 125 171 152 C165 179 140 198 110 198Z',
  tired:       'M110 200 C80 200 56 181 50 155 C44 128 52 96 69 78 C82 65 95 59 110 57 C125 59 138 65 151 78 C168 96 176 128 170 155 C164 181 140 200 110 200Z',
  celebrating: 'M110 195 C76 195 48 174 42 143 C35 112 47 75 68 57 C82 43 95 36 110 34 C125 36 138 43 152 57 C173 75 185 112 178 143 C172 174 144 195 110 195Z',
};

export default function EmberMascot({ state = 'idle', size = 220, style }: EmberMascotProps) {
  const cfg = GRAD_CONFIGS[state];
  const bodyPath = BODY_PATHS[state];
  const svgHeight = size * (state === 'celebrating' ? 1.2 : 1.15);

  // Eye/mouth configs per state
  const isSad         = state === 'sad';
  const isFocused     = state === 'focused';
  const isExcited     = state === 'excited';
  const isCelebrating = state === 'celebrating';
  const isTired       = state === 'tired';
  const showShoes     = isExcited || isCelebrating;
  const showSparkles  = isCelebrating;

  // Vertical offsets to account for taller/shorter bodies
  const eyeY  = state === 'celebrating' ? 132 : state === 'focused' ? 130 : 138;
  const mouthY = state === 'celebrating' ? 155 : state === 'focused' ? 152 : 162;

  return (
    <Svg width={size} height={svgHeight} viewBox="0 0 220 253" style={style as ViewStyle}>
      <Defs>
        {/* Body outer gradient */}
        <RadialGradient id={`bodyGrad_${state}`} cx="50%" cy="60%" r="48%">
          <Stop offset="0%"   stopColor="#FFE566" />
          <Stop offset="35%"  stopColor={cfg.outer[1]} />
          <Stop offset="75%"  stopColor={cfg.outer[0]} />
          <Stop offset="100%" stopColor={isSad ? '#4A0000' : '#CC3D00'} />
        </RadialGradient>

        {/* Wing gradient */}
        <SvgLinearGradient id={`wingGrad_${state}`} x1="0%" y1="100%" x2="60%" y2="0%">
          <Stop offset="0%"   stopColor={cfg.outer[0]} />
          <Stop offset="50%"  stopColor={cfg.outer[1]} />
          <Stop offset="100%" stopColor={cfg.outer[2]} />
        </SvgLinearGradient>

        {/* Spike gradient */}
        <SvgLinearGradient id={`spikeGrad_${state}`} x1="0%" y1="100%" x2="0%" y2="0%">
          <Stop offset="0%"   stopColor={cfg.outer[1]} />
          <Stop offset="100%" stopColor={cfg.outer[2]} />
        </SvgLinearGradient>

        {/* Inner glow */}
        <RadialGradient id={`innerGlow_${state}`} cx="50%" cy="55%" r="35%">
          <Stop offset="0%"   stopColor={cfg.inner[1]} stopOpacity="0.85" />
          <Stop offset="100%" stopColor={cfg.inner[0]} stopOpacity="0"    />
        </RadialGradient>

        {/* Leg gradient */}
        <SvgLinearGradient id={`legGrad_${state}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%"   stopColor={cfg.outer[1]} />
          <Stop offset="100%" stopColor={cfg.outer[0]} />
        </SvgLinearGradient>

        {/* Ground glow */}
        <RadialGradient id={`groundGlow_${state}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor={cfg.outer[1]} stopOpacity={isSad ? '0.2' : '0.35'} />
          <Stop offset="100%" stopColor={cfg.outer[1]} stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* ── Celebration sparkles ── */}
      {showSparkles && (
        <>
          <SvgText x="30"  y="45"  fontSize="14" fill="#FFD166" opacity={0.9}>✦</SvgText>
          <SvgText x="175" y="38"  fontSize="11" fill="#FFAA33" opacity={0.85}>✦</SvgText>
          <SvgText x="185" y="80"  fontSize="9"  fill="#FFD166" opacity={0.7}>✦</SvgText>
          <SvgText x="22"  y="90"  fontSize="10" fill="#FFAA33" opacity={0.8}>✦</SvgText>
          <SvgText x="105" y="22"  fontSize="8"  fill="#FFD166" opacity={0.75}>✦</SvgText>
        </>
      )}

      {/* ── Ground glow ── */}
      <Ellipse cx="110" cy="242" rx={showShoes ? 80 : 72} ry="10" fill={`url(#groundGlow_${state})`} />

      {/* ── Running shoes ── */}
      {showShoes && (
        <>
          <Ellipse cx="80"  cy="228" rx="18" ry="6" fill={cfg.outer[0]} opacity={0.9} />
          <Ellipse cx="140" cy="228" rx="18" ry="6" fill={cfg.outer[0]} opacity={0.9} />
          <Rect x="68"  y="220" width="24" height="9" rx="4" fill={cfg.outer[1]} />
          <Rect x="128" y="220" width="24" height="9" rx="4" fill={cfg.outer[1]} />
        </>
      )}

      {/* ── Far-left outer wing ── */}
      <Path
        d="M110 195 C85 185 45 165 30 130 C18 102 25 75 35 65 C50 80 58 105 60 130 C62 155 68 175 75 190Z"
        fill={`url(#wingGrad_${state})`}
        opacity={isSad ? 0.5 : 0.7}
      />
      {/* ── Far-right outer wing ── */}
      <Path
        d="M110 195 C135 185 175 165 190 130 C202 102 195 75 185 65 C170 80 162 105 160 130 C158 155 152 175 145 190Z"
        fill={`url(#wingGrad_${state})`}
        opacity={isSad ? 0.5 : 0.7}
      />
      {/* ── Left mid wing ── */}
      <Path
        d="M110 195 C90 182 58 160 48 125 C40 98 50 72 62 62 C72 80 75 108 76 132 C77 155 82 175 90 190Z"
        fill={`url(#wingGrad_${state})`}
        opacity={isSad ? 0.65 : 0.85}
      />
      {/* ── Right mid wing ── */}
      <Path
        d="M110 195 C130 182 162 160 172 125 C180 98 170 72 158 62 C148 80 145 108 144 132 C143 155 138 175 130 190Z"
        fill={`url(#wingGrad_${state})`}
        opacity={isSad ? 0.65 : 0.85}
      />
      {/* ── Inner flame petals ── */}
      <Path
        d="M110 192 C95 178 72 155 68 125 C64 100 75 78 85 70 C90 88 92 115 93 138 C94 162 98 180 105 192Z"
        fill={cfg.outer[1]}
        opacity={0.9}
      />
      <Path
        d="M110 192 C125 178 148 155 152 125 C156 100 145 78 135 70 C130 88 128 115 127 138 C126 162 122 180 115 192Z"
        fill={cfg.outer[1]}
        opacity={0.9}
      />

      {/* ── Central spike ── */}
      <Path
        d={isCelebrating
          ? 'M110 32 C106 52 102 80 103 105 C104 130 107 153 110 167 C113 153 116 130 117 105 C118 80 114 52 110 32Z'
          : 'M110 42 C106 60 102 85 103 110 C104 135 107 158 110 172 C113 158 116 135 117 110 C118 85 114 60 110 42Z'
        }
        fill={`url(#spikeGrad_${state})`}
      />

      {/* ── Main body ── */}
      <Path d={bodyPath} fill={`url(#bodyGrad_${state})`} />
      {/* ── Inner glow overlay ── */}
      <Path d={bodyPath} fill={`url(#innerGlow_${state})`} />

      {/* ── Feather texture lines ── */}
      <Path d="M85 80 C80 100 78 125 80 148"    stroke={cfg.outer[0]} strokeWidth="1.5" fill="none" opacity={0.22} />
      <Path d="M95 65 C88 88 86 115 88 140"     stroke={cfg.outer[0]} strokeWidth="1.5" fill="none" opacity={0.18} />
      <Path d="M135 80 C140 100 142 125 140 148" stroke={cfg.outer[0]} strokeWidth="1.5" fill="none" opacity={0.22} />
      <Path d="M125 65 C132 88 134 115 132 140"  stroke={cfg.outer[0]} strokeWidth="1.5" fill="none" opacity={0.18} />

      {/* ── Focused eyebrows ── */}
      {isFocused && (
        <>
          <Path d="M82 122 Q88 118 94 121" stroke="#1A0800" strokeWidth="3" fill="none" strokeLinecap="round" />
          <Path d="M126 121 Q132 118 138 122" stroke="#1A0800" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* ── Sad furrowed brows ── */}
      {isSad && (
        <>
          <Path d="M78 126 Q86 122 92 125" stroke="#1A0800" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <Path d="M128 125 Q134 122 142 126" stroke="#1A0800" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )}

      {/* ── Eyes ── */}
      {(isExcited || isCelebrating) ? (
        /* Star eyes */
        <>
          <SvgText x="88"  y={eyeY + 6} fontSize="22" textAnchor="middle" fill="#1A0800">★</SvgText>
          <SvgText x="132" y={eyeY + 6} fontSize="22" textAnchor="middle" fill="#1A0800">★</SvgText>
        </>
      ) : isTired ? (
        /* Half-lidded eyes */
        <>
          <Ellipse cx="88"  cy={eyeY} rx="16" ry="11" fill="#1A0800" />
          <Ellipse cx="132" cy={eyeY} rx="16" ry="11" fill="#1A0800" />
          <Ellipse cx="84"  cy={eyeY - 5} rx="5" ry="4" fill="white" opacity={0.5} />
          <Ellipse cx="128" cy={eyeY - 5} rx="5" ry="4" fill="white" opacity={0.5} />
          {/* Heavy eyelid covers */}
          <Rect x="70"  y={eyeY - 12} width="36" height="13" rx="6" fill={cfg.outer[0]} opacity={0.85} />
          <Rect x="114" y={eyeY - 12} width="36" height="13" rx="6" fill={cfg.outer[0]} opacity={0.85} />
        </>
      ) : (
        /* Normal round eyes */
        <>
          <Ellipse cx="88"  cy={eyeY} rx="16" ry="18" fill="#1A0800" />
          <Ellipse cx="88"  cy={eyeY} rx="13" ry="15" fill="#0D0500" />
          <Ellipse cx="82"  cy={eyeY - 7} rx="5" ry="6" fill="white" opacity={0.9} />
          <Ellipse cx="91"  cy={eyeY + 4} rx="2" ry="2" fill="white" opacity={0.4} />

          <Ellipse cx="132" cy={eyeY} rx="16" ry="18" fill="#1A0800" />
          <Ellipse cx="132" cy={eyeY} rx="13" ry="15" fill="#0D0500" />
          <Ellipse cx="126" cy={eyeY - 7} rx="5" ry="6" fill="white" opacity={0.9} />
          <Ellipse cx="135" cy={eyeY + 4} rx="2" ry="2" fill="white" opacity={0.4} />
        </>
      )}

      {/* ── Tear (sad only) ── */}
      {isSad && (
        <Ellipse cx="82" cy={eyeY + 18} rx="4" ry="6" fill="#4488CC" opacity={0.75} />
      )}

      {/* ── Mouth ── */}
      {isFocused ? (
        <Path d={`M98 ${mouthY} L122 ${mouthY}`} stroke="#1A0800" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : isSad ? (
        <Path d={`M96 ${mouthY} Q110 ${mouthY - 8} 124 ${mouthY}`} stroke="#1A0800" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : isCelebrating ? (
        <Path d={`M90 ${mouthY} Q110 ${mouthY + 14} 130 ${mouthY}`} stroke="#1A0800" strokeWidth="4" fill="none" strokeLinecap="round" />
      ) : (
        <Path d={`M98 ${mouthY} Q110 ${mouthY + 10} 122 ${mouthY}`} stroke="#1A0800" strokeWidth="3" fill="none" strokeLinecap="round" />
      )}

      {/* ── Four stubby legs ── */}
      <Path d="M82 212 C78 212 74 214 73 220 C72 225 75 230 80 231 C85 232 89 228 89 223 C89 217 86 212 82 212Z"  fill={`url(#legGrad_${state})`} />
      <Path d="M98 215 C94 215 91 217 90 223 C89 228 92 233 97 233 C102 233 105 229 105 224 C105 218 102 215 98 215Z" fill={`url(#legGrad_${state})`} />
      <Path d="M122 215 C118 215 115 218 115 224 C115 229 118 233 123 233 C128 233 131 228 130 223 C129 217 126 215 122 215Z" fill={`url(#legGrad_${state})`} />
      <Path d="M138 212 C134 212 131 217 131 223 C131 228 135 232 140 231 C145 230 148 225 147 220 C146 214 142 212 138 212Z" fill={`url(#legGrad_${state})`} />

      {/* ── Ember sparks ── */}
      <Ellipse cx="168" cy="72"  rx="4"   ry="5"   fill={cfg.outer[2]} opacity={0.9}  />
      <Ellipse cx="178" cy="95"  rx="3"   ry="4"   fill={cfg.outer[1]} opacity={0.75} />
      <Ellipse cx="155" cy="52"  rx="2.5" ry="3"   fill={cfg.outer[1]} opacity={0.8}  />
      <Ellipse cx="52"  cy="72"  rx="4"   ry="5"   fill={cfg.outer[2]} opacity={0.9}  />
      <Ellipse cx="42"  cy="95"  rx="3"   ry="4"   fill={cfg.outer[1]} opacity={0.75} />
      <Ellipse cx="65"  cy="52"  rx="2.5" ry="3"   fill={cfg.outer[1]} opacity={0.8}  />
      <Ellipse cx="110" cy="30"  rx="3"   ry="4"   fill={cfg.outer[2]} opacity={0.7}  />
      <Ellipse cx="130" cy="38"  rx="2"   ry="2.5" fill={cfg.outer[1]} opacity={0.65} />
      <Ellipse cx="90"  cy="38"  rx="2"   ry="2.5" fill={cfg.outer[1]} opacity={0.65} />
    </Svg>
  );
}
