import React from "react";
import { Circle, Line, Path, Polyline, Rect, Svg } from "react-native-svg";

const SIZE = 22;

export function BankIcon({ color = "#FFFFFF" }: { color?: string }) {
  return (
    <Svg viewBox="0 0 64 64" width={SIZE} height={SIZE}>
      <Circle fill={color} cx="32" cy="14" r="3" />
      <Path
        fill={color}
        d="M4,25h56c1.794,0,3.368-1.194,3.852-2.922c0.484-1.728-0.242-3.566-1.775-4.497l-28-17
C33.438,0.193,32.719,0,32,0s-1.438,0.193-2.076,0.581l-28,17c-1.533,0.931-2.26,2.77-1.775,4.497C0.632,23.806,2.206,25,4,25z
M32,9c2.762,0,5,2.238,5,5s-2.238,5-5,5s-5-2.238-5-5S29.238,9,32,9z"
      />
      <Rect x="34" y="27" fill={color} width="8" height="25" />
      <Rect x="46" y="27" fill={color} width="8" height="25" />
      <Rect x="22" y="27" fill={color} width="8" height="25" />
      <Rect x="10" y="27" fill={color} width="8" height="25" />
      <Path fill={color} d="M4,58h56c0-2.209-1.791-4-4-4H8C5.791,54,4,55.791,4,58z" />
      <Path fill={color} d="M63.445,60H0.555C0.211,60.591,0,61.268,0,62v2h64v-2C64,61.268,63.789,60.591,63.445,60z" />
    </Svg>
  );
}

export function PayIcon({ color = "#FFFFFF" }: { color?: string }) {
  return (
    <Svg viewBox="0 0 24 24" width={SIZE} height={SIZE}>
      <Path
        fill={color}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M2 8C2 5.79086 3.79086 4 6 4H18C20.2091 4 22 5.79086 22 8V8.5C22 8.77614 21.7761 9 21.5 9L2.5 9C2.22386 9 2 8.77614 2 8.5V8ZM2.5 11C2.22386 11 2 11.2239 2 11.5V16C2 18.2091 3.79086 20 6 20H18C20.2091 20 22 18.2091 22 16V11.5C22 11.2239 21.7761 11 21.5 11L2.5 11ZM13 15C13 14.4477 13.4477 14 14 14H17C17.5523 14 18 14.4477 18 15C18 15.5523 17.5523 16 17 16H14C13.4477 16 13 15.5523 13 15Z"
      />
    </Svg>
  );
}

export function ExchangeIcon({ color = "#FFFFFF" }: { color?: string }) {
  const s = { stroke: color, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 2, fill: "none" };
  return (
    <Svg viewBox="0 0 24 24" width={SIZE} height={SIZE}>
      <Path {...s} d="M5.3,7.64A8,8,0,0,1,20,12" />
      <Path {...s} d="M4,12a7.91,7.91,0,0,0,.35,2.35,8,8,0,0,0,14.35,2" />
      <Polyline {...s} points="19,11 20,12 21,11" />
      <Polyline {...s} points="5,13 4,12 3,13" />
      <Line {...s} x1="9" y1="12" x2="11" y2="12" />
      <Path {...s} d="M14,9.77A3,3,0,0,0,12,9h0a3,3,0,0,0-3,3H9a3,3,0,0,0,3,3h0a3,3,0,0,0,2-.77" />
    </Svg>
  );
}
