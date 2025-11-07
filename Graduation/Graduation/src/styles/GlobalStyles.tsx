// src/styles/GlobalStyles.tsx
import { Global, css } from '@emotion/react';

const style = css`
  @import url('https://fonts.googleapis.com/css2?family=Lemon&family=Noto+Sans+KR:wght@400;500;700&display=swap');

  body {
    margin: 0;
    font-family: 'Noto Sans KR', sans-serif;
    background-color: #f8f9fa;
  }
`;

function GlobalStyles() {
    return <Global styles={style} />;
}

export default GlobalStyles;