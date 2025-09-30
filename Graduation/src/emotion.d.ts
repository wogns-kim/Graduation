// src/emotion.d.ts

import '@emotion/react';
import { theme } from './styles/theme';

// typeof를 사용해 theme 객체의 타입을 추론합니다.
type ThemeType = typeof theme;

// Emotion의 기본 Theme 타입을 우리가 만든 ThemeType으로 확장합니다.
declare module '@emotion/react' {
    export interface Theme extends ThemeType { }
}