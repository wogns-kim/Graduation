// src/emotion.d.ts

import '@emotion/react';
import { theme } from './styles/theme';

// theme 객체의 타입을 그대로 가져와 ThemeType으로 정의합니다.
type ThemeType = typeof theme;

// Emotion의 기본 Theme 인터페이스를 우리가 만든 ThemeType으로 확장(extend)합니다.
// 이렇게 하면 Emotion의 모든 styled-component 안에서 우리 theme의 타입을 알 수 있게 됩니다.
declare module '@emotion/react' {
    export interface Theme extends ThemeType { }
}